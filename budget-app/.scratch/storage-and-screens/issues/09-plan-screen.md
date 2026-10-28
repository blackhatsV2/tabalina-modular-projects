# 09: Plan screen

**What to build:** The full Plan screen behind its real route.

**Blocked by:** 02, 03, 04, 05, 06

**Status:** ready-for-agent

- [ ] Renders one card per pay period with its status stamp (ticket 02), breakdown (pay/bills/savings/living), and closing balance.
- [ ] Savings and extra are each editable per period, writing to `periodOverrides`, with that period's numbers updating immediately on edit (no debounce needed for recomputation — only the storage write downstream is debounced, per ticket 06).
- [ ] The horizon strip (ticket 02) renders only on the current period's card — never on a past or future one.
- [ ] Copy refers to the "safety buffer," never "cushion" (existing glossary constraint).
- [ ] Widgets are error-boundaried (ticket 04) and ⓘ-annotated (ticket 05) the same way as the Today screen; module-exclusion warnings render in the warnings banner.
- [ ] Reads and saves the active profile exclusively through the store from ticket 06.
