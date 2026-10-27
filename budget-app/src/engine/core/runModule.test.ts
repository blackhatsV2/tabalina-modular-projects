import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { ModuleDefinition } from "../modules/types";
import { runModule } from "./runModule";

const range = { start: "2026-10-27", end: "2026-10-30" };

const throwingModule: ModuleDefinition<{ enabled: boolean }> = {
  name: "throws",
  schema: z.object({ enabled: z.boolean() }),
  contribute: () => {
    throw new Error("boom");
  },
};

const invalidSchemaModule: ModuleDefinition<{ enabled: boolean; mustHave: string }> = {
  name: "invalid",
  schema: z.object({ enabled: z.boolean(), mustHave: z.string() }),
  contribute: () => ({ breakdown: {} }),
};

const workingModule: ModuleDefinition<{ enabled: boolean; amount: number }> = {
  name: "working",
  schema: z.object({ enabled: z.boolean(), amount: z.number() }),
  contribute: (section, r) => ({
    breakdown: { [r.start]: { working: section.amount } },
  }),
};

describe("runModule", () => {
  it("contributes nothing and warns nothing when the section is absent", () => {
    const outcome = runModule(workingModule, undefined, range);
    expect(outcome.contribution).toEqual({ breakdown: {} });
    expect(outcome.warning).toBeUndefined();
  });

  it("contributes nothing and warns nothing when the module is disabled", () => {
    const outcome = runModule(workingModule, { enabled: false, amount: 999 }, range);
    expect(outcome.contribution).toEqual({ breakdown: {} });
    expect(outcome.warning).toBeUndefined();
  });

  it("contributes the module's real output when enabled and valid", () => {
    const outcome = runModule(workingModule, { enabled: true, amount: 500 }, range);
    expect(outcome.contribution).toEqual({ breakdown: { "2026-10-27": { working: 500 } } });
    expect(outcome.warning).toBeUndefined();
  });

  it("excludes the module and warns once when its data fails its own schema", () => {
    const outcome = runModule(invalidSchemaModule, { enabled: true }, range);
    expect(outcome.contribution).toEqual({ breakdown: {} });
    expect(outcome.warning).toMatch(/invalid/i);
  });

  it("excludes the module and warns once when its contribute() throws", () => {
    const outcome = runModule(throwingModule, { enabled: true }, range);
    expect(outcome.contribution).toEqual({ breakdown: {} });
    expect(outcome.warning).toMatch(/throws/i);
  });
});
