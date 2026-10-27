# 03: simulate() skeleton with module isolation

**What to build:** the single `simulate()` entry point, proven first against a profile with no real feature modules enabled — the period grid, the day-by-day balance loop, the breakdown that explains every total, and the mechanism that excludes a failing module with a warning instead of corrupting the run.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `simulate()` takes a parsed Profile and returns a day-by-day result spanning `planStart`..`planEnd`.
- [ ] Pay-period boundaries come from `periodSchedule`, independent of whether any income module is present.
- [ ] A profile with every module disabled produces a flat balance (starting balance carried forward) across every day, with no errors.
- [ ] Every returned total (a day's planned balance, a period's closing balance) carries a breakdown whose terms sum exactly to that total.
- [ ] A placeholder/test module that throws during its contribution is excluded from every total, and the result carries exactly one warning naming it.
- [ ] A placeholder/test module whose contributed data fails its own schema is excluded the same way, with its own warning.
- [ ] Excluding a module never crashes `simulate()` and never silently omits the warning.
