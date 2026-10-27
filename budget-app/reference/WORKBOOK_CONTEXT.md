# Jayrold's budget workbook (Oct 27, 2026 – Dec 31, 2027)

Personal budget for Jayrold, Instructor I at PHINMA University of Iloilo (CITE), Iloilo City.
He is new to budgeting: explain things in plain language, keep the workbook simple to use, and
prefer adding notes/explanations over jargon. Currency is Philippine pesos (₱).

## Files

| Path | What it is |
|---|---|
| `../Budget_Oct2026-Dec2027(5).xlsx` | **The live workbook he uses** (in the parent `Files` folder). He types his daily "Actual spent" here. Never overwrite it without carrying his entries over. |
| `build_budget.py` | Builds the whole workbook from scratch with openpyxl. All defaults, dates, schedules and layout live here. Writes `output/Budget_built.xlsx` and `output/ledger.json`. |
| `carry_over.py` | Copies his typed entries (Daily actual spent, Schedule "Paid?", Schedule rows he added) from the live file into a fresh build. |
| `output/` | Build output. Not the live file. |

### Changing the workbook safely
1. Edit `build_budget.py` (preferred: the workbook is fully generated, so edits by hand in the xlsx get lost on the next build).
2. `python3 build_budget.py` (needs `pip install --user openpyxl`). It asserts the lowest daily balance never drops below the ₱500 buffer.
3. Ask Jayrold to close the live file in LibreOffice (a `.~lock.*#` file in `../` means it's open).
4. `python3 carry_over.py "../Budget_Oct2026-Dec2027(5).xlsx" output/Budget_built.xlsx "../Budget_Oct2026-Dec2027(6).xlsx"` (new numbered copy; keep the old one).
5. Recalculate: openpyxl writes formulas without cached values. Open the new file in LibreOffice Calc, press **Ctrl+Shift+F9**, save as .xlsx (Keep current format). Or headless: `soffice --headless --convert-to xlsx --outdir /tmp/recalc <file>` and check values.
6. Verify (below), then tell him which file to use from now on.

If he changed inputs in the live file (Assumptions, School Calendar, Pay Periods blue cells), those are NOT carried over: copy the same values into `build_budget.py` first.

## Workbook structure (sheet order)
- **Summary**: whole-plan totals, typical week cost per schedule, savings, watch-outs, school calendar, debt end dates, charts. Protected (no inputs).
- **Glossary**: plain-language meaning of every heading + live example of the Oct 31 payday + money habits. Protected. Every column heading on Pay Periods/Daily/Weekly/Monthly/Schedule also has a hover comment (dict `G` in the script).
- **Assumptions**: inputs (blue on yellow). Key cells: B10–B12 starting cash/GCash/bank; B16 salary per payday; B17/B18 13th month amount/date; B19 paid during summer? (Yes/No); B24 rent; B25 SPayLater fee; B28 fare per ride; B29 water per campus day; B30 meal; B31/B32 Sunday fare/water; B33 misc per day; B34 brother allowance; **B35 brother switch (No)**; **B36 Sunday-out switch (No)**; B38 safety buffer; B39 emergency fund goal.
- **School Calendar**: terms table (start dates + which weekly schedule applies), rides-per-weekday grid and bought-meals grid per schedule, holiday list (no trips on holidays).
- **Pay Periods**: one row per payday. Inputs: H savings set-aside, I extra spending. Status OK / Below buffer / SHORTFALL.
- **Monthly**, **Weekly**: roll-ups of Daily. Protected (no inputs). Weekly T6 was once accidentally deleted, which is why these are locked.
- **Daily**: one row per day (rows 6–436). Columns: A date, C week #, D pay period #, E term, F weekly schedule, G day type, H rides, I fare, J water, K meal, L Sunday out, M misc, N extra, O living total, P income, Q bills, R what's due, S moved to savings, T planned balance, U savings balance, **V actual spent (his input)**, W under/(over), X running.
- **Schedule**: every payday and bill (rows 5–300). Type Income/Bill, Category (Salary, 13th Month, Rent, SPayLater, Gloan, Family, Data), Paid? = Yes greys the row out.

## Facts from Jayrold (keep these)
- Salary ₱15k/month, paid on the 15th and the last day of each month, about ₱6,000–6,500 each. **Plan at ₱6,000.** Started July 6, 2026.
- Starting money Oct 27, 2026: ₱300 cash, ₱2,731 GCash, ₱0 bank.
- Rent ₱2,000 on the 1st (includes electricity and water).
- SPayLater: Nov 5, 2026 ₱2,726.46 (incl. ₱53.46 fee); Dec 5, 2026 ₱2,672.98 (+ possible ₱53.46 fee, included for safety).
- Gloan 1: ₱1,029.08 on the 6th, Nov 2026–May 2027, last ₱1,029.06 Jun 6, 2027. Gloan 2: ₱808.56 on the 24th, Nov 2026–Apr 2027, last ₱808.55 May 24. Gloan 3: ₱650.06 on the 24th, Nov 2026–Jul 2027. No processing fees.
- Commute: 1 ride to school, 1 ride home. Jeepney ₱15, e-bus ₱20. **Planned at ₱20.** One Summit water (₱20) per work day.
- Lunch: if the lunch break is about 2 hours or more, he goes home to eat at his aunt's (free, +2 rides). If under 1 hour, he buys a ~₱100 meal.
- No load needed (Wi-Fi at home and on campus). Smart non-expiring 26GB ₱449 lasts about a year; one reload planned Oct 15, 2027.
- Sundays with his girlfriend: **optional**, only fare + one 1L water (₱25). Switch on Assumptions B36, default No.
- ₱500 to his younger brother "when he has extra": **optional** (his mom also supports him). Switch B35, default No.
- 13th month pay: counted as ₱0 until confirmed.
- Savings set-asides were sized with both optional switches ON, so turning them on keeps every period OK. With them off, the spare money shows as "Cushion above buffer".

## Class schedules (from his screenshots)
- **1st Sem SY 26-27 (until Oct 31, 2026)**: Mon ITE387 10am–1pm (2 rides); Wed ITE297 4:30–8pm (2); Thu ITE298 1–6pm (2); Fri ITE387/ITE300 2:30–6pm (2); Sat 7:30am–1pm then ITE298 ~4:30–6pm, long gap so home for lunch (4 rides). No bought meals.
- **2nd Sem SY 26-27 (Thu–Sat)**: Thu 7:30am–5pm, 30-min lunch, so buy a meal (2 rides); Fri ITE393 7:30–9:30am, then lab ~1–4:30pm, long gap so home for lunch (4 rides); Sat 7:30am–5:30pm, 30-min lunch, so buy a meal (2 rides).
- Breaks: assumed 2 campus days a week (Thu, Sat). Christmas break: 0.

## School calendar (from his PHINMA Gmail/Calendar/Drive, Oct 27, 2026)
- 1st Sem started Jul 6, 2026 (17-week calendar). P3 exams Oct 26–31; P3 grade encoding Nov 3–7.
- Faculty clearance advisory sent Oct 27. **HR: end-of-term payroll is processed only after clearance is complete.**
- 2nd Sem start **not announced**: assumed Nov 16, 2026 (in 2024 it started about Nov 18). Christmas break Dec 20–Jan 3, 2nd Sem ends about Mar 27, 2027, summer break until Jul 4, SY 27-28 1st Sem from Jul 5, 2027 (all assumed; update School Calendar when announced).
- Unknown: whether pay continues over the summer break (B19 switch).
- Holidays: 2027 list from Proclamation No. 1427.

## Conventions
- Formulas, never hardcoded results. Inputs blue text on yellow fill, formulas black, cross-sheet links green. Font Arial.
- Use only functions LibreOffice evaluates: SUMIFS, COUNTIFS, INDEX/MATCH, IFERROR; `_xlfn.MAXIFS` with the prefix. Never XLOOKUP/FILTER/SEQUENCE/UNIQUE.
- After every build: zero formula errors; Summary "Check" row says "OK, it balances"; Daily planned balance (T) matches `output/ledger.json`; no Pay Periods row is "Below buffer"/"SHORTFALL" unless he chose that.
- He reads on desktop (LibreOffice on Fedora) and sometimes on his phone. Keep explanations short and friendly. He's Catholic, budget-conscious, and new to adulting money stuff.
