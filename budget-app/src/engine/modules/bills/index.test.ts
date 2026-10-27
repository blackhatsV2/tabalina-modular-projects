import { describe, expect, it } from "vitest";
import type { Profile } from "../../../model/schema";
import { simulate } from "../../core/simulate";
import { eraseModule } from "../types";
import { billsModule } from "./index";

const range = { start: "2026-10-27", end: "2027-01-31" };

describe("bills module contribute()", () => {
  it("lands a monthly bill (incl. 'last' day) on its due dates", () => {
    const result = billsModule.contribute(
      {
        enabled: true,
        items: [
          { id: "rent", name: "Rent", category: "Rent", amount: 200000, recurrence: { type: "monthly", day: 1 } },
        ],
      },
      range,
    );
    expect(Object.keys(result.breakdown).sort()).toEqual(["2026-11-01", "2026-12-01", "2027-01-01"]);
    expect(result.breakdown["2026-11-01"].bills).toBe(-200000);
  });

  it("lands a weekly bill on its weekday", () => {
    const result = billsModule.contribute(
      {
        enabled: true,
        items: [{ id: "w", name: "Weekly", category: "Other", amount: 1000, recurrence: { type: "weekly", weekday: 0 } }],
      },
      { start: "2026-11-01", end: "2026-11-08" },
    );
    expect(Object.keys(result.breakdown).sort()).toEqual(["2026-11-01", "2026-11-08"]);
  });

  it("lands a yearly bill once a year", () => {
    const result = billsModule.contribute(
      {
        enabled: true,
        items: [
          { id: "y", name: "Yearly", category: "Other", amount: 44900, recurrence: { type: "yearly", month: 10, day: 15 } },
        ],
      },
      range,
    );
    expect(Object.keys(result.breakdown)).toEqual([]);
    const result2 = billsModule.contribute(
      {
        enabled: true,
        items: [
          { id: "y", name: "Yearly", category: "Other", amount: 44900, recurrence: { type: "yearly", month: 10, day: 15 } },
        ],
      },
      { start: "2027-10-01", end: "2027-10-31" },
    );
    expect(Object.keys(result2.breakdown)).toEqual(["2027-10-15"]);
  });

  it("produces exactly one occurrence for a 'once' bill, never repeating", () => {
    const result = billsModule.contribute(
      {
        enabled: true,
        items: [
          { id: "once", name: "Reload", category: "Data", amount: 44900, recurrence: { type: "once", date: "2026-12-01" } },
        ],
      },
      range,
    );
    expect(Object.keys(result.breakdown)).toEqual(["2026-12-01"]);
    expect(result.breakdown["2026-12-01"].bills).toBe(-44900);
  });

  it("sums multiple bills landing on the same day", () => {
    const result = billsModule.contribute(
      {
        enabled: true,
        items: [
          { id: "a", name: "A", category: "Other", amount: 1000, recurrence: { type: "once", date: "2026-11-01" } },
          { id: "b", name: "B", category: "Other", amount: 2000, recurrence: { type: "once", date: "2026-11-01" } },
        ],
      },
      range,
    );
    expect(result.breakdown["2026-11-01"].bills).toBe(-3000);
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
    accounts: [{ id: "cash", name: "Cash", kind: "cash", startingBalance: 500000 }],
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

describe("bills module through simulate()", () => {
  it("is visible in the day's and the period's breakdown", () => {
    const result = simulate(
      baseProfile({
        modules: {
          bills: {
            enabled: true,
            items: [
              { id: "rent", name: "Rent", category: "Rent", amount: 200000, recurrence: { type: "monthly", day: 1 } },
            ],
          },
        },
      }),
      [eraseModule(billsModule)],
    );
    expect(result.warnings).toEqual([]);
    const dueDay = result.days.find((d) => d.date === "2026-11-01")!;
    expect(dueDay.breakdown.bills).toBe(-200000);
    expect(dueDay.end).toBe(dueDay.start - 200000);
  });

  it("excludes all bills when modules.bills.enabled is false", () => {
    const result = simulate(
      baseProfile({
        modules: {
          bills: {
            enabled: false,
            items: [{ id: "r", name: "Rent", category: "Rent", amount: 200000, recurrence: { type: "monthly", day: 1 } }],
          },
        },
      }),
      [eraseModule(billsModule)],
    );
    expect(result.days.every((d) => d.breakdown.bills === undefined)).toBe(true);
  });

  it("excludes invalid bills data with a warning while the rest of the plan still computes", () => {
    const result = simulate(baseProfile({ modules: { bills: { enabled: true, items: "nope" } } }), [
      eraseModule(billsModule),
    ]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/bills/);
  });
});
