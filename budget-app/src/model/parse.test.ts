import { describe, expect, it } from "vitest";
import { parseProfile } from "./parse";

function validRawProfile(overrides: Record<string, unknown> = {}): unknown {
  return {
    schemaVersion: 1,
    meta: {
      id: "profile-1",
      name: "Jayrold",
      currency: { code: "PHP", symbol: "₱", decimalDigits: 2 },
      planStart: "2026-10-27",
      planEnd: "2027-12-31",
      updatedAt: "2026-10-27T00:00:00.000Z",
    },
    accounts: [
      { id: "cash", name: "Cash", kind: "cash", startingBalance: 30000 },
      { id: "gcash", name: "GCash", kind: "gcash", startingBalance: 273100 },
    ],
    periodSchedule: { type: "semiMonthly", days: [15, "last"] },
    savingsGoals: [],
    safetyBuffer: 50000,
    periodOverrides: {},
    actuals: {},
    paid: {},
    modules: {},
    ...overrides,
  };
}

describe("parseProfile", () => {
  it("parses a valid profile into the expected typed shape", () => {
    const result = parseProfile(validRawProfile());
    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    expect(result.profile.meta.name).toBe("Jayrold");
    expect(result.profile.accounts).toHaveLength(2);
    expect(result.profile.periodSchedule).toEqual({ type: "semiMonthly", days: [15, "last"] });
    expect(result.profile.safetyBuffer).toBe(50000);
  });

  it("pools one or more named starting balances under accounts", () => {
    const result = parseProfile(validRawProfile());
    if (!result.success) throw new Error("expected success");
    const total = result.profile.accounts.reduce((sum, a) => sum + a.startingBalance, 0);
    expect(total).toBe(303100);
  });

  it("rejects a profile entirely when a core field is missing", () => {
    const raw = validRawProfile();
    delete (raw as Record<string, unknown>).safetyBuffer;
    const result = parseProfile(raw);
    expect(result.success).toBe(false);
  });

  it("rejects a profile entirely when a core field has the wrong type", () => {
    const result = parseProfile(validRawProfile({ safetyBuffer: "500" }));
    expect(result.success).toBe(false);
  });

  it("rejects an account missing its own id", () => {
    const result = parseProfile(
      validRawProfile({
        accounts: [{ name: "Cash", kind: "cash", startingBalance: 30000 }],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a malformed periodSchedule", () => {
    const result = parseProfile(validRawProfile({ periodSchedule: { type: "fortnightly" } }));
    expect(result.success).toBe(false);
  });

  it("accepts any periodSchedule shape shared with income schedules (monthly with 'last')", () => {
    const result = parseProfile(validRawProfile({ periodSchedule: { type: "monthly", day: "last" } }));
    expect(result.success).toBe(true);
  });

  it("rejects malformed raw input outright (not an object)", () => {
    expect(parseProfile(null).success).toBe(false);
    expect(parseProfile("not a profile").success).toBe(false);
    expect(parseProfile(42).success).toBe(false);
  });

  it("accepts a modules section as present-but-not-yet-interpreted, even with garbage shapes", () => {
    const result = parseProfile(
      validRawProfile({
        modules: { bills: "this is not a valid bills section", income: 123, loans: null },
      }),
    );
    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    expect(result.profile.modules).toEqual({
      bills: "this is not a valid bills section",
      income: 123,
      loans: null,
    });
  });

  it("defaults modules to an empty object when absent", () => {
    const raw = validRawProfile();
    delete (raw as Record<string, unknown>).modules;
    const result = parseProfile(raw);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    expect(result.profile.modules).toEqual({});
  });
});
