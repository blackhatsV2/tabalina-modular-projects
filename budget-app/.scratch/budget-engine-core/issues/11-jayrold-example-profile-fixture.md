# 11: Jayrold's example profile fixture

**What to build:** `fixtures/jayrold-profile.json` — Jayrold's real Oct 2026–Dec 2027 plan, re-entered under the general model, as a validation fixture (not a template for new users — see GLOSSARY "Example profile").

**Blocked by:** 04, 05, 06, 08, 09

**Status:** done

- [x] The fixture enables `income`, `bills`, `loans`, `commute`, and `flexibleExpenses`, matching Jayrold's real setup; `allowance` stays disabled.
- [x] Every number in the fixture (salary, rent, GLoan/SPayLater schedules and fees, fare/water/meal amounts, class schedules, terms, holidays) matches `reference/WORKBOOK_CONTEXT.md` and `reference/build_budget.py` exactly.
- [x] The fixture parses successfully and runs through `simulate()` with zero warnings — every module's data is valid.
- [x] The fixture does not bake in `periodOverrides` — it reflects Jayrold's real settings as they'd exist before any plan-specific overrides are applied.

`fixtures/jayrold-profile.json` + `src/fixtures/jayrold-profile.test.ts`. Design notes:
- SPayLater/GLoan1-3 are modeled as `modules.loans` (not `modules.bills`) — they're installment loans per CLAUDE.md's own examples, even though the source workbook lumps everything under one "Bill" category.
- The two ₱500 "Christmas extra" period add-ons (Dec 15 2026/2027) are one-time bills, not `periodOverrides.extra` — this keeps the fixture override-free per the checklist above.
- "Personal & misc" (₱10/day, unconditional) is a `flexibleExpenses` item with `enabled: true` — it doesn't fit `allowance` (which must stay disabled to match Jayrold's real setup) or `commute.perActiveDayExtra` (which only fires on campus days; misc is every day).
- Sunday-outing and brother's-allowance are `flexibleExpenses` items with `enabled: false, reserveRoom: true` — matching both their real default-off switches and the workbook's "savings sized with both switches ON" note (confirmed against `reference/ledger.json`: its day-by-day `ledger` array was generated with both switches off, but its `sim` savings figures were sized with both on).
- Verified informally (not a committed test) that simulating this fixture with `periodOverrides.savings` set to the Python script's historical per-period values reproduces every one of `reference/ledger.json`'s 431 days to the centavo — the real version of this check is ticket 13.
