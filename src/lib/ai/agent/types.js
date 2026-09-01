/**
 * Shared type surface for the Voxy agent layer (JSDoc typedefs + runtime enums).
 *
 * This project is plain JavaScript, so "interfaces" are expressed as JSDoc
 * typedefs plus frozen constant objects for the closed sets (permissions, tool
 * names). Import the constants where you need values; reference the typedefs in
 * `@param`/`@returns` to keep the boundaries honest across S2–S7.
 */

/**
 * The closed set of tool permissions. A tool declares exactly one, and the
 * reasoning layer must be *granted* that permission for the tool to resolve.
 * Sensitive capabilities (drafting orders, requesting payment) are never
 * implicit — see PRD §4.3.
 * @readonly
 * @enum {string}
 */
export const ToolPermission = Object.freeze({
  READ_CATALOGUE: 'read_catalogue',
  DRAFT_ORDER: 'draft_order',
  REQUEST_PAYMENT: 'request_payment',
});

/**
 * Canonical tool identifiers. Kept stable because the reasoning layer references
 * them by name when it decides to call a tool.
 * @readonly
 * @enum {string}
 */
export const ToolName = Object.freeze({
  PRODUCT_LOOKUP: 'product_lookup',
  ORDER_BUILDER: 'order_builder',
  PAYMENT_REQUEST: 'payment_request',
});

/**
 * A single declared input to a tool. This is intentionally a tiny, provider-
 * agnostic schema shape (not JSON-Schema) so it can be rendered into any model's
 * tool/function-calling format later without lock-in.
 * @typedef {Object} ToolParameter
 * @property {string} name
 * @property {'string'|'number'|'boolean'|'object'|'array'} type
 * @property {boolean} required
 * @property {string} description
 */

/**
 * The contract every tool implements. `execute` is the only side-effecting
 * surface; it must go through {@link BusinessDataGateway} for any business fact
 * so tools can never invent data (PRD §4.1).
 * @typedef {Object} ToolDefinition
 * @property {string} name - One of {@link ToolName}.
 * @property {string} description - Model-facing description of when to use it.
 * @property {string} permission - One of {@link ToolPermission}.
 * @property {ToolParameter[]} parameters
 * @property {(args: Object, context: AgentContext) => Promise<ToolResult>} execute
 */

/**
 * Uniform tool return envelope. Tools resolve with `ok:false` for expected,
 * recoverable outcomes (e.g. "no matching product") and throw typed errors for
 * programmer/permission/contract failures.
 * @typedef {Object} ToolResult
 * @property {boolean} ok
 * @property {*} [data] - Present when ok:true.
 * @property {string} [error] - Human-readable reason when ok:false.
 * @property {string} [code] - Stable machine code when ok:false.
 */

/**
 * Everything a tool or the reasoning layer needs to act on a single turn,
 * without reaching into request/DB globals directly.
 * @typedef {Object} AgentContext
 * @property {string} businessId
 * @property {string} [conversationId]
 * @property {string} [customerId]
 * @property {string} [language] - Detected reply language (e.g. "english", "yoruba").
 * @property {string[]} grantedPermissions - Permissions the reasoning layer may use this turn.
 * @property {BusinessDataGateway} [data] - The approved-data read seam.
 * @property {ConfirmationState} [confirmation] - Customer confirmation for financial actions.
 */

/**
 * Explicit customer confirmation for a financially significant action. The
 * payment tool refuses to run unless `confirmed === true`.
 * @typedef {Object} ConfirmationState
 * @property {boolean} confirmed
 * @property {string} [summary] - The exact items/quantities/total the customer agreed to.
 * @property {string} [confirmedAt] - ISO timestamp.
 */

/**
 * A minimal, safe reference to a real catalogue product. Only ever produced by
 * the business-data gateway — never fabricated by the model.
 * @typedef {Object} ProductRef
 * @property {string} id
 * @property {string} name
 * @property {number} price - Amount in Naira (₦). Integer minor units are a backend decision (see contracts doc).
 * @property {string} [variant]
 * @property {boolean} available
 */

/**
 * One line on a draft order.
 * @typedef {Object} DraftOrderLine
 * @property {string} productId
 * @property {string} name
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} lineTotal
 */

/**
 * A pre-confirmation order the agent has assembled but NOT committed. Building a
 * draft is safe; committing/paying requires confirmation (PRD §4.2).
 * @typedef {Object} DraftOrder
 * @property {string} businessId
 * @property {string} [customerId]
 * @property {DraftOrderLine[]} lines
 * @property {number} total
 * @property {string} currency - Always "NGN" for V2.
 */

/**
 * A request to the payment provider, produced only after confirmation. Voxy
 * never handles raw card details and never asserts success before the provider
 * verifies it (PRD §4.6).
 * @typedef {Object} PaymentRequestDraft
 * @property {string} orderId
 * @property {number} amount
 * @property {string} currency - "NGN".
 * @property {string} [customerEmail]
 */

/**
 * One turn of conversation as the reasoning layer consumes it.
 * @typedef {Object} ConversationTurn
 * @property {'user'|'model'|'system'} role
 * @property {string} content
 */

/**
 * Input to the reasoning layer. S2 formalises the builder that produces this
 * (`conversationContext.buildReasoningRequest`).
 * @typedef {Object} ReasoningRequest
 * @property {ConversationTurn[]|string} messages - History window or a single prompt.
 * @property {string} systemInstruction - Grounded system prompt (real business data only). The rolling summary, when present, is folded in here rather than sent as a turn.
 * @property {string} [userId]
 * @property {string} [businessId]
 * @property {string} [model] - Reasoning model id; defaults to the locked choice in `agent/model.js`.
 */

/**
 * Output of the reasoning layer, normalised across providers.
 * @typedef {Object} ReasoningResponse
 * @property {string} text
 * @property {string} [model]
 * @property {string} [provider] - Which provider actually served it (groq/gemini).
 * @property {*} [raw] - The untouched provider payload for observability.
 * @property {boolean} [handoff] - True when Voxy is deferring to a human instead of answering (PRD §4.8).
 * @property {string} [handoffReason] - Why, from `fallback.HANDOFF_REASON`, when `handoff` is true.
 * @property {string|null} [error] - Internal failure detail for logs/observability; never shown to the customer.
 */

export {};
