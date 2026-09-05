/**
 * Voxy agent layer — public barrel.
 *
 * This is the single import surface for the V2 agent scaffolding introduced in
 * S1 and fleshed out in S2. Everything here is additive: the live chat and voice
 * paths do not depend on it yet — S2 builds the reasoning capability behind these
 * exports without switching the running `/api/assistant/chat` route over to it
 * (that swap is a later story). S3–S7 build behind the same surface.
 *
 *   reasoning         → runReasoning: the grounded model boundary.
 *   model             → REASONING_MODEL + fallback ladder (the locked S2 choice).
 *   systemInstruction → buildSystemInstruction: persona + PRD §4 guardrails.
 *   conversationContext→ buildReasoningRequest: history window + summary → request.
 *   fallback          → safe deflection + human-handoff when the chain is down.
 *   tools             → product / order / payment interfaces + permissioned registry.
 *   businessData      → the single approved-data read seam (S3).
 *   types/errors      → the shared contracts every layer branches on.
 *
 * @see ./README.md
 * @see public/docs/AI_AGENT_BACKEND_CONTRACTS.md
 */

export * from './types.js';
export * from './errors.js';

export { runReasoning } from './reasoning.js';

// S2 — AI Model Integration.
export * from './model.js';
export * from './systemInstruction.js';
export * from './conversationContext.js';
export * from './fallback.js';

export { BusinessDataGateway, createBusinessDataGateway } from './businessData.js';

// S3 — Business Knowledge Grounding & Policies Engine.
export {
  GroundingService,
  createGroundingService
} from './knowledge/groundingService.js';
export {
  PolicyChecker,
  createPolicyChecker
} from './knowledge/policyChecker.js';

export {
  ToolRegistry,
  productTool,
  productLookupTool,
  productDetailTool,
  recommendProductsTool,
  orderTool,
  orderBuilderTool,
  paymentTool,
  defaultTools,
  createDefaultToolRegistry,
} from './tools/index.js';

export {
  OrderStateManager
} from './order/orderStateManager.js';

// S4 — Customer Conversation Engine & Intent Routing.
export {
  IntentClassifier,
  classifyIntent
} from './intentClassifier.js';
export {
  HandoffManager,
  createHandoffManager
} from './handoffManager.js';
export {
  ConversationEngine,
  createConversationEngine
} from './conversationEngine.js';

// S5 — Sales Employee Behavior & Objection Handling.
export {
  SalesPlaybook,
  DiscoveryDimension
} from './sales/salesPlaybook.js';
export {
  ObjectionHandler,
  ObjectionType
} from './sales/objectionHandler.js';


