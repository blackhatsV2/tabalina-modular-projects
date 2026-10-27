# 04: Income module

**What to build:** `modules.income` — any number of income sources, each on its own pay schedule, landing as real money in the day-by-day plan.

**Blocked by:** 03

**Status:** done

- [x] `modules.income.sources` accepts any number of sources, each with its own `id`, `kind`, `amount`, and `PayScheduleRule`.
- [x] Each source's pay dates are expanded using the shared date/recurrence seam (ticket 01), not a separate implementation.
- [x] Income lands as a contribution on the day it's paid, visible in that day's and that period's breakdown.
- [x] Two income sources on different schedules both land correctly inside whichever pay period (from `periodSchedule`) their date falls in.
- [x] `modules.income.enabled = false` excludes all income from the computed plan.
- [x] Invalid income data is excluded per ticket 03's isolation mechanism, with a warning, while the rest of the plan still computes.

Implemented in `src/engine/modules/income/index.ts`, registered in `src/engine/modules/registry.ts`. Multiple
sources landing on the same day sum into one `income` breakdown term (not split per-source) — simplest shape
that still satisfies the breakdown-sums-to-total invariant.
