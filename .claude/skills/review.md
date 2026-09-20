# Code Review Skill

This skill performs code reviews based on the project's review guidelines.

## Usage

Use `/code-review` to review code changes:
- Review the current diff on the active branch
- Pass `--comment` to post findings as inline PR comments
- Pass `--fix` to apply findings to the working tree

## Review Guidelines (from REVIEW.md)

### What "Important" means
Reserve Important for findings that would break behavior, leak data, or block a rollback: incorrect logic, unscoped database queries, PII in logs or error messages, and migrations that aren't backward compatible. Style, naming, and refactoring suggestions are Nit at most.

### Cap the nits
Report at most five Nits per review. If you found more, say "plus N similar items" in the summary instead of posting them inline. If everything you found is a Nit, lead the summary with "No blocking issues."

### Do not report
- Anything CI already enforces: lint, formatting, type errors
- Generated files under `src/gen/` and any `*.lock` file
- Test-only code that intentionally violates production rules

### Always check
- New API routes have an integration test
- Log lines don't include email addresses, user IDs, or request bodies
- Database queries are scoped to the caller's tenant
