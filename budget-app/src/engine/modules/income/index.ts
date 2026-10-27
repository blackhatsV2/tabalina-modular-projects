import { z } from "zod";
import { payScheduleRuleSchema } from "../../../model/schema";
import { expandRecurrence, type DateRange } from "../../dates";
import type { Centavos } from "../../money";
import type { ModuleContribution, ModuleDefinition } from "../types";

const incomeSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["salary", "sideJob", "allowance", "thirteenthMonth", "other"]),
  amount: z.number().int(),
  schedule: payScheduleRuleSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const incomeSectionSchema = z.object({
  enabled: z.boolean(),
  sources: z.array(incomeSourceSchema),
});

export type IncomeSection = z.infer<typeof incomeSectionSchema>;

function clampRange(range: DateRange, startDate?: string, endDate?: string): DateRange {
  const start = startDate && startDate > range.start ? startDate : range.start;
  const end = endDate && endDate < range.end ? endDate : range.end;
  return { start, end };
}

function contribute(section: IncomeSection, range: DateRange): ModuleContribution {
  const breakdown: Record<string, Record<string, Centavos>> = {};
  for (const source of section.sources) {
    const sourceRange = clampRange(range, source.startDate, source.endDate);
    for (const date of expandRecurrence(source.schedule, sourceRange)) {
      breakdown[date] ??= {};
      breakdown[date].income = (breakdown[date].income ?? 0) + source.amount;
    }
  }
  return { breakdown };
}

/** `modules.income`: any number of income sources, each on its own pay schedule. */
export const incomeModule: ModuleDefinition<IncomeSection> = {
  name: "income",
  schema: incomeSectionSchema,
  contribute,
};
