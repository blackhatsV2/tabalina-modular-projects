# 01: Actuals as spending-entry lists

**What to build:** The model and parser store and validate a list of independently editable/deletable spending entries per day, instead of one lump actual amount — per ADR 0007 (`docs/adr/0007-actuals-as-spending-entry-lists.md`). This is a foundation ticket: no UI, verified entirely through its own tests.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A day's `actuals` entry is a list of `{id, amount, note?, category?}` items, not a single `{amount, note?}`.
- [ ] `category` is optional free text, the same convention as a bill's `category` — no enum.
- [ ] Each entry is addressable and independently editable/deletable by its own `id`.
- [ ] A day's actual total is always the sum of its entries at read time — never stored or cached as a separate field.
- [ ] Stage 1's existing core-vs-module validation split is otherwise unchanged.
- [ ] The existing Jayrold centavo parity test still passes unchanged (the simulation never reads `actuals`, and the fixture's `actuals` is already empty).
