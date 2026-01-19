/**
 * Conditional (Ternary) Expression Example
 *
 * Ternary expressions with comparisons and arithmetic.
 */

import { createParser, defineNode, constVal, lhs, rhs, expr } from 'stringent';

const nodes = [
  // Ternary (lowest precedence)
  defineNode({
    name: 'ternary',
    pattern: [
      lhs('boolean').as('condition'),
      constVal('?'),
      expr('number').as('then'),
      constVal(':'),
      rhs('number').as('else'),
    ],
    precedence: 0,
    resultType: 'number',
    eval: ({ condition, then: thenVal, else: elseVal }) => (condition ? thenVal : elseVal),
  }),

  // Comparisons
  defineNode({
    name: 'gte',
    pattern: [lhs('number').as('left'), constVal('>='), rhs('number').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => left >= right,
  }),
  defineNode({
    name: 'gt',
    pattern: [lhs('number').as('left'), constVal('>'), rhs('number').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => left > right,
  }),

  // Arithmetic
  defineNode({
    name: 'add',
    pattern: [lhs('number').as('left'), constVal('+'), rhs('number').as('right')],
    precedence: 2,
    resultType: 'number',
    eval: ({ left, right }) => left + right,
  }),
  defineNode({
    name: 'sub',
    pattern: [lhs('number').as('left'), constVal('-'), rhs('number').as('right')],
    precedence: 2,
    resultType: 'number',
    eval: ({ left, right }) => left - right,
  }),
] as const;

const parser = createParser(nodes);
const schema = { score: 'number', threshold: 'number', bonus: 'number', penalty: 'number' } as const;

console.log('=== Ternary Expressions ===\n');

const data = { score: 85, threshold: 70, bonus: 10, penalty: 5 };

const [eval1, err1] = parser.parse('score >= threshold ? bonus : penalty', schema);
if (!err1) console.log(`score >= threshold ? bonus : penalty = ${eval1(data)}`); // 10

const [eval2, err2] = parser.parse('score > 90 ? 100 : 50', schema);
if (!err2) console.log(`score > 90 ? 100 : 50 = ${eval2(data)}`); // 50

const [eval3, err3] = parser.parse('score >= threshold ? score + bonus : score - penalty', schema);
if (!err3) console.log(`score >= threshold ? score + bonus : score - penalty = ${eval3(data)}`); // 95

// Nested ternary
const [eval4, err4] = parser.parse('score >= 90 ? 100 : (score >= 70 ? 75 : 50)', schema);
if (!err4) console.log(`Nested ternary = ${eval4(data)}`); // 75

console.log('\n=== Clamp Example ===\n');

const clampSchema = { value: 'number', min: 'number', max: 'number' } as const;
const [clamp, clampErr] = parser.parse('value > max ? max : (value > min ? value : min)', clampSchema);

if (!clampErr) {
  console.log(`clamp(-10, 0, 100) = ${clamp({ value: -10, min: 0, max: 100 })}`); // 0
  console.log(`clamp(50, 0, 100) = ${clamp({ value: 50, min: 0, max: 100 })}`); // 50
  console.log(`clamp(150, 0, 100) = ${clamp({ value: 150, min: 0, max: 100 })}`); // 100
}
