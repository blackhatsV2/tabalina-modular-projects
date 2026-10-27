# 06: Loans module (with real-module fault isolation)

**What to build:** `modules.loans` — any provider, installments as the canonical stored form, optional fee lines, loan payoff tracked only by the `paid` map — and, now that income and bills are real working modules alongside it, proof that the isolation mechanism holds when a real module is the one that's broken.

**Blocked by:** 03, 04, 05

**Status:** ready-for-agent

- [ ] `modules.loans.items` stores installments explicitly (`date`, `amount`, optional `note`); a free-text `provider` is accepted (no fixed list).
- [ ] An "amount × N months from a date" entry expands into the correct explicit installment list, including a differing final installment when the total doesn't divide evenly.
- [ ] Optional fee lines on a loan land as their own dated cost, separate from the installment they're attached to.
- [ ] Loan payoff (paid vs remaining, per loan) is computed only from the `paid` map — never from comparing an installment's date to today.
- [ ] `modules.loans.enabled = false` excludes all loan costs from the computed plan.
- [ ] With `income`, `bills`, and `loans` all enabled and all valid, a profile with a deliberately invalid `loans` section still returns correct income and bill totals, with exactly one warning naming loans as excluded.
- [ ] A profile where the loans module implementation throws during computation (valid input, failing computation) behaves the same way: loans excluded, income/bills unaffected, one warning.
