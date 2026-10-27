# budget-app: Budget Buddy

A general-purpose personal budget app, first validated against Jayrold's (Instructor I, PHINMA University of
Iloilo) Oct 2026 – Dec 2027 budget workbook. He is new to budgeting: keep the UI simple and friendly, explain
money terms in plain language. Currency and holidays are data a profile carries, not hardcoded assumptions —
see Goals below.

**Status:** scaffold only (configs + dependencies). Nothing under `src/` yet. The data model was redesigned to
be general-purpose (see below) before any implementation starts. Follow the build plan below.

## Goals

Budget Buddy must work for **anyone** — Jayrold, his girlfriend, friends, colleagues — not just Jayrold's own
workbook. His workbook is the **first validated example profile**, not the app's hardcoded design: every number
in it (salary, rent, GLoan schedule, class rides) is ordinary user-entered data, same as any other profile would
enter. The budget engine must still reproduce it (`reference/ledger.json`) to the centavo as a parity/regression
check, but nothing in the data model may assume there's only one income source, one pay schedule, or a commute
module.

One codebase that is:
1. **Offline personal app**: works with no internet; data saved on the device.
2. **Android APK**: installable on his phone. Other OSes use the web version.
3. **Online version on Vercel + Supabase**: optional sign-in that syncs a profile's data.
4. **Backups**: export a backup file locally, upload/share it to Google Drive, restore it.
General-purpose: secure, compatible everywhere, fast and "rugged" (doesn't lose data, handles bad input).
Scope: everything the workbook does **plus extras**: charts, reminders before bills are due, loan payoff
tracking, offline rule-based suggestions (no AI/network service — see step 4), and plain-language explanations
for every number and setting (he's new to budgeting, same as the workbook's hover notes on every heading — see
step 6).

## Modularity & fault isolation

One feature breaking should never break the whole app. This applies everywhere, not just the engine:

- **Engine (step 2)**: a small core (profile data, money/date utilities, the period grid, balance + savings simulation) plus one isolated module per feature (`income`, `bills`, `loans`, `allowance`, `commute`, `flexibleExpenses`), each behind one shared interface, each independently enable-able. `simulate()` catches a failing module and excludes it with a clear warning instead of letting it corrupt the totals or crash the run.
- **Data model (step 1)**: profile data is stored per module section; a corrupted section disables only that module, never the whole profile.
- **Screens (later, step 5)**: each screen/widget gets its own error boundary, so one broken widget shows an error in its own corner instead of taking down the screen around it.
- **Backup, sync, reminders (later, steps 7–9)**: each fails independently and never blocks offline use — a sync error, a failed backup upload, or a reminder-scheduling failure degrades gracefully rather than cascading into the rest of the app.
- **Settings (later, step 5)**: a feature on/off screen exposing each module's `enabled` flag directly, so the user can turn a feature off themselves if it's giving them trouble or they simply don't need it.

## Stack (decided)
- React 19 + TypeScript (strict) + Vite 7
- Capacitor 8 for Android (`appId` `ph.tabalina.budget`, name "Budget Buddy"); `CAPACITOR=1` build skips the PWA service worker
- vite-plugin-pwa for the installable/offline web app
- zustand (state) + idb-keyval (IndexedDB persistence, with a localStorage fallback)
- zod: validate everything loaded from storage, backups and Supabase
- @supabase/supabase-js: auth (email + password; magic links are awkward in an APK) + one table with RLS
- Capacitor plugins: filesystem, share (share backup to Drive), local-notifications (bill reminders), app
- vitest for tests. No UI framework: a small hand-written CSS design system, mobile-first; charts as small SVG components (no chart library)
- `vercel.json` already has SPA rewrites + strict security headers (CSP allows only self + *.supabase.co)

## Reference material (`reference/`)

Jayrold's own workbook is the first validated **example profile**, kept as ground truth for the parity test —
not the app's hardcoded data.

- `WORKBOOK_CONTEXT.md`: Jayrold's numbers, class schedule, rules, school-calendar findings. Source for `fixtures/jayrold-profile.json`.
- `build_budget.py`: the Python script that generated his original single-user xlsx. Still the spec for the *day-by-day arithmetic* (see `day_cost`, `TERMS`, `PATTERNS`, `HOLIDAYS`, events, savings simulation) — translate its logic into the general engine, not its Jayrold-specific hardcoding.
- `ledger.json`: Python's day-by-day result: `sim` (per pay period: start, end, days, pay, bills, living, savings, closing) and `ledger` (per day: date, rides, living cost, planned balance, savings balance). Both optional switches are off. **Use it for parity tests** against `fixtures/jayrold-profile.json`.

## Build plan

### 1. Data model (`src/model/`), one JSON document **per profile**, versioned (`schemaVersion: 1`)

Everything is optional and user-added — there are no hardcoded singleton ids (no fixed `"salary"`/`"rent"`
record baked into the engine); every item the user creates carries its own `id`, and `paid` keys off that `id`.
**All amounts are integer centavos** (₱20.00 = `2000`), never floating point — see Conventions.

Profile data splits into **core** (always present, validated strictly — the whole profile fails to load if
core is broken) and **module sections** (each validated independently; a corrupted section disables only that
module, never the whole profile — see "Modularity & fault isolation" above).

**Core:**
- `meta`: id, profile name/label, currency `{code, symbol, decimalDigits}` (e.g. `{code:"PHP", symbol:"₱", decimalDigits:2}`), `planStart`/`planEnd` (the bounded budgeting horizon the engine generates events/days/periods within — every profile needs one, same as Jayrold's workbook's plan window), updatedAt, deviceId, lastSyncedAt
- `accounts`: `[{id, name, kind: "cash"|"gcash"|"bank"|"other", startingBalance}]` — one or more named starting balances, pooled into a single spendable total for planning (matches how Jayrold's own workbook treats "Total starting money" as one pool). True per-account tracking (which account pays which bill, transfers between accounts) is a possible **future** feature, explicitly out of scope for Stage 1.
- `periodSchedule: PayScheduleRule` — decoupled from the `income` module: defines the pay-period grid the Plan screen and auto-savings use, so it keeps working even if `income` is disabled or excluded due to a data error. In the common case it matches the user's main income's schedule (the setup wizard, step 4, should default it there), but it stands on its own. Jayrold's fixture sets it to `{type:"semiMonthly", days:[15,"last"]}`, reproducing his original 30 periods exactly.
- `savingsGoals`: `[{id, name, targetAmount, targetDate?, kind?: "emergency"|"general"}]` — informational targets the user tracks progress against; not fed back into the simulation
- `safetyBuffer`: integer centavos — the one configurable floor auto-savings protects; no separate cushion constant
- `periodOverrides`: `{[periodStartISO]: {savings?, extra?}}`, keyed by `periodSchedule`'s period boundaries
- `actuals`: `{[dateISO]: {amount, note?}}`
- `paid`: `{[eventKey]: true}`, `eventKey = ${sourceId}:${date}`, `sourceId` is always the owning item's own `id`

`PayScheduleRule` (tagged union, shared by the `income` module's `schedule` field and by `periodSchedule`): `{type:"monthly", day}` | `{type:"semiMonthly", days:[day,day]}` | `{type:"weekly", weekday}` | `{type:"biweekly", weekday, anchor}` | `{type:"custom", dates}` — `day` can be `"last"` for end-of-month.

**Modules** (`modules.<name>`; each section carries its own `enabled: boolean` in addition to whatever its items carry):
- `modules.income`: `{enabled, sources: [{id, name, kind: "salary"|"sideJob"|"allowance"|"thirteenthMonth"|"other", amount, schedule: PayScheduleRule, startDate?, endDate?}]}` — any number of income streams, each on its own schedule
- `modules.bills`: `{enabled, items: [{id, name, category, amount, recurrence: {type:"monthly",day}|{type:"weekly",weekday}|{type:"yearly",month,day}|{type:"once",date}, startDate?, endDate?}]}` — a one-time bill is just `recurrence:{type:"once", date}`
- `modules.loans`: `{enabled, items: [{id, name, provider (free text — GLoan, SPayLater, BillEase, Home Credit, credit card, personal, anything), startDate, installments: [{date, amount, note?}], feeLines?: [{amount, note?}]}]}` — any provider; "amount × N months from a date" is an **entry-time convenience** that expands into `installments` so canonical storage is always the explicit list (irregular last payments, like Jayrold's GLoans, stay representable exactly)
- `modules.allowance`: `{enabled, amount, recurrence}` — a flat daily/weekly living-cost allowance
- `modules.commute`: `{enabled, farePerRide, mealCost, perActiveDayExtra?: {amount, label}, schedules: [{id, name, rides:[7], meals:[7]}], terms: [{id, startDate, name, scheduleId}], holidays: [{date, name}]}` — Jayrold's fare/meal/schedule setup; `perActiveDayExtra` generalizes his "Summit water" into any flat per-campus-day cost
- `modules.flexibleExpenses`: `{enabled, items: [{id, name, enabled: boolean, reserveRoom: boolean, amount, recurrence}]}` — generalizes Jayrold's Sunday-out and brother's allowance into any number of optional/flexible items. Two levels of "on": the module's own `enabled` hides/excludes the whole feature; each item's own `enabled`/`reserveRoom` still work exactly as before (an item can be switched off but still have `reserveRoom: true`)

`allowance` and `commute` were previously one `dailySpending` field with two mutually-exclusive modes — **this changes under the modular architecture**: they're now two independent modules, each separately enable-able, consistent with every other module. Most profiles will enable exactly one of the two (as a convention, not an enforced constraint); nothing stops both running and summing if a profile genuinely wants both.

A reusable Philippine holiday dataset ships as plain data (`src/data/holidays/ph.json`), importable into any profile's `modules.commute.holidays` — never hardcoded into engine logic, so other countries' lists can be added the same way later.

Jayrold's own workbook becomes a seed/fixture profile built with this general model — `fixtures/jayrold-profile.json` — used by the parity test, not as the app's defaults for a brand-new profile. It enables `income`, `bills`, `loans`, `commute`, and `flexibleExpenses`; `allowance` stays disabled, matching his real setup.

### 2. Engine (`src/engine/`, pure functions, no React) — a small core plus isolated feature modules

**Core** (always on): the profile's own core data (above), money/date utilities, the period grid (from `periodSchedule`), and the balance + auto-savings simulation. Core has no knowledge of any specific module's internals — only the shared module interface below.

**Modules** (`src/engine/modules/<name>/`, one per `modules.<name>` section — `income`, `bills`, `loans`, `allowance`, `commute`, `flexibleExpenses`), each behind one shared interface: given its own validated profile section and a date range, contribute (a) events (income/bill/installment dates and amounts), (b) per-day living costs, and (c) breakdown items explaining both. A module never talks to another module or to the core simulation loop directly.

- `src/engine/dates`: the one pure recurrence seam (see Testing Decisions in the spec) — expands a `PayScheduleRule` or a bill's `recurrence` into concrete dates over a range, in UTC. Reused by every module that needs dates (`income`, `bills`, `loans`, `commute`'s terms) and later by reminders and the setup wizard.
- **Module isolation**: `simulate()` runs each enabled module in isolation. If a module throws, or the data it contributes fails its own zod schema, the core **excludes that module's contribution and adds a clear warning to the result** (e.g. "Loans couldn't be calculated: totals exclude them") instead of letting one module's bad data corrupt the totals or crash the run. The breakdown-sums-to-total invariant (below) holds over whatever's actually included; the warning names what's missing.
- Per day: sum the living costs and breakdown items every enabled, non-excluded module contributes for that date, plus income/bill/loan-installment events landing on it; planned balance; actual vs planned (from `actuals`, always user-entered, never inferred)
- **Pay periods**: boundaries come from `periodSchedule` (core), independent of which modules are enabled or excluded
- **Auto-savings** (default when no override): a full whole-plan lookahead — for each period, savings = largest multiple of 100 centavos that keeps every later day's balance ≥ `safetyBuffer`, simulating every `flexibleExpenses` item flagged `reserveRoom: true` as if it were `enabled`, regardless of its real switch. If a cost-contributing module was excluded due to failure, this guarantee only holds over the modules that actually ran — covered by that module's own warning, not a separate one.
- Roll-ups: weekly (Mon–Sun) and monthly with the same columns as the workbook
- Loan payoff: paid vs remaining per loan, driven only by the user-maintained `paid` map (never inferred from today's date); a later screen should *suggest* marking an installment paid once its due date has passed, but `paid` stays the source of truth
- **Every computed total carries its breakdown, not just the number**: a day's planned balance, a pay period's closing balance, a weekly/monthly roll-up figure — each returns the named terms and real values that produced it (e.g. a period's `{start, pay, bills, savings, living, end}`; a day's `{start, income, bills, fare, water, meal, flexibleExpenses, savings, end}`, assembled from whatever modules actually contributed), so step 6 (Help & explainability) can show "explain this number" later purely by rendering what the engine already returned, with no separate recomputation path to keep in sync. Breakdown terms must sum to the total they explain — assert this alongside the parity test.
- **Parity test:** `fixtures/jayrold-profile.json`, with `periodOverrides.savings` set to the Python `sim` savings values and all of Jayrold's modules enabled, must make every day's planned balance equal `reference/ledger.json` to the centavo, with **no warnings** in the result

### 3. Storage & safety (`src/store/`)
- zustand store holding the active profile document; autosave to IndexedDB (debounced) + keep the previous 5 versions as local snapshots
- On load: zod-validate. If invalid, keep the raw copy, load the last good snapshot, and tell the user
- Never lose data: write before navigating away (`visibilitychange` / Capacitor `appStateChange`)

### 4. Suggestions engine (`src/suggestions/`, rule-based, offline)
Rule-based only — no AI/network service.
- A setup-wizard rule table: simple questions ("How are you paid?", "Do you commute?", "Any GLoan/SPayLater/other installments?") map to pre-filled `modules.income`/`modules.allowance`/`modules.commute`/`modules.loans` entries (enabling only the modules that apply — including suggesting *which one* of `allowance`/`commute` to turn on based on the answers, since most people want exactly one), and default `periodSchedule` to the main income source's schedule so most users never have to think about it separately
- Repeated-spending detection over `actuals` → suggest promoting a pattern to a `modules.bills` entry
- Shortfall warnings: surface the engine's own period `status` (OK / Below buffer / SHORTFALL) proactively, before the period starts
- Safe-savings suggestion: this *is* the auto-savings algorithm from step 2 — no separate logic needed
This needs real `actuals` history to be useful in practice, so build order likely has it land after Storage (step 3) and alongside Screens (step 5), even though it's listed here for data-model completeness.

### 5. Screens (bottom tab bar on phone, sidebar on desktop)
Each screen/widget gets its own error boundary (see "Modularity & fault isolation") — one broken widget shows an error in its own corner, not a crashed screen.
- **Today**: today's planned spend broken down, quick "log what I spent", balance now, days to next income, bills due in the next 7 days, a status chip
- **Plan** (pay periods): cards per period with status, editable savings / extra, cushion
- **Days**: list grouped by week: day type, costs, bill/income markers, actual input
- **Reports**: monthly + weekly tables and SVG charts (money at month-end spendable vs savings; income vs bills vs living)
- **Bills & loans**: upcoming list, mark paid (with a suggestion once overdue), add a bill, loan payoff progress bars
- **Setup / Commute & School**: accounts, income sources, bills, loans, flexible expenses, allowance/commute; the commute/school schedule grids and holidays only appear when the `commute` module is enabled. If both `allowance` and `commute` are enabled at once, show a hint that their costs add up — so it's a choice the user made on purpose, not a surprise later
- **Settings**: profile name, currency, safety buffer, emergency fund / savings goals, and a feature on/off list exposing each module's `enabled` flag (see "Modularity & fault isolation")
- **Backup & sync**: export/import, Drive, sign in, sync status
- **Help / glossary**: see step 6 (Help & explainability) for the ⓘ affordances, "explain this number," and the full glossary screen

### 6. Help & explainability (screens-adjacent; Stage 1 only supplies the breakdown data in step 2)
For first-time budgeters, same spirit as the workbook's hover note on every heading.
- A help dictionary (one entry per label/setting/computed-amount term), built from the workbook's glossary (the `G` dict in `reference/build_budget.py`) and `GLOSSARY.md`, so wording stays consistent in exactly one place
- An ⓘ next to every label, number, and setting: tapping it shows that entry's plain-language explanation plus a tip
- **Explain this number**: tapping a computed amount renders the breakdown the engine already returns (step 2) with the user's real figures, e.g. "₱2,811 start + ₱6,000 pay − ₱5,755.54 bills − ₱0 savings − ₱490 living = ₱2,565.46 left on Nov 14" — no separate recomputation, just formatting what's already there
- A Help screen: the full glossary, plus "how your money flows" (payday → bills → pay yourself → live on the rest → keep a buffer → repeat)
- A short first-run walkthrough, and a setting to turn tips off once learned

### 7. Backup
Fails independently of everything else — never blocks offline use (see "Modularity & fault isolation").
- Export `budget-backup-YYYY-MM-DD.json` = `{format:"budget-buddy-backup", version, exportedAt, data}`; optional passphrase → AES-GCM (WebCrypto, PBKDF2 250k iterations, random salt/IV)
- Web: download; on mobile browsers use `navigator.share({files})` so he can pick Google Drive
- Android: write with Filesystem (Documents) then Share → Drive
- Import: validate with zod, show a summary (dates, number of entries) and confirm before replacing; snapshot the current data first

### 8. Online sync (optional; app works fully without it)
Fails independently of everything else — never blocks offline use (see "Modularity & fault isolation").
- Table `public.budget_documents(user_id uuid pk references auth.users on delete cascade, data jsonb not null, schema_version int, revision bigint, updated_at timestamptz default now())` with RLS: select/insert/update/delete only where `user_id = auth.uid()`. Put the SQL in `supabase/migrations/`.
- Sync = whole document, optimistic revision check: push if server revision == local base revision; else show "this device vs cloud" with dates and let him choose (and snapshot the losing copy)
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`). Hide sync UI if unset.

### 9. Reminders
Fails independently of everything else — never blocks offline use (see "Modularity & fault isolation").
- Android: schedule local notifications 1 day before each unpaid bill/installment at 8:00 AM (and on the day); reschedule when data changes
- Web: in-app banner for bills due soon (optional Notification API while open)

### 10. Android APK
- `npx cap add android` (Capacitor 8 needs JDK 21 + Android SDK 36)
- GitHub Actions workflow at the repo root `.github/workflows/budget-app-android.yml`, triggered on changes under `budget-app/**`: setup-node 22, `npm ci`, `CAPACITOR=1 npm run build`, `npx cap sync android`, setup-java 21, `./gradlew assembleDebug`, upload `app-debug.apk` as an artifact
- Locally: `npm run android:apk`

### 11. Vercel
- Import the repo in Vercel with **Root Directory = `budget-app`**, add the two env vars. `vercel.json` handles the rest.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `budget-app/.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `GLOSSARY.md` + `docs/adr/` at the `budget-app/` root, created lazily as needed. See `docs/agents/domain.md`.

## Conventions
- Repo is a monorepo: this project lives only in `budget-app/`. Branches are prefixed `budget-app/…`.
- TypeScript strict; no `any`. Validate external data with zod.
- **All monetary amounts are integer centavos** (`type Centavos = number`, ₱20.00 = `2000`). Never use floating point for money; the only exception is display formatting, which converts centavos → a currency string at the last step.
- No hardcoded singleton ids anywhere in the model (no fixed `"salary"`/`"rent"` records) — every item the user adds owns its own `id`, generated at creation time.
- Currency and holidays are data a profile carries, never hardcoded into engine logic — ship reusable datasets (e.g. `src/data/holidays/ph.json`) as plain importable data, not code branches.
- Keep dependencies few. Ask Jayrold before adding big libraries.
- Mobile-first, works at 360px wide. Large tap targets. Format money using the profile's own currency (e.g. `₱1,234.00`), never hardcode the peso sign in shared components.
- Before calling something done: `npm run typecheck`, `npm test` (incl. the parity test), `npm run build`.
