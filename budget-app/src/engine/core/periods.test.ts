import { describe, expect, it } from "vitest";
import { computePeriods } from "./periods";

describe("computePeriods", () => {
  it("builds pay-period boundaries from periodSchedule, independent of any income module", () => {
    const periods = computePeriods(
      { type: "semiMonthly", days: [15, "last"] },
      "2026-10-27",
      "2026-12-31",
    );
    expect(periods).toEqual([
      { start: "2026-10-27", end: "2026-10-30" },
      { start: "2026-10-31", end: "2026-11-14" },
      { start: "2026-11-15", end: "2026-11-29" },
      { start: "2026-11-30", end: "2026-12-14" },
      { start: "2026-12-15", end: "2026-12-30" },
      { start: "2026-12-31", end: "2026-12-31" },
    ]);
  });

  it("produces a single period spanning the whole plan when the schedule never fires inside it", () => {
    const periods = computePeriods({ type: "monthly", day: 1 }, "2026-10-02", "2026-10-31");
    expect(periods).toEqual([{ start: "2026-10-02", end: "2026-10-31" }]);
  });

  it("never produces a zero-length leading period when a payday lands exactly on planStart", () => {
    const periods = computePeriods({ type: "monthly", day: 1 }, "2026-11-01", "2026-12-31");
    expect(periods).toEqual([
      { start: "2026-11-01", end: "2026-11-30" },
      { start: "2026-12-01", end: "2026-12-31" },
    ]);
  });
});
