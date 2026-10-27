# Budget engine core: general data model + pure-TypeScript engine

Status: ready-for-agent

## Problem Statement

Budget Buddy is currently a scaffold: there is no data model and no computation engine under `src/`. Without
one, nothing else (screens, storage, suggestions, sync) can be built, and there's no way to check that a
general-purpose app still produces exactly the numbers Jayrold already trusts from his own Python-generated
workbook.

From the user's side: a first-time budgeter needs to trust that the app's numbers are right, without being able
to audit the arithmetic themselves. And specifically for Jayrold: his own Oct 2026 – Dec 2027 plan must come out
byte-identical, to the centavo, once it's re-expressed as an ordinary profile under the new general model — he
needs proof that generalizing the app for other people (his girlfriend, friends, colleagues) didn't quietly
change or lose anything about his real plan.

## Solution

Build the general, per-profile data model and a pure-TypeScript engine that turns any such profile into a
day-by-day, pay-period, and weekly/monthly plan — with every computed total accompanied by the breakdown that
produced it, so a later "explain this number" feature can render it without recomputing anything. The engine is
a small always-on core plus one isolated module per feature (income, bills, loans, allowance, commute, flexible
expenses): a module with bad data is excluded with a clear warning instead of corrupting the totals or crashing
the run, so one broken feature never breaks the whole plan. Validate the whole thing by building Jayrold's own
workbook as an example profile (`fixtures/jayrold-profile.json`, all modules enabled) and asserting the engine
reproduces `reference/ledger.json` to the centavo with no warnings. This stage is data model + engine only: no
screens, no persistence, no suggestions, no network.

## User Stories

1. As a budgeter, I want to record money I'm starting with across one or more accounts (cash, GCash, bank, other), so that the plan starts from my real current balance.
2. As a budgeter with more than one source of income, I want to add each income source separately with its own amount and pay schedule, so that irregular or multiple incomes are reflected correctly.
3. As a budgeter, I want to choose how I'm paid — monthly on a day, twice a month, weekly, every two weeks, or specific custom dates — so that the plan matches how I actually get paid.
4. As a budgeter, I want the app to use a single pay-period rhythm for planning even if I have several income sources on different schedules, so my Plan view isn't fragmented into confusing overlapping periods.
5. As a first-time user, I want the pay-period rhythm to be able to default to my main income's schedule later, so I don't have to configure a separate concept I don't understand yet.
6. As a budgeter, I want to record recurring bills (rent, utilities, data load, etc.) on a monthly, weekly, or yearly cadence, so regular obligations are planned for automatically.
7. As a budgeter, I want to record one-time bills (like a data reload I only need once a year) without it recurring, so my plan doesn't double-count a cost that only happens once.
8. As a budgeter with an installment loan (GLoan, SPayLater, BillEase, Home Credit, credit card, or anything else), I want to enter it as either "₱X for N months starting on a date" or an explicit list of installments, so both simple and irregular loans (a different last payment, occasional fees) are represented exactly.
9. As a budgeter paying a loan with handling fees, I want to add a fee as its own line tied to an installment, so my plan counts the fee as real money leaving on the right day.
10. As a budgeter with optional spending I only do sometimes (an outing, an allowance I send a family member), I want to mark it "on" or "off" independently of whether my savings plan reserves room for it, so turning it on later never puts me in a shortfall I didn't see coming.
11. As a budgeter who doesn't commute to a job or school on a fixed weekly pattern, I want a simple flat daily or weekly allowance for everyday spending, so I don't have to fill in a schedule I don't need.
12. As a commuter/student with a regular class or work schedule, I want to describe my weekly rides, fares, and bought-meal pattern across one or more terms (with holidays skipped), so my daily living costs match my real routine.
13. As a budgeter, I want to set savings goals (including a named emergency-fund goal) with an optional target amount and date, so I have something concrete to track progress against.
14. As a budgeter, I want to set a single minimum-balance safety buffer, so the app knows how much cushion I always want to keep and never plans past it.
15. As a budgeter, I want the app to automatically suggest how much to set aside as savings each pay period, calculated so every day for the *rest of the plan* — not just the end of the current period — stays above my safety buffer, so a savings suggestion that looks fine today never causes a shortfall two months from now.
16. As a budgeter with a flexible expense flagged "reserve room," I want the automatic savings suggestion to behave as though that expense were already turned on, so I can switch it on in any future period without breaking my plan.
17. As a budgeter, I want to override the automatic savings suggestion for any specific pay period with my own number, so I stay in control when I know better than the algorithm.
18. As a budgeter, I want weekly and monthly roll-ups of my plan (income, bills, living costs, savings) in the same shape as the day-by-day view, so I can check my plan at whatever zoom level makes sense.
19. As a budgeter with multiple loans, I want to see, per loan, how much is paid off and how much remains, so I can track progress toward being debt-free.
20. As a budgeter, I want "paid" status on a bill or loan installment to be something I control myself (ticking it off), not something the app decides based on today's date, so my records reflect what I actually did, not a guess.
21. As a budgeter, I want to log what I actually spent on any day, so I can compare it against what was planned.
22. As a first-time budgeter, I want every computed number (a day's balance, a period's closing balance, a monthly total) to come with the real figures that produced it, so that later, when I tap on a number, the app can show me exactly how it was calculated instead of asking me to trust a black box.
23. As Jayrold, I want my own existing Oct 2026 – Dec 2027 workbook, re-entered as a profile under the new general model, to produce the exact same day-by-day numbers as my trusted Python-generated ledger, so I know the new app didn't lose or change anything about my real plan.
24. As a budgeter in the Philippines, I want peso amounts and Philippine holidays available as ready-to-use data, so I don't have to enter obvious defaults myself, while still being free to add or change holidays for my own situation.
25. As a budgeter in a different country or currency, I want the app's currency and holiday handling to not be hardcoded to the Philippines, so the same app could work for me later without the engine itself changing.
26. As a budgeter, I want every amount stored precisely down to the centavo, with no rounding drift from repeated calculations, so running totals over a 14-month plan don't quietly drift from the real numbers.
27. As a budgeter who loads a previously-saved profile, I want its structure strictly validated before anything is calculated, so a corrupted or malformed file produces a clear problem rather than silently wrong numbers.
28. As a budgeter, I want recurring dates (paydays, monthly bills, "last day of the month") calculated correctly in edge cases like February or 30-day months, so a bill or payday is never silently shown on the wrong date because of a timezone or calendar bug.
29. As a budgeter, if one part of my data turns out to be corrupted (say, my loans section), I want the rest of my plan — income, bills, everyday spending, savings — to keep computing correctly, rather than the whole app refusing to show me anything.
30. As a budgeter in that situation, I want a clear message telling me exactly what couldn't be calculated and why my totals don't include it, so I'm never trusting a number that's quietly wrong or incomplete.
31. As a budgeter, I want to be able to turn an entire feature (loans, commute, flexible expenses, etc.) off myself if I don't use it or it's giving me trouble, so I'm not stuck with a feature I can't get rid of.

## Implementation Decisions

- **Modules (code organization)**: `src/model/` (schema, types, zod validation, the Jayrold example-profile fixture) and `src/engine/` (pure functions only — no React, no storage, no UI), with the engine itself split into `src/engine/core/` (always on) and `src/engine/modules/<name>/` — `income`, `bills`, `loans`, `allowance`, `commute`, `flexibleExpenses` — each behind one shared interface. Three public seams, agreed with the user:
  1. **Profile parsing** (`src/model/`): one function taking raw/unknown JSON and returning a validated, typed `Profile`. **Two-level validation, not all-or-nothing**: core fields are validated strictly (a broken core field fails the whole parse — core isn't optional); each `modules.<name>` section is validated independently, and a section that fails its own schema is treated as absent/disabled with a parse-time warning, not a failed parse. This refines (does not replace) the seam agreed earlier — the function signature is still "raw JSON in, typed result out," but the result can now legitimately be partial.
  2. **Date/recurrence expansion** (`src/engine/dates`): one pure function taking a `PayScheduleRule`/bill `recurrence` rule plus a date range, and returning the concrete dates it produces. This is exactly the "date utilities" piece of the core, and is reused by every module that needs dates (`income`, `bills`, `loans`, `commute`'s terms) and later by reminders and the setup wizard — hence its own seam rather than an internal helper.
  3. **Simulation** (`src/engine/`): one entry point taking a validated `Profile` and returning the full result — days, pay periods, weekly/monthly roll-ups, loan payoff, each with its breakdown, **plus a list of warnings for any module that was excluded**. Everything else (auto-savings, reserve-room, breakdown assembly, roll-ups, module isolation itself) is tested *through* this seam, not as separately-exposed internals. The seam itself (one entry point) is unchanged; its result shape is richer.
- **Data model** (full field list in `CLAUDE.md` step 1): one JSON document per profile, `schemaVersion: 1`, split into **core** (always present, strictly validated: `meta`, `accounts`, `periodSchedule`, `savingsGoals`, `safetyBuffer`, `periodOverrides`, `actuals`, `paid`) and **module sections** (`modules.income`, `modules.bills`, `modules.loans`, `modules.allowance`, `modules.commute`, `modules.flexibleExpenses`), each independently validated and each carrying its own `enabled: boolean`. No hardcoded singleton ids — every item carries its own `id`; `paid` keys off that `id` (`eventKey = ${sourceId}:${date}`).
- **Money**: integer centavos everywhere (`type Centavos = number`, ₱20.00 = `2000`); see ADR 0001. No floating point in any engine arithmetic.
- **Accounts**: pooled into a single spendable total for all planning math — not a per-account ledger. Per-account tracking is noted in `CLAUDE.md` as a possible future feature, explicitly out of scope here.
- **Period schedule**: `periodSchedule: PayScheduleRule` is core, decoupled from the `income` module (ADR 0003) — it keeps defining pay-period boundaries even if `income` is disabled or excluded due to bad data. This modularity requirement reinforces, rather than changes, ADR 0003's original reasoning.
- **`PayScheduleRule`** (tagged union, shared by `modules.income.sources[].schedule` and `periodSchedule`): `{type:"monthly", day}` | `{type:"semiMonthly", days:[day,day]}` | `{type:"weekly", weekday}` | `{type:"biweekly", weekday, anchor}` | `{type:"custom", dates}`, where `day` may be `"last"` for end-of-month. All date math happens in UTC (no local-timezone date shifting).
- **Bills**: `modules.bills.items`; a one-time bill is just `recurrence:{type:"once", date}` (no separate `oneTimeBills` array). Bills do **not** carry `feeLines` — only loans do, per the user's explicit scope.
- **Loans**: `modules.loans.items`; any `provider` is free text (not an enum). Canonical, persisted storage is always an explicit `installments: [{date, amount, note?}]` list; "amount × N months from a date" is an entry-time convenience that expands into that list (so irregular last payments, like Jayrold's GLoans, stay representable exactly). Optional `feeLines: [{amount, note?}]`.
- **Flexible expenses**: `modules.flexibleExpenses.items`, generalizing Jayrold's Sunday-out / brother's-allowance pair into an open-ended list, each with its own `enabled: boolean` and `reserveRoom: boolean`. `reserveRoom: true` means the auto-savings lookahead simulates as if `enabled` were `true`, regardless of its real value. This is a *second*, independent `enabled` from the module-level one (`modules.flexibleExpenses.enabled` turns the whole feature off; an item's own `enabled` turns just that item off).
- **Daily spending — changed decision**: previously a tagged union (`dailySpending: {mode:"allowance"|"commute"}`). Under the modular architecture this is now **two independent modules**, `modules.allowance` and `modules.commute`, each with its own `enabled` flag, consistent with every other module (ADR 0005). Most profiles enable exactly one by convention; nothing technically prevents both. `modules.commute` carries `farePerRide`, `mealCost`, an optional `perActiveDayExtra` (generalizes Jayrold's "Summit water"), `schedules` (per-weekday rides/meals grids), `terms` (which schedule applies from which start date), and `holidays` (zero out rides/meals for that day).
- **Safety buffer**: a single `safetyBuffer: Centavos` field (core). No separate "cushion" constant — considered and explicitly rejected (see the "Cushion" grilling round); the lookahead target is simply "every later day's balance ≥ `safetyBuffer`."
- **Auto-savings**: a full whole-plan lookahead (not a period-level approximation) — for each period, the largest multiple of 100 centavos that keeps every later day's balance at or above `safetyBuffer`, with every `reserveRoom` flexible expense treated as enabled. `periodOverrides.savings`, when present (including explicitly `0`), overrides the computed value for that period. If a cost-contributing module was excluded, the lookahead runs over whatever modules did contribute — this is covered by that module's own warning, not a separate claim of correctness.
- **Breakdowns** (ADR 0004): every computed total the engine returns — a day's planned balance, a period's closing balance, a roll-up figure — carries the named terms and real values that produced it, assembled from whatever modules actually contributed, as part of the same result. Breakdown terms must sum to the total they explain — over whatever was actually included, not a hypothetical complete set.
- **Module isolation** (ADR 0005, the new requirement this update covers): `simulate()` runs each enabled module behind its shared interface — given its own validated section and a date range, it contributes events, daily costs, and breakdown items. The core wraps each module's execution in a try/catch and zod-validates what it returns; a throw or a schema failure excludes that module's contribution from every total and appends a warning naming the module and the fact that totals exclude it (e.g. "Loans couldn't be calculated: totals exclude them"). A module never calls another module or the core simulation loop directly — it only returns data for the core to fold in.
- **Loan payoff**: paid-vs-remaining per loan is driven only by the user-maintained `paid` map; never inferred from "installment date ≤ today." (A later screen will *suggest* marking paid once overdue — that's UI, not engine, logic.)
- **Currency/holidays as data**: `meta.currency` (`{code, symbol, decimalDigits}`) lives on the profile, not hardcoded in formatting code. A reusable Philippine holiday dataset ships as a plain data file (not engine logic), importable into a profile's `modules.commute.holidays`.
- **Jayrold's fixture**: `fixtures/jayrold-profile.json`, built from `reference/WORKBOOK_CONTEXT.md` and `reference/build_budget.py`, expresses his real plan under this general model, with `income`, `bills`, `loans`, `commute`, and `flexibleExpenses` enabled (`allowance` disabled, matching his real setup). It is a validation fixture only — never the app's default data for a new profile (see GLOSSARY "Example profile").

## Testing Decisions

- Tests exercise the three agreed seams and their observable behavior, not the internal functions that compose them (e.g. no direct test of a private per-day cost helper once `simulate()` already covers it). Module isolation is tested *through* `simulate()` too — not by adding a fourth per-module seam — using a deliberately invalid section (or a test double module that throws) as the input.
- **`src/engine/dates`** (direct unit tests — the one seam tested below the top level, because it's reused later by reminders and the setup wizard): `{type:"monthly", day:"last"}` across February in a leap year and a non-leap year, the 31st in a 30-day month, `{type:"semiMonthly", days:[15,"last"]}`, `{type:"weekly"}`, `{type:"biweekly"}`, `{type:"custom", dates}`, and confirmation that all of the above are computed in UTC so no local timezone shifts a date by one day.
- **Profile parsing** (`src/model/`): valid profiles parse to the expected typed shape; malformed/missing/wrong-type core fields are rejected with a clear validation failure for the whole profile; a malformed individual `modules.<name>` section is instead accepted with that module marked disabled/excluded and a parse-time warning, while the rest of the profile parses normally.
- **`simulate()`** (`src/engine/`):
  - The parity test — `fixtures/jayrold-profile.json`, with `periodOverrides.savings` set to the Python `sim` savings values and all of Jayrold's modules enabled, must make every day's planned balance equal `reference/ledger.json` to the centavo, **and the result must carry zero warnings**.
  - **Module isolation** (the new requirement this update covers): a profile with one deliberately broken module (invalid data that fails that module's own schema, or a module implementation that throws) must still return correct totals for the core and every other enabled module, plus exactly one warning naming the broken module and stating that totals exclude it. Cover both failure points — bad input data, and a module that throws during computation despite valid input.
  - Smaller synthetic profiles cover: multiple income sources on different schedules with a decoupled `periodSchedule`; auto-savings' whole-plan lookahead, including a `reserveRoom` flexible expense; the breakdown-sums-to-total invariant (over whatever modules actually contributed); loan payoff via the `paid` map (not date-inferred); bills under each `recurrence` kind (`once`/`monthly`/`weekly`/`yearly`); a `flexibleExpenses` item that's `enabled` vs one that's only `reserveRoom`; `allowance` and `commute` modules both enabled at once (summing, not conflicting).
- **Prior art**: none yet — this is the first test suite in the repo. `vitest` is already configured (`vite.config.ts`'s `test.include: ["src/**/*.test.ts"]`), so tests are colocated `*.test.ts` files next to the source they cover, per that existing convention.

## Out of Scope

- Screens/UI, React components of any kind — including per-screen/widget error boundaries (noted in `CLAUDE.md` "Modularity & fault isolation" for the Screens stage, step 5, not implemented here).
- Storage/persistence (zustand store, IndexedDB autosave, snapshots) — CLAUDE.md step 3.
- The suggestions engine (setup-wizard rule table, repeated-spending detection) — CLAUDE.md step 4. In particular, defaulting `periodSchedule` from the main income source is wizard logic for a later stage; this stage only needs `periodSchedule` to be a valid, independent schema field.
- The help dictionary and "explain this number" UI — CLAUDE.md step 6. This stage only produces the breakdown data that feature will render.
- Backup/export, online sync, reminders, Android build, Vercel config — CLAUDE.md steps 7–11. Their "fails independently, never blocks offline use" requirement is noted in `CLAUDE.md` for when those stages are built, not implemented here.
- A feature on/off settings screen — noted in `CLAUDE.md` for the Screens stage; this stage only needs each module's `enabled` flag to exist and be respected by `simulate()`.
- True per-account ledger tracking (which account pays which bill, transfers) — noted as a possible future feature, not this stage.
- Any "cushion" concept beyond `safetyBuffer` — explicitly dropped.

## Further Notes

- See `docs/adr/0001`–`0005` and `GLOSSARY.md` for the reasoning behind integer centavos, the general profile model, the decoupled period schedule, engine-returned breakdowns, and the core-plus-isolated-modules architecture.
- `reference/build_budget.py` remains the arithmetic spec (`day_cost`, `TERMS`, `PATTERNS`, `HOLIDAYS`, event generation, the savings simulation) — translate its logic, not its Jayrold-specific hardcoding, into the general engine.
- This update changes two earlier decisions, both called out above and in the reply alongside this spec: the `dailySpending` tagged union is replaced by two independent `allowance`/`commute` modules (ADR 0005), and profile parsing moves from all-or-nothing validation to core-strict/per-module-lenient validation.
