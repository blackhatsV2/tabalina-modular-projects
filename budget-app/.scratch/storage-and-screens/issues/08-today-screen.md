# 08: Today screen

**What to build:** The full Today screen behind its real route — the first ticket where a user can see and act on their plan.

**Blocked by:** 02, 03, 04, 05, 06, 07

**Status:** ready-for-agent

- [ ] Shows today's planned spending broken down into its real terms (income, bills, fare, savings, etc.), balance now, days to next income, bills due in the next 7 days, and a status stamp (reusing ticket 02's component).
- [ ] "Log what I spent" opens the shared spending-entry editor (ticket 07) scoped to today; future dates are never offered since today is the latest editable date.
- [ ] Each widget (breakdown, quick-log, balance, days-to-next-income, bills-due list, status stamp) is wrapped in its own error boundary (ticket 04); a crash in one leaves the others working, and the screen also carries one top-level boundary as a backstop.
- [ ] Any ⓘ-marked label or number shows its margin note (ticket 05); tapping a computed total shows its breakdown ("explain this number").
- [ ] Any module-exclusion warning from the simulation renders in the warnings banner (ticket 04), not as a crash.
- [ ] Reads and saves the active profile exclusively through the store from ticket 06 — no direct storage access from the screen.
