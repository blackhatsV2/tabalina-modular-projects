# budget-app: Budget Buddy

Personal budget app for Jayrold (Instructor I, PHINMA University of Iloilo), built from his
Oct 2026 – Dec 2027 budget workbook. He is new to budgeting: keep the UI simple and friendly, explain
money terms in plain language, and use Philippine pesos (₱).

**Status:** scaffold only (configs + dependencies). Nothing under `src/` yet. Follow the build plan below.

## Goals (from Jayrold)
One codebase that is:
1. **Offline personal app**: works with no internet; data saved on the device.
2. **Android APK**: installable on his phone. Other OSes use the web version.
3. **Online version on Vercel + Supabase**: optional sign-in that syncs his data.
4. **Backups**: export a backup file locally, upload/share it to Google Drive, restore it.
He wants something secure, compatible everywhere, fast and "rugged" (doesn't lose data, handles bad input).
Scope: everything the workbook does **plus extras**: charts, reminders before bills are due, loan payoff tracking.

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
- `WORKBOOK_CONTEXT.md`: **read first.** All of Jayrold's numbers, class schedules, rules, school calendar findings and decisions.
- `build_budget.py`: the Python script that generates the xlsx. It is the spec for the engine (see `day_cost`, `TERMS`, `PATTERNS`, `HOLIDAYS`, events, and the savings simulation).
- `ledger.json`: Python's day-by-day result: `sim` (per pay period: start, end, days, pay, bills, living, savings, closing) and `ledger` (per day: date, rides, living cost, planned balance, savings balance). Both optional switches are off. **Use it for parity tests.**

## Build plan

### 1. Data model (`src/model/`), one JSON document, versioned (`schemaVersion: 1`)
- `settings`: plan start/end, starting cash/GCash/bank, salary per payday (6000), paydays rule (15th + last day), summerPaid, rent (2000, day 1), farePerRide (20), waterPerCampusDay (20), mealPrice (100), miscPerDay (10), sundayOut {enabled:false, fare:80, water:25}, brother {enabled:false, amount:500, day:15}, safetyBuffer (500), emergencyFundGoal (13500), thirteenthMonth {amount:0, date}
- `schedules`: id, name, rides[7] (Mon..Sun), meals[7]
- `terms`: id, start date, name, kind (semester|exam|break|christmas|summer), scheduleId
- `holidays`: date, name
- `loans`: id, name, provider (SPayLater/GLoan), installments [{date, amount}], with fee notes
- `oneTimeBills`: id, date, item, category, amount (e.g. Smart data reload ₱449 on 2027-10-15)
- `periodOverrides`: { [periodStartISO]: { savings?: number, extra?: number } }
- `actuals`: { [dateISO]: { amount: number, note?: string } }
- `paid`: { [eventKey]: true }, where eventKey = `${sourceId}:${date}`
- meta: id, updatedAt, deviceId, lastSyncedAt
Seed it with exactly the workbook's data (see `build_budget.py`). Dates are `YYYY-MM-DD` strings; do date maths in UTC to avoid timezone bugs.

### 2. Engine (`src/engine/`, pure functions, no React)
- Generate events: salary on paydays (0 in summer if `summerPaid` false), 13th month, rent monthly, loan installments, one-time bills, brother (if enabled)
- Per day: term → schedule → rides/meals (0 on holidays); fare, water, meal, Sunday out (if enabled), misc, extra (on period start); living total; income; bills; savings move; planned balance; savings balance; actual vs planned
- Pay periods (payday to the day before the next payday): pay in, bills, start, savings, extra, living, end, cushion over buffer, status OK / Below buffer / SHORTFALL
- **Auto-savings** (default when no override): greedy look-ahead: for each period, savings = largest multiple of 100 that keeps every later day's balance ≥ (buffer + 500 cushion) assuming no later savings, while **reserving room for the optional items** (Sunday out, brother) even when they're switched off. The last period keeps rent + ~2 weeks of costs for the month after the plan ends.
- Roll-ups: weekly (Mon–Sun) and monthly with the same columns as the workbook
- Loan payoff: paid vs remaining per loan, next due date, payoff date
- **Parity test:** with `periodOverrides.savings` set to the Python `sim` savings values, every day's planned balance must equal `reference/ledger.json` to the centavo.

### 3. Storage & safety (`src/store/`)
- zustand store holding the document; autosave to IndexedDB (debounced) + keep the previous 5 versions as local snapshots
- On load: zod-validate. If invalid, keep the raw copy, load the last good snapshot, and tell the user
- Never lose data: write before navigating away (`visibilitychange` / Capacitor `appStateChange`)

### 4. Screens (bottom tab bar on phone, sidebar on desktop)
- **Today**: today's planned spend broken down, quick "log what I spent", balance now, days to next payday, bills due in the next 7 days, a status chip
- **Plan** (pay periods): cards per period with status, editable savings / extra, cushion
- **Days**: list grouped by week: day type, rides, costs, bill/payday markers, actual input
- **Reports**: monthly + weekly tables and SVG charts (money at month-end spendable vs savings; income vs bills vs living)
- **Bills & loans**: upcoming list, mark paid, add a bill, loan payoff progress bars
- **School**: terms, weekly schedules (rides/meals grids), holidays: all editable
- **Settings**: every amount and the switches (Sunday out, brother, summer pay)
- **Backup & sync**: export/import, Drive, sign in, sync status
- **Help / glossary**: port the workbook's glossary (`G` dict in `build_budget.py`)

### 5. Backup
- Export `budget-backup-YYYY-MM-DD.json` = `{format:"budget-buddy-backup", version, exportedAt, data}`; optional passphrase → AES-GCM (WebCrypto, PBKDF2 250k iterations, random salt/IV)
- Web: download; on mobile browsers use `navigator.share({files})` so he can pick Google Drive
- Android: write with Filesystem (Documents) then Share → Drive
- Import: validate with zod, show a summary (dates, number of entries) and confirm before replacing; snapshot the current data first

### 6. Online sync (optional; app works fully without it)
- Table `public.budget_documents(user_id uuid pk references auth.users on delete cascade, data jsonb not null, schema_version int, revision bigint, updated_at timestamptz default now())` with RLS: select/insert/update/delete only where `user_id = auth.uid()`. Put the SQL in `supabase/migrations/`.
- Sync = whole document, optimistic revision check: push if server revision == local base revision; else show "this device vs cloud" with dates and let him choose (and snapshot the losing copy)
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`). Hide sync UI if unset.

### 7. Reminders
- Android: schedule local notifications 1 day before each unpaid bill at 8:00 AM (and on the day); reschedule when data changes
- Web: in-app banner for bills due soon (optional Notification API while open)

### 8. Android APK
- `npx cap add android` (Capacitor 8 needs JDK 21 + Android SDK 36)
- GitHub Actions workflow at the repo root `.github/workflows/budget-app-android.yml`, triggered on changes under `budget-app/**`: setup-node 22, `npm ci`, `CAPACITOR=1 npm run build`, `npx cap sync android`, setup-java 21, `./gradlew assembleDebug`, upload `app-debug.apk` as an artifact
- Locally: `npm run android:apk`

### 9. Vercel
- Import the repo in Vercel with **Root Directory = `budget-app`**, add the two env vars. `vercel.json` handles the rest.

## Conventions
- Repo is a monorepo: this project lives only in `budget-app/`. Branches are prefixed `budget-app/…`.
- TypeScript strict; no `any`. Validate external data with zod.
- Keep dependencies few. Ask Jayrold before adding big libraries.
- Mobile-first, works at 360px wide. Large tap targets. Peso formatting `₱1,234.00`.
- Before calling something done: `npm run typecheck`, `npm test` (incl. the parity test), `npm run build`.
