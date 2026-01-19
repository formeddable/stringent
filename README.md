# Stringent

Type-safe expression parser for TypeScript with compile-time validation.

> **Warning:** Under active development. APIs may change.

## Install

```bash
npm install stringent
```

## Quick Start

```typescript
import { createParser, defineNode, constVal, lhs, rhs } from 'stringent';

// Define operators
const add = defineNode({
  name: 'add',
  pattern: [lhs('number').as('left'), constVal('+'), rhs('number').as('right')],
  precedence: 1,
  resultType: 'number',
  eval: ({ left, right }) => left + right,
});

const mul = defineNode({
  name: 'mul',
  pattern: [lhs('number').as('left'), constVal('*'), rhs('number').as('right')],
  precedence: 2,
  resultType: 'number',
  eval: ({ left, right }) => left * right,
});

// Create parser
const parser = createParser([add, mul]);

// Parse and evaluate
const [evaluator, err] = parser.parse('x + 2 * 3', { x: 'number' });
if (!err) {
  const result = evaluator({ x: 1 }); // 7
  //    ^? number
}
```

## Key Features

- **Compile-time validation** - Invalid expressions fail TypeScript compilation
- **Type inference** - Return types flow through parsing to evaluation
- **ArkType integration** - Schema types validated at compile-time and runtime
- **Operator precedence** - Configurable precedence for correct parsing

## Pattern Elements

| Element         | Description                         |
| --------------- | ----------------------------------- |
| `lhs(type?)`    | Left operand (higher precedence)    |
| `rhs(type?)`    | Right operand (same precedence)     |
| `expr(type?)`   | Full expression (resets precedence) |
| `constVal(str)` | Exact string match                  |

## API

### `createParser(nodes)`

Creates a parser from node definitions.

### `defineNode(config)`

Defines a grammar node:

- `name` - Unique identifier
- `pattern` - Array of pattern elements
- `precedence` - Lower binds looser
- `resultType` - Output type (e.g., `'number'`, `'boolean'`)
- `eval` - Evaluation function

### `parser.parse(input, schema)`

Returns `[evaluator, null]` on success or `[null, error]` on failure.

The evaluator is callable with data matching the schema and has `ast` and `schema` properties.

## Examples

See [`examples/`](./examples) for more:

- Basic arithmetic with precedence
- Comparison operators
- Ternary expressions
- Custom domain operators
- Form validation

## License

MIT
