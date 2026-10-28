import { describe, expect, it } from "vitest";
import jayroldProfileRaw from "../../fixtures/jayrold-profile.json";
import phHolidays from "../data/holidays/ph.json";
import { parseProfile } from "../model/parse";
import { simulate } from "../engine/core/simulate";

describe("fixtures/jayrold-profile.json", () => {
  it("enables income, bills, loans, commute, and flexibleExpenses, with allowance disabled", () => {
    const result = parseProfile(jayroldProfileRaw);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    const modules = result.profile.modules as Record<string, { enabled: boolean }>;
    expect(modules.income.enabled).toBe(true);
    expect(modules.bills.enabled).toBe(true);
    expect(modules.loans.enabled).toBe(true);
    expect(modules.commute.enabled).toBe(true);
    expect(modules.flexibleExpenses.enabled).toBe(true);
    expect(modules.allowance.enabled).toBe(false);
  });

  it("does not bake in periodOverrides", () => {
    const result = parseProfile(jayroldProfileRaw);
    if (!result.success) throw new Error("expected success");
    expect(result.profile.periodOverrides).toEqual({});
  });

  it("matches the reusable src/data/holidays/ph.json dataset exactly (no drift between the two copies)", () => {
    const commute = jayroldProfileRaw.modules.commute as { holidays: { date: string; name: string }[] };
    expect(commute.holidays).toEqual(phHolidays);
  });

  it("parses and runs through simulate() with zero warnings", () => {
    const result = parseProfile(jayroldProfileRaw);
    if (!result.success) throw new Error(`expected success: ${result.error?.message}`);
    const simulation = simulate(result.profile);
    expect(simulation.warnings).toEqual([]);
    // Oct 27, 2026 through Dec 31, 2027 inclusive.
    expect(simulation.days).toHaveLength(431);
  });

  it("every day's breakdown terms sum exactly to that day's change in balance", () => {
    const result = parseProfile(jayroldProfileRaw);
    if (!result.success) throw new Error("expected success");
    const simulation = simulate(result.profile);
    for (const day of simulation.days) {
      const sum = Object.values(day.breakdown).reduce((a, b) => a + b, 0);
      expect(day.start + sum).toBe(day.end);
    }
  });

  it("auto-savings (no periodOverrides) keeps every day's balance at or above the safety buffer", () => {
    const result = parseProfile(jayroldProfileRaw);
    if (!result.success) throw new Error("expected success");
    const simulation = simulate(result.profile);
    const buffer = result.profile.safetyBuffer;
    const belowBuffer = simulation.days.filter((d) => d.end < buffer);
    expect(belowBuffer).toEqual([]);
  });
});
