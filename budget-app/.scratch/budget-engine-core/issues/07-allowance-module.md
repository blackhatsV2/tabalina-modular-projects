# 07: Allowance module

**What to build:** `modules.allowance` — a flat daily or weekly living-cost allowance.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] `modules.allowance` stores an amount and a recurrence (e.g. every day).
- [ ] The allowance amount lands as a living cost on every day it applies, visible in that day's breakdown.
- [ ] `modules.allowance.enabled = false` excludes it from the computed plan.
- [ ] Invalid allowance data is excluded per ticket 03's isolation mechanism, with a warning, while the rest of the plan still computes.
