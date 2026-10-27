import { z } from "zod";
import { dailyRuleSchema, weeklyRuleSchema } from "../../../model/schema";
import { expandRecurrence, type DateRange } from "../../dates";
import type { Centavos } from "../../money";
import type { ModuleContribution, ModuleDefinition } from "../types";

const allowanceRecurrenceSchema = z.discriminatedUnion("type", [dailyRuleSchema, weeklyRuleSchema]);

export const allowanceSectionSchema = z.object({
  enabled: z.boolean(),
  amount: z.number().int(),
  recurrence: allowanceRecurrenceSchema,
});

export type AllowanceSection = z.infer<typeof allowanceSectionSchema>;

function contribute(section: AllowanceSection, range: DateRange): ModuleContribution {
  const breakdown: Record<string, Record<string, Centavos>> = {};
  for (const date of expandRecurrence(section.recurrence, range)) {
    breakdown[date] ??= {};
    breakdown[date].allowanceLiving = (breakdown[date].allowanceLiving ?? 0) - section.amount;
  }
  return { breakdown };
}

/** `modules.allowance`: a flat daily/weekly living-cost allowance. */
export const allowanceModule: ModuleDefinition<AllowanceSection> = {
  name: "allowance",
  schema: allowanceSectionSchema,
  contribute,
};
