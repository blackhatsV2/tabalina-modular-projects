# 08: Commute module (with allowance+commute composition)

**What to build:** `modules.commute` — weekly ride/meal schedules, terms, and holidays, producing fare/meal/`perActiveDayExtra` costs — and proof that it composes correctly alongside the allowance module when both are enabled.

**Blocked by:** 03, 07

**Status:** ready-for-agent

- [ ] `modules.commute.schedules` stores a per-weekday rides and bought-meals grid; `terms` says which schedule applies from which start date; the latest term starting on or before a day is the one that applies.
- [ ] A day listed in `holidays` has zero rides, zero meals, and zero commute-mode costs, regardless of its weekday pattern.
- [ ] Fare cost = rides × `farePerRide`; meal cost = bought meals × `mealCost`; `perActiveDayExtra`, when set, applies once on any day with at least one ride.
- [ ] `modules.commute.enabled = false` excludes all commute costs from the computed plan.
- [ ] Invalid commute data (malformed schedule, term, or holiday) is excluded per ticket 03's isolation mechanism, with a warning.
- [ ] A profile with both `modules.allowance.enabled` and `modules.commute.enabled` set to `true` sums both modules' daily costs into the day's total — no conflict, no double-count, neither silently overriding the other.
