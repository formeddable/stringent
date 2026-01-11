/**
 * Context - carries schema data for identifier type resolution
 *
 * The context maps variable names to their types, enabling type-safe
 * parsing of expressions like `x + y` where x and y come from a schema.
 *
 * Grammar is now computed from node schemas via ComputeGrammar<Nodes>.
 */

// =============================================================================
// Context Interface
// =============================================================================

/**
 * Parse context with schema data.
 *
 * @typeParam TData - Schema mapping variable names to their types
 *
 * @example
 * ```ts
 * type Ctx = Context<{ x: "number"; y: "string" }>;
 * // x resolves to type "number", y resolves to type "string"
 * ```
 */
export interface Context<TData extends Record<string, string> = Record<string, string>> {
  /** Schema types for identifier resolution */
  readonly data: TData;
}

// =============================================================================
// Default Context
// =============================================================================

/** Empty context (no schema variables) */
export const emptyContext: Context<{}> = { data: {} };

/** Type alias for empty context */
export type EmptyContext = Context<{}>;
