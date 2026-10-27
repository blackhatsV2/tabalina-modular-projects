# 05: Bills module

**What to build:** `modules.bills` — recurring and one-time bills, landing as costs in the day-by-day plan.

**Blocked by:** 03

**Status:** done

- [x] `modules.bills.items` supports `monthly` (incl. `"last"` day), `weekly`, `yearly`, and `once` recurrence kinds.
- [x] Each bill's due dates are expanded using the shared date/recurrence seam.
- [x] A bill's amount lands as a cost on its due date(s), visible in that day's and that period's breakdown.
- [x] A `once` bill produces exactly one occurrence, never repeating.
- [x] `modules.bills.enabled = false` excludes all bills from the computed plan.
- [x] Invalid bills data is excluded per ticket 03's isolation mechanism, with a warning, while the rest of the plan still computes.

Implemented in `src/engine/modules/bills/index.ts`. Added `billRecurrenceSchema`/`yearlyRuleSchema`/
`onceRuleSchema` etc. to `src/model/schema.ts` so bills, loans, and flexible expenses can share the same
recurrence building blocks as `PayScheduleRule`.
