/**
 * Parser Combinators
 *
 * Composable parsers that work at both runtime and compile-time.
 * Parse methods are generic - return types computed from input literals.
 * All combinators thread context ($) through to child parsers.
 *
 * IMPORTANT: All parse methods MUST be generic in context:
 *   parse<TInput extends string, $ extends Context>(input: TInput, $: $)
 */

import type { Context } from "../context.js";
import type {
  IParser,
  ParseNumber,
  ParseString,
  ParseIdent,
  ParseConst,
  _Number,
  _String,
  _Ident,
  _Const,
} from "../primitive/index.js";

// =============================================================================
// Static Parse Types
// =============================================================================

/** Static type for parsing any parser */
export type Parse<
  P,
  TInput extends string,
  $ extends Context
> = P extends _Number
  ? ParseNumber<TInput>
  : P extends _String<infer Q>
  ? ParseString<Q, TInput>
  : P extends _Const<infer V>
  ? ParseConst<V, TInput>
  : P extends _Ident
  ? ParseIdent<TInput, $>
  : P extends _Union<infer Parsers>
  ? ParseUnion<Parsers, TInput, $>
  : P extends _Tuple<infer Parsers>
  ? ParseTuple<Parsers, TInput, $>
  : P extends _Optional<infer Parser>
  ? ParseOptional<Parser, TInput, $>
  : P extends _Many<infer Parser>
  ? ParseMany<Parser, TInput, $>
  : never;

/** Static type for Union parsing */
export type ParseUnion<
  TParsers extends IParser[],
  TInput extends string,
  $ extends Context
> = TParsers extends [
  infer First extends IParser,
  ...infer Rest extends IParser[]
]
  ? Parse<First, TInput, $> extends [infer R, infer Remaining extends string]
    ? [R, Remaining]
    : ParseUnion<Rest, TInput, $>
  : [];

/** Static type for Tuple parsing */
export type ParseTuple<
  TParsers extends IParser[],
  TInput extends string,
  $ extends Context,
  TAcc extends unknown[] = []
> = TParsers extends [
  infer First extends IParser,
  ...infer Rest extends IParser[]
]
  ? Parse<First, TInput, $> extends [infer R, infer Remaining extends string]
    ? ParseTuple<Rest, Remaining, $, [...TAcc, R]>
    : []
  : [TAcc, TInput];

/** Static type for Optional parsing */
export type ParseOptional<
  TParser extends IParser,
  TInput extends string,
  $ extends Context
> = Parse<TParser, TInput, $> extends [infer R, infer Remaining extends string]
  ? [R, Remaining]
  : [undefined, TInput];

/** Static type for Many parsing */
export type ParseMany<
  TParser extends IParser,
  TInput extends string,
  $ extends Context,
  TAcc extends unknown[] = []
> = Parse<TParser, TInput, $> extends [infer R, infer Remaining extends string]
  ? Remaining extends TInput
    ? [TAcc, TInput] // Prevent infinite recursion on zero-width match
    : ParseMany<TParser, Remaining, $, [...TAcc, R]>
  : [TAcc, TInput];

// =============================================================================
// Union Combinator
// =============================================================================

class _Union<TParsers extends IParser[]> {
  readonly __combinator = "union" as const;
  readonly parsers: TParsers;

  constructor(parsers: TParsers) {
    this.parsers = parsers;
  }

  parse<TInput extends string, $ extends Context>(
    input: TInput,
    $: $
  ): ParseUnion<TParsers, TInput, $> {
    for (const parser of this.parsers) {
      const result = parser.parse(input, $);
      if (result.length === 2) {
        return result as unknown as ParseUnion<TParsers, TInput, $>;
      }
    }
    return [] as ParseUnion<TParsers, TInput, $>;
  }
}

// =============================================================================
// Tuple Combinator
// =============================================================================

class _Tuple<TParsers extends IParser[]> {
  readonly __combinator = "tuple" as const;
  readonly parsers: TParsers;

  constructor(parsers: TParsers) {
    this.parsers = parsers;
  }

  parse<TInput extends string, $ extends Context>(
    input: TInput,
    $: $
  ): ParseTuple<TParsers, TInput, $> {
    const results: unknown[] = [];
    let remaining: string = input;

    for (const parser of this.parsers) {
      const result = parser.parse(remaining, $);
      if (result.length !== 2) {
        return [] as unknown as ParseTuple<TParsers, TInput, $>;
      }
      results.push(result[0]);
      remaining = result[1];
    }

    return [results, remaining] as unknown as ParseTuple<TParsers, TInput, $>;
  }
}

// =============================================================================
// Optional Combinator
// =============================================================================

class _Optional<TParser extends IParser> {
  readonly __combinator = "optional" as const;
  readonly parser: TParser;

  constructor(parser: TParser) {
    this.parser = parser;
  }

  parse<TInput extends string, $ extends Context>(
    input: TInput,
    $: $
  ): ParseOptional<TParser, TInput, $> {
    const result = this.parser.parse(input, $);
    if (result.length === 2) {
      return result as unknown as ParseOptional<TParser, TInput, $>;
    }
    return [undefined, input] as unknown as ParseOptional<TParser, TInput, $>;
  }
}

// =============================================================================
// Many Combinator
// =============================================================================

class _Many<TParser extends IParser> {
  readonly __combinator = "many" as const;
  readonly parser: TParser;

  constructor(parser: TParser) {
    this.parser = parser;
  }

  parse<TInput extends string, $ extends Context>(
    input: TInput,
    $: $
  ): ParseMany<TParser, TInput, $> {
    const results: unknown[] = [];
    let remaining: string = input;

    while (true) {
      const result = this.parser.parse(remaining, $);
      if (result.length !== 2) {
        break;
      }
      results.push(result[0]);
      const newRemaining = result[1];
      // Prevent infinite loop on zero-width matches
      if (newRemaining === remaining) {
        break;
      }
      remaining = newRemaining;
    }

    return [results, remaining] as unknown as ParseMany<TParser, TInput, $>;
  }
}

// =============================================================================
// Exported Factories
// =============================================================================

export const Union = <TParsers extends IParser[]>(
  parsers: [...TParsers]
): _Union<TParsers> => new _Union(parsers);

export const Tuple = <TParsers extends IParser[]>(
  parsers: [...TParsers]
): _Tuple<TParsers> => new _Tuple(parsers);

export const Optional = <TParser extends IParser>(
  parser: TParser
): _Optional<TParser> => new _Optional(parser);

export const Many = <TParser extends IParser>(
  parser: TParser
): _Many<TParser> => new _Many(parser);

// Re-export types
export type { _Union, _Tuple, _Optional, _Many };
