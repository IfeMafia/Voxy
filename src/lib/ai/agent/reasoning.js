/**
 * Reasoning-layer boundary.
 *
 * This is the seam between "the app decided what to ask" and "a model produced a
 * grounded answer." It defines the request/response shape ({@link ReasoningRequest}
 * / {@link ReasoningResponse}) and delegates to the existing unified interface
 * (`generateAIResponse` → `generateAI`), which already carries the resilient
 * provider chain, circuit breaker, security scanning, and observability.
 *
 * S2 + Tool Execution additions:
 *   - System-instruction builder (`buildSystemInstruction`)
 *   - Conversation-context interface (`buildReasoningRequest`)
 *   - Tool Execution loop (`parseToolCall` & `executeToolCall` via `ToolRegistry`)
 *   - Structured error / fallback (`withReasoningFallback`)
 */

import { generateAIResponse } from '../core/generateAIResponse.js';
import { REASONING_MODEL } from './model.js';
import { buildSystemInstruction } from './systemInstruction.js';
import { buildReasoningRequest } from './conversationContext.js';
import { withReasoningFallback } from './fallback.js';
import { createDefaultToolRegistry } from './tools/index.js';
import { ToolPermission } from './types.js';

/**
 * Parse structured tool call JSON from model response text if present.
 * Supports:
 *   - ```json { "tool": "product_lookup", "args": { ... } } ```
 *   - { "tool": "product_lookup", "args": { ... } }
 *   - { "name": "product_lookup", "arguments": { ... } }
 *
 * @param {string} text
 * @returns {{ name: string, args: Object } | null}
 */
export function parseToolCall(text) {
  if (!text || typeof text !== 'string') return null;

  const jsonBlockMatch = text.match(/```(?:json)?\s*(\{\s*"(?:tool|name)"[\s\S]*?\})\s*```/i);
  const jsonStr = jsonBlockMatch ? jsonBlockMatch[1] : text.trim();

  if (!jsonStr.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(jsonStr);
    const toolName = parsed.tool || parsed.name;
    const args = parsed.args || parsed.arguments || {};
    if (toolName && typeof toolName === 'string') {
      return { name: toolName, args };
    }
  } catch {
    // Not valid tool JSON
  }
  return null;
}

/**
 * Execute a tool call against the registry with permission checking and error normalization.
 *
 * @param {{ name: string, args: Object }} toolCall
 * @param {import('./tools/registry.js').ToolRegistry} registry
 * @param {string[]} grantedPermissions
 * @param {import('./types.js').AgentContext} context
 * @returns {Promise<{ ok: boolean, toolName: string, data?: *, error?: string, code?: string, contractRef?: string }>}
 */
export async function executeToolCall(toolCall, registry, grantedPermissions, context) {
  const { name, args } = toolCall;
  try {
    const tool = registry.resolve(name, grantedPermissions);
    const result = await tool.execute(args, context);
    return { ok: true, toolName: name, data: result };
  } catch (err) {
    return {
      ok: false,
      toolName: name,
      error: err.message,
      code: err.code || 'TOOL_EXECUTION_ERROR',
      contractRef: err.contractRef || null
    };
  }
}

/**
 * Run one grounded reasoning turn with iterative tool execution.
 *
 * @param {import('./types.js').ReasoningRequest & {
 *   history?: Array<*>,
 *   summary?: string,
 *   grounding?: import('./systemInstruction.js').GroundingContext,
 *   grantedPermissions?: string[],
 *   toolRegistry?: import('./tools/registry.js').ToolRegistry,
 *   context?: import('./types.js').AgentContext
 * }} request
 * @returns {Promise<import('./types.js').ReasoningResponse>}
 */
export async function runReasoning(request) {
  const req = request ?? {};

  const usesContext =
    req.history !== undefined || req.summary !== undefined || req.grounding !== undefined;

  const {
    messages,
    systemInstruction = buildSystemInstruction(),
    userId = null,
    businessId = null,
    model = REASONING_MODEL,
  } = usesContext ? buildReasoningRequest(req) : req;

  const registry = req.toolRegistry ?? req.registry ?? createDefaultToolRegistry();
  const grantedPermissions = req.grantedPermissions ??
    req.context?.grantedPermissions ??
    [ToolPermission.READ_CATALOGUE, ToolPermission.DRAFT_ORDER, ToolPermission.REQUEST_PAYMENT];

  const agentContext = req.context ?? {
    businessId: businessId || req.grounding?.businessId || 'default-biz',
    grantedPermissions,
    data: req.data ?? null,
    confirmation: req.confirmation ?? null,
  };

  const hasPrompt =
    typeof messages === 'string' ? messages.trim() !== '' : Array.isArray(messages) && messages.length > 0;
  if (!hasPrompt) {
    throw new Error('runReasoning requires `messages` (a non-empty history window or prompt string) or `history`.');
  }

  return withReasoningFallback(async () => {
    const toolCallsExecuted = [];
    let currentSystemInstruction = systemInstruction;
    let currentMessages = messages;

    // Append tool catalogue guidance if tools are registered & permissions granted
    const availableTools = registry.list().filter(t => grantedPermissions.includes(t.permission));
    if (availableTools.length > 0 && !currentSystemInstruction.includes('--- AVAILABLE TOOLS ---')) {
      const toolDescriptions = registry.describe()
        .filter(t => grantedPermissions.includes(t.permission))
        .map(t => `- ${t.name}: ${t.description} (params: ${JSON.stringify(t.parameters)})`)
        .join('\n');

      currentSystemInstruction += `\n\n--- AVAILABLE TOOLS ---\n` +
        `You may call an available tool to fetch real business facts before responding.\n` +
        `To call a tool, respond with ONLY a JSON block in this exact shape:\n` +
        `\`\`\`json\n{ "tool": "<tool_name>", "args": { ... } }\n\`\`\`\n` +
        `Available tools:\n${toolDescriptions}\n` +
        `--- END AVAILABLE TOOLS ---`;
    }

    // Step 1: Initial model call
    const result = await generateAIResponse(currentMessages, currentSystemInstruction, userId, businessId, model);
    let responseText = result?.text ?? '';

    // Step 2: Inspect for tool calls
    const toolCall = parseToolCall(responseText);

    if (toolCall) {
      // Step 3: Execute tool via ToolRegistry
      const execResult = await executeToolCall(toolCall, registry, grantedPermissions, agentContext);
      toolCallsExecuted.push(execResult);

      // Step 4: Pass tool result back for final customer-facing response
      const toolOutputMessage = execResult.ok
        ? `[Tool "${execResult.toolName}" Result]: ${JSON.stringify(execResult.data)}`
        : `[Tool "${execResult.toolName}" Status]: ${execResult.error}`;

      const followUpMessages = Array.isArray(currentMessages)
        ? [
            ...currentMessages,
            { role: 'model', content: responseText },
            { role: 'user', content: `Tool execution result: ${toolOutputMessage}. Please answer the customer based on this.` }
          ]
        : `${currentMessages}\n\n[Tool Executed: ${execResult.toolName}]\n${toolOutputMessage}`;

      const finalTurnResult = await generateAIResponse(followUpMessages, currentSystemInstruction, userId, businessId, model);
      responseText = finalTurnResult?.text ?? responseText;
    }

    return {
      text: responseText,
      model: result?.model,
      provider: result?.providerUsed ?? result?.provider,
      toolCalls: toolCallsExecuted,
      raw: result,
    };
  });
}
