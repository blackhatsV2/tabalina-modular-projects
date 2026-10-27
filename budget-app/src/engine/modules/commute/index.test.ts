import { describe, expect, it } from "vitest";
import type { Profile } from "../../../model/schema";
import { simulate } from "../../core/simulate";
import { allowanceModule } from "../allowance";
import { eraseModule } from "../types";
import { commuteModule } from "./index";

// rides/meals grids are Monday-first (index 0 = Monday .. 6 = Sunday), matching the source
// workbook's weekly pattern tables.
const schedule = {
  id: "s1",
  name: "Schedule 1",
  rides: [0, 2, 3, 4, 5, 6, 7] as [number, number, number, number, number, number, number],
  meals: [0, 0, 0, 0, 0, 0, 1] as [number, number, number, number, number, number, number],
};

function section(overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    farePerRide: 2000,
    mealCost: 10000,
    perActiveDayExtra: { amount: 500, label: "Water" },
    schedules: [schedule],
    terms: [{ id: "t1", startDate: "2026-10-27", scheduleId: "s1" }],
    holidays: [{ date: "2026-10-28", name: "Test holiday" }],
    ...overrides,
  };
}

const range = { start: "2026-10-27", end: "2026-11-03" };

describe("commute module contribute()", () => {
  it("computes fare, meal, and perActiveDayExtra from the weekday grid", () => {
    const result = commuteModule.contribute(section(), range);
    // Oct 27, 2026 is a Tuesday (grid index 1): 2 rides, 0 meals.
    expect(result.breakdown["2026-10-27"]).toEqual({ commuteFare: -4000, commutePerActiveDayExtra: -500 });
    // Nov 1, 2026 is a Sunday (grid index 6): 7 rides, 1 meal.
    expect(result.breakdown["2026-11-01"]).toEqual({
      commuteFare: -14000,
      commuteMeal: -10000,
      commutePerActiveDayExtra: -500,
    });
  });

  it("zeroes rides, meals, and every commute cost on a holiday, regardless of weekday pattern", () => {
    const result = commuteModule.contribute(section(), range);
    // Oct 28 would otherwise be a Wednesday with 3 rides, but it's marked a holiday.
    expect(result.breakdown["2026-10-28"]).toBeUndefined();
  });

  it("charges no fare and no perActiveDayExtra on a day with zero rides", () => {
    const result = commuteModule.contribute(section(), range);
    // Nov 2, 2026 is a Monday (grid index 0): 0 rides.
    expect(result.breakdown["2026-11-02"]).toBeUndefined();
  });

  it("applies the latest term starting on or before a day", () => {
    const schedule2 = { id: "s2", name: "Schedule 2", rides: [9, 9, 9, 9, 9, 9, 9] as [number, number, number, number, number, number, number], meals: [0, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number] };
    const result = commuteModule.contribute(
      section({
        schedules: [schedule, schedule2],
        terms: [
          { id: "t1", startDate: "2026-10-27", scheduleId: "s1" },
          { id: "t2", startDate: "2026-10-30", scheduleId: "s2" },
        ],
        holidays: [],
      }),
      range,
    );
    // Oct 29 (before the second term starts) still uses schedule 1: Thursday, index 3, 4 rides.
    expect(result.breakdown["2026-10-29"].commuteFare).toBe(-8000);
    // Oct 30 onward uses schedule 2: flat 9 rides every day.
    expect(result.breakdown["2026-10-30"].commuteFare).toBe(-18000);
  });
});

function baseProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    schemaVersion: 1,
    meta: {
      id: "p1",
      name: "Test",
      currency: { code: "PHP", symbol: "₱", decimalDigits: 2 },
      planStart: "2026-10-27",
      planEnd: "2026-11-03",
      updatedAt: "2026-10-27T00:00:00.000Z",
    },
    accounts: [{ id: "cash", name: "Cash", kind: "cash", startingBalance: 1000000 }],
    periodSchedule: { type: "monthly", day: 1 },
    savingsGoals: [],
    safetyBuffer: 0,
    periodOverrides: {},
    actuals: {},
    paid: {},
    modules: {},
    ...overrides,
  };
}

describe("commute module through simulate()", () => {
  it("excludes commute costs when disabled", () => {
    const result = simulate(baseProfile({ modules: { commute: section({ enabled: false }) } }), [
      eraseModule(commuteModule),
    ]);
    expect(result.days.every((d) => d.breakdown.commuteFare === undefined)).toBe(true);
  });

  it("excludes invalid commute data with a warning while the rest of the plan still computes", () => {
    const result = simulate(
      baseProfile({ modules: { commute: section({ schedules: "not an array" }) } }),
      [eraseModule(commuteModule)],
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/commute/);
  });
});

describe("allowance + commute composition", () => {
  it("sums both modules' daily costs with neither silently overriding the other", () => {
    const result = simulate(
      baseProfile({
        modules: {
          allowance: { enabled: true, amount: 1000, recurrence: { type: "daily" } },
          commute: section(),
        },
      }),
      [eraseModule(allowanceModule), eraseModule(commuteModule)],
    );
    expect(result.warnings).toEqual([]);
    const day = result.days.find((d) => d.date === "2026-10-27")!;
    expect(day.breakdown.allowanceLiving).toBe(-1000);
    expect(day.breakdown.commuteFare).toBe(-4000);
    expect(day.breakdown.commutePerActiveDayExtra).toBe(-500);
    expect(day.end).toBe(day.start - 1000 - 4000 - 500);
  });
});
