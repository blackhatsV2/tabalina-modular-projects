import { addDays, parseISO } from "../dates";
import type { Centavos } from "../money";
import type { DayResult } from "./simulate";

export interface Rollup {
  start: string;
  end: string;
  startBalance: Centavos;
  endBalance: Centavos;
  breakdown: Record<string, Centavos>;
}

function groupConsecutiveBy(days: DayResult[], bucketKey: (date: string) => string): DayResult[][] {
  const groups: DayResult[][] = [];
  let currentKey: string | undefined;
  let current: DayResult[] = [];
  for (const day of days) {
    const key = bucketKey(day.date);
    if (key !== currentKey) {
      if (current.length > 0) groups.push(current);
      current = [];
      currentKey = key;
    }
    current.push(day);
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

function summarize(group: DayResult[]): Rollup {
  const breakdown: Record<string, Centavos> = {};
  for (const day of group) {
    for (const [term, amount] of Object.entries(day.breakdown)) {
      breakdown[term] = (breakdown[term] ?? 0) + amount;
    }
  }
  return {
    start: group[0].date,
    end: group[group.length - 1].date,
    startBalance: group[0].start,
    endBalance: group[group.length - 1].end,
    breakdown,
  };
}

/** Monday of the ISO week containing `date` (JS Sunday=0..Saturday=6, converted to days-since-Monday). */
function mondayOf(date: string): string {
  const daysSinceMonday = (parseISO(date).getUTCDay() + 6) % 7;
  return addDays(date, -daysSinceMonday);
}

function firstOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/**
 * Weekly (Monday-Sunday) roll-up of a day-by-day plan. The first/last week may be partial —
 * `start`/`end` reflect the actual days present, not the full calendar week. Every term's
 * weekly total is exactly the sum of that term across its days (same `breakdown` shape the
 * day-by-day result uses, so the same "explain this number" rendering works at this zoom level).
 */
export function computeWeeklyRollup(days: DayResult[]): Rollup[] {
  return groupConsecutiveBy(days, mondayOf).map(summarize);
}

/** Monthly roll-up, same shape and partial-boundary behavior as {@link computeWeeklyRollup}. */
export function computeMonthlyRollup(days: DayResult[]): Rollup[] {
  return groupConsecutiveBy(days, firstOfMonth).map(summarize);
}
