import { describe, expect, it } from "vitest";
import {
  addCentavos,
  divideCentavosEvenly,
  floorToMultiple,
  multiplyCentavos,
  subtractCentavos,
  sumCentavos,
} from "./money";

describe("money (integer centavos)", () => {
  it("adds without floating point drift", () => {
    expect(addCentavos(272646, 5346)).toBe(277992);
    expect(addCentavos(1, 2, 3, 4)).toBe(10);
    expect(addCentavos()).toBe(0);
  });

  it("subtracts", () => {
    expect(subtractCentavos(1000, 346)).toBe(654);
    expect(subtractCentavos(100, 300)).toBe(-200);
  });

  it("multiplies an amount by an integer count", () => {
    expect(multiplyCentavos(2000, 3)).toBe(6000);
    expect(multiplyCentavos(0, 5)).toBe(0);
  });

  it("rejects a non-integer count when multiplying", () => {
    expect(() => multiplyCentavos(2000, 1.5)).toThrow();
  });

  it("sums a list of centavos", () => {
    expect(sumCentavos([100, 200, 300])).toBe(600);
    expect(sumCentavos([])).toBe(0);
  });

  it("divides evenly, putting the remainder on the last installment", () => {
    // 823262 / 8 does not divide evenly: 102907 * 8 = 823256, remainder 6
    expect(divideCentavosEvenly(823262, 8)).toEqual([
      102907, 102907, 102907, 102907, 102907, 102907, 102907, 102913,
    ]);
  });

  it("divides evenly when it already divides cleanly", () => {
    expect(divideCentavosEvenly(600, 3)).toEqual([200, 200, 200]);
  });

  it("rejects dividing into zero or negative installments", () => {
    expect(() => divideCentavosEvenly(100, 0)).toThrow();
    expect(() => divideCentavosEvenly(100, -1)).toThrow();
  });

  it("floors to the nearest multiple, never going negative past zero", () => {
    expect(floorToMultiple(250, 100)).toBe(200);
    expect(floorToMultiple(199, 100)).toBe(100);
    expect(floorToMultiple(-50, 100)).toBe(-100);
    expect(floorToMultiple(0, 100)).toBe(0);
  });
});
