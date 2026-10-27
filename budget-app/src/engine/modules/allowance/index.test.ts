import { describe, expect, it } from "vitest";
import type { Profile } from "../../../model/schema";
import { simulate } from "../../core/simulate";
import { allowanceModule } from "./index";
import { eraseModule } from "../types";

describe("allowance module contribute()", () => {
  it("lands a daily allowance on every day it applies", () => {
    const result = allowanceModule.contribute(
      { enabled: true, amount: 1000, recurrence: { type: "daily" } },
      { start: "2026-10-27", end: "2026-10-29" },
    );
    expect(result.breakdown["2026-10-27"].allowanceLiving).toBe(-1000);
    expect(result.breakdown["2026-10-28"].allowanceLiving).toBe(-1000);
    expect(result.breakdown["2026-10-29"].allowanceLiving).toBe(-1000);
  });

  it("lands a weekly allowance only on its weekday", () => {
    const result = allowanceModule.contribute(
      { enabled: true, amount: 5000, recurrence: { type: "weekly", weekday: 0 } },
      { start: "2026-10-27", end: "2026-11-08" },
    );
    expect(Object.keys(result.breakdown).sort()).toEqual(["2026-11-01", "2026-11-08"]);
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
      planEnd: "2026-10-30",
      updatedAt: "2026-10-27T00:00:00.000Z",
    },
    accounts: [{ id: "cash", name: "Cash", kind: "cash", startingBalance: 100000 }],
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

describe("allowance module through simulate()", () => {
  it("is visible in the day's breakdown", () => {
    const result = simulate(
      baseProfile({ modules: { allowance: { enabled: true, amount: 1000, recurrence: { type: "daily" } } } }),
      [eraseModule(allowanceModule)],
    );
    expect(result.warnings).toEqual([]);
    expect(result.days.every((d) => d.breakdown.allowanceLiving === -1000)).toBe(true);
  });

  it("excludes the allowance when disabled", () => {
    const result = simulate(
      baseProfile({ modules: { allowance: { enabled: false, amount: 1000, recurrence: { type: "daily" } } } }),
      [eraseModule(allowanceModule)],
    );
    expect(result.days.every((d) => d.breakdown.allowanceLiving === undefined)).toBe(true);
  });

  it("excludes invalid allowance data with a warning while the rest of the plan still computes", () => {
    const result = simulate(baseProfile({ modules: { allowance: { enabled: true, amount: "lots" } } }), [
      eraseModule(allowanceModule),
    ]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/allowance/);
  });
});
