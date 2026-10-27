import type { Profile } from "../../model/schema";
import { enumerateDays, type DateRange } from "../dates";
import { contributeForLookahead, flexibleExpensesSectionSchema } from "../modules/flexibleExpenses";
import { sumCentavos, type Centavos } from "../money";
import { DEFAULT_MODULES } from "../modules/registry";
import { EMPTY_CONTRIBUTION, mergeContributions, type ErasedModuleDefinition, type ModuleContribution } from "../modules/types";
import { computeAutoSavingsFromBreakdown } from "./autoSavings";
import { computePeriods } from "./periods";
import { runModule, type ModuleRunOutcome } from "./runModule";

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

  const lookaheadBreakdownByDate = mergeContributions(buildLookaheadContributions(modules, outcomes, profile, range));
  const autoSavings = computeAutoSavingsFromBreakdown(
    periods,
    lookaheadBreakdownByDate,
    profile.periodOverrides,
    startingBalance,
    profile.safetyBuffer,
  );

  const days: DayResult[] = [];
  let balance = startingBalance;
  let periodIndex = 0;
  for (const date of enumerateDays(range)) {
    while (periodIndex + 1 < periods.length && date > periods[periodIndex].end) periodIndex += 1;
    const period = periods[periodIndex];

    const terms: Record<string, Centavos> = { ...(breakdownByDate[date] ?? {}) };
    if (date === period.start) {
      const override = profile.periodOverrides[period.start];
      const savings = override?.savings ?? autoSavings[period.start] ?? 0;
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

/**
 * The same per-module contributions used for the real plan, except the `flexibleExpenses`
 * module (if present) is re-run with `contributeForLookahead` instead of its normal
 * `contribute` — so a `reserveRoom` item counts as enabled for auto-savings' sizing (ticket
 * 12) without ever affecting the real simulated plan above. Every other module's outcome is
 * reused unchanged; this is a deliberate, narrow exception to core's module-agnosticism,
 * required because `reserveRoom` is specifically a flexibleExpenses concept.
 */
function buildLookaheadContributions(
  modules: ErasedModuleDefinition[],
  outcomes: ModuleRunOutcome[],
  profile: Profile,
  range: DateRange,
): ModuleContribution[] {
  return modules.map((m, i) => {
    if (m.name !== "flexibleExpenses") return outcomes[i].contribution;
    const raw = profile.modules[m.name];
    if (raw === undefined) return EMPTY_CONTRIBUTION;
    const parsed = flexibleExpensesSectionSchema.safeParse(raw);
    if (!parsed.success || !parsed.data.enabled) return EMPTY_CONTRIBUTION;
    try {
      return contributeForLookahead(parsed.data, range);
    } catch {
      return EMPTY_CONTRIBUTION;
    }
  });
}
