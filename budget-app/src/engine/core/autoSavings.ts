import { enumerateDays } from "../dates";
import { floorToMultiple, sumCentavos, type Centavos } from "../money";
import type { Period } from "./periods";

export interface PeriodOverrideLike {
  savings?: Centavos;
}

/**
 * The default per-period savings when no `periodOverrides.savings` entry is present: for
 * each period, in chronological order, the largest multiple of 100 centavos that keeps every
 * later day's balance — for the rest of the whole plan, not just the current period — at or
 * above `safetyBuffer`. Processed left to right so each period's decision is checked against
 * the real, already-committed trajectory of every earlier period (and any later period's own
 * explicit override, which is already fixed information); every later, not-yet-decided
 * period is conservatively assumed to save nothing while sizing the current one.
 *
 * `breakdownByDate` should already reflect whatever the auto-savings calculation wants to
 * treat as "the costs" — including, per ticket 12, flexibleExpenses items flagged
 * `reserveRoom` as if they were enabled (that substitution happens one level up, in
 * `simulate()`; this function only runs the lookahead arithmetic itself).
 */
export function computeAutoSavingsFromBreakdown(
  periods: Period[],
  breakdownByDate: Record<string, Record<string, Centavos>>,
  overrides: Record<string, PeriodOverrideLike>,
  startingBalance: Centavos,
  safetyBuffer: Centavos,
): Record<string, Centavos> {
  if (periods.length === 0) return {};
  const days = enumerateDays({ start: periods[0].start, end: periods[periods.length - 1].end });
  const netByDate = new Map(days.map((date) => [date, sumCentavos(Object.values(breakdownByDate[date] ?? {}))]));

  const computed: Record<string, Centavos> = {};

  function committedSavings(periodStart: string): Centavos {
    return overrides[periodStart]?.savings ?? computed[periodStart] ?? 0;
  }

  function fullTrajectory(): Map<string, Centavos> {
    const trajectory = new Map<string, Centavos>();
    let balance = startingBalance;
    let periodIndex = 0;
    for (const date of days) {
      while (periodIndex + 1 < periods.length && date > periods[periodIndex].end) periodIndex += 1;
      const period = periods[periodIndex];
      let delta = netByDate.get(date) ?? 0;
      if (date === period.start) delta -= committedSavings(period.start);
      balance += delta;
      trajectory.set(date, balance);
    }
    return trajectory;
  }

  for (const period of periods) {
    if (overrides[period.start]?.savings !== undefined) continue;

    const trajectory = fullTrajectory();
    let minBalance = Infinity;
    for (const date of days) {
      if (date < period.start) continue;
      minBalance = Math.min(minBalance, trajectory.get(date)!);
    }
    const slack = minBalance - safetyBuffer;
    computed[period.start] = slack > 0 ? floorToMultiple(slack, 100) : 0;
  }

  return computed;
}
