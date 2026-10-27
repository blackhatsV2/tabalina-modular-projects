# 13: Jayrold's centavo parity test

**What to build:** the regression check that the general engine reproduces Jayrold's trusted Python-generated numbers exactly.

**Blocked by:** 11

**Status:** done

- [x] Using Jayrold's fixture (ticket 11) with `periodOverrides.savings` set to the Python script's historical `sim` savings values for every period, `simulate()`'s day-by-day planned balance equals `reference/ledger.json` to the centavo for every day of the plan.
- [x] The result carries zero warnings.
- [x] The breakdown-sums-to-total invariant (ticket 03) holds for every day and every period in this run, not just the no-module skeleton case.

Implemented in `src/fixtures/jayrold-parity.test.ts`: builds `periodOverrides.savings` directly from
`reference/ledger.json`'s `sim` array (not hand-transcribed), runs `simulate()` on the fixture with those
overrides applied, and asserts `day.end` matches `ledger.json`'s `ledger` array's planned balance (pesos ×
100, rounded) for all 431 days — passed on the first run with no engine or fixture changes needed, which is
the strongest signal the general model and engine are faithful to Jayrold's real plan.
