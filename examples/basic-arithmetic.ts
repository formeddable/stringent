/**
 * Basic Arithmetic Example
 *
 * Simple arithmetic parser with proper operator precedence.
 */

import { createParser, defineNode, constVal, lhs, rhs } from 'stringent';

const nodes = [
  defineNode({
    name: 'add',
    pattern: [lhs('number').as('left'), constVal('+'), rhs('number').as('right')],
    precedence: 1,
    resultType: 'number',
    eval: ({ left, right }) => left + right,
  }),
  defineNode({
    name: 'sub',
    pattern: [lhs('number').as('left'), constVal('-'), rhs('number').as('right')],
    precedence: 1,
    resultType: 'number',
    eval: ({ left, right }) => left - right,
  }),
  defineNode({
    name: 'mul',
    pattern: [lhs('number').as('left'), constVal('*'), rhs('number').as('right')],
    precedence: 2,
    resultType: 'number',
    eval: ({ left, right }) => left * right,
  }),
  defineNode({
    name: 'div',
    pattern: [lhs('number').as('left'), constVal('/'), rhs('number').as('right')],
    precedence: 2,
    resultType: 'number',
    eval: ({ left, right }) => left / right,
  }),
  defineNode({
    name: 'pow',
    pattern: [lhs('number').as('base'), constVal('**'), rhs('number').as('exp')],
    precedence: 3,
    resultType: 'number',
    eval: ({ base, exp }) => Math.pow(base, exp),
  }),
] as const;

const parser = createParser(nodes);

console.log('=== Basic Arithmetic ===\n');

const [eval1, err1] = parser.parse('2 + 3', {});
if (!err1) console.log(`2 + 3 = ${eval1({})}`);

const [eval2, err2] = parser.parse('2 + 3 * 4', {});
if (!err2) console.log(`2 + 3 * 4 = ${eval2({})}`); // 14 (precedence)

const [eval3, err3] = parser.parse('(2 + 3) * 4', {});
if (!err3) console.log(`(2 + 3) * 4 = ${eval3({})}`); // 20 (parentheses)

const [eval4, err4] = parser.parse('2 ** 3 + 4 * 5 - 6 / 2', {});
if (!err4) console.log(`2 ** 3 + 4 * 5 - 6 / 2 = ${eval4({})}`); // 25
