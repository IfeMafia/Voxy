/**
 * Prompt Builder — Model system prompt and context builder.
 *
 * Grounding & Policy Enforcement (PRD §4.1):
 * Dynamically injects verified business information without leaking internal IDs
 * or cross-tenant data. Enforces strict honesty: if information is missing,
 * instructs the model to say "I'll check with the business owner" rather than guessing.
 */

import { VOXY_PERSONA, buildSystemInstruction } from '../agent/systemInstruction.js';

/**
 * Strict Honesty & Grounding Directives
 */
export const GROUNDING_POLICY_RULES = [
  'STRICT POLICY & FACTUAL GROUNDING RULES:',
  '1. Zero Hallucination: Never invent or guess products, prices, stock, discounts, delivery areas, delivery times, or policies.',
  '2. Delivery Areas: Only confirm delivery for locations explicitly listed under "Approved Delivery Areas". For any unlisted area, truthfully refuse delivery and cite the approved areas.',
  '3. Exact Policy Quotation: Quote stored return, refund, and payment policies verbatim. Never paraphrase them into new promises or warranties.',
  '4. Missing Information: If any business fact, policy, or detail is not present in the BUSINESS INFORMATION, say "I\'ll check with the business owner" — never fabricate an answer.',
  '5. Scoping: Never mention or assume details from any other business or internal database IDs.'
].join('\n');

/**
 * Top-Tier Sales Employee Behavior Directives (PRD §6.4)
 */
export const SALES_EMPLOYEE_RULES = [
  'SALES EMPLOYEE BEHAVIOR & OBJECTION RULES (PRD §6.4):',
  '1. Need Discovery: Ask only ONE targeted question at a time (e.g., budget range, preferred size/flavor, or delivery destination). Never overwhelm the customer with a barrage of questions.',
  '2. Value Articulation: Highlight verified quality, reliability, and benefits rather than dryly regurgitating technical specs.',
  '3. Objection Handling: Acknowledge price, timing, or sizing concerns politely. For price objections, suggest a budget-friendly catalog alternative or ask for their target budget. NEVER fabricate discounts, coupons, or price concessions.',
  '4. Non-Pushy Add-ons: Suggest at most 1 relevant complementary item (e.g. screen protector or case with a phone) only after primary customer interest is established.',
  '5. Tone: Maintain a warm, consultative, culturally attuned, professional sales presence.'
].join('\n');

/**
 * Builds a dynamic, grounded system prompt for the reasoning model.
 *
 * @param {Object} opts
 * @param {string} [opts.businessName]
 * @param {string} [opts.tone]
 * @param {string} [opts.language]
 * @param {string} [opts.businessSummary]
 * @param {string} [opts.assistantInstructions]
 * @param {Object} [opts.policies] - Authoritative policy object
 * @param {string[]} [opts.deliveryAreas] - Approved delivery areas
 * @param {import('../agent/knowledge/policyChecker.js').PolicyChecker} [opts.policyChecker]
 * @returns {string} The formatted system prompt.
 */
export function buildGroundedSystemPrompt(opts = {}) {
  const {
    businessName,
    tone,
    language,
    businessSummary,
    assistantInstructions,
    policies,
    deliveryAreas,
    policyChecker
  } = opts;

  const sections = [VOXY_PERSONA, '', GROUNDING_POLICY_RULES, '', SALES_EMPLOYEE_RULES, ''];

  if (businessName) {
    sections.push(`You are representing "${businessName}". Speak as part of their team ("we", "us"), not as a third party.`);
  }
  if (tone) {
    sections.push(`Match this business's preferred tone: ${tone}.`);
  }
  if (language) {
    sections.push(`Reply in ${language}. Match the customer's language and register where appropriate.`);
  }
  if (assistantInstructions) {
    sections.push(`Business-specific guidance: ${assistantInstructions}`);
  }

  // Authoritative Business Context
  sections.push('');
  sections.push('--- BUSINESS INFORMATION (your only source of truth) ---');

  if (businessSummary && businessSummary.trim()) {
    sections.push(businessSummary.trim());
  } else {
    // If no summary string provided, format from pieces
    const parts = [];
    if (businessName) parts.push(`Business: ${businessName}`);
    if (deliveryAreas && deliveryAreas.length > 0) {
      parts.push(`Approved Delivery Areas: ${deliveryAreas.join(', ')}`);
    } else {
      parts.push(`Approved Delivery Areas: None listed (say: "I'll check with the business owner")`);
    }
    if (policies) {
      parts.push(`Return Policy: ${policies.returns || "Not specified (say: \"I'll check with the business owner\")"}`);
      parts.push(`Refund Policy: ${policies.refunds || "Not specified (say: \"I'll check with the business owner\")"}`);
      parts.push(`Delivery Terms: ${policies.delivery || "Not specified (say: \"I'll check with the business owner\")"}`);
      parts.push(`Payment Methods: ${policies.payment || "Not specified (say: \"I'll check with the business owner\")"}`);
    }
    sections.push(parts.join('\n') || 'No business information provided. Do not invent any.');
  }

  sections.push('--- END BUSINESS INFORMATION ---');

  return sections.join('\n');
}

/**
 * Standard alias matching promptBuilder conventions.
 */
export const buildSystemPrompt = buildGroundedSystemPrompt;
export const buildPrompt = buildGroundedSystemPrompt;

export default {
  buildGroundedSystemPrompt,
  buildSystemPrompt,
  buildPrompt,
  GROUNDING_POLICY_RULES,
  SALES_EMPLOYEE_RULES
};
