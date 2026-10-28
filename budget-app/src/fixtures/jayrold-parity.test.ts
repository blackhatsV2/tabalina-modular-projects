import { describe, expect, it } from "vitest";
import jayroldProfileRaw from "../../fixtures/jayrold-profile.json";
import ledgerData from "../../reference/ledger.json";
import { simulate } from "../engine/core/simulate";
import { parseProfile } from "../model/parse";

interface Ledger {
  /** [periodNumber, startISO, endISO, days, payPesos, billsPesos, livingPesos, savingsPesos, closingPesos] */
  sim: [number, string, string, number, number, number, number, number, number][];
  /** [dateISO, rides, livingCostPesos, plannedBalancePesos, savingsBalancePesos] */
  ledger: [string, number, number, number, number][];
}

const ledger = ledgerData as unknown as Ledger;

/**
 * Converts `reference/ledger.json`'s peso-float amounts (Python's output, round-tripped
 * through JSON) into integer centavos. This is a test-only boundary with external legacy
 * data, not engine arithmetic — ADR 0001's "never float for money" rule is about every
 * amount the engine itself computes or stores, which stays integer centavos throughout;
 * `Math.round` here just undoes JSON's float representation of an already centavo-precise
 * number, the same way parsing a decimal string off a form would.
 */
function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

/**
 * Builds the exact periodOverrides.savings Jayrold's original Python script computed for
 * every pay period (reference/build_budget.py's `sim`), so this test isolates the one thing
 * it's meant to check — that the general engine's day-by-day arithmetic matches
 * reference/ledger.json to the centavo — from the (deliberately different, general-purpose)
 * auto-savings algorithm covered by ticket 12.
 */
function withHistoricalSavingsOverrides(profile: typeof jayroldProfileRaw): typeof jayroldProfileRaw {
  const periodOverrides: Record<string, { savings: number }> = {};
  for (const row of ledger.sim) {
    const [, startISO, , , , , , savingsPesos] = row;
    periodOverrides[startISO] = { savings: pesosToCentavos(savingsPesos) };
  }
  return { ...profile, periodOverrides };
}

describe("Jayrold's centavo parity test", () => {
  const profileWithHistoricalSavings = withHistoricalSavingsOverrides(jayroldProfileRaw);
  const parsed = parseProfile(profileWithHistoricalSavings);
  if (!parsed.success) throw new Error(`fixture failed to parse: ${parsed.error.message}`);
  const result = simulate(parsed.profile);

  it("carries zero warnings", () => {
    expect(result.warnings).toEqual([]);
  });

  it("matches reference/ledger.json's planned balance to the centavo for every day of the plan", () => {
    expect(result.days).toHaveLength(ledger.ledger.length);
    const mismatches: string[] = [];
    for (const [date, , , plannedBalancePesos] of ledger.ledger) {
      const day = result.days.find((d) => d.date === date);
      if (!day) {
        mismatches.push(`${date}: missing from simulate() result`);
        continue;
      }
      const expected = pesosToCentavos(plannedBalancePesos);
      if (day.end !== expected) {
        mismatches.push(`${date}: expected ${expected}, got ${day.end} (diff ${day.end - expected})`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("holds the breakdown-sums-to-total invariant for every day and every period of the real plan", () => {
    for (const day of result.days) {
      const sum = Object.values(day.breakdown).reduce((a, b) => a + b, 0);
      expect(day.start + sum).toBe(day.end);
    }
    for (const period of result.periods) {
      const sum = Object.values(period.breakdown).reduce((a, b) => a + b, 0);
      expect(period.startBalance + sum).toBe(period.endBalance);
    }
  });
});
