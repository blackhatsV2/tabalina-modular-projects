import { z } from "zod";
import { parseISO, resolveDayOfMonth, toISO, type DateRange } from "../../dates";
import { divideCentavosEvenly, type Centavos } from "../../money";
import type { ModuleContribution, ModuleDefinition } from "../types";

const loanInstallmentSchema = z.object({
  date: z.string(),
  amount: z.number().int(),
  note: z.string().optional(),
});
const loanFeeLineSchema = z.object({
  date: z.string(),
  amount: z.number().int(),
  note: z.string().optional(),
});
const loanItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  startDate: z.string(),
  installments: z.array(loanInstallmentSchema),
  feeLines: z.array(loanFeeLineSchema).optional(),
});

export const loansSectionSchema = z.object({
  enabled: z.boolean(),
  items: z.array(loanItemSchema),
});

export type LoansSection = z.infer<typeof loansSectionSchema>;
export type LoanInstallment = z.infer<typeof loanInstallmentSchema>;

/**
 * Entry-time convenience: "₱X total over N months starting on a date" expands into the
 * canonical explicit installment list (one per month, same day-of-month as `startDate`,
 * clamped for short months), with any remainder from an uneven split on the last installment
 * (ADR 0001). Canonical storage is always the explicit list this returns, never this formula.
 */
export function expandLoanInstallments(
  totalAmount: Centavos,
  numInstallments: number,
  startDate: string,
): LoanInstallment[] {
  const amounts = divideCentavosEvenly(totalAmount, numInstallments);
  const start = parseISO(startDate);
  const day = start.getUTCDate();
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();
  const installments: LoanInstallment[] = [];
  for (let i = 0; i < numInstallments; i += 1) {
    const resolvedDay = resolveDayOfMonth(year, month, day);
    installments.push({ date: toISO(new Date(Date.UTC(year, month, resolvedDay))), amount: amounts[i] });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return installments;
}

function withinRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

function contribute(section: LoansSection, range: DateRange): ModuleContribution {
  const breakdown: Record<string, Record<string, Centavos>> = {};
  for (const loan of section.items) {
    for (const installment of loan.installments) {
      if (!withinRange(installment.date, range)) continue;
      breakdown[installment.date] ??= {};
      breakdown[installment.date].loans = (breakdown[installment.date].loans ?? 0) - installment.amount;
    }
    for (const fee of loan.feeLines ?? []) {
      if (!withinRange(fee.date, range)) continue;
      breakdown[fee.date] ??= {};
      breakdown[fee.date].loans = (breakdown[fee.date].loans ?? 0) - fee.amount;
    }
  }
  return { breakdown };
}

export interface LoanPayoff {
  loanId: string;
  paid: Centavos;
  remaining: Centavos;
}

/**
 * Paid vs remaining per loan, driven only by the user-maintained `paid` map
 * (`eventKey = ${loanId}:${date}` for installments; fee lines on the same date use a
 * `:fee` suffix so they can be marked paid independently) — never inferred from comparing a
 * date to today.
 */
export function computeLoanPayoff(section: LoansSection, paid: Record<string, true>): LoanPayoff[] {
  return section.items.map((loan) => {
    let paidAmount = 0;
    let remaining = 0;
    for (const installment of loan.installments) {
      const key = `${loan.id}:${installment.date}`;
      if (paid[key]) paidAmount += installment.amount;
      else remaining += installment.amount;
    }
    for (const fee of loan.feeLines ?? []) {
      const key = `${loan.id}:${fee.date}:fee`;
      if (paid[key]) paidAmount += fee.amount;
      else remaining += fee.amount;
    }
    return { loanId: loan.id, paid: paidAmount, remaining };
  });
}

/** `modules.loans`: any provider, explicit installments as canonical storage, optional fee lines. */
export const loansModule: ModuleDefinition<LoansSection> = {
  name: "loans",
  schema: loansSectionSchema,
  contribute,
};
