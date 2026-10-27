import { allowanceModule } from "./allowance";
import { billsModule } from "./bills";
import { incomeModule } from "./income";
import { loansModule } from "./loans";
import { eraseModule, type ErasedModuleDefinition } from "./types";

/**
 * The real feature modules `simulate()` runs by default. Populated incrementally as each
 * module ships (income, bills, loans, allowance, commute, flexibleExpenses).
 */
export const DEFAULT_MODULES: ErasedModuleDefinition[] = [
  eraseModule(incomeModule),
  eraseModule(billsModule),
  eraseModule(loansModule),
  eraseModule(allowanceModule),
];
