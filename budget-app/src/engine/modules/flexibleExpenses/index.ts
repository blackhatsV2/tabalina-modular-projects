import { z } from "zod";
import { dailyRuleSchema, monthlyRuleSchema, onceRuleSchema, weeklyRuleSchema, yearlyRuleSchema } from "../../../model/schema";
import { expandRecurrence, type DateRange } from "../../dates";
import type { Centavos } from "../../money";
import type { ModuleContribution, ModuleDefinition } from "../types";

const flexibleExpenseRecurrenceSchema = z.discriminatedUnion("type", [
  dailyRuleSchema,
  weeklyRuleSchema,
  monthlyRuleSchema,
  yearlyRuleSchema,
  onceRuleSchema,
]);

const flexibleExpenseItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean(),
  reserveRoom: z.boolean(),
  amount: z.number().int(),
  recurrence: flexibleExpenseRecurrenceSchema,
});

export const flexibleExpensesSectionSchema = z.object({
  enabled: z.boolean(),
  items: z.array(flexibleExpenseItemSchema),
});

export type FlexibleExpensesSection = z.infer<typeof flexibleExpensesSectionSchema>;
export type FlexibleExpenseItem = z.infer<typeof flexibleExpenseItemSchema>;

function contributeFiltered(
  section: FlexibleExpensesSection,
  range: DateRange,
  isActive: (item: FlexibleExpenseItem) => boolean,
): ModuleContribution {
  const breakdown: Record<string, Record<string, Centavos>> = {};
  for (const item of section.items) {
    if (!isActive(item)) continue;
    for (const date of expandRecurrence(item.recurrence, range)) {
      breakdown[date] ??= {};
      breakdown[date].flexibleExpenses = (breakdown[date].flexibleExpenses ?? 0) - item.amount;
    }
  }
  return { breakdown };
}

/** The real plan: only an item's own `enabled` decides whether it contributes — `reserveRoom` never does. */
function contribute(section: FlexibleExpensesSection, range: DateRange): ModuleContribution {
  return contributeFiltered(section, range, (item) => item.enabled);
}

/**
 * For the auto-savings whole-plan lookahead (ticket 12) only: an item flagged `reserveRoom`
 * contributes as if it were enabled, even when its real `enabled` is `false` — so switching
 * it on later never causes a shortfall. Never used for the actual simulated plan.
 */
export function contributeForLookahead(section: FlexibleExpensesSection, range: DateRange): ModuleContribution {
  return contributeFiltered(section, range, (item) => item.enabled || item.reserveRoom);
}

/** `modules.flexibleExpenses`: any number of optional items, each independently switchable and reserve-flaggable. */
export const flexibleExpensesModule: ModuleDefinition<FlexibleExpensesSection> = {
  name: "flexibleExpenses",
  schema: flexibleExpensesSectionSchema,
  contribute,
  contributeForLookahead,
};
