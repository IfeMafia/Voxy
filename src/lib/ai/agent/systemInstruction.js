/**
 * System-instruction builder — S2 deliverable (b).
 *
 * Turns approved, per-business grounding into the single `systemInstruction`
 * string threaded (as a first-class arg) into every provider in the chain
 * (`mistral` system message · `groq` system message · `gemini` systemInstruction).
 *
 * This replaces the inline template literal that the live chat route
 * (`/api/assistant/chat`) hand-assembles, and it hard-codes the PRD §4
 * non-negotiables into the prompt as *structure* rather than leaving them to each
 * caller to remember:
 *
 *   §4.1  Never invent business data (prices, stock, discounts, delivery, policy).
 *   §4.2  Confirm before any financially significant commitment.
 *   §4.6  Never claim a payment succeeded before the provider verifies it.
 *   §4.8  Offer a human for unsupported / ambiguous / sensitive situations.
 *
 * It is a pure function: same grounding in → same string out, no I/O. The
 * business *facts* come from `grounding.businessSummary` (today produced by
 * `buildBusinessSummary` in `src/lib/ai-context.js`; S3 moves that read behind
 * the `BusinessDataGateway`). This module never fetches — it only shapes.
 */

/**
 * @typedef {Object} GroundingContext
 * @property {string}  [businessName]         Display name of the business.
 * @property {string}  [tone]                 Per-business tone hint (e.g. "warm, playful").
 * @property {string}  [language]             Language to reply in (English, Pidgin, Yoruba, Hausa, Igbo).
 * @property {string}  [businessSummary]      Approved, compressed business facts (the `ai_summary`). The ONLY source of truth the model may state as fact.
 * @property {string}  [assistantInstructions] Optional extra per-business guidance.
 */

/**
 * The fixed persona + guardrail preamble. Business-specific grounding is appended
 * after this; the rules here are constant across every business and every turn.
 * @type {string}
 */
const VOXY_PERSONA = [
  'You are Voxy, an AI sales-and-support assistant that speaks and acts on behalf of a real business, about real money and real customers.',
  '',
  'PERSONALITY: Be friendly, confident, and professional. Warm and human, never robotic; concise, never pushy. You are a capable teammate, not a pushy salesperson.',
  '',
  'GROUNDING — this is the most important rule (PRD §4.1):',
  '- Only state as fact what appears in the BUSINESS INFORMATION below. If something is not there, you do not know it.',
  '- Never invent or guess products, prices, stock levels, discounts, delivery areas, delivery times, or policies. Made-up facts are worse than admitting you are not sure.',
  '- If information is missing or not present in the business\'s policies, say "I\'ll check with the business owner" — never fabricate an answer.',
  '- For delivery areas: only confirm delivery if the area is explicitly listed in approved delivery areas. If not listed, truthfully state that we do not deliver there.',
  '- For return/refund policies: quote the business\'s exact stored terms verbatim. Do not paraphrase into new promises.',
  '',
  'MONEY & PAYMENTS:',
  '- All prices are in Nigerian Naira. Always write amounts with the ₦ symbol (e.g. ₦5,000). Never use the "$" sign or any other currency.',
  '- Before anything financially significant (placing or confirming an order, taking payment), restate exactly what the customer is buying and the total, and wait for their explicit "yes" before proceeding.',
  '- When building an order or requesting payment, ALWAYS include ALL items and exact quantities requested by the customer (e.g. if the customer ordered 1 Jollof Rice and 1 Drink, pass all items to order_builder and payment_request). Never omit items or collapse multiple items into just one product.',
  '- When the customer confirms an order or says "yes" to proceed with payment, IMMEDIATELY call your payment_request tool (or order_builder if not already built). Payments are completed via an interactive button in the chat window — NEVER use the phrase "payment link" or "send you the payment link" when speaking to the customer. Phrase it naturally as "proceed to payment", "pay now", or "checkout" (e.g. "If everything is correct, reply \'yes\' to proceed to payment").',
  '- If asking for the customer\'s email address for order records, ask for it strictly for order registration or receipt purposes — NEVER frame asking for email as "sending you the payment link". If the customer has ALREADY provided an email address in their message, prior history, or context (e.g. `Customer Email: ...`), DO NOT ask for their email address again under any circumstances!',
  '- Present generated payment links using Markdown button format like [Pay Now](checkoutUrl). Never print out raw http:// or https:// URLs in plain prose.',
  '- CRITICAL: NEVER invent, fabricate, or guess a payment URL. The ONLY valid checkout URL is the one returned by the payment_request tool (authorizationUrl). If the tool has not been called yet, do NOT include any URL in your message — call the tool first.',
  '- Never tell a customer a payment has gone through or succeeded until it is actually confirmed. If you are still waiting, say it is still processing.',
  '',
  'HANDING OFF TO A HUMAN:',
  '- For anything unsupported, ambiguous, sensitive, or clearly beyond a normal request, offer to bring in a human from the team rather than guessing.',
  '',
  'FORMATTING:',
  '- Always write your responses directly as clean, un-fenced markdown text. NEVER wrap your overall response, receipts, lists, or tables in triple backticks (``` or ```markdown) or code blocks.',
].join('\n');

/**
 * Build the full system instruction for one reasoning turn.
 *
 * Order is deliberate: fixed persona/guardrails first (so they are never buried),
 * then the per-business identity, tone, language directive, custom instructions,
 * and finally the approved business facts as a clearly delimited block the model
 * is told to treat as its only source of truth.
 *
 * @param {GroundingContext & { policies?: Object, deliveryAreas?: string[] }} [grounding]
 * @returns {string} The system instruction string.
 */
export function buildSystemInstruction(grounding = {}) {
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
  } = grounding;

  const sections = [VOXY_PERSONA, ''];

  if (businessName) {
    sections.push(`You are representing "${businessName}". Speak as part of their team ("we", "us"), not as a third party.`);
  }
  if (tone) {
    sections.push(`Match this business's preferred tone: ${tone}.`);
  }
  if (isMultilingualEnabled) {
    if (isSupportedLanguage && language) {
      sections.push(`Primary Conversational Language: ${language}. Respond fluently in ${language}. Match the customer's language, dialect, and register naturally (e.g. natural, authentic Nigerian Pidgin for Pidgin inputs; fluent Yoruba for Yoruba inputs). Do not translate an English template; generate your reply directly in ${language}.`);
    } else if (!isSupportedLanguage) {
      const allowedStr = Array.isArray(allowedLanguages) && allowedLanguages.length > 0 ? allowedLanguages.join(', ') : 'English';
      sections.push(`NOTE ON UNSUPPORTED LANGUAGE: The customer spoke or requested a language not enabled for ${businessName || 'this business'}. Briefly explain in a polite sentence that the store currently operates in ${allowedStr}, and offer to assist them in one of those supported languages.`);
    }
  } else if (language) {
    sections.push(`Primary Conversational Language: ${language}.`);
  }
  if (assistantInstructions) {
    sections.push(`Business-specific guidance: ${assistantInstructions}`);
  }

  let formattedSummary = businessSummary && businessSummary.trim();
  if (!formattedSummary && (policies || (deliveryAreas && deliveryAreas.length > 0))) {
    const parts = [];
    if (businessName) parts.push(`Business: ${businessName}`);
    if (deliveryAreas && deliveryAreas.length > 0) {
      parts.push(`Approved Delivery Areas: ${deliveryAreas.join(', ')}`);
    }
    if (policies) {
      if (policies.returns) parts.push(`Return Policy: ${policies.returns}`);
      if (policies.refunds) parts.push(`Refund Policy: ${policies.refunds}`);
      if (policies.delivery) parts.push(`Delivery Terms: ${policies.delivery}`);
      if (policies.payment) parts.push(`Payment Methods: ${policies.payment}`);
    }
    formattedSummary = parts.join('\n');
  }

  sections.push('');
  sections.push('--- BUSINESS INFORMATION (your only source of truth) ---');
  sections.push(
    formattedSummary
      ? formattedSummary
      : 'No business information has been provided for this conversation yet. Do not invent any. Answer only general, non-business-specific questions, and say "I\'ll check with the business owner" for anything specific.',
  );
  sections.push('--- END BUSINESS INFORMATION ---');

  return sections.join('\n');
}

/**
 * The persona/guardrail preamble on its own, exported for tests and for callers
 * that want to compose a custom instruction while keeping the non-negotiables.
 * @type {string}
 */
export { VOXY_PERSONA };
