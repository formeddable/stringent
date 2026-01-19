# Contributing

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/stringent.git
cd stringent
pnpm install
pnpm build
pnpm test
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Compile TypeScript |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | Type check |

## Key Concept

Type-level and runtime code must stay in sync:
- Runtime: `src/runtime/`
- Type-level: `src/parse/`, `src/static/`

## Pull Requests

1. Fork and create a branch
2. Make changes
3. Ensure tests pass (`pnpm test`)
4. Ensure type checking passes (`pnpm typecheck`)
5. Submit PR
