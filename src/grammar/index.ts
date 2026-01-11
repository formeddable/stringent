/**
 * Grammar Type Computation
 *
 * Computes a grammar TYPE from node schemas. The grammar is a flat tuple
 * of precedence levels, sorted from lowest to highest precedence, with
 * atoms as the final element.
 *
 * Example:
 *   [[AddOps], [MulOps], [Atoms]]
 *   // level 0 (lowest prec) → level 1 → atoms (last)
 */

import type {
  Pipe,
  Numbers,
  Objects,
  Tuples,
  Fn,
  Unions,
  Call,
} from "hotscript";
import type { NodeSchema } from "../schema/index.js";

// =============================================================================
// Grammar Type
// =============================================================================

/**
 * A grammar is a tuple of levels, where each level is an array of node schemas.
 * Sorted by precedence (lowest first), atoms last.
 */
export type Grammar = readonly (readonly NodeSchema[])[];

// =============================================================================
// Hotscript Helpers
// =============================================================================

/**
 * Compare precedence entries: numbers sort ascending, "atom" always comes last.
 * Entry format: [precedence, nodes[]]
 */
interface SortByPrecedence extends Fn {
  return: this["arg0"][0] extends "atom"
    ? false // atom never comes before anything
    : this["arg1"][0] extends "atom"
    ? true // anything comes before atom
    : Call<Numbers.LessThanOrEqual, this["arg0"][0], this["arg1"][0]>;
}

// =============================================================================
// ComputeGrammar
// =============================================================================

/**
 * Compute the grammar tuple from node schemas.
 *
 * 1. Group nodes by precedence
 * 2. Convert to entries and sort (numbers ascending, "atom" last)
 * 3. Extract just the node arrays
 */
type ComputeGrammarImpl<TNodes extends readonly NodeSchema[]> = Pipe<
  [...TNodes],
  [
    Tuples.GroupBy<Objects.Get<"precedence">>,
    Objects.Entries,
    Unions.ToTuple,
    Tuples.Sort<SortByPrecedence>,
    Tuples.Map<Tuples.At<1>>
  ]
>;

export type ComputeGrammar<TNodes extends readonly NodeSchema[]> =
  ComputeGrammarImpl<TNodes> extends infer G extends Grammar ? G : never;
