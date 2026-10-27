# 10: Weekly & monthly roll-ups

**What to build:** weekly (Mon–Sun) and monthly aggregations of whatever day-by-day plan `simulate()` produces, in the workbook's column shape.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] A weekly roll-up aggregates income, bills, living costs, and savings for each Monday–Sunday week across the plan window, including partial first/last weeks.
- [ ] A monthly roll-up does the same per calendar month, including a partial first/last month.
- [ ] Both roll-ups work correctly over a day-by-day plan with any combination of modules enabled, including none.
- [ ] Roll-up totals are internally consistent with the underlying day-by-day figures they summarize (e.g. a week's total income equals the sum of its days' income).
