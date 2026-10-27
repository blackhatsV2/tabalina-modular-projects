import { allowanceModule } from "./allowance";
import { billsModule } from "./bills";
import { commuteModule } from "./commute";
import { flexibleExpensesModule } from "./flexibleExpenses";
import { incomeModule } from "./income";
import { loansModule } from "./loans";
import { eraseModule, type ErasedModuleDefinition } from "./types";

/**
 * The real feature modules `simulate()` runs by default — income, bills, loans, allowance,
 * commute, flexibleExpenses (ADR 0005).
 */
export const DEFAULT_MODULES: ErasedModuleDefinition[] = [
  eraseModule(incomeModule),
  eraseModule(billsModule),
  eraseModule(loansModule),
  eraseModule(allowanceModule),
  eraseModule(commuteModule),
  eraseModule(flexibleExpensesModule),
];
