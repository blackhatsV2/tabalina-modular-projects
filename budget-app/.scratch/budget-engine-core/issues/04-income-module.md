# 04: Income module

**What to build:** `modules.income` — any number of income sources, each on its own pay schedule, landing as real money in the day-by-day plan.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] `modules.income.sources` accepts any number of sources, each with its own `id`, `kind`, `amount`, and `PayScheduleRule`.
- [ ] Each source's pay dates are expanded using the shared date/recurrence seam (ticket 01), not a separate implementation.
- [ ] Income lands as a contribution on the day it's paid, visible in that day's and that period's breakdown.
- [ ] Two income sources on different schedules both land correctly inside whichever pay period (from `periodSchedule`) their date falls in.
- [ ] `modules.income.enabled = false` excludes all income from the computed plan.
- [ ] Invalid income data is excluded per ticket 03's isolation mechanism, with a warning, while the rest of the plan still computes.
