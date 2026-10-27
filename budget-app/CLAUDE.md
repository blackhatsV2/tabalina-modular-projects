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
tracking, and offline rule-based suggestions (no AI/network service — see step 4).

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

- `meta`: id, profile name/label, currency `{code, symbol, decimalDigits}` (e.g. `{code:"PHP", symbol:"₱", decimalDigits:2}`), `planStart`/`planEnd` (the bounded budgeting horizon the engine generates events/days/periods within — every profile needs one, same as Jayrold's workbook's plan window), updatedAt, deviceId, lastSyncedAt
- `accounts`: `[{id, name, kind: "cash"|"gcash"|"bank"|"other", startingBalance}]` — one or more named starting balances, pooled into a single spendable total for planning (matches how Jayrold's own workbook treats "Total starting money" as one pool). True per-account tracking (which account pays which bill, transfers between accounts) is a possible **future** feature, explicitly out of scope for Stage 1.
- `periodSchedule: PayScheduleRule` — decoupled from `incomeSources`: defines the pay-period grid the Plan screen and auto-savings use. In the common case it matches the user's main income's schedule (the setup wizard, step 4, should default it there), but it stands on its own, so it still works with zero or several income sources on different schedules. Jayrold's fixture sets it to `{type:"semiMonthly", days:[15,"last"]}`, reproducing his original 30 periods exactly.
- `incomeSources`: `[{id, name, kind: "salary"|"sideJob"|"allowance"|"thirteenthMonth"|"other", amount, schedule: PayScheduleRule, startDate?, endDate?}]` — any number of income streams, each on its own schedule
- `PayScheduleRule` (tagged union): `{type:"monthly", day}` | `{type:"semiMonthly", days:[day,day]}` | `{type:"weekly", weekday}` | `{type:"biweekly", weekday, anchor}` | `{type:"custom", dates}` — `day` can be `"last"` for end-of-month
- `bills`: `[{id, name, category, amount, recurrence: {type:"monthly",day}|{type:"weekly",weekday}|{type:"yearly",month,day}|{type:"once",date}, startDate?, endDate?}]` — replaces the old separate `oneTimeBills` array; a one-time bill is just `recurrence:{type:"once", date}`
- `loans`: `[{id, name, provider (free text — GLoan, SPayLater, BillEase, Home Credit, credit card, personal, anything), startDate, installments: [{date, amount, note?}], feeLines?: [{amount, note?}]}]` — any provider; "amount × N months from a date" is an **entry-time convenience** that expands into `installments` so canonical storage is always the explicit list (irregular last payments, like Jayrold's GLoans, stay representable exactly)
- `flexibleExpenses`: `[{id, name, enabled: boolean, reserveRoom: boolean, amount, recurrence}]` — generalizes Jayrold's Sunday-out and brother's allowance into any number of optional/flexible items; `reserveRoom: true` means auto-savings sizes as if the item were enabled even while `enabled: false`
- `dailySpending`: `{mode:"allowance", amount, recurrence}` | `{mode:"commute", commute: CommuteModule}` — most people use a flat allowance; Jayrold's fare/meal/schedule setup is the optional `commute` mode
- `CommuteModule`: `{farePerRide, mealCost, perActiveDayExtra?: {amount, label}, schedules: [{id, name, rides:[7], meals:[7]}], terms: [{id, startDate, name, scheduleId}], holidays: [{date, name}]}` — `perActiveDayExtra` generalizes Jayrold's "Summit water" into any flat per-campus-day cost
- `savingsGoals`: `[{id, name, targetAmount, targetDate?, kind?: "emergency"|"general"}]`
- `safetyBuffer`: integer centavos
- `periodOverrides`: `{[periodStartISO]: {savings?, extra?}}` — see the open "pay period" design question under step 2
- `actuals`: `{[dateISO]: {amount, note?}}`
- `paid`: `{[eventKey]: true}`, `eventKey = ${sourceId}:${date}`, `sourceId` is always the owning item's own `id`
- A reusable Philippine holiday dataset ships as plain data (`src/data/holidays/ph.json`), importable into any profile's `commute.holidays` — never hardcoded into engine logic, so other countries' lists can be added the same way later

Jayrold's own workbook becomes a seed/fixture profile built with this general model — `fixtures/jayrold-profile.json` — used by the parity test, not as the app's defaults for a brand-new profile.

### 2. Engine (`src/engine/`, pure functions, no React)
- Generate events from `incomeSources` (expand each `PayScheduleRule` into concrete dates), `bills` + their `feeLines` (expand each `recurrence`), `loans` (expand `installments` + `feeLines`), and `flexibleExpenses` that are `enabled` (on their recurrence's dates)
- Per day: look up the active `dailySpending` mode — `allowance` adds a flat cost; `commute` mode looks up term → schedule → rides/meals (0 on holidays), fare/meal/`perActiveDayExtra`; sum with that day's enabled `flexibleExpenses`, bills, loan installments, income; planned balance; actual vs planned (from `actuals`, always user-entered, never inferred)
- **Pay periods**: boundaries come from `periodSchedule`, not from `incomeSources` directly — any income lands within whichever period contains its date, regardless of how many income sources there are or how their own schedules differ
- **Auto-savings** (default when no override): a full whole-plan lookahead — for each period, savings = largest multiple of 100 centavos that keeps every later day's balance ≥ `safetyBuffer` (the one configurable floor — no separate hidden cushion constant), simulating every `flexibleExpenses` item flagged `reserveRoom: true` as if it were `enabled`, regardless of its real switch
- Roll-ups: weekly (Mon–Sun) and monthly with the same columns as the workbook
- Loan payoff: paid vs remaining per loan, driven only by the user-maintained `paid` map (never inferred from today's date); a later screen should *suggest* marking an installment paid once its due date has passed, but `paid` stays the source of truth
- **Parity test:** `fixtures/jayrold-profile.json`, with `periodOverrides.savings` set to the Python `sim` savings values, must make every day's planned balance equal `reference/ledger.json` to the centavo

### 3. Storage & safety (`src/store/`)
- zustand store holding the active profile document; autosave to IndexedDB (debounced) + keep the previous 5 versions as local snapshots
- On load: zod-validate. If invalid, keep the raw copy, load the last good snapshot, and tell the user
- Never lose data: write before navigating away (`visibilitychange` / Capacitor `appStateChange`)

### 4. Suggestions engine (`src/suggestions/`, rule-based, offline)
Rule-based only — no AI/network service.
- A setup-wizard rule table: simple questions ("How are you paid?", "Do you commute?", "Any GLoan/SPayLater/other installments?") map to pre-filled `incomeSources`/`dailySpending`/`loans` entries, and default `periodSchedule` to the main income source's schedule so most users never have to think about it separately
- Repeated-spending detection over `actuals` → suggest promoting a pattern to a `bills` entry
- Shortfall warnings: surface the engine's own period `status` (OK / Below buffer / SHORTFALL) proactively, before the period starts
- Safe-savings suggestion: this *is* the auto-savings algorithm from step 2 — no separate logic needed
This needs real `actuals` history to be useful in practice, so build order likely has it land after Storage (step 3) and alongside Screens (step 5), even though it's listed here for data-model completeness.

### 5. Screens (bottom tab bar on phone, sidebar on desktop)
- **Today**: today's planned spend broken down, quick "log what I spent", balance now, days to next income, bills due in the next 7 days, a status chip
- **Plan** (pay periods): cards per period with status, editable savings / extra, cushion
- **Days**: list grouped by week: day type, costs, bill/income markers, actual input
- **Reports**: monthly + weekly tables and SVG charts (money at month-end spendable vs savings; income vs bills vs living)
- **Bills & loans**: upcoming list, mark paid (with a suggestion once overdue), add a bill, loan payoff progress bars
- **Setup / Commute & School**: accounts, income sources, bills, loans, flexible expenses, daily-spending mode; the commute/school schedule grids and holidays only appear when `dailySpending.mode = "commute"`
- **Settings**: profile name, currency, safety buffer, emergency fund / savings goals
- **Backup & sync**: export/import, Drive, sign in, sync status
- **Help / glossary**: plain-language glossary of every term

### 6. Backup
- Export `budget-backup-YYYY-MM-DD.json` = `{format:"budget-buddy-backup", version, exportedAt, data}`; optional passphrase → AES-GCM (WebCrypto, PBKDF2 250k iterations, random salt/IV)
- Web: download; on mobile browsers use `navigator.share({files})` so he can pick Google Drive
- Android: write with Filesystem (Documents) then Share → Drive
- Import: validate with zod, show a summary (dates, number of entries) and confirm before replacing; snapshot the current data first

### 7. Online sync (optional; app works fully without it)
- Table `public.budget_documents(user_id uuid pk references auth.users on delete cascade, data jsonb not null, schema_version int, revision bigint, updated_at timestamptz default now())` with RLS: select/insert/update/delete only where `user_id = auth.uid()`. Put the SQL in `supabase/migrations/`.
- Sync = whole document, optimistic revision check: push if server revision == local base revision; else show "this device vs cloud" with dates and let him choose (and snapshot the losing copy)
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`). Hide sync UI if unset.

### 8. Reminders
- Android: schedule local notifications 1 day before each unpaid bill/installment at 8:00 AM (and on the day); reschedule when data changes
- Web: in-app banner for bills due soon (optional Notification API while open)

### 9. Android APK
- `npx cap add android` (Capacitor 8 needs JDK 21 + Android SDK 36)
- GitHub Actions workflow at the repo root `.github/workflows/budget-app-android.yml`, triggered on changes under `budget-app/**`: setup-node 22, `npm ci`, `CAPACITOR=1 npm run build`, `npx cap sync android`, setup-java 21, `./gradlew assembleDebug`, upload `app-debug.apk` as an artifact
- Locally: `npm run android:apk`

### 10. Vercel
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
