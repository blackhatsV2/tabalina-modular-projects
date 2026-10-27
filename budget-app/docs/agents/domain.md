# Domain Docs

How the engineering skills should consume budget-app's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the `budget-app/` root, if it exists.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in.
- **`reference/WORKBOOK_CONTEXT.md`**: not a glossary/ADR, but read first for anything touching the budget engine — it's where Jayrold's numbers, rules, and school-calendar decisions live (per `CLAUDE.md`).

If `GLOSSARY.md` or `docs/adr/` don't exist yet, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. They get created lazily when terms or decisions actually get resolved.

## File structure (single-context)

```
budget-app/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-....md
│   └── 0002-....md
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md` — and where relevant, as defined in the workbook's own glossary (the `G` dict in `build_budget.py` / `reference/WORKBOOK_CONTEXT.md`). Don't drift to synonyms.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap worth noting.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0003 (...), but worth reopening because…_
