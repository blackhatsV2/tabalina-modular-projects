# 05: Bills module

**What to build:** `modules.bills` — recurring and one-time bills, landing as costs in the day-by-day plan.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] `modules.bills.items` supports `monthly` (incl. `"last"` day), `weekly`, `yearly`, and `once` recurrence kinds.
- [ ] Each bill's due dates are expanded using the shared date/recurrence seam.
- [ ] A bill's amount lands as a cost on its due date(s), visible in that day's and that period's breakdown.
- [ ] A `once` bill produces exactly one occurrence, never repeating.
- [ ] `modules.bills.enabled = false` excludes all bills from the computed plan.
- [ ] Invalid bills data is excluded per ticket 03's isolation mechanism, with a warning, while the rest of the plan still computes.
