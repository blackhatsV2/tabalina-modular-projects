import type { DateRange } from "../dates";
import {
  EMPTY_CONTRIBUTION,
  moduleContributionSchema,
  type ModuleContribution,
  type ModuleDefinition,
} from "../modules/types";

export interface ModuleRunOutcome {
  name: string;
  contribution: ModuleContribution;
  warning?: string;
}

function excluded(name: string, reason: string): ModuleRunOutcome {
  return {
    name,
    contribution: EMPTY_CONTRIBUTION,
    warning: `${name} couldn't be calculated: totals exclude them (${reason})`,
  };
}

/**
 * Runs one module's `contribute`-shaped function behind the shared isolation mechanism (ADR
 * 0005): an absent/disabled section contributes nothing, silently. A section that fails its
 * own schema, a function that throws, or one that returns data failing its own output shape,
 * excludes the contribution with exactly one warning — it never crashes the caller. `label`,
 * when given, distinguishes a secondary run of the same module (e.g. the auto-savings
 * lookahead) from its normal one in the warning text, so two runs of one module never produce
 * indistinguishable warnings.
 */
export function runModuleContribute<Section extends { enabled: boolean }>(
  definition: ModuleDefinition<Section>,
  contributeFn: (section: Section, range: DateRange) => ModuleContribution,
  rawSection: unknown,
  range: DateRange,
  label?: string,
): ModuleRunOutcome {
  const name = label ? `${definition.name} (${label})` : definition.name;
  if (rawSection === undefined) {
    return { name, contribution: EMPTY_CONTRIBUTION };
  }
  const parsed = definition.schema.safeParse(rawSection);
  if (!parsed.success) {
    return excluded(name, "invalid data");
  }
  if (!parsed.data.enabled) {
    return { name, contribution: EMPTY_CONTRIBUTION };
  }
  let contribution: ModuleContribution;
  try {
    contribution = contributeFn(parsed.data, range);
  } catch (err) {
    return excluded(name, err instanceof Error ? err.message : String(err));
  }
  if (!moduleContributionSchema.safeParse(contribution).success) {
    return excluded(name, "returned invalid data");
  }
  return { name, contribution };
}

/** Runs a module's normal `contribute()` — see {@link runModuleContribute}. */
export function runModule<Section extends { enabled: boolean }>(
  definition: ModuleDefinition<Section>,
  rawSection: unknown,
  range: DateRange,
): ModuleRunOutcome {
  return runModuleContribute(definition, definition.contribute, rawSection, range);
}
