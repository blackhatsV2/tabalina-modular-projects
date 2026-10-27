import { addDays, expandRecurrence, type PayScheduleRule } from "../dates";

export interface Period {
  start: string;
  end: string;
}

/**
 * Pay-period boundaries from `periodSchedule` alone — independent of whether any income
 * module is present or enabled (ADR 0003). The plan's first period always starts at
 * `planStart`; every later occurrence of the schedule strictly after `planStart` opens the
 * next period; the plan's last period always ends at `planEnd`.
 */
export function computePeriods(schedule: PayScheduleRule, planStart: string, planEnd: string): Period[] {
  const occurrences = expandRecurrence(schedule, { start: planStart, end: planEnd }).filter(
    (date) => date > planStart,
  );
  const starts = [planStart, ...occurrences];
  return starts.map((start, i) => ({
    start,
    end: i + 1 < starts.length ? addDays(starts[i + 1], -1) : planEnd,
  }));
}
