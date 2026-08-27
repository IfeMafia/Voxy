/**
 * Voxy agent layer — public barrel.
 *
 * This is the single import surface for the V2 agent scaffolding introduced in
 * S1. Everything here is additive and (except the reasoning pass-through) unwired
 * — the live chat and voice paths do not depend on it yet. S2–S7 build behind
 * these exports without changing the surface.
 *
 *   reasoning   → runReasoning: the model boundary S2 formalises.
 *   tools       → product / order / payment interfaces + permissioned registry.
 *   businessData→ the single approved-data read seam (S3).
 *   types/errors→ the shared contracts every layer branches on.
 *
 * @see ./README.md
 * @see public/docs/AI_AGENT_BACKEND_CONTRACTS.md
 */

export * from './types.js';
export * from './errors.js';

export { runReasoning } from './reasoning.js';
export { BusinessDataGateway, createBusinessDataGateway } from './businessData.js';

export {
  ToolRegistry,
  productTool,
  orderTool,
  paymentTool,
  defaultTools,
  createDefaultToolRegistry,
} from './tools/index.js';
