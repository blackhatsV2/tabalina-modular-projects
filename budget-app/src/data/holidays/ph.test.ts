import { describe, expect, it } from "vitest";
import { z } from "zod";
import phHolidays from "./ph.json";

const holidaySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), name: z.string().min(1) });

describe("src/data/holidays/ph.json", () => {
  it("is a reusable, plain-data array shaped exactly like modules.commute.holidays items", () => {
    const result = z.array(holidaySchema).safeParse(phHolidays);
    expect(result.success).toBe(true);
  });

  it("has no duplicate dates", () => {
    const dates = phHolidays.map((h) => h.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("is sorted chronologically", () => {
    const dates = phHolidays.map((h) => h.date);
    expect(dates).toEqual([...dates].sort());
  });
});
