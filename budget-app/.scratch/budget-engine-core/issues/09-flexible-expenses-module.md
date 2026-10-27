# 09: Flexible expenses module

**What to build:** `modules.flexibleExpenses` — any number of optional items, each independently switchable and independently flaggable to reserve room.

**Blocked by:** 03

**Status:** done

- [x] `modules.flexibleExpenses.items` supports any number of items, each with its own `id`, `enabled`, `reserveRoom`, `amount`, and recurrence.
- [x] An item with `enabled: true` contributes its cost on its recurrence dates; `enabled: false` contributes nothing to the computed plan, regardless of `reserveRoom`.
- [x] `modules.flexibleExpenses.enabled = false` excludes every item, regardless of each item's own `enabled`/`reserveRoom`.
- [x] Invalid flexible-expense data is excluded per ticket 03's isolation mechanism, with a warning.

Implemented in `src/engine/modules/flexibleExpenses/index.ts`. Also exports `contributeForLookahead`
(item active if `enabled || reserveRoom`), used only by ticket 12's auto-savings algorithm — never by the
real simulated plan.
