# 12: Auto-savings whole-plan lookahead

**What to build:** the default per-period savings calculation used whenever a period has no `periodOverrides.savings` entry.

**Blocked by:** 03, 04, 05, 09, 11

**Status:** ready-for-agent

- [ ] For each period, the computed savings is the largest multiple of 100 centavos that keeps every later day's balance — for the rest of the whole plan, not just the current period — at or above `safetyBuffer`.
- [ ] A `flexibleExpenses` item flagged `reserveRoom: true` is treated as enabled for this calculation even when its real `enabled` is `false`.
- [ ] `periodOverrides.savings`, when present for a period (including explicitly `0`), is used instead of the computed value for that period only.
- [ ] Running auto-savings (with no `periodOverrides`) on Jayrold's fixture (ticket 11) keeps every single day's balance at or above `safetyBuffer`, start to end of the plan.
