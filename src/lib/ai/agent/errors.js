/**
 * Typed errors for the Voxy agent layer.
 *
 * These exist so the orchestrator (and later the reasoning loop) can branch on
 * a stable `code` instead of string-matching messages. Every scaffolded tool in
 * this module throws one of these until the backing backend contract lands.
 */

/**
 * Thrown by a tool / gateway method whose backend contract is documented but
 * not yet wired up. Carries a pointer to the contract it is waiting on so the
 * failure is self-explaining in logs.
 *
 * @see public/docs/AI_AGENT_BACKEND_CONTRACTS.md
 */
export class NotImplementedError extends Error {
  /**
   * @param {string} feature - Dotted name of the seam, e.g. "product_lookup.execute".
   * @param {string} [contractRef] - Which backend contract fulfils it, e.g. "T2 §Product Catalogue Query".
   * @param {Record<string, unknown>} [detail] - Arbitrary context (args/ids) for debugging.
   */
  constructor(feature, contractRef = 'see AI_AGENT_BACKEND_CONTRACTS.md', detail = {}) {
    super(`[NOT_IMPLEMENTED] ${feature} — awaiting backend contract: ${contractRef}`);
    this.name = 'NotImplementedError';
    this.code = 'NOT_IMPLEMENTED';
    this.feature = feature;
    this.contractRef = contractRef;
    this.detail = detail;
  }
}

/**
 * Thrown when a financially significant tool is invoked without an explicit,
 * verified customer confirmation. This is the structural enforcement of PRD §4.2
 * ("Confirmation before commitment") — the payment tool cannot execute until the
 * caller passes a confirmed confirmation object, even before the real payment
 * integration exists.
 */
export class ConfirmationRequiredError extends Error {
  /**
   * @param {string} summary - The exact order/amount summary the customer must confirm.
   */
  constructor(summary = 'This action requires explicit customer confirmation before it can run.') {
    super(`[CONFIRMATION_REQUIRED] ${summary}`);
    this.name = 'ConfirmationRequiredError';
    this.code = 'CONFIRMATION_REQUIRED';
    this.summary = summary;
  }
}

/**
 * Thrown when a tool is resolved without the permission it declares. Encodes
 * PRD §4.3 ("Explicit tool permissions") — a tool is never available to the
 * reasoning layer just because it is registered.
 */
export class PermissionDeniedError extends Error {
  /**
   * @param {string} toolName
   * @param {string} requiredPermission
   */
  constructor(toolName, requiredPermission) {
    super(`[PERMISSION_DENIED] Tool "${toolName}" requires permission "${requiredPermission}" which was not granted.`);
    this.name = 'PermissionDeniedError';
    this.code = 'PERMISSION_DENIED';
    this.toolName = toolName;
    this.requiredPermission = requiredPermission;
  }
}
