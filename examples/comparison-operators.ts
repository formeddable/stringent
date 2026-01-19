/**
 * Comparison Operators Example
 *
 * Arithmetic + comparison operators for building filter expressions.
 */

import { createParser, defineNode, constVal, lhs, rhs } from 'stringent';

const nodes = [
  // Arithmetic (higher precedence)
  defineNode({
    name: 'add',
    pattern: [lhs('number').as('left'), constVal('+'), rhs('number').as('right')],
    precedence: 2,
    resultType: 'number',
    eval: ({ left, right }) => left + right,
  }),
  defineNode({
    name: 'mul',
    pattern: [lhs('number').as('left'), constVal('*'), rhs('number').as('right')],
    precedence: 3,
    resultType: 'number',
    eval: ({ left, right }) => left * right,
  }),

  // Comparisons (lower precedence)
  defineNode({
    name: 'eq',
    pattern: [lhs('number').as('left'), constVal('=='), rhs('number').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => left === right,
  }),
  defineNode({
    name: 'lt',
    pattern: [lhs('number').as('left'), constVal('<'), rhs('number').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => left < right,
  }),
  defineNode({
    name: 'gt',
    pattern: [lhs('number').as('left'), constVal('>'), rhs('number').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => left > right,
  }),
  defineNode({
    name: 'gte',
    pattern: [lhs('number').as('left'), constVal('>='), rhs('number').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => left >= right,
  }),
] as const;

const parser = createParser(nodes);

console.log('=== Comparison Operators ===\n');

// With variables
const schema = { age: 'number', minAge: 'number' } as const;

const [eval1, err1] = parser.parse('age >= minAge', schema);
if (!err1) console.log(`age >= minAge = ${eval1({ age: 25, minAge: 18 })}`); // true

const [eval2, err2] = parser.parse('age + 10 > 30', schema);
if (!err2) console.log(`age + 10 > 30 = ${eval2({ age: 25, minAge: 18 })}`); // true

// Pure literals
const [eval3, err3] = parser.parse('10 * 2 < 25', {});
if (!err3) console.log(`10 * 2 < 25 = ${eval3({})}`); // true

console.log('\n=== Filter Example ===\n');

type Item = { name: string; age: number };
const items: Item[] = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 17 },
  { name: 'Charlie', age: 30 },
];

const [filter, filterErr] = parser.parse('age >= 18', { age: 'number' });
if (!filterErr) {
  const adults = items.filter((item) => filter({ age: item.age }));
  console.log('Adults:', adults.map((i) => i.name).join(', '));
}
