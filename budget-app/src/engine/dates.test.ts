import { describe, expect, it } from "vitest";
import { enumerateDays, expandRecurrence } from "./dates";

describe("expandRecurrence", () => {
  it("expands a monthly rule on a fixed day", () => {
    expect(
      expandRecurrence({ type: "monthly", day: 1 }, { start: "2026-11-01", end: "2027-02-28" }),
    ).toEqual(["2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01"]);
  });

  it("resolves 'last' day of the month for February in a leap year and a non-leap year", () => {
    // 2028 is a leap year (Feb has 29 days); 2027 is not (28 days).
    expect(
      expandRecurrence({ type: "monthly", day: "last" }, { start: "2027-02-01", end: "2027-02-28" }),
    ).toEqual(["2027-02-28"]);
    expect(
      expandRecurrence({ type: "monthly", day: "last" }, { start: "2028-02-01", end: "2028-02-29" }),
    ).toEqual(["2028-02-29"]);
  });

  it("clamps the 31st to the last real day of a 30-day month", () => {
    expect(
      expandRecurrence({ type: "monthly", day: 31 }, { start: "2026-11-01", end: "2026-11-30" }),
    ).toEqual(["2026-11-30"]);
  });

  it("expands semi-monthly [15, 'last'] over a multi-month range", () => {
    expect(
      expandRecurrence(
        { type: "semiMonthly", days: [15, "last"] },
        { start: "2026-10-27", end: "2026-12-31" },
      ),
    ).toEqual([
      "2026-10-31",
      "2026-11-15",
      "2026-11-30",
      "2026-12-15",
      "2026-12-31",
    ]);
  });

  it("expands a weekly rule", () => {
    // weekday 0 = Sunday in this engine's convention.
    expect(
      expandRecurrence({ type: "weekly", weekday: 0 }, { start: "2026-10-27", end: "2026-11-16" }),
    ).toEqual(["2026-11-01", "2026-11-08", "2026-11-15"]);
  });

  it("expands a biweekly rule anchored on a given date", () => {
    expect(
      expandRecurrence(
        { type: "biweekly", weekday: 1, anchor: "2026-11-02" },
        { start: "2026-11-01", end: "2026-12-15" },
      ),
    ).toEqual(["2026-11-02", "2026-11-16", "2026-11-30", "2026-12-14"]);
  });

  it("rejects a biweekly anchor that doesn't fall on the stated weekday", () => {
    expect(() =>
      expandRecurrence(
        { type: "biweekly", weekday: 1, anchor: "2026-11-03" },
        { start: "2026-11-01", end: "2026-12-15" },
      ),
    ).toThrow();
  });

  it("expands custom dates, filtered and sorted to the range", () => {
    expect(
      expandRecurrence(
        { type: "custom", dates: ["2027-03-10", "2026-11-01", "2028-01-01"] },
        { start: "2026-10-27", end: "2027-12-31" },
      ),
    ).toEqual(["2026-11-01", "2027-03-10"]);
  });

  it("expands a yearly rule", () => {
    expect(
      expandRecurrence(
        { type: "yearly", month: 10, day: 15 },
        { start: "2026-10-27", end: "2027-12-31" },
      ),
    ).toEqual(["2027-10-15"]);
  });

  it("expands a once rule to exactly one occurrence, or none if outside the range", () => {
    expect(
      expandRecurrence({ type: "once", date: "2027-10-15" }, { start: "2026-10-27", end: "2027-12-31" }),
    ).toEqual(["2027-10-15"]);
    expect(
      expandRecurrence({ type: "once", date: "2026-01-01" }, { start: "2026-10-27", end: "2027-12-31" }),
    ).toEqual([]);
  });

  it("expands a daily rule across the whole range", () => {
    expect(expandRecurrence({ type: "daily" }, { start: "2026-10-27", end: "2026-10-29" })).toEqual([
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
    ]);
  });

  it("never shifts a date by a day due to local timezone handling", () => {
    // Every date produced is a plain UTC-calculated ISO string; round-tripping through
    // expandRecurrence with a single-day range must return exactly that day.
    const dates = expandRecurrence({ type: "monthly", day: "last" }, { start: "2026-02-01", end: "2026-02-28" });
    expect(dates).toEqual(["2026-02-28"]);
  });
});

describe("enumerateDays", () => {
  it("lists every ISO date in an inclusive range", () => {
    expect(enumerateDays({ start: "2026-10-27", end: "2026-10-30" })).toEqual([
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
    ]);
  });

  it("returns a single day when start equals end", () => {
    expect(enumerateDays({ start: "2026-10-27", end: "2026-10-27" })).toEqual(["2026-10-27"]);
  });
});
