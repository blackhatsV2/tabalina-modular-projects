import type { Profile } from "../../model/schema";
import { enumerateDays, type DateRange } from "../dates";
import { sumBreakdownTerms, sumCentavos, type Centavos } from "../money";
import { DEFAULT_MODULES } from "../modules/registry";
import { EMPTY_CONTRIBUTION, mergeContributions, type ErasedModuleDefinition, type ModuleContribution } from "../modules/types";
import { computeAutoSavingsFromBreakdown } from "./autoSavings";
import { computePeriods } from "./periods";
import { runModule, runModuleContribute, type ModuleRunOutcome } from "./runModule";
import type { BalanceSummary } from "./types";

export interface DayResult {
  date: string;
  start: Centavos;
  end: Centavos;
  /** Signed terms whose sum equals `end - start` (ADR 0004: breakdown sums to the total it explains). */
  breakdown: Record<string, Centavos>;
}

/** A pay period's closing balance and the breakdown that explains it — see {@link BalanceSummary}. */
export type PeriodResult = BalanceSummary;

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
  const breakdownByDate = mergeContributions(outcomes.map((o) => o.contribution));

  const startingBalance = sumCentavos(profile.accounts.map((a) => a.startingBalance));

  const lookahead = buildLookaheadContributions(modules, outcomes, profile, range);
  const lookaheadBreakdownByDate = mergeContributions(lookahead.contributions);
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
    return {
      start: period.start,
      end: period.end,
      startBalance: periodDays[0].start,
      endBalance: periodDays[periodDays.length - 1].end,
      breakdown: sumBreakdownTerms(periodDays.map((d) => d.breakdown)),
    };
  });

  const warnings = [
    ...outcomes.filter((o) => o.warning !== undefined).map((o) => o.warning!),
    ...lookahead.warnings,
  ];

  return { days, periods: periodResults, warnings };
}

/**
 * The same per-module contributions used for the real plan, except any module that declares
 * its own `contributeForLookahead` (ticket 12 — only flexibleExpenses has a reason to) is
 * re-run with that function instead of its normal `contribute`, so e.g. a `reserveRoom` item
 * counts as enabled for auto-savings' sizing without ever affecting the real simulated plan
 * above. Core never names a specific module here — it only asks each one, generically,
 * whether it has a lookahead variant. A module already excluded by its normal run (warning
 * present) is mirrored as excluded here too, without a second warning; a lookahead-only
 * failure (the normal run succeeded, but `contributeForLookahead` itself threw or returned
 * invalid data) produces its own warning, since that failure is otherwise invisible — it only
 * affects auto-savings' sizing, never the real plan a warning would normally describe.
 */
function buildLookaheadContributions(
  modules: ErasedModuleDefinition[],
  outcomes: ModuleRunOutcome[],
  profile: Profile,
  range: DateRange,
): { contributions: ModuleContribution[]; warnings: string[] } {
  const warnings: string[] = [];
  const contributions = modules.map((m, i) => {
    const normalOutcome = outcomes[i];
    if (normalOutcome.warning !== undefined) return EMPTY_CONTRIBUTION;
    if (!m.contributeForLookahead) return normalOutcome.contribution;
    const outcome = runModuleContribute(
      m,
      m.contributeForLookahead,
      profile.modules[m.name],
      range,
      "auto-savings sizing",
    );
    if (outcome.warning !== undefined) warnings.push(outcome.warning);
    return outcome.contribution;
  });
  return { contributions, warnings };
}
