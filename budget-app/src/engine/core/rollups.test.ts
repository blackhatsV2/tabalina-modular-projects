import { describe, expect, it } from "vitest";
import type { Profile } from "../../model/schema";
import { simulate, type DayResult } from "./simulate";
import { computeMonthlyRollup, computeWeeklyRollup } from "./rollups";

function day(date: string, start: number, breakdown: Record<string, number>): DayResult {
  const end = start + Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { date, start, end, breakdown };
}

describe("computeWeeklyRollup", () => {
  it("aggregates income/bills/living/savings across Monday-Sunday weeks, including a partial first/last week", () => {
    // 2026-10-27 is a Tuesday, so the first week is partial (Tue..Sun = 6 days).
    const days: DayResult[] = [
      day("2026-10-27", 1000, { income: 500 }),
      day("2026-10-28", 1500, {}),
      day("2026-10-29", 1500, {}),
      day("2026-10-30", 1500, {}),
      day("2026-10-31", 1500, { income: 600000 }),
      day("2026-11-01", 601500, { bills: -200000 }),
      // second week starts Monday Nov 2
      day("2026-11-02", 401500, { flexibleExpenses: -1000 }),
      day("2026-11-03", 400500, {}),
    ];
    const weeks = computeWeeklyRollup(days);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].start).toBe("2026-10-27");
    expect(weeks[0].end).toBe("2026-11-01");
    expect(weeks[0].breakdown.income).toBe(500 + 600000);
    expect(weeks[0].breakdown.bills).toBe(-200000);
    expect(weeks[0].startBalance).toBe(1000);
    expect(weeks[0].endBalance).toBe(401500);

    expect(weeks[1].start).toBe("2026-11-02");
    expect(weeks[1].end).toBe("2026-11-03");
    expect(weeks[1].breakdown.flexibleExpenses).toBe(-1000);
  });

  it("every week's total for a term equals the sum of its days' values for that term", () => {
    const days: DayResult[] = [
      day("2026-11-02", 0, { income: 100 }),
      day("2026-11-03", 100, { income: 200 }),
      day("2026-11-04", 300, { bills: -50 }),
    ];
    const weeks = computeWeeklyRollup(days);
    expect(weeks).toHaveLength(1);
    const expectedIncome = days.reduce((sum, d) => sum + (d.breakdown.income ?? 0), 0);
    expect(weeks[0].breakdown.income).toBe(expectedIncome);
  });

  it("works with no breakdown terms at all (every module disabled)", () => {
    const days: DayResult[] = [day("2026-11-02", 500, {}), day("2026-11-03", 500, {})];
    const weeks = computeWeeklyRollup(days);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].breakdown).toEqual({});
    expect(weeks[0].startBalance).toBe(500);
    expect(weeks[0].endBalance).toBe(500);
  });
});

describe("computeMonthlyRollup", () => {
  it("aggregates per calendar month, including a partial first/last month", () => {
    const days: DayResult[] = [
      day("2026-10-27", 1000, { income: 500 }),
      day("2026-10-28", 1500, {}),
      day("2026-10-31", 1500, { income: 600000 }),
      day("2026-11-01", 601500, { bills: -200000 }),
      day("2026-11-02", 401500, {}),
    ];
    const months = computeMonthlyRollup(days);
    expect(months).toHaveLength(2);
    expect(months[0].start).toBe("2026-10-27");
    expect(months[0].end).toBe("2026-10-31");
    expect(months[0].breakdown.income).toBe(500 + 600000);
    expect(months[1].start).toBe("2026-11-01");
    expect(months[1].end).toBe("2026-11-02");
    expect(months[1].breakdown.bills).toBe(-200000);
  });
});

describe("roll-ups over a real simulate() result with every module disabled", () => {
  it("still produces a consistent flat roll-up", () => {
    const profile: Profile = {
      schemaVersion: 1,
      meta: {
        id: "p1",
        name: "Test",
        currency: { code: "PHP", symbol: "₱", decimalDigits: 2 },
        planStart: "2026-10-27",
        planEnd: "2026-11-10",
        updatedAt: "2026-10-27T00:00:00.000Z",
      },
      accounts: [{ id: "cash", name: "Cash", kind: "cash", startingBalance: 10000 }],
      periodSchedule: { type: "monthly", day: 1 },
      savingsGoals: [],
      // Equal to the starting balance so auto-savings (ticket 12) computes 0 everywhere —
      // this test is about roll-up aggregation, not savings sizing.
      safetyBuffer: 10000,
      periodOverrides: {},
      actuals: {},
      paid: {},
      modules: {},
    };
    const result = simulate(profile, []);
    const weeks = computeWeeklyRollup(result.days);
    const months = computeMonthlyRollup(result.days);
    for (const bucket of [...weeks, ...months]) {
      expect(bucket.startBalance).toBe(10000);
      expect(bucket.endBalance).toBe(10000);
      expect(bucket.breakdown).toEqual({});
    }
  });
});
