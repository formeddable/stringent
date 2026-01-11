# Stringent

A type-safe expression parser for TypeScript with compile-time validation and inference.

> **Warning**
> This library is under active development and not yet ready for production use. APIs may change.

## Overview

Stringent parses and validates expressions like `values.password == values.confirmPassword` against a schema at both compile-time and runtime, with full TypeScript type inference for expression results.

## Installation

```bash
npm install stringent
# or
pnpm add stringent
```

## Usage

### Define Your Grammar

Use `defineNode` to create expression nodes with patterns, precedence, and result types:

```typescript
import { defineNode, number, constVal, lhs, rhs, createParser } from 'stringent';

// Atomic: number literals
const numberLit = defineNode({
  name: "number",
  pattern: [number()],
  precedence: "atom",
  resultType: "number",
});

// Binary operators with precedence
const add = defineNode({
  name: "add",
  pattern: [lhs("number").as("left"), constVal("+"), rhs("number").as("right")],
  precedence: 1,  // Lower = binds looser
  resultType: "number",
});

const mul = defineNode({
  name: "mul",
  pattern: [lhs("number").as("left"), constVal("*"), rhs("number").as("right")],
  precedence: 2,  // Higher = binds tighter
  resultType: "number",
});
```

### Create a Parser

```typescript
const parser = createParser([numberLit, add, mul] as const);

// Type-safe parsing - result type is inferred at compile-time
const result = parser.parse("1+2*3", {});
//    ^? const result: [{ node: "add"; left: { node: "number"; value: "1" }; right: { node: "mul"; left: { node: "number"; value: "2" }; right: { node: "number"; value: "3" } } }, ""]
```

### Pattern Elements

| Pattern | Description |
|---------|-------------|
| `number()` | Matches numeric literals |
| `string(quotes)` | Matches quoted strings |
| `ident()` | Matches identifiers, resolves type from context |
| `constVal(value)` | Matches exact string (operators, keywords) |
| `lhs(constraint)` | Left operand (higher precedence, avoids left-recursion) |
| `rhs(constraint)` | Right operand (same precedence, right-associative) |
| `expr(constraint)` | Full expression (all grammar levels) |

Use `.as(name)` to capture pattern elements as named bindings in the AST:

```typescript
lhs("number").as("left")  // Captures left operand as "left" in the AST node
```

### Runtime Evaluation (Coming Soon)

> **Note**
> Runtime evaluation is not yet implemented.

Add `eval` to compute values at runtime:

```typescript
const add = defineNode({
  name: "add",
  pattern: [lhs("number").as("left"), constVal("+"), rhs("number").as("right")],
  precedence: 1,
  resultType: "number",
  eval: ({ left, right }) => left + right,
});
```

## Key Features

- **Compile-time validation**: Invalid expressions fail TypeScript compilation
- **Type inference**: Expression result types are inferred automatically
- **Operator precedence**: Correct parsing of complex expressions
- **Schema-aware**: Validates field references against your schema
- **Dual API**: Same parsing logic at compile-time (types) and runtime

## License

MIT
