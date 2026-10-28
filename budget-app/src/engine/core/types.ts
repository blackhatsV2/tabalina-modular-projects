import type { Centavos } from "../money";

/**
 * A balance-change summary over a date range: a pay period's closing balance and a
 * weekly/monthly roll-up figure are the same shape (ADR 0004 — every computed total carries
 * the breakdown that explains it), just aggregated over a different span.
 */
export interface BalanceSummary {
  start: string;
  end: string;
  startBalance: Centavos;
  endBalance: Centavos;
  /** Signed terms whose sum equals `endBalance - startBalance`. */
  breakdown: Record<string, Centavos>;
}
