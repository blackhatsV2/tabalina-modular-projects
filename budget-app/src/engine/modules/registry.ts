import type { ErasedModuleDefinition } from "./types";

/**
 * The real feature modules `simulate()` runs by default. Populated incrementally as each
 * module ships (income, bills, loans, allowance, commute, flexibleExpenses) — empty for now.
 */
export const DEFAULT_MODULES: ErasedModuleDefinition[] = [];
