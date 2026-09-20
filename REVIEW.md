{\rtf1\ansi\ansicpg1252\cocoartf2907
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # Review instructions\
\
## What Important means here\
\
Reserve Important for findings that would break behavior, leak data,\
or block a rollback: incorrect logic, unscoped database queries, PII\
in logs or error messages, and migrations that aren't backward\
compatible. Style, naming, and refactoring suggestions are Nit at\
most.\
\
## Cap the nits\
\
Report at most five Nits per review. If you found more, say "plus N\
similar items" in the summary instead of posting them inline. If\
everything you found is a Nit, lead the summary with "No blocking\
issues."\
\
## Do not report\
\
- Anything CI already enforces: lint, formatting, type errors\
- Generated files under `src/gen/` and any `*.lock` file\
- Test-only code that intentionally violates production rules\
\
## Always check\
\
- New API routes have an integration test\
- Log lines don't include email addresses, user IDs, or request bodies\
- Database queries are scoped to the caller's tenant}