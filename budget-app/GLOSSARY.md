# Budget Buddy

A general-purpose personal budgeting app. Jayrold's own workbook is its first validated example, not its design.

## Language

**Profile**:
A user's complete budget document — accounts, income sources, bills, loans, flexible expenses, daily spending, savings goals. One per person; the engine has no privileged user baked in.
_Avoid_: Plan (that word is reserved for the budgeting time window — `planStart`/`planEnd` — and the Plan screen's pay-period cards).

**Example profile**:
A fully-specified profile used to validate the engine, e.g. Jayrold's own workbook at `fixtures/jayrold-profile.json`. Not a starter template offered to new users.
_Avoid_: Default profile, template profile, sample data.

**Centavo**:
The base integer unit of money (₱1.00 = 100 centavos). Every amount field is stored as an integer count of centavos; the engine never uses floating point for money.
_Avoid_: Peso amount, decimal amount (as a storage type — fine as display-layer words only).

**Income source**:
Any stream of money a profile expects to receive (salary, side job, allowance, 13th month, etc.), each on its own pay schedule.
_Avoid_: Paycheck. "Salary" is one kind of income source, not a synonym for all of them.

**Flexible expense**:
An optional, user-toggleable cost (e.g. a weekly outing, an allowance sent to a family member) that the user can flag to reserve room for in auto-savings even while it's switched off.
_Avoid_: Optional expense, discretionary spending.

**Reserve room**:
A flag on a flexible expense meaning auto-savings sizes every period as if that expense were enabled, even when it is currently switched off, so turning it on later never causes a shortfall.
_Avoid_: Buffer, cushion — those describe the safety buffer, a different concept.

**Daily spending**:
Everyday living costs (fare, meals, flat allowance) computed by whichever of `allowance` or `commute` is enabled — two independent modules, not a single mutually-exclusive mode. Most profiles enable exactly one, by convention; nothing stops both from running and summing.
_Avoid_: Daily spending mode, daily cost model (both imply a single either/or switch, which this isn't).

**Commute module**:
The optional daily-spending mode that computes rides, fares, meals, and holidays from a weekly schedule and a calendar of terms. Jayrold's own setup — not assumed for every profile.
_Avoid_: School module (usable by anyone with a fixed weekly travel pattern, not only students).

**Period schedule**:
The `PayScheduleRule` that defines pay-period boundaries for the Plan screen and auto-savings, stored independently of any specific income source even though it usually matches the main one's rhythm.
_Avoid_: Pay schedule (that's the per-income-source field; period schedule is the profile-wide one derived from it by default, not the same field).

**Safety buffer**:
The single, user-configurable minimum balance auto-savings protects on every future day of the plan. There is no separate "cushion" on top of it — considered and rejected, to avoid a second unexplained number in a UI aimed at someone new to budgeting.
_Avoid_: Cushion, minimum balance.

**Breakdown**:
The named terms and real values behind a single computed total (a day's planned balance, a period's closing balance, a roll-up figure), returned by the engine alongside the total itself so the UI can show "explain this number" by rendering, never recomputing.
_Avoid_: Explanation, trace (breakdown is the data; "explain this number" is the UI feature that renders it).

**Help dictionary**:
The single source of plain-language text for every label, setting, and computed-amount term, built from the workbook's glossary (`G` dict) and `GLOSSARY.md`. Powers the ⓘ affordances and the Help screen.
_Avoid_: Tooltip text, copy (those describe where it's rendered, not the single source it's rendered from).

**Core** (engine):
The always-on part of the engine — profile data, date/money utilities, the period grid, and the balance + savings simulation. Has no knowledge of any module's internals.
_Avoid_: Engine (the whole engine is core + modules together, not a synonym for core alone).

**Module** (engine):
One isolated, independently enable-able feature (`income`, `bills`, `loans`, `allowance`, `commute`, `flexibleExpenses`) behind one shared contribute-events/costs/breakdown interface. A module that fails is excluded with a warning; it never corrupts the core's totals or the other modules.
_Avoid_: Plugin, extension.

**Fee line**:
An extra charge attached to a loan installment (e.g. a handling fee) that is still counted as its own dated amount in the day-by-day ledger.
_Avoid_: Penalty, surcharge.

**Spending entry**:
One logged item within a day's `actuals` — an amount with an optional note and an optional free-text category. A day's actual total is always the sum of its entries, never stored as a separate value.
_Avoid_: Actual, log entry — both are ambiguous with the day-level `actuals` map itself, which holds a list of entries, not a single one.

## Screens & help (Stage 2)

**Status stamp**:
The visual rendering of a day's or period's OK / Low / Short standing against the safety buffer (CLAUDE.md's "status chip," realized as a circular rubber-stamp badge in the Libreta visual direction) — always paired with a text label, never conveyed by color alone.

**Margin note**:
The ⓘ explanation affordance, rendered as a note attached to the row it explains — inline beneath the row on phones, connected by a leader line to the margin on tablet/desktop (≥768px).
_Avoid_: Tooltip, popover — this app's ⓘ affordance is anchored and persistent-looking, not a transient hover bubble.

**Horizon strip**:
A thin ink-on-paper strip marking today's position within the *current* pay period. Shown on the Today screen and on the Plan screen's current-period card only — past and future period cards never show it, since they have no "today" to mark.
_Avoid_: Progress bar — this isn't a completion metric, only a position in time.
