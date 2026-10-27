# 11: Jayrold's example profile fixture

**What to build:** `fixtures/jayrold-profile.json` — Jayrold's real Oct 2026–Dec 2027 plan, re-entered under the general model, as a validation fixture (not a template for new users — see GLOSSARY "Example profile").

**Blocked by:** 04, 05, 06, 08, 09

**Status:** ready-for-agent

- [ ] The fixture enables `income`, `bills`, `loans`, `commute`, and `flexibleExpenses`, matching Jayrold's real setup; `allowance` stays disabled.
- [ ] Every number in the fixture (salary, rent, GLoan/SPayLater schedules and fees, fare/water/meal amounts, class schedules, terms, holidays) matches `reference/WORKBOOK_CONTEXT.md` and `reference/build_budget.py` exactly.
- [ ] The fixture parses successfully and runs through `simulate()` with zero warnings — every module's data is valid.
- [ ] The fixture does not bake in `periodOverrides` — it reflects Jayrold's real settings as they'd exist before any plan-specific overrides are applied.
