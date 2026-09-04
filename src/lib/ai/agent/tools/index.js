/**
 * Tools barrel — the three V2 tool interfaces plus the registry and a factory
 * that wires them together with their declared permissions.
 *
 * Importers should prefer {@link createDefaultToolRegistry} over hand-registering
 * tools, so the canonical set stays in one place as S4–S5 implement them.
 */

import { ToolRegistry } from './registry.js';
import { productTool } from './productTool.js';
import { productLookupTool } from './productLookup.js';
import { productDetailTool } from './productDetail.js';
import { recommendProductsTool } from './recommendProducts.js';
import { orderTool } from './orderTool.js';
import { orderBuilderTool } from './orderBuilder.js';
import { paymentTool } from './paymentTool.js';

export { ToolRegistry } from './registry.js';
export { productTool } from './productTool.js';
export { productLookupTool } from './productLookup.js';
export { productDetailTool } from './productDetail.js';
export { recommendProductsTool } from './recommendProducts.js';
export { orderTool } from './orderTool.js';
export { orderBuilderTool } from './orderBuilder.js';
export { paymentTool } from './paymentTool.js';

/**
 * The canonical V2 tool set, in ascending order of sensitivity
 * (read catalogue / product tools → draft order → request payment).
 * @type {import('../types.js').ToolDefinition[]}
 */
export const defaultTools = [
  productLookupTool,
  productDetailTool,
  recommendProductsTool,
  orderBuilderTool,
  paymentTool
];

/**
 * Build a registry pre-loaded with the canonical tool set. Permissions are still
 * enforced per-turn at {@link ToolRegistry#resolve}; registering a tool here does
 * NOT make it callable without the matching granted permission.
 * @returns {ToolRegistry}
 */
export function createDefaultToolRegistry() {
  const registry = new ToolRegistry();
  for (const tool of defaultTools) registry.register(tool);
  return registry;
}
