# 03: simulate() skeleton with module isolation

**What to build:** the single `simulate()` entry point, proven first against a profile with no real feature modules enabled — the period grid, the day-by-day balance loop, the breakdown that explains every total, and the mechanism that excludes a failing module with a warning instead of corrupting the run.

**Blocked by:** 02

**Status:** done

- [x] `simulate()` takes a parsed Profile and returns a day-by-day result spanning `planStart`..`planEnd`.
- [x] Pay-period boundaries come from `periodSchedule`, independent of whether any income module is present.
- [x] A profile with every module disabled produces a flat balance (starting balance carried forward) across every day, with no errors.
- [x] Every returned total (a day's planned balance, a period's closing balance) carries a breakdown whose terms sum exactly to that total.
- [x] A placeholder/test module that throws during its contribution is excluded from every total, and the result carries exactly one warning naming it.
- [x] A placeholder/test module whose contributed data fails its own schema is excluded the same way, with its own warning.
- [x] Excluding a module never crashes `simulate()` and never silently omits the warning.

Implemented in `src/engine/core/{periods,runModule,simulate}.ts` and the shared module interface in
`src/engine/modules/types.ts` (+ empty `registry.ts`, populated as later tickets land). Each module
contributes signed per-day breakdown terms directly (`{breakdown: {date: {term: signedCentavos}}}`); the
core just sums everything, so the invariant "breakdown sums to the total" holds by construction. Core
also applies `periodOverrides.savings`/`.extra` as lump subtractions on each period's start day (auto-savings
default of 0 arrives in ticket 12).
