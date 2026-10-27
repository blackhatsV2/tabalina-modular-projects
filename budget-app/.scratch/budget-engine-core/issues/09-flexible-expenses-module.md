# 09: Flexible expenses module

**What to build:** `modules.flexibleExpenses` — any number of optional items, each independently switchable and independently flaggable to reserve room.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] `modules.flexibleExpenses.items` supports any number of items, each with its own `id`, `enabled`, `reserveRoom`, `amount`, and recurrence.
- [ ] An item with `enabled: true` contributes its cost on its recurrence dates; `enabled: false` contributes nothing to the computed plan, regardless of `reserveRoom`.
- [ ] `modules.flexibleExpenses.enabled = false` excludes every item, regardless of each item's own `enabled`/`reserveRoom`.
- [ ] Invalid flexible-expense data is excluded per ticket 03's isolation mechanism, with a warning.
