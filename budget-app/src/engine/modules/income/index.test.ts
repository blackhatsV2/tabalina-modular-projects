import { describe, expect, it } from "vitest";
import type { Profile } from "../../../model/schema";
import { simulate } from "../../core/simulate";
import { eraseModule } from "../types";
import { incomeModule } from "./index";

const range = { start: "2026-10-27", end: "2026-11-30" };

describe("income module contribute()", () => {
  it("lands each source's pay on the days its own schedule produces", () => {
    const result = incomeModule.contribute(
      {
        enabled: true,
        sources: [
          {
            id: "salary",
            name: "Salary",
            kind: "salary",
            amount: 600000,
            schedule: { type: "semiMonthly", days: [15, "last"] },
          },
        ],
      },
      range,
    );
    expect(Object.keys(result.breakdown).sort()).toEqual(["2026-10-31", "2026-11-15", "2026-11-30"]);
    expect(result.breakdown["2026-10-31"].income).toBe(600000);
  });

  it("sums two sources on different schedules landing on the same day", () => {
    const result = incomeModule.contribute(
      {
        enabled: true,
        sources: [
          { id: "a", name: "A", kind: "salary", amount: 100000, schedule: { type: "monthly", day: 1 } },
          { id: "b", name: "B", kind: "sideJob", amount: 25000, schedule: { type: "monthly", day: 1 } },
        ],
      },
      { start: "2026-11-01", end: "2026-11-01" },
    );
    expect(result.breakdown["2026-11-01"].income).toBe(125000);
  });

  it("respects a source's own startDate/endDate window", () => {
    const result = incomeModule.contribute(
      {
        enabled: true,
        sources: [
          {
            id: "side",
            name: "Side job",
            kind: "sideJob",
            amount: 50000,
            schedule: { type: "weekly", weekday: 0 },
            startDate: "2026-11-10",
            endDate: "2026-11-20",
          },
        ],
      },
      range,
    );
    // Sundays in range: Nov 1, 8, 15, 22, 29 — only Nov 15 falls inside [Nov10, Nov20].
    expect(Object.keys(result.breakdown)).toEqual(["2026-11-15"]);
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
      planEnd: "2026-11-30",
      updatedAt: "2026-10-27T00:00:00.000Z",
    },
    accounts: [{ id: "cash", name: "Cash", kind: "cash", startingBalance: 0 }],
    periodSchedule: { type: "semiMonthly", days: [15, "last"] },
    savingsGoals: [],
    safetyBuffer: 0,
    periodOverrides: {},
    actuals: {},
    paid: {},
    modules: {},
    ...overrides,
  };
}

describe("income module through simulate()", () => {
  it("is visible in the day's and the period's breakdown", () => {
    const result = simulate(
      baseProfile({
        modules: {
          income: {
            enabled: true,
            sources: [
              {
                id: "salary",
                name: "Salary",
                kind: "salary",
                amount: 600000,
                schedule: { type: "semiMonthly", days: [15, "last"] },
              },
            ],
          },
        },
      }),
      [eraseModule(incomeModule)],
    );
    expect(result.warnings).toEqual([]);
    const payday = result.days.find((d) => d.date === "2026-10-31")!;
    expect(payday.breakdown.income).toBe(600000);
    const paydayPeriod = result.periods.find((p) => p.start === "2026-10-31")!;
    expect(paydayPeriod.breakdown.income).toBe(600000);
  });

  it("excludes all income when modules.income.enabled is false", () => {
    const result = simulate(
      baseProfile({
        modules: {
          income: {
            enabled: false,
            sources: [
              { id: "s", name: "S", kind: "salary", amount: 600000, schedule: { type: "monthly", day: 1 } },
            ],
          },
        },
      }),
      [eraseModule(incomeModule)],
    );
    expect(result.warnings).toEqual([]);
    expect(result.days.every((d) => d.breakdown.income === undefined)).toBe(true);
  });

  it("excludes invalid income data with a warning while the rest of the plan still computes", () => {
    const result = simulate(
      baseProfile({ modules: { income: { enabled: true, sources: "not an array" } } }),
      [eraseModule(incomeModule)],
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/income/);
    expect(result.days).toHaveLength(35);
  });
});
