/**
 * Custom Operators Example
 *
 * Domain-specific operators: strings, set operations, unit conversions.
 */

import { createParser, defineNode, constVal, lhs, rhs } from 'stringent';

// =============================================================================
// String Operations
// =============================================================================

const stringNodes = [
  defineNode({
    name: 'concat',
    pattern: [lhs('string').as('left'), constVal('++'), rhs('string').as('right')],
    precedence: 1,
    resultType: 'string',
    eval: ({ left, right }) => String(left) + String(right),
  }),
  defineNode({
    name: 'repeat',
    pattern: [lhs('string').as('str'), constVal('**'), rhs('number').as('times')],
    precedence: 2,
    resultType: 'string',
    eval: ({ str, times }) => String(str).repeat(Number(times)),
  }),
  defineNode({
    name: 'upper',
    pattern: [constVal('UPPER'), rhs('string').as('str')],
    precedence: 3,
    resultType: 'string',
    eval: ({ str }) => String(str).toUpperCase(),
  }),
] as const;

const stringParser = createParser(stringNodes);

console.log('=== String Operations ===\n');

const [s1, e1] = stringParser.parse('"Hello" ++ " " ++ "World"', {});
if (!e1) console.log(`"Hello" ++ " " ++ "World" = "${s1({})}"`);

const [s2, e2] = stringParser.parse('"abc" ** 3', {});
if (!e2) console.log(`"abc" ** 3 = "${s2({})}"`);

const [s3, e3] = stringParser.parse('UPPER "hello"', {});
if (!e3) console.log(`UPPER "hello" = "${s3({})}"`);

// =============================================================================
// Custom Domain Operators
// =============================================================================

const domainNodes = [
  defineNode({
    name: 'divides',
    pattern: [lhs('number').as('left'), constVal('divides'), rhs('number').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => Number(right) % Number(left) === 0,
  }),
  defineNode({
    name: 'between',
    pattern: [
      lhs('number').as('value'),
      constVal('between'),
      rhs('number').as('low'),
      constVal('and'),
      rhs('number').as('high'),
    ],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ value, low, high }) => Number(value) >= Number(low) && Number(value) <= Number(high),
  }),
] as const;

const domainParser = createParser(domainNodes);

console.log('\n=== Domain Operators ===\n');

const [d1, de1] = domainParser.parse('3 divides 12', {});
if (!de1) console.log(`3 divides 12 = ${d1({})}`); // true

const [d2, de2] = domainParser.parse('5 between 1 and 10', {});
if (!de2) console.log(`5 between 1 and 10 = ${d2({})}`); // true

// =============================================================================
// Unit Conversions
// =============================================================================

const unitNodes = [
  defineNode({
    name: 'kmToMiles',
    pattern: [lhs('number').as('km'), constVal('km'), constVal('to'), constVal('miles')],
    precedence: 1,
    resultType: 'number',
    eval: ({ km }) => Number(km) * 0.621371,
  }),
  defineNode({
    name: 'celsiusToF',
    pattern: [lhs('number').as('c'), constVal('C'), constVal('to'), constVal('F')],
    precedence: 1,
    resultType: 'number',
    eval: ({ c }) => (Number(c) * 9) / 5 + 32,
  }),
] as const;

const unitParser = createParser(unitNodes);

console.log('\n=== Unit Conversions ===\n');

const [u1, ue1] = unitParser.parse('100 km to miles', {});
if (!ue1) console.log(`100 km to miles = ${(u1({}) as number).toFixed(2)}`);

const [u2, ue2] = unitParser.parse('25 C to F', {});
if (!ue2) console.log(`25 C to F = ${u2({})}`);
