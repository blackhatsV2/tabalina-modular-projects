# 01: Money & date/recurrence foundation

**What to build:** the integer-centavo money representation and the date/recurrence seam every later module depends on — one of the three public seams agreed for this stage.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Centavo arithmetic (add, subtract, multiply by a count) never uses floating point.
- [ ] A function expands a `PayScheduleRule` (monthly incl. `"last"`, semi-monthly, weekly, biweekly, custom dates) or a bill's recurrence rule into concrete dates over a given range.
- [ ] "Last day of the month" resolves correctly for February in both a leap year and a non-leap year, and for the 31st in a 30-day month.
- [ ] Semi-monthly `[15, "last"]`, weekly, biweekly, and custom-dates rules each produce the expected dates over a multi-month range.
- [ ] All date math runs in UTC; no local timezone ever shifts a computed date by a day.
