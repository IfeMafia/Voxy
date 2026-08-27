/**
 * ToolRegistry — the gate between the reasoning layer and side-effecting tools.
 *
 * Two jobs, both from PRD §4.3 ("explicit tool permissions"):
 *   1. Hold the set of known tools.
 *   2. Refuse to hand a tool to the reasoning layer unless the current turn was
 *      *granted* that tool's declared permission. Registration ≠ availability.
 *
 * The reasoning loop never reaches into this map directly to execute; it calls
 * {@link ToolRegistry#resolve}, which enforces permission before returning the
 * callable tool. `describe()` produces the model-facing catalogue used when
 * prompting the model about which tools exist.
 */

import { PermissionDeniedError } from '../errors.js';

/**
 * @typedef {import('../types.js').ToolDefinition} ToolDefinition
 */

export class ToolRegistry {
  /** @type {Map<string, ToolDefinition>} */
  #tools = new Map();

  /**
   * @param {ToolDefinition} def
   * @returns {this}
   */
  register(def) {
    if (!def?.name) throw new Error('ToolRegistry.register: tool is missing a name.');
    if (!def.permission) throw new Error(`ToolRegistry.register: tool "${def.name}" declares no permission.`);
    if (typeof def.execute !== 'function') throw new Error(`ToolRegistry.register: tool "${def.name}" has no execute().`);
    if (this.#tools.has(def.name)) throw new Error(`ToolRegistry.register: duplicate tool "${def.name}".`);
    this.#tools.set(def.name, def);
    return this;
  }

  /** @param {string} name @returns {boolean} */
  has(name) {
    return this.#tools.has(name);
  }

  /** @param {string} name @returns {ToolDefinition|undefined} */
  get(name) {
    return this.#tools.get(name);
  }

  /** @returns {ToolDefinition[]} */
  list() {
    return [...this.#tools.values()];
  }

  /**
   * Return a tool ONLY if the granted permissions include the one it declares.
   * This is the enforcement point for PRD §4.3 — the reasoning layer cannot call
   * a sensitive tool it was not explicitly granted this turn.
   *
   * @param {string} name
   * @param {string[]} [grantedPermissions]
   * @returns {ToolDefinition}
   */
  resolve(name, grantedPermissions = []) {
    const tool = this.#tools.get(name);
    if (!tool) throw new Error(`ToolRegistry.resolve: unknown tool "${name}".`);
    if (!grantedPermissions.includes(tool.permission)) {
      throw new PermissionDeniedError(name, tool.permission);
    }
    return tool;
  }

  /**
   * Model-facing description of the available tools (name, when-to-use, params,
   * required permission). Provider-agnostic — S2 renders this into whatever
   * tool/function-calling format the chosen model expects.
   * @returns {Array<{name:string, description:string, permission:string, parameters:Object[]}>}
   */
  describe() {
    return this.list().map((t) => ({
      name: t.name,
      description: t.description,
      permission: t.permission,
      parameters: t.parameters ?? [],
    }));
  }
}
