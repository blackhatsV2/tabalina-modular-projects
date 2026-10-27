import { describe, expect, it } from "vitest";
import type { Profile } from "../../../model/schema";
import { simulate } from "../../core/simulate";
import { eraseModule } from "../types";
import { contributeForLookahead, flexibleExpensesModule, type FlexibleExpenseItem } from "./index";

const range = { start: "2026-10-27", end: "2026-11-30" };

function section(items: FlexibleExpenseItem[]) {
  return { enabled: true, items };
}

describe("flexibleExpenses module contribute()", () => {
  it("lands an enabled item's cost on its recurrence dates", () => {
    const result = flexibleExpensesModule.contribute(
      section([
        { id: "misc", name: "Misc", enabled: true, reserveRoom: false, amount: 1000, recurrence: { type: "daily" } },
      ]),
      { start: "2026-10-27", end: "2026-10-28" },
    );
    expect(result.breakdown["2026-10-27"].flexibleExpenses).toBe(-1000);
    expect(result.breakdown["2026-10-28"].flexibleExpenses).toBe(-1000);
  });

  it("contributes nothing for a disabled item, regardless of reserveRoom", () => {
    const result = flexibleExpensesModule.contribute(
      section([
        { id: "sunday", name: "Sunday out", enabled: false, reserveRoom: true, amount: 10500, recurrence: { type: "weekly", weekday: 0 } },
      ]),
      range,
    );
    expect(result.breakdown).toEqual({});
  });

  it("sums multiple enabled items landing on the same day", () => {
    const result = flexibleExpensesModule.contribute(
      section([
        { id: "a", name: "A", enabled: true, reserveRoom: false, amount: 1000, recurrence: { type: "once", date: "2026-10-27" } },
        { id: "b", name: "B", enabled: true, reserveRoom: false, amount: 2000, recurrence: { type: "once", date: "2026-10-27" } },
      ]),
      range,
    );
    expect(result.breakdown["2026-10-27"].flexibleExpenses).toBe(-3000);
  });
});

describe("contributeForLookahead", () => {
  it("treats a reserveRoom item as enabled even when its real enabled is false", () => {
    const result = contributeForLookahead(
      section([
        { id: "brother", name: "Brother", enabled: false, reserveRoom: true, amount: 50000, recurrence: { type: "monthly", day: 15 } },
      ]),
      { start: "2026-11-01", end: "2026-11-30" },
    );
    expect(result.breakdown["2026-11-15"].flexibleExpenses).toBe(-50000);
  });

  it("still excludes an item that is neither enabled nor reserveRoom", () => {
    const result = contributeForLookahead(
      section([
        { id: "x", name: "X", enabled: false, reserveRoom: false, amount: 50000, recurrence: { type: "monthly", day: 15 } },
      ]),
      { start: "2026-11-01", end: "2026-11-30" },
    );
    expect(result.breakdown).toEqual({});
  });

  it("includes an item that is already enabled regardless of reserveRoom", () => {
    const result = contributeForLookahead(
      section([
        { id: "y", name: "Y", enabled: true, reserveRoom: false, amount: 1000, recurrence: { type: "once", date: "2026-11-05" } },
      ]),
      { start: "2026-11-01", end: "2026-11-30" },
    );
    expect(result.breakdown["2026-11-05"].flexibleExpenses).toBe(-1000);
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

describe("flexibleExpenses module through simulate()", () => {
  it("module-level enabled=false excludes every item regardless of each item's own flags", () => {
    const result = simulate(
      baseProfile({
        modules: {
          flexibleExpenses: {
            enabled: false,
            items: [
              { id: "misc", name: "Misc", enabled: true, reserveRoom: true, amount: 1000, recurrence: { type: "daily" } },
            ],
          },
        },
      }),
      [eraseModule(flexibleExpensesModule)],
    );
    expect(result.days.every((d) => d.breakdown.flexibleExpenses === undefined)).toBe(true);
  });

  it("excludes invalid flexible-expense data with a warning while the rest of the plan still computes", () => {
    const result = simulate(
      baseProfile({ modules: { flexibleExpenses: { enabled: true, items: "nope" } } }),
      [eraseModule(flexibleExpensesModule)],
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/flexibleExpenses/);
  });
});
