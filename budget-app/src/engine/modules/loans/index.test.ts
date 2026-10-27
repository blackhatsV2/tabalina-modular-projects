import { describe, expect, it } from "vitest";
import type { Profile } from "../../../model/schema";
import { simulate } from "../../core/simulate";
import { billsModule } from "../bills";
import { incomeModule } from "../income";
import { eraseModule } from "../types";
import { computeLoanPayoff, expandLoanInstallments, loansModule } from "./index";

const range = { start: "2026-10-27", end: "2027-06-30" };

describe("expandLoanInstallments (amount x N months entry convenience)", () => {
  it("expands a total divided evenly into N monthly installments", () => {
    expect(expandLoanInstallments(600, 3, "2027-01-01")).toEqual([
      { date: "2027-01-01", amount: 200 },
      { date: "2027-02-01", amount: 200 },
      { date: "2027-03-01", amount: 200 },
    ]);
  });

  it("puts the remainder on the final installment when the total doesn't divide evenly", () => {
    expect(expandLoanInstallments(823262, 8, "2026-11-06")).toEqual([
      { date: "2026-11-06", amount: 102907 },
      { date: "2026-12-06", amount: 102907 },
      { date: "2027-01-06", amount: 102907 },
      { date: "2027-02-06", amount: 102907 },
      { date: "2027-03-06", amount: 102907 },
      { date: "2027-04-06", amount: 102907 },
      { date: "2027-05-06", amount: 102907 },
      { date: "2027-06-06", amount: 102913 },
    ]);
  });

  it("clamps a short month the same way monthly recurrence does", () => {
    expect(expandLoanInstallments(200, 2, "2027-01-31")).toEqual([
      { date: "2027-01-31", amount: 100 },
      { date: "2027-02-28", amount: 100 },
    ]);
  });
});

describe("loans module contribute()", () => {
  it("lands each explicit installment on its own date", () => {
    const result = loansModule.contribute(
      {
        enabled: true,
        items: [
          {
            id: "gloan1",
            name: "Gloan 1",
            provider: "GLoan",
            startDate: "2026-11-06",
            installments: [
              { date: "2026-11-06", amount: 102908 },
              { date: "2026-12-06", amount: 102908 },
            ],
          },
        ],
      },
      range,
    );
    expect(result.breakdown["2026-11-06"].loans).toBe(-102908);
    expect(result.breakdown["2026-12-06"].loans).toBe(-102908);
  });

  it("lands fee lines as their own dated cost, separate from the installment", () => {
    const result = loansModule.contribute(
      {
        enabled: true,
        items: [
          {
            id: "spaylater",
            name: "SPayLater",
            provider: "SPayLater",
            startDate: "2026-12-05",
            installments: [{ date: "2026-12-05", amount: 267298 }],
            feeLines: [{ date: "2026-12-05", amount: 5346, note: "possible handling fee" }],
          },
        ],
      },
      range,
    );
    expect(result.breakdown["2026-12-05"].loans).toBe(-267298 - 5346);
  });
});

describe("computeLoanPayoff", () => {
  it("computes paid vs remaining only from the paid map, never from today's date", () => {
    const section = {
      enabled: true,
      items: [
        {
          id: "gloan1",
          name: "Gloan 1",
          provider: "GLoan",
          startDate: "2026-11-06",
          installments: [
            { date: "2026-11-06", amount: 102908 },
            { date: "2026-12-06", amount: 102908 },
            { date: "2027-01-06", amount: 102906 },
          ],
        },
      ],
    };
    const paid = { "gloan1:2026-11-06": true as const };
    const payoff = computeLoanPayoff(section, paid);
    expect(payoff).toEqual([{ loanId: "gloan1", paid: 102908, remaining: 102908 + 102906 }]);
  });

  it("counts fee lines in payoff too, keyed separately from the installment on the same date", () => {
    const section = {
      enabled: true,
      items: [
        {
          id: "spaylater",
          name: "SPayLater",
          provider: "SPayLater",
          startDate: "2026-12-05",
          installments: [{ date: "2026-12-05", amount: 267298 }],
          feeLines: [{ date: "2026-12-05", amount: 5346 }],
        },
      ],
    };
    const paid = { "spaylater:2026-12-05": true as const };
    const payoff = computeLoanPayoff(section, paid);
    // The installment is marked paid; the fee line (separate key) is not.
    expect(payoff).toEqual([{ loanId: "spaylater", paid: 267298, remaining: 5346 }]);
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
      planEnd: "2026-12-31",
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

describe("real-module fault isolation: income, bills, and loans together", () => {
  it("a deliberately invalid loans section still leaves income and bills correct, with exactly one warning", () => {
    const result = simulate(
      baseProfile({
        modules: {
          income: {
            enabled: true,
            sources: [
              { id: "salary", name: "Salary", kind: "salary", amount: 600000, schedule: { type: "monthly", day: 1 } },
            ],
          },
          bills: {
            enabled: true,
            items: [
              { id: "rent", name: "Rent", category: "Rent", amount: 200000, recurrence: { type: "monthly", day: 1 } },
            ],
          },
          loans: { enabled: true, items: "not an array" },
        },
      }),
      [eraseModule(incomeModule), eraseModule(billsModule), eraseModule(loansModule)],
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/loans/);
    const dec1 = result.days.find((d) => d.date === "2026-12-01")!;
    expect(dec1.breakdown.income).toBe(600000);
    expect(dec1.breakdown.bills).toBe(-200000);
    expect(dec1.breakdown.loans).toBeUndefined();
  });

  it("a loans module that throws during computation excludes only loans, with one warning", () => {
    const throwingLoans = {
      ...loansModule,
      contribute: () => {
        throw new Error("loans computation exploded");
      },
    };
    const result = simulate(
      baseProfile({
        modules: {
          income: {
            enabled: true,
            sources: [
              { id: "salary", name: "Salary", kind: "salary", amount: 600000, schedule: { type: "monthly", day: 1 } },
            ],
          },
          bills: {
            enabled: true,
            items: [
              { id: "rent", name: "Rent", category: "Rent", amount: 200000, recurrence: { type: "monthly", day: 1 } },
            ],
          },
          loans: {
            enabled: true,
            items: [
              {
                id: "gloan1",
                name: "Gloan 1",
                provider: "GLoan",
                startDate: "2026-11-06",
                installments: [{ date: "2026-11-06", amount: 102908 }],
              },
            ],
          },
        },
      }),
      [eraseModule(incomeModule), eraseModule(billsModule), eraseModule(throwingLoans)],
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/loans/);
    const dec1 = result.days.find((d) => d.date === "2026-12-01")!;
    expect(dec1.breakdown.income).toBe(600000);
    expect(dec1.breakdown.bills).toBe(-200000);
    const nov6 = result.days.find((d) => d.date === "2026-11-06")!;
    expect(nov6.breakdown.loans).toBeUndefined();
  });
});
