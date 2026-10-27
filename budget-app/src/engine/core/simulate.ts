import type { Profile } from "../../model/schema";
import { enumerateDays, type DateRange } from "../dates";
import { sumCentavos, type Centavos } from "../money";
import { DEFAULT_MODULES } from "../modules/registry";
import { mergeContributions, type ErasedModuleDefinition } from "../modules/types";
import { computePeriods } from "./periods";
import { runModule } from "./runModule";

export interface DayResult {
  date: string;
  start: Centavos;
  end: Centavos;
  /** Signed terms whose sum equals `end - start` (ADR 0004: breakdown sums to the total it explains). */
  breakdown: Record<string, Centavos>;
}

export interface PeriodResult {
  start: string;
  end: string;
  startBalance: Centavos;
  endBalance: Centavos;
  /** Signed terms whose sum equals `endBalance - startBalance`. */
  breakdown: Record<string, Centavos>;
}

export interface SimulationResult {
  days: DayResult[];
  periods: PeriodResult[];
  /** One entry per module excluded due to invalid data or a thrown error; empty means every enabled module computed cleanly. */
  warnings: string[];
}

/**
 * The single simulation entry point (ADR 0005): runs every module in isolation over the
 * profile's plan window, then walks day by day, carrying the pooled starting balance forward
 * and folding in whatever each module (and `periodOverrides`) contributed. A module that
 * fails is excluded from every total, with a warning — it never corrupts the rest of the run.
 */
export function simulate(profile: Profile, modules: ErasedModuleDefinition[] = DEFAULT_MODULES): SimulationResult {
  const range: DateRange = { start: profile.meta.planStart, end: profile.meta.planEnd };
  const periods = computePeriods(profile.periodSchedule, range.start, range.end);

  const outcomes = modules.map((m) => runModule(m, profile.modules[m.name], range));
  const warnings = outcomes.filter((o) => o.warning !== undefined).map((o) => o.warning!);
  const breakdownByDate = mergeContributions(outcomes.map((o) => o.contribution));

  const startingBalance = sumCentavos(profile.accounts.map((a) => a.startingBalance));

  const days: DayResult[] = [];
  let balance = startingBalance;
  let periodIndex = 0;
  for (const date of enumerateDays(range)) {
    while (periodIndex + 1 < periods.length && date > periods[periodIndex].end) periodIndex += 1;
    const period = periods[periodIndex];

    const terms: Record<string, Centavos> = { ...(breakdownByDate[date] ?? {}) };
    if (date === period.start) {
      const override = profile.periodOverrides[period.start];
      const savings = override?.savings ?? 0;
      const extra = override?.extra ?? 0;
      if (savings !== 0) terms.savings = -savings;
      if (extra !== 0) terms.extra = -extra;
    }

    const start = balance;
    const end = start + sumCentavos(Object.values(terms));
    days.push({ date, start, end, breakdown: terms });
    balance = end;
  }

  const periodResults: PeriodResult[] = periods.map((period) => {
    const periodDays = days.filter((d) => d.date >= period.start && d.date <= period.end);
    const breakdown: Record<string, Centavos> = {};
    for (const day of periodDays) {
      for (const [term, amount] of Object.entries(day.breakdown)) {
        breakdown[term] = (breakdown[term] ?? 0) + amount;
      }
    }
    return {
      start: period.start,
      end: period.end,
      startBalance: periodDays[0].start,
      endBalance: periodDays[periodDays.length - 1].end,
      breakdown,
    };
  });

  return { days, periods: periodResults, warnings };
}
