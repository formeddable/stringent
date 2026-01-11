/**
 * Runtime Parser
 *
 * Mirrors the type-level Parse<Grammar, Input, Context> at runtime.
 * Uses the same precedence-based parsing strategy:
 *   1. Try operators at current level (lowest precedence first)
 *   2. Fall back to next level (higher precedence)
 *   3. Base case: try atoms (last level)
 */

import { Token } from "@sinclair/parsebox";
import type { Context } from "../context.js";
import type { ComputeGrammar, Grammar } from "../grammar/index.js";
import type { Parse } from "../parse/index.js";
import type {
  NodeSchema,
  PatternSchema,
  StringSchema,
  ConstSchema,
  ExprSchema,
} from "../schema/index.js";

import {
  ASTNode,
  IdentNode,
  NumberNode,
  StringNode,
} from "../primitive/index.js";

/** Parse result: empty = no match, [node, rest] = matched */
export type ParseResult<T extends ASTNode<any, any> = ASTNode<any, any>> =
  | []
  | [T & {}, string];

// =============================================================================
// Primitive Parsers
// =============================================================================

function parseNumber(input: string): ParseResult {
  const result = Token.Number(input) as [] | [string, string];
  if (result.length === 0) return [];
  return [
    {
      node: "literal",
      raw: result[0],
      value: +result[0],
      outputSchema: "number",
    } as NumberNode<(typeof result)[0]>,
    result[1],
  ];
}

function parseString(quotes: readonly string[], input: string): ParseResult {
  const result = Token.String([...quotes], input) as [] | [string, string];
  if (result.length === 0) return [];
  return [
    {
      node: "literal",
      raw: result[0],
      value: result[0],
      outputSchema: "string",
    } as StringNode<(typeof result)[0]>,
    result[1],
  ];
}

function parseIdent(input: string, context: Context): ParseResult {
  const result = Token.Ident(input) as [] | [string, string];
  if (result.length === 0) return [];
  const name = result[0];
  const valueType =
    name in context.data
      ? (context.data as Record<string, string>)[name]
      : "unknown";
  return [
    { node: "identifier", name, outputSchema: valueType } as IdentNode<
      typeof name,
      typeof valueType
    >,
    result[1],
  ];
}

function parseConst(value: string, input: string): ParseResult {
  const result = Token.Const(value, input) as [] | [string, string];
  if (result.length === 0) return [];
  return [{ node: "const", outputSchema: JSON.stringify(value) }, result[1]];
}

// =============================================================================
// Build Runtime Grammar from Node Schemas
// =============================================================================

/**
 * Build runtime grammar from node schemas.
 *
 * Returns a flat tuple of levels:
 *   [[ops@prec1], [ops@prec2], ..., [atoms]]
 *
 * Levels are sorted by precedence ascending (lowest first).
 * Atoms are always the last level.
 */
export function buildGrammar(nodes: readonly NodeSchema[]): Grammar {
  const atoms: NodeSchema[] = [];
  const operators: Map<number, NodeSchema[]> = new Map();

  for (const node of nodes) {
    if (node.precedence === "atom") {
      atoms.push(node);
    } else {
      const prec = node.precedence as number;
      if (!operators.has(prec)) {
        operators.set(prec, []);
      }
      operators.get(prec)!.push(node);
    }
  }

  // Sort precedences ascending
  const precedences = [...operators.keys()].sort((a, b) => a - b);

  // Build flat grammar: [[ops@prec1], [ops@prec2], ..., [atoms]]
  const grammar: (readonly NodeSchema[])[] = [];
  for (const prec of precedences) {
    grammar.push(operators.get(prec)!);
  }
  grammar.push(atoms);

  return grammar;
}

// =============================================================================
// Pattern Element Parsing
// =============================================================================

/**
 * Parse a single pattern element (non-Expr).
 */
function parseElement(
  element: PatternSchema,
  input: string,
  context: Context
): ParseResult {
  switch (element.kind) {
    case "number":
      return parseNumber(input);
    case "string":
      return parseString((element as StringSchema).quotes, input);
    case "ident":
      return parseIdent(input, context);
    case "const":
      return parseConst((element as ConstSchema).value, input);
    default:
      return [];
  }
}

/**
 * Parse an expression element based on its role.
 *
 * Role determines which grammar slice is used:
 * - "lhs": nextLevels (avoids left-recursion)
 * - "rhs": currentLevels (maintains precedence, enables right-associativity)
 * - "expr": fullGrammar (full reset for delimited contexts)
 */
function parseElementWithLevel(
  element: PatternSchema,
  input: string,
  context: Context,
  currentLevels: Grammar,
  nextLevels: Grammar,
  fullGrammar: Grammar
): ParseResult {
  if (element.kind === "expr") {
    const exprElement = element as ExprSchema;
    const constraint = exprElement.constraint;
    const role = exprElement.role;

    if (role === "lhs") {
      return parseExprWithConstraint(
        nextLevels,
        input,
        context,
        constraint,
        fullGrammar
      );
    } else if (role === "rhs") {
      return parseExprWithConstraint(
        currentLevels,
        input,
        context,
        constraint,
        fullGrammar
      );
    } else {
      return parseExprWithConstraint(
        fullGrammar,
        input,
        context,
        constraint,
        fullGrammar
      );
    }
  }
  return parseElement(element, input, context);
}

/**
 * Parse a pattern tuple.
 */
function parsePatternTuple(
  pattern: readonly PatternSchema[],
  input: string,
  context: Context,
  currentLevels: Grammar,
  nextLevels: Grammar,
  fullGrammar: Grammar
): [] | [ASTNode[], string] {
  let remaining = input;
  const children: ASTNode[] = [];

  for (const element of pattern) {
    const result = parseElementWithLevel(
      element,
      remaining,
      context,
      currentLevels,
      nextLevels,
      fullGrammar
    );
    if (result.length === 0) return [];
    children.push(result[0]);
    remaining = result[1];
  }

  return [children, remaining];
}

/**
 * Extract named bindings from pattern and children.
 * Only includes children where the pattern element has .as(name).
 */
function extractBindings(
  pattern: readonly PatternSchema[],
  children: ASTNode[]
): Record<string, ASTNode> {
  const bindings: Record<string, ASTNode> = {};

  for (let i = 0; i < pattern.length; i++) {
    const element = pattern[i];
    const child = children[i];

    // Check if element is a NamedSchema (has __named and name properties)
    if ("__named" in element && element.__named === true) {
      bindings[(element as { name: string }).name] = child;
    }
  }

  return bindings;
}

/**
 * Build AST node from parsed children.
 *
 * Uses named bindings from .as() to determine node fields.
 * - Single child without names: passthrough (atom behavior)
 * - If configure() provided: transform bindings to fields
 * - Otherwise: bindings become node fields directly
 */
function buildNodeResult(
  nodeSchema: NodeSchema,
  children: ASTNode[],
  context: Context
): ASTNode {
  const bindings = extractBindings(nodeSchema.pattern, children);

  // Single unnamed child → passthrough (atom behavior)
  if (Object.keys(bindings).length === 0 && children.length === 1) {
    return children[0];
  }

  // Apply configure() if provided, otherwise use bindings directly
  const fields = nodeSchema.configure
    ? nodeSchema.configure(bindings, context)
    : bindings;

  // Build node with fields
  return {
    node: nodeSchema.name,
    outputSchema: nodeSchema.resultType,
    ...fields,
  } as ASTNode;
}

/**
 * Parse a node pattern.
 */
function parseNodePattern(
  node: NodeSchema,
  input: string,
  context: Context,
  currentLevels: Grammar,
  nextLevels: Grammar,
  fullGrammar: Grammar
): ParseResult {
  const result = parsePatternTuple(
    node.pattern,
    input,
    context,
    currentLevels,
    nextLevels,
    fullGrammar
  );
  if (result.length === 0) return [];
  return [buildNodeResult(node, result[0], context), result[1]];
}

/**
 * Parse with expression constraint check.
 */
function parseExprWithConstraint(
  startLevels: Grammar,
  input: string,
  context: Context,
  constraint: string | undefined,
  fullGrammar: Grammar
): ParseResult {
  const result = parseLevels(startLevels, input, context, fullGrammar);
  if (result.length === 0) return [];

  const [node, remaining] = result;

  if (constraint !== undefined) {
    const nodeOutputSchema = (node as { outputSchema?: string }).outputSchema;
    if (nodeOutputSchema !== constraint) {
      return [];
    }
  }

  return [node, remaining];
}

/**
 * Try parsing each node in a level.
 */
function parseNodes(
  nodes: readonly NodeSchema[],
  input: string,
  context: Context,
  currentLevels: Grammar,
  nextLevels: Grammar,
  fullGrammar: Grammar
): ParseResult {
  for (const node of nodes) {
    const result = parseNodePattern(
      node,
      input,
      context,
      currentLevels,
      nextLevels,
      fullGrammar
    );
    if (result.length === 2) return result;
  }
  return [];
}

/**
 * Parse using grammar levels (flat tuple).
 *
 * levels[0] is current level, levels[1:] is next levels.
 * Base case: single level (atoms) - just try those nodes.
 */
function parseLevels(
  levels: Grammar,
  input: string,
  context: Context,
  fullGrammar: Grammar
): ParseResult {
  if (levels.length === 0) {
    return [];
  }

  const currentNodes = levels[0];
  const nextLevels = levels.slice(1);

  // Try nodes at current level
  const result = parseNodes(
    currentNodes,
    input,
    context,
    levels,
    nextLevels,
    fullGrammar
  );

  if (result.length === 2) {
    return result;
  }

  // Fall through to next levels (if any)
  if (nextLevels.length > 0) {
    return parseLevels(nextLevels, input, context, fullGrammar);
  }

  return [];
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Parse input string using node schemas.
 *
 * The return type is computed from the input types using the type-level
 * Parse<Grammar, Input, Context> type, ensuring runtime and type-level
 * parsing stay in sync.
 */
export function parse<
  const TNodes extends readonly NodeSchema[],
  const TInput extends string,
  const TContext extends Context
>(
  nodes: TNodes,
  input: TInput,
  context: TContext
): Parse<ComputeGrammar<TNodes>, TInput, TContext> {
  const grammar = buildGrammar(nodes);
  return parseLevels(grammar, input, context, grammar) as Parse<
    ComputeGrammar<TNodes>,
    TInput,
    TContext
  >;
}
