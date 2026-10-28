/**
 * The one pure recurrence seam: expands a `PayScheduleRule` or a bill/flexible-expense
 * recurrence rule into concrete ISO dates over a range. All date math runs in UTC via
 * Date.UTC/getUTC* so no local timezone can ever shift a computed date by a day.
 *
 * Weekday convention for `weekly`/`biweekly`/this module: 0 = Sunday .. 6 = Saturday
 * (JS's native Date#getUTCDay()). Modules with their own weekday grids (e.g. commute's
 * Monday-first schedule) convert to/from this convention at their own boundary.
 */

export type DayOfMonth = number | "last";

export interface MonthlyRule {
  type: "monthly";
  day: DayOfMonth;
}
export interface SemiMonthlyRule {
  type: "semiMonthly";
  days: [DayOfMonth, DayOfMonth];
}
export interface WeeklyRule {
  type: "weekly";
  weekday: number;
}
export interface BiweeklyRule {
  type: "biweekly";
  weekday: number;
  anchor: string;
}
export interface CustomRule {
  type: "custom";
  dates: string[];
}
export interface YearlyRule {
  type: "yearly";
  month: number;
  day: number;
}
export interface OnceRule {
  type: "once";
  date: string;
}
export interface DailyRule {
  type: "daily";
}

/** Shared by `periodSchedule` (core) and every income source's `schedule`. */
export type PayScheduleRule = MonthlyRule | SemiMonthlyRule | WeeklyRule | BiweeklyRule | CustomRule;

/** The full set this engine's recurrence seam understands — superset used by bills/flexible expenses. */
export type RecurrenceRule = PayScheduleRule | YearlyRule | OnceRule | DailyRule;

export interface DateRange {
  start: string;
  end: string;
}

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISO(dateISO: string): Date {
  const match = ISO_PATTERN.exec(dateISO);
  if (!match) throw new Error(`Invalid ISO date: ${dateISO}`);
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(m) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    throw new Error(`Invalid calendar date: ${dateISO}`);
  }
  return date;
}

export function toISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function daysInMonthUTC(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

export function resolveDayOfMonth(year: number, monthIndex0: number, day: DayOfMonth): number {
  const last = daysInMonthUTC(year, monthIndex0);
  if (day === "last") return last;
  if (!Number.isInteger(day) || day < 1) {
    throw new Error(`Invalid day of month: ${day}`);
  }
  return Math.min(day, last);
}

/** Every (year, 0-based month) pair whose month overlaps [start, end]. */
function* monthsBetween(start: Date, end: Date): Generator<[number, number]> {
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();
  while (year < endYear || (year === endYear && month <= endMonth)) {
    yield [year, month];
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
}

function isWithin(dateISO: string, start: Date, end: Date): boolean {
  const t = parseISO(dateISO).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function expandMonthlyLike(day: DayOfMonth, start: Date, end: Date): string[] {
  const dates: string[] = [];
  for (const [year, monthIndex0] of monthsBetween(start, end)) {
    const resolvedDay = resolveDayOfMonth(year, monthIndex0, day);
    const candidate = new Date(Date.UTC(year, monthIndex0, resolvedDay));
    if (candidate.getTime() >= start.getTime() && candidate.getTime() <= end.getTime()) {
      dates.push(toISO(candidate));
    }
  }
  return dates;
}

function expandWeekly(weekday: number, start: Date, end: Date): string[] {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new Error(`Invalid weekday: ${weekday}`);
  }
  const dates: string[] = [];
  const offset = (weekday - start.getUTCDay() + 7) % 7;
  let current = addDaysUTC(start, offset);
  while (current.getTime() <= end.getTime()) {
    dates.push(toISO(current));
    current = addDaysUTC(current, 7);
  }
  return dates;
}

function expandBiweekly(weekday: number, anchorISO: string, start: Date, end: Date): string[] {
  const anchor = parseISO(anchorISO);
  if (anchor.getUTCDay() !== weekday) {
    throw new Error(`Biweekly anchor ${anchorISO} does not fall on weekday ${weekday}`);
  }
  const dates: string[] = [];
  const daysSinceAnchor = Math.round((start.getTime() - anchor.getTime()) / 86_400_000);
  let k = Math.ceil(daysSinceAnchor / 14);
  let current = addDaysUTC(anchor, k * 14);
  while (current.getTime() < start.getTime()) {
    k += 1;
    current = addDaysUTC(anchor, k * 14);
  }
  while (current.getTime() <= end.getTime()) {
    dates.push(toISO(current));
    k += 1;
    current = addDaysUTC(anchor, k * 14);
  }
  return dates;
}

function expandYearly(month: number, day: number, start: Date, end: Date): string[] {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  const dates: string[] = [];
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year += 1) {
    const resolvedDay = resolveDayOfMonth(year, month - 1, day);
    const candidate = new Date(Date.UTC(year, month - 1, resolvedDay));
    if (candidate.getTime() >= start.getTime() && candidate.getTime() <= end.getTime()) {
      dates.push(toISO(candidate));
    }
  }
  return dates;
}

function expandDaily(start: Date, end: Date): string[] {
  const dates: string[] = [];
  let current = start;
  while (current.getTime() <= end.getTime()) {
    dates.push(toISO(current));
    current = addDaysUTC(current, 1);
  }
  return dates;
}

export function expandRecurrence(rule: RecurrenceRule, range: DateRange): string[] {
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  if (start.getTime() > end.getTime()) return [];

  switch (rule.type) {
    case "once":
      return isWithin(rule.date, start, end) ? [rule.date] : [];
    case "daily":
      return expandDaily(start, end);
    case "weekly":
      return expandWeekly(rule.weekday, start, end);
    case "biweekly":
      return expandBiweekly(rule.weekday, rule.anchor, start, end);
    case "monthly":
      return expandMonthlyLike(rule.day, start, end);
    case "semiMonthly": {
      const [a, b] = rule.days;
      const merged = new Set([...expandMonthlyLike(a, start, end), ...expandMonthlyLike(b, start, end)]);
      return [...merged].sort();
    }
    case "yearly":
      return expandYearly(rule.month, rule.day, start, end);
    case "custom":
      return [...rule.dates].filter((d) => isWithin(d, start, end)).sort();
    default: {
      const exhaustive: never = rule;
      throw new Error(`Unknown recurrence rule: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/** Every ISO date in [range.start, range.end], inclusive. */
export function enumerateDays(range: DateRange): string[] {
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  return expandDaily(start, end);
}

/** `dateISO` shifted by `days` (negative to go backward), in UTC. */
export function addDays(dateISO: string, days: number): string {
  return toISO(addDaysUTC(parseISO(dateISO), days));
}

/** -1 if a < b, 0 if equal, 1 if a > b — lexicographic ISO comparison also works, this is explicit. */
export function compareISO(a: string, b: string): number {
  return parseISO(a).getTime() - parseISO(b).getTime();
}

/**
 * Narrows `range` to an item's own optional `startDate`/`endDate` window — the shared
 * "an item is only active while it's in range" clamp every module with that shape
 * (income sources, bills) reuses instead of its own copy.
 */
export function clampRange(range: DateRange, startDate?: string, endDate?: string): DateRange {
  const start = startDate && startDate > range.start ? startDate : range.start;
  const end = endDate && endDate < range.end ? endDate : range.end;
  return { start, end };
}
