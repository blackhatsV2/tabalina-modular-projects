# 08: Commute module (with allowance+commute composition)

**What to build:** `modules.commute` — weekly ride/meal schedules, terms, and holidays, producing fare/meal/`perActiveDayExtra` costs — and proof that it composes correctly alongside the allowance module when both are enabled.

**Blocked by:** 03, 07

**Status:** done

- [x] `modules.commute.schedules` stores a per-weekday rides and bought-meals grid; `terms` says which schedule applies from which start date; the latest term starting on or before a day is the one that applies.
- [x] A day listed in `holidays` has zero rides, zero meals, and zero commute-mode costs, regardless of its weekday pattern.
- [x] Fare cost = rides × `farePerRide`; meal cost = bought meals × `mealCost`; `perActiveDayExtra`, when set, applies once on any day with at least one ride.
- [x] `modules.commute.enabled = false` excludes all commute costs from the computed plan.
- [x] Invalid commute data (malformed schedule, term, or holiday) is excluded per ticket 03's isolation mechanism, with a warning.
- [x] A profile with both `modules.allowance.enabled` and `modules.commute.enabled` set to `true` sums both modules' daily costs into the day's total — no conflict, no double-count, neither silently overriding the other.

Implemented in `src/engine/modules/commute/index.ts`. Rides/meals grids are Monday-first (index 0=Monday..
6=Sunday) to match the source workbook's weekly pattern tables 1:1; converts from JS's native
Sunday-first weekday at the one lookup site. Breakdown terms: `commuteFare`, `commuteMeal`,
`commutePerActiveDayExtra` — distinct from `allowanceLiving`, so the two modules never collide.
