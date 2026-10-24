# Claude Configuration

## Git Operations

**Never commit or push changes to Git unless explicitly asked by the user.**

Always ask for explicit confirmation before running:
- `git commit`
- `git push`
- Any git operations that would change the remote repository

# Project Rules

- Always run `npx tsc --noEmit` immediately after modifying any `.ts` or `.tsx` files.
- Resolve any TypeScript compilation errors before introducing new features or moving to other subcomponents.
- Do not bypass type checks or use `// @ts-ignore` to silence compilation problems.
