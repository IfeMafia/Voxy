/**
 * product_lookup — read-only catalogue search.
 *
 * Safest of the three tools: it only reads. It still must go through the
 * {@link BusinessDataGateway} so it can never return anything but real,
 * business-approved products (PRD §4.1). An empty result is a valid, honest
 * answer — the model must not invent a product to fill a gap.
 *
 * S1 status: interface only. `execute` throws {@link NotImplementedError} until
 * the T2 product catalogue backend exists.
 */

import { ToolName, ToolPermission } from '../types.js';
import { productLookupTool } from './productLookup.js';

/** @type {import('../types.js').ToolDefinition} */
export const productTool = {
  ...productLookupTool
};
