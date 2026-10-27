import { z } from "zod";
import { billRecurrenceSchema } from "../../../model/schema";
import { expandRecurrence, type DateRange } from "../../dates";
import type { Centavos } from "../../money";
import type { ModuleContribution, ModuleDefinition } from "../types";

const billItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().int(),
  recurrence: billRecurrenceSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const billsSectionSchema = z.object({
  enabled: z.boolean(),
  items: z.array(billItemSchema),
});

export type BillsSection = z.infer<typeof billsSectionSchema>;

function clampRange(range: DateRange, startDate?: string, endDate?: string): DateRange {
  const start = startDate && startDate > range.start ? startDate : range.start;
  const end = endDate && endDate < range.end ? endDate : range.end;
  return { start, end };
}

function contribute(section: BillsSection, range: DateRange): ModuleContribution {
  const breakdown: Record<string, Record<string, Centavos>> = {};
  for (const item of section.items) {
    const itemRange = clampRange(range, item.startDate, item.endDate);
    for (const date of expandRecurrence(item.recurrence, itemRange)) {
      breakdown[date] ??= {};
      breakdown[date].bills = (breakdown[date].bills ?? 0) - item.amount;
    }
  }
  return { breakdown };
}

/** `modules.bills`: recurring and one-time bills (monthly incl. "last", weekly, yearly, once). */
export const billsModule: ModuleDefinition<BillsSection> = {
  name: "bills",
  schema: billsSectionSchema,
  contribute,
};
