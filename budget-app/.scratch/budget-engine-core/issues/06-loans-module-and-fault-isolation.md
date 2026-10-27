# 06: Loans module (with real-module fault isolation)

**What to build:** `modules.loans` — any provider, installments as the canonical stored form, optional fee lines, loan payoff tracked only by the `paid` map — and, now that income and bills are real working modules alongside it, proof that the isolation mechanism holds when a real module is the one that's broken.

**Blocked by:** 03, 04, 05

**Status:** done

- [x] `modules.loans.items` stores installments explicitly (`date`, `amount`, optional `note`); a free-text `provider` is accepted (no fixed list).
- [x] An "amount × N months from a date" entry expands into the correct explicit installment list, including a differing final installment when the total doesn't divide evenly.
- [x] Optional fee lines on a loan land as their own dated cost, separate from the installment they're attached to.
- [x] Loan payoff (paid vs remaining, per loan) is computed only from the `paid` map — never from comparing an installment's date to today.
- [x] `modules.loans.enabled = false` excludes all loan costs from the computed plan.
- [x] With `income`, `bills`, and `loans` all enabled and all valid, a profile with a deliberately invalid `loans` section still returns correct income and bill totals, with exactly one warning naming loans as excluded.
- [x] A profile where the loans module implementation throws during computation (valid input, failing computation) behaves the same way: loans excluded, income/bills unaffected, one warning.

Implemented in `src/engine/modules/loans/index.ts`. Deviated from the literal `feeLines?: [{amount, note?}]`
sketch in CLAUDE.md by giving each fee line its own `date` — required for "their own dated cost" (ticket
text) to mean anything; without a date a fee line has nowhere to land. `computeLoanPayoff` is a standalone
reporting function (not wired into `simulate()`'s cash-flow loop, since `paid` status doesn't change the
forward-looking plan) — fee lines get a `:fee`-suffixed paid-map key so they can be marked paid independently
of an installment that happens to share their date.
