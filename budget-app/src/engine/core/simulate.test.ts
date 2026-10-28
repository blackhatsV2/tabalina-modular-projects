import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Profile } from "../../model/schema";
import type { ModuleDefinition } from "../modules/types";
import { eraseModule } from "../modules/types";
import { simulate } from "./simulate";

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
    accounts: [{ id: "cash", name: "Cash", kind: "cash", startingBalance: 300000 }],
    periodSchedule: { type: "monthly", day: 1 },
    savingsGoals: [],
    safetyBuffer: 0,
    // Pin auto-savings (ticket 12) to 0 by default so these tests — which predate it and are
    // about module isolation / breakdown invariants, not savings sizing — keep their original
    // expected totals. The one test that cares about savings overrides this itself.
    periodOverrides: { "2026-10-27": { savings: 0 } },
    actuals: {},
    paid: {},
    modules: {},
    ...overrides,
  };
}

describe("simulate", () => {
  it("produces a flat carried-forward balance when every module is disabled/absent, with no errors", () => {
    const result = simulate(baseProfile(), []);
    expect(result.warnings).toEqual([]);
    expect(result.days).toHaveLength(4);
    for (const day of result.days) {
      expect(day.start).toBe(300000);
      expect(day.end).toBe(300000);
    }
    expect(result.periods).toHaveLength(1);
    expect(result.periods[0]).toMatchObject({ startBalance: 300000, endBalance: 300000 });
  });

  it("every day's breakdown terms sum exactly to that day's change in balance", () => {
    const working: ModuleDefinition<{ enabled: boolean }> = {
      name: "working",
      schema: z.object({ enabled: z.boolean() }),
      contribute: (_section, range) => ({
        breakdown: {
          [range.start]: { income: 10000 } as Record<string, number>,
          "2026-10-29": { bills: -4000 } as Record<string, number>,
        },
      }),
    };
    const result = simulate(baseProfile({ modules: { working: { enabled: true } } }), [eraseModule(working)]);
    expect(result.warnings).toEqual([]);
    for (const day of result.days) {
      const sum = Object.values(day.breakdown).reduce((a, b) => a + b, 0);
      expect(day.start + sum).toBe(day.end);
    }
    const day27 = result.days.find((d) => d.date === "2026-10-27")!;
    expect(day27.start).toBe(300000);
    expect(day27.end).toBe(310000);
    const day29 = result.days.find((d) => d.date === "2026-10-29")!;
    expect(day29.end).toBe(day29.start - 4000);
  });

  it("every period's breakdown terms sum exactly to that period's change in balance", () => {
    const working: ModuleDefinition<{ enabled: boolean }> = {
      name: "working",
      schema: z.object({ enabled: z.boolean() }),
      contribute: () => ({
        breakdown: {
          "2026-10-27": { income: 10000 } as Record<string, number>,
          "2026-10-29": { bills: -4000 } as Record<string, number>,
        },
      }),
    };
    const result = simulate(baseProfile({ modules: { working: { enabled: true } } }), [eraseModule(working)]);
    expect(result.periods).toHaveLength(1);
    const period = result.periods[0];
    const sum = Object.values(period.breakdown).reduce((a, b) => a + b, 0);
    expect(period.startBalance + sum).toBe(period.endBalance);
    expect(period.endBalance).toBe(300000 + 10000 - 4000);
  });

  it("excludes a module whose contribute() throws, with exactly one warning naming it, leaving other totals correct", () => {
    const throwing: ModuleDefinition<{ enabled: boolean }> = {
      name: "broken",
      schema: z.object({ enabled: z.boolean() }),
      contribute: () => {
        throw new Error("kaboom");
      },
    };
    const working: ModuleDefinition<{ enabled: boolean }> = {
      name: "working",
      schema: z.object({ enabled: z.boolean() }),
      contribute: () => ({ breakdown: { "2026-10-27": { income: 5000 } } }),
    };
    const result = simulate(
      baseProfile({ modules: { broken: { enabled: true }, working: { enabled: true } } }),
      [eraseModule(throwing), eraseModule(working)],
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/broken/);
    const day27 = result.days.find((d) => d.date === "2026-10-27")!;
    expect(day27.end).toBe(305000);
  });

  it("excludes a module whose data fails its own schema, with exactly one warning naming it", () => {
    const strict: ModuleDefinition<{ enabled: boolean; mustHave: string }> = {
      name: "strict",
      schema: z.object({ enabled: z.boolean(), mustHave: z.string() }),
      contribute: () => ({ breakdown: {} }),
    };
    const result = simulate(baseProfile({ modules: { strict: { enabled: true } } }), [eraseModule(strict)]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/strict/);
    expect(result.days.every((d) => d.start === 300000 && d.end === 300000)).toBe(true);
  });

  it("warns when a module's contributeForLookahead fails even though its normal contribute() succeeds", () => {
    const flaky: ModuleDefinition<{ enabled: boolean }> = {
      name: "flaky",
      schema: z.object({ enabled: z.boolean() }),
      contribute: () => ({ breakdown: { "2026-10-27": { flakyCost: -1000 } } }),
      contributeForLookahead: () => {
        throw new Error("sizing exploded");
      },
    };
    const result = simulate(baseProfile({ modules: { flaky: { enabled: true } } }), [eraseModule(flaky)]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/flaky \(auto-savings sizing\)/);
    // The real plan is unaffected by the lookahead-only failure.
    const day27 = result.days.find((d) => d.date === "2026-10-27")!;
    expect(day27.breakdown.flakyCost).toBe(-1000);
  });

  it("never double-warns when a module already excluded by its normal run also has a lookahead variant", () => {
    const brokenWithLookahead: ModuleDefinition<{ enabled: boolean; mustHave: string }> = {
      name: "brokenWithLookahead",
      schema: z.object({ enabled: z.boolean(), mustHave: z.string() }),
      contribute: () => ({ breakdown: {} }),
      contributeForLookahead: () => ({ breakdown: {} }),
    };
    const result = simulate(baseProfile({ modules: { brokenWithLookahead: { enabled: true } } }), [
      eraseModule(brokenWithLookahead),
    ]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/brokenWithLookahead/);
  });

  it("applies periodOverrides.savings and .extra as lump subtractions on the period's start day", () => {
    const result = simulate(
      baseProfile({ periodOverrides: { "2026-10-27": { savings: 1000, extra: 500 } } }),
      [],
    );
    const day27 = result.days.find((d) => d.date === "2026-10-27")!;
    expect(day27.breakdown.savings).toBe(-1000);
    expect(day27.breakdown.extra).toBe(-500);
    expect(day27.end).toBe(300000 - 1000 - 500);
    const day28 = result.days.find((d) => d.date === "2026-10-28")!;
    expect(day28.breakdown.savings).toBeUndefined();
  });
});
