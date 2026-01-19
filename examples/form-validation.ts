/**
 * Form Validation Example
 *
 * Type-safe validation rules for form fields.
 */

import { createParser, defineNode, constVal, lhs, rhs } from 'stringent';

const nodes = [
  defineNode({
    name: 'strEq',
    pattern: [lhs('string').as('left'), constVal('=='), rhs('string').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => left === right,
  }),
  defineNode({
    name: 'numGte',
    pattern: [lhs('number').as('left'), constVal('>='), rhs('number').as('right')],
    precedence: 1,
    resultType: 'boolean',
    eval: ({ left, right }) => left >= right,
  }),
  defineNode({
    name: 'contains',
    pattern: [lhs('string').as('haystack'), constVal('contains'), rhs('string').as('needle')],
    precedence: 2,
    resultType: 'boolean',
    eval: ({ haystack, needle }) => String(haystack).includes(String(needle)),
  }),
  defineNode({
    name: 'and',
    pattern: [lhs('boolean').as('left'), constVal('&&'), rhs('boolean').as('right')],
    precedence: 0,
    resultType: 'boolean',
    eval: ({ left, right }) => left && right,
  }),
] as const;

const parser = createParser(nodes);

console.log('=== Form Validation ===\n');

const formSchema = {
  password: 'string',
  confirmPassword: 'string',
  email: 'string',
  age: 'number',
} as const;

const formData = {
  password: 'secret123',
  confirmPassword: 'secret123',
  email: 'user@example.com',
  age: 25,
};

// Validation rules
const [pwMatch, e1] = parser.parse('password == confirmPassword', formSchema);
if (!e1) console.log(`Passwords match: ${pwMatch(formData)}`);

const [ageOk, e2] = parser.parse('age >= 18', formSchema);
if (!e2) console.log(`Age >= 18: ${ageOk(formData)}`);

const [emailOk, e3] = parser.parse('email contains "@"', formSchema);
if (!e3) console.log(`Email has @: ${emailOk(formData)}`);

console.log('\n=== Validation System ===\n');

interface Rule {
  expression: string;
  message: string;
  schema: Record<string, string>;
  getData: (d: typeof formData) => Record<string, unknown>;
}

const rules: Rule[] = [
  {
    expression: 'password == confirmPassword',
    message: 'Passwords must match',
    schema: { password: 'string', confirmPassword: 'string' },
    getData: (d) => ({ password: d.password, confirmPassword: d.confirmPassword }),
  },
  {
    expression: 'age >= 18',
    message: 'Must be 18+',
    schema: { age: 'number' },
    getData: (d) => ({ age: d.age }),
  },
  {
    expression: 'email contains "@"',
    message: 'Email must contain @',
    schema: { email: 'string' },
    getData: (d) => ({ email: d.email }),
  },
];

function validate(data: typeof formData): string[] {
  const errors: string[] = [];
  for (const rule of rules) {
    const [evaluator, err] = parser.parse(rule.expression as never, rule.schema as never);
    if (!err && !evaluator(rule.getData(data))) {
      errors.push(rule.message);
    }
  }
  return errors;
}

console.log('Valid data:', formData);
console.log('Errors:', validate(formData).length === 0 ? 'None' : validate(formData).join(', '));

const invalidData = { password: 'abc', confirmPassword: 'xyz', email: 'bad', age: 16 };
console.log('\nInvalid data:', invalidData);
console.log('Errors:', validate(invalidData).join('; '));
