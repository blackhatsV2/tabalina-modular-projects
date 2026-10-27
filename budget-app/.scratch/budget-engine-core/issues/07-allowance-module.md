# 07: Allowance module

**What to build:** `modules.allowance` — a flat daily or weekly living-cost allowance.

**Blocked by:** 03

**Status:** done

- [x] `modules.allowance` stores an amount and a recurrence (e.g. every day).
- [x] The allowance amount lands as a living cost on every day it applies, visible in that day's breakdown.
- [x] `modules.allowance.enabled = false` excludes it from the computed plan.
- [x] Invalid allowance data is excluded per ticket 03's isolation mechanism, with a warning, while the rest of the plan still computes.

Implemented in `src/engine/modules/allowance/index.ts`. Recurrence is `daily` or `weekly` (reusing the
schemas from `src/model/schema.ts`); lands as a signed `allowanceLiving` breakdown term.
