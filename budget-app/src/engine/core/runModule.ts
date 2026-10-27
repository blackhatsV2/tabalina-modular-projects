import type { DateRange } from "../dates";
import { EMPTY_CONTRIBUTION, type ModuleContribution, type ModuleDefinition } from "../modules/types";

export interface ModuleRunOutcome {
  name: string;
  contribution: ModuleContribution;
  warning?: string;
}

/**
 * Runs one module behind its shared interface, isolated from the rest of `simulate()` (ADR
 * 0005): a section that's absent or disabled contributes nothing, silently. A section that
 * fails its own schema, or a `contribute()` that throws despite valid input, excludes the
 * module's contribution and produces exactly one warning — it never crashes the caller.
 */
export function runModule<Section extends { enabled: boolean }>(
  definition: ModuleDefinition<Section>,
  rawSection: unknown,
  range: DateRange,
): ModuleRunOutcome {
  const name = definition.name;
  if (rawSection === undefined) {
    return { name, contribution: EMPTY_CONTRIBUTION };
  }
  const parsed = definition.schema.safeParse(rawSection);
  if (!parsed.success) {
    return {
      name,
      contribution: EMPTY_CONTRIBUTION,
      warning: `${name} couldn't be calculated: totals exclude them (invalid data)`,
    };
  }
  if (!parsed.data.enabled) {
    return { name, contribution: EMPTY_CONTRIBUTION };
  }
  try {
    return { name, contribution: definition.contribute(parsed.data, range) };
  } catch (err) {
    return {
      name,
      contribution: EMPTY_CONTRIBUTION,
      warning: `${name} couldn't be calculated: totals exclude them (${err instanceof Error ? err.message : String(err)})`,
    };
  }
}
