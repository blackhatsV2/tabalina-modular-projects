# 13: Jayrold's centavo parity test

**What to build:** the regression check that the general engine reproduces Jayrold's trusted Python-generated numbers exactly.

**Blocked by:** 11

**Status:** ready-for-agent

- [ ] Using Jayrold's fixture (ticket 11) with `periodOverrides.savings` set to the Python script's historical `sim` savings values for every period, `simulate()`'s day-by-day planned balance equals `reference/ledger.json` to the centavo for every day of the plan.
- [ ] The result carries zero warnings.
- [ ] The breakdown-sums-to-total invariant (ticket 03) holds for every day and every period in this run, not just the no-module skeleton case.
