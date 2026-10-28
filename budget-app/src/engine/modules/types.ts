import { z } from "zod";
import type { Centavos } from "../money";
import type { DateRange } from "../dates";

/**
 * What one module contributes over a date range: for each ISO date it touches, a set of
 * named, *signed* terms (positive adds to balance, negative subtracts) — e.g. income
 * contributes `{income: 600000}`, bills contributes `{bills: -200000}`, commute contributes
 * `{commuteFare: -4000, commuteWater: -2000}`. The core sums every term across every
 * contributing module to get a day's total change in balance; nothing else about a module's
 * internals is visible to the core. Term names should be namespaced per module so two modules
 * never collide (see each module's own ticket for its chosen names).
 */
export interface ModuleContribution {
  breakdown: Record<string, Record<string, Centavos>>;
}

export const EMPTY_CONTRIBUTION: ModuleContribution = { breakdown: {} };

/**
 * Validates a `contribute()` return value's shape and that every amount is an integer
 * centavo count — the core zod-validates what a module returns, not just what it's given, so
 * a module that returns malformed data without throwing is excluded the same as one that does.
 */
export const moduleContributionSchema = z.object({
  breakdown: z.record(z.string(), z.record(z.string(), z.number().int())),
});

/**
 * One isolated, independently enable-able feature module, behind the one shared interface
 * every module in `src/engine/modules/<name>/` implements (ADR 0005). `schema` validates the
 * module's own raw `modules.<name>` section (must include `enabled: boolean`); `contribute`
 * is a pure function from a validated section + date range to a `ModuleContribution`.
 */
export interface ModuleDefinition<Section extends { enabled: boolean } = { enabled: boolean }> {
  name: string;
  schema: z.ZodType<Section>;
  contribute(section: Section, range: DateRange): ModuleContribution;
  /**
   * An alternate `contribute()` used only by the auto-savings whole-plan lookahead (ticket
   * 12) — e.g. flexibleExpenses treats a `reserveRoom` item as enabled here, regardless of
   * its real `enabled`. Modules with no reason to differ omit this; core falls back to
   * `contribute`. Never used for the real simulated plan.
   */
  contributeForLookahead?(section: Section, range: DateRange): ModuleContribution;
}

/** The common shape the registry stores modules as — each one's real `Section` is checked at
 * runtime by its own `schema` before `contribute` ever sees it, so this erasure is safe. */
export type ErasedModuleDefinition = ModuleDefinition<{ enabled: boolean }>;

export function eraseModule<Section extends { enabled: boolean }>(
  definition: ModuleDefinition<Section>,
): ErasedModuleDefinition {
  return definition as unknown as ErasedModuleDefinition;
}

export function mergeContributions(contributions: ModuleContribution[]): ModuleContribution["breakdown"] {
  const merged: Record<string, Record<string, Centavos>> = {};
  for (const contribution of contributions) {
    for (const [date, terms] of Object.entries(contribution.breakdown)) {
      merged[date] ??= {};
      for (const [term, amount] of Object.entries(terms)) {
        if (merged[date][term] !== undefined) {
          throw new Error(`Breakdown term "${term}" was contributed more than once on ${date}`);
        }
        merged[date][term] = amount;
      }
    }
  }
  return merged;
}
