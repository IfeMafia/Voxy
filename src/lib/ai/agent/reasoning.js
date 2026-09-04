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

    // Build list of permitted tools
    const availableTools = registry.list().filter(t => grantedPermissions.includes(t.permission));
    if (availableTools.length > 0 && !currentSystemInstruction.includes('--- AVAILABLE TOOLS ---')) {
      const toolDescriptions = registry.describe()
        .filter(t => grantedPermissions.includes(t.permission))
        .map(t => `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`)
        .join('\n');

      currentSystemInstruction += `\n\n--- AVAILABLE TOOLS ---\n` +
        `You are an autonomous AI employee with access to real business tools.\n` +
        `When a customer asks about products, prices, stock, delivery fees, policies, or order placement, YOU MUST CALL A TOOL FIRST to fetch accurate facts before answering.\n` +
        `To call a tool, respond with ONLY a JSON block in this exact shape:\n` +
        `\`\`\`json\n{ "tool": "<tool_name>", "args": { ... } }\n\`\`\`\n` +
        `Available tools:\n${toolDescriptions}\n` +
        `--- END AVAILABLE TOOLS ---`;
    }

    let conversationHistory = Array.isArray(messages)
      ? [...messages]
      : [{ role: 'user', content: messages }];

    let responseText = '';
    let lastResult = null;
    const MAX_TOOL_LOOPS = 3;
    let loopCount = 0;

    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount++;
      lastResult = await generateAIResponse(conversationHistory, currentSystemInstruction, userId, businessId, model);
      responseText = lastResult?.text ?? '';

      const toolCall = parseToolCall(responseText);
      if (!toolCall) {
        // No tool requested; this is the final customer-facing answer
        break;
      }

      // Execute tool call via registry
      const execResult = await executeToolCall(toolCall, registry, grantedPermissions, agentContext);
      toolCallsExecuted.push(execResult);

      const toolOutputStr = execResult.ok
        ? JSON.stringify(execResult.data)
        : `Error: ${execResult.error || 'Execution failed'}`;

      // Append assistant tool request and user tool response to history window
      conversationHistory.push({ role: 'model', content: responseText });
      conversationHistory.push({
        role: 'user',
        content: `[TOOL_RESULT for "${execResult.toolName}"]: ${toolOutputStr}\nNow evaluate this result and provide the next step or final response to the customer.`
      });
    }

    return {
      text: responseText,
      model: lastResult?.model,
      provider: lastResult?.providerUsed ?? lastResult?.provider,
      toolCalls: toolCallsExecuted,
      raw: lastResult,
    };
  });
}
