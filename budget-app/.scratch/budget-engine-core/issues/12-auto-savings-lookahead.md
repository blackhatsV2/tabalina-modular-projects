# 12: Auto-savings whole-plan lookahead

**What to build:** the default per-period savings calculation used whenever a period has no `periodOverrides.savings` entry.

**Blocked by:** 03, 04, 05, 09, 11

**Status:** done

- [x] For each period, the computed savings is the largest multiple of 100 centavos that keeps every later day's balance — for the rest of the whole plan, not just the current period — at or above `safetyBuffer`.
- [x] A `flexibleExpenses` item flagged `reserveRoom: true` is treated as enabled for this calculation even when its real `enabled` is `false`.
- [x] `periodOverrides.savings`, when present for a period (including explicitly `0`), is used instead of the computed value for that period only.
- [x] Running auto-savings (with no `periodOverrides`) on Jayrold's fixture (ticket 11) keeps every single day's balance at or above `safetyBuffer`, start to end of the plan.

Implemented in `src/engine/core/autoSavings.ts` (`computeAutoSavingsFromBreakdown`, the pure left-to-right
lookahead algorithm — unit-tested directly with synthetic breakdown maps) and wired into
`src/engine/core/simulate.ts`, which builds a parallel "lookahead" breakdown (identical to the real one,
except `flexibleExpenses` is re-run through `contributeForLookahead`) and uses it only to size the default
savings, never to change the real simulated plan. Processing periods strictly left-to-right, with each
period's own committed value fixed before the next period's lookahead runs, guarantees the whole-plan
invariant holds for the real, final trajectory (not just each period's local view) — proved in the ticket's
commit message / code comments, exercised by the "looks ahead past the current period" and "accounts for an
already-committed override" test cases. Several earlier tickets' tests needed `safetyBuffer`/`periodOverrides`
pinned to keep their original (pre-auto-savings) expected totals, since this default now actively sizes
savings on any period without an explicit override.
