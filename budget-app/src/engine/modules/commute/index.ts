import { z } from "zod";
import { enumerateDays, parseISO, type DateRange } from "../../dates";
import type { Centavos } from "../../money";
import type { ModuleContribution, ModuleDefinition } from "../types";

const weekdayGrid = z.tuple([
  z.number().int().min(0),
  z.number().int().min(0),
  z.number().int().min(0),
  z.number().int().min(0),
  z.number().int().min(0),
  z.number().int().min(0),
  z.number().int().min(0),
]);

const commuteScheduleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Monday-first (index 0 = Monday .. 6 = Sunday), one ride/meal count per weekday. */
  rides: weekdayGrid,
  meals: weekdayGrid,
});

const commuteTermSchema = z.object({
  id: z.string().min(1),
  startDate: z.string(),
  name: z.string().optional(),
  scheduleId: z.string().min(1),
});

const commuteHolidaySchema = z.object({ date: z.string(), name: z.string().min(1) });

const perActiveDayExtraSchema = z.object({ amount: z.number().int(), label: z.string().min(1) });

export const commuteSectionSchema = z.object({
  enabled: z.boolean(),
  farePerRide: z.number().int(),
  mealCost: z.number().int(),
  perActiveDayExtra: perActiveDayExtraSchema.optional(),
  schedules: z.array(commuteScheduleSchema),
  terms: z.array(commuteTermSchema),
  holidays: z.array(commuteHolidaySchema),
});

export type CommuteSection = z.infer<typeof commuteSectionSchema>;

/** JS's Sunday=0..Saturday=6 converted to this module's Monday=0..Sunday=6 weekday grid. */
function commuteWeekdayIndex(dateISO: string): number {
  return (parseISO(dateISO).getUTCDay() + 6) % 7;
}

function contribute(section: CommuteSection, range: DateRange): ModuleContribution {
  const breakdown: Record<string, Record<string, Centavos>> = {};
  const scheduleById = new Map(section.schedules.map((s) => [s.id, s]));
  const sortedTerms = [...section.terms].sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
  const holidaySet = new Set(section.holidays.map((h) => h.date));

  for (const date of enumerateDays(range)) {
    if (holidaySet.has(date)) continue;

    let term;
    for (const candidate of sortedTerms) {
      if (candidate.startDate <= date) term = candidate;
      else break;
    }
    if (!term) continue;

    const schedule = scheduleById.get(term.scheduleId);
    if (!schedule) {
      throw new Error(`Commute term ${term.id} refers to an unknown schedule ${term.scheduleId}`);
    }

    const weekday = commuteWeekdayIndex(date);
    const rides = schedule.rides[weekday];
    const meals = schedule.meals[weekday];

    if (rides > 0) {
      breakdown[date] ??= {};
      breakdown[date].commuteFare = -(rides * section.farePerRide);
      if (section.perActiveDayExtra) {
        breakdown[date].commutePerActiveDayExtra = -section.perActiveDayExtra.amount;
      }
    }
    if (meals > 0) {
      breakdown[date] ??= {};
      breakdown[date].commuteMeal = -(meals * section.mealCost);
    }
  }
  return { breakdown };
}

/** `modules.commute`: weekly ride/meal schedules, terms, and holidays. */
export const commuteModule: ModuleDefinition<CommuteSection> = {
  name: "commute",
  schema: commuteSectionSchema,
  contribute,
};
