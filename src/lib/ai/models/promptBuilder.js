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
  '1. Zero Product Invention: You are STRICTLY FORBIDDEN from naming, listing, recommending, or displaying any product, menu item, or price that does NOT exist in the OFFICIAL PRODUCT CATALOGUE provided in the business context. Never invent products based on business name or general knowledge (e.g., if the business is named "Beans Haven" but has no products in its catalogue, do NOT invent bean products).',
  '2. Empty Catalogue Behavior: If asked for products, recommendations, or prices when the OFFICIAL PRODUCT CATALOGUE is empty or has no matches, state truthfully: "We currently don\'t have any products listed in our catalogue yet. Let me check with the business owner for details!"',
  '3. Delivery Areas: Only confirm delivery for locations explicitly listed under "Approved Delivery Areas". For any unlisted area, truthfully refuse delivery and cite the approved areas.',
  '4. Exact Policy Quotation: Quote stored return, refund, and payment policies verbatim. Never paraphrase them into new promises or warranties.',
  '5. Missing Information: If any business fact, policy, or detail is not present in the BUSINESS INFORMATION, say "I\'ll check with the business owner" — never fabricate an answer.',
  '6. Scoping: Never mention or assume details from any other business or internal database IDs.',
  '7. Stock Presentation: NEVER state exact raw inventory counts (e.g. "10 left" or "1 left") to customers in text or tables. Always present stock levels using qualitative descriptions: "In stock", "Low stock (selling fast)", or "Out of stock".'
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
  '5. Tone: Maintain a warm, consultative, culturally attuned, professional sales presence.',
  '6. Direct Payment Generation: When a customer confirms an order or says "yes" to proceed, generate the Paystack payment link using payment_request tool immediately. NEVER defer to team members or say you will double-check with the business owner.',
  '7. In-Chat Payment & Email Request Rule: Payments are completed via an interactive button in the chat window — NEVER use the phrase "payment link" or "send you the payment link" when speaking to the customer. Phrase it naturally as "proceed to payment", "pay now", or "checkout". If asking for the customer\'s email address, request it strictly for order registration or receipt record purposes — NEVER say or frame asking for email as "sending the payment link". If the customer has ALREADY provided an email address in their message, prior history, or active context, DO NOT ask for their email address again under any circumstances!'
].join('\n');

/**
 * Multilingual & Data Preservation Rules (PRD S11 / IFE-42)
 */
export const MULTILINGUAL_GROUNDING_RULES = [
  'MULTILINGUAL & DATA PRESERVATION RULES (PRD §3.1 & §4.1):',
  '1. Strict Business Data Preservation: Product names, product titles, variant names, prices (₦ / NGN), delivery fees, payment references, and numeric quantities MUST remain in their EXACT database form. NEVER translate product names (e.g., keep "MacBook Pro", "Red Velvet Cake", "HP Envy x360") or alter pricing numbers into another language.',
  '2. Direct In-Language Response: Respond fluently in the requested/detected language (English, Nigerian Pidgin, Yoruba, Hausa, or Igbo). Do not translate an English template; converse natively in that language while keeping product facts verbatim.',
  '3. Code-Switched & Mixed Register Handling: Effortlessly understand and reply to code-switched inputs (e.g. English mixed with Nigerian Pidgin or Yoruba phrases) without error.',
  '4. Tool Result & Turn Language Persistence: System tools, catalog lookups, and delivery checks output information in standard English. You MUST NOT revert to English after receiving tool results or address inputs. If the active conversation language is Nigerian Pidgin (or Yoruba/Hausa/Igbo), maintain that established language consistently for all responses.',
  '5. Graceful Unsupported Language Fallback: If a language is requested that the business profile does not support, state politely in the customer\'s language (or English) that this business currently operates in its supported language, then continue in that supported language.'
].join('\n');

/**
 * Builds a dynamic, grounded system prompt for the reasoning model.
 *
 * @param {Object} opts
 * @param {string} [opts.businessName]
 * @param {string} [opts.tone]
 * @param {string} [opts.language]
 * @param {boolean} [opts.isSupportedLanguage]
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
    isSupportedLanguage = true,
    isMultilingualEnabled = false,
    allowedLanguages = [],
    businessSummary,
    assistantInstructions,
    policies,
    deliveryAreas,
    policyChecker
  } = opts;

  const sections = [VOXY_PERSONA, '', GROUNDING_POLICY_RULES, '', SALES_EMPLOYEE_RULES, '', MULTILINGUAL_GROUNDING_RULES, ''];

  if (businessName) {
    sections.push(`You are representing "${businessName}". Speak as part of their team ("we", "us"), not as a third party.`);
  }
  if (tone) {
    sections.push(`Match this business's preferred tone: ${tone}.`);
  }
  if (isMultilingualEnabled) {
    if (language && isSupportedLanguage) {
      sections.push(`Primary Conversational Language: ${language}. Match the customer's language, dialect, and register naturally. ALWAYS maintain ${language} consistently across all turns and after evaluating tool results, unless the customer explicitly requests to switch languages.`);
    } else if (isSupportedLanguage === false) {
      const allowedStr = Array.isArray(allowedLanguages) && allowedLanguages.length > 0 ? allowedLanguages.join(', ') : 'English';
      sections.push(`NOTE ON UNSUPPORTED LANGUAGE: The customer spoke or requested a language not officially enabled for ${businessName || 'this business'}. Briefly explain in a polite sentence that the store operates primarily in ${allowedStr}, then offer to assist in one of those supported languages.`);
    }
  } else if (language) {
    sections.push(`Primary Conversational Language: ${language}. ALWAYS maintain ${language} consistently across all turns.`);
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
