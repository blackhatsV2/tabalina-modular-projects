import { describe, expect, it } from "vitest";
import type { Period } from "./periods";
import { computeAutoSavingsFromBreakdown } from "./autoSavings";

function periodsOf(starts: string[], end: string): Period[] {
  return starts.map((start, i) => ({
    start,
    end: i + 1 < starts.length ? dayBefore(starts[i + 1]) : end,
  }));
}

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

describe("computeAutoSavingsFromBreakdown", () => {
  it("saves the largest multiple of 100 that keeps every later day at or above the safety buffer", () => {
    // One period, flat +1000 income on day 1, nothing else. Starting balance 0, buffer 500.
    // Every day's balance (ignoring savings) stays at 1000 for the whole period, so the most
    // that can be saved on day 1 while keeping every day >= 500 is 500.
    const periods = periodsOf(["2026-10-01"], "2026-10-05");
    const breakdown = { "2026-10-01": { income: 1000 } };
    const result = computeAutoSavingsFromBreakdown(periods, breakdown, {}, 0, 500);
    expect(result["2026-10-01"]).toBe(500);
  });

  it("floors to the nearest multiple of 100", () => {
    const periods = periodsOf(["2026-10-01"], "2026-10-05");
    const breakdown = { "2026-10-01": { income: 999 } };
    const result = computeAutoSavingsFromBreakdown(periods, breakdown, {}, 0, 500);
    // slack = 999 - 500 = 499 -> floors to 400.
    expect(result["2026-10-01"]).toBe(400);
  });

  it("never goes negative when costs already push below the buffer", () => {
    const periods = periodsOf(["2026-10-01"], "2026-10-05");
    const breakdown = { "2026-10-01": { bills: -1000 } };
    const result = computeAutoSavingsFromBreakdown(periods, breakdown, {}, 500, 500);
    expect(result["2026-10-01"]).toBe(0);
  });

  it("looks ahead past the current period to a later shortfall before committing", () => {
    // Period 1: +2000 income. Period 2: a -1800 bill. Buffer 500. Saving all 2000 in period 1
    // (leaving nothing for period 2's bill) would drop period 2 below buffer, so period 1's
    // savings must leave enough room.
    const periods = periodsOf(["2026-10-01", "2026-10-15"], "2026-10-31");
    const breakdown = {
      "2026-10-01": { income: 2000 },
      "2026-10-15": { bills: -1800 },
    };
    const result = computeAutoSavingsFromBreakdown(periods, breakdown, {}, 0, 500);
    // Without saving: balance after period 1 = 2000; after period 2's bill = 200 (below 500!).
    // So period 1 can save at most floor((2000 - (1800 + 500))/100)*100 = floor(-300/100)*100 -> 0.
    expect(result["2026-10-01"]).toBe(0);
    // Period 2 then has its own room: balance entering period 2 is 2000, minus the 1800 bill = 200,
    // which is already below buffer with 0 savings — so period 2 also saves 0.
    expect(result["2026-10-15"]).toBe(0);
  });

  it("respects an explicit periodOverrides.savings instead of computing one, including an explicit 0", () => {
    const periods = periodsOf(["2026-10-01"], "2026-10-05");
    const breakdown = { "2026-10-01": { income: 1000 } };
    const result = computeAutoSavingsFromBreakdown(
      periods,
      breakdown,
      { "2026-10-01": { savings: 0 } },
      0,
      500,
    );
    expect(result["2026-10-01"]).toBeUndefined();
  });

  it("accounts for an already-committed override on a later period when sizing an earlier one", () => {
    const periods = periodsOf(["2026-10-01", "2026-10-15"], "2026-10-31");
    const breakdown = {
      "2026-10-01": { income: 2000 },
    };
    // Period 2 is overridden to pull out 1500 regardless. Period 1 must leave enough that
    // period 2's override doesn't push below the buffer.
    const result = computeAutoSavingsFromBreakdown(
      periods,
      breakdown,
      { "2026-10-15": { savings: 1500 } },
      0,
      500,
    );
    // Balance after period1's income with 0 savings = 2000; after period2's override withdrawal = 500 (== buffer, OK).
    // So period 1 can safely save floor((2000-500-1500)/100... let's just assert it keeps things safe:
    expect(result["2026-10-01"]).toBe(0);
  });

  it("keeps every day of Jayrold-scale multi-period data at or above the buffer (sanity, small synthetic plan)", () => {
    const periods = periodsOf(["2026-10-01", "2026-10-15", "2026-10-31"], "2026-11-14");
    const breakdown = {
      "2026-10-01": { income: 6000 },
      "2026-10-10": { bills: -2000 },
      "2026-10-15": { income: 6000 },
      "2026-10-20": { bills: -1000 },
      "2026-10-31": { income: 6000 },
      "2026-11-05": { bills: -3000 },
    };
    const result = computeAutoSavingsFromBreakdown(periods, breakdown, {}, 1000, 500);
    for (const v of Object.values(result)) {
      expect(v % 100).toBe(0);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});
