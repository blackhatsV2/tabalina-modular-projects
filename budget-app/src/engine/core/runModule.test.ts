import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { ModuleDefinition } from "../modules/types";
import { runModule, runModuleContribute } from "./runModule";

const range = { start: "2026-10-27", end: "2026-10-30" };

const throwingModule: ModuleDefinition<{ enabled: boolean }> = {
  name: "throws",
  schema: z.object({ enabled: z.boolean() }),
  contribute: () => {
    throw new Error("boom");
  },
};

const badOutputModule: ModuleDefinition<{ enabled: boolean }> = {
  name: "badOutput",
  schema: z.object({ enabled: z.boolean() }),
  // Returns a non-integer amount — valid input, but the contribution itself is malformed.
  contribute: (_section, r) => ({ breakdown: { [r.start]: { oops: 12.5 } } }),
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

  it("excludes the module and warns once when contribute() returns data failing its own output shape", () => {
    const outcome = runModule(badOutputModule, { enabled: true }, range);
    expect(outcome.contribution).toEqual({ breakdown: {} });
    expect(outcome.warning).toMatch(/badOutput/i);
  });
});

describe("runModuleContribute with a label", () => {
  it("distinguishes a secondary run's warning from the module's normal name", () => {
    const outcome = runModuleContribute(
      throwingModule,
      throwingModule.contribute,
      { enabled: true },
      range,
      "auto-savings sizing",
    );
    expect(outcome.name).toBe("throws (auto-savings sizing)");
    expect(outcome.warning).toMatch(/throws \(auto-savings sizing\)/);
  });

  it("runs a different contribute-shaped function than the module's own", () => {
    const alternate = () => ({ breakdown: { "2026-10-27": { alt: 42 } } });
    const outcome = runModuleContribute(workingModule, alternate, { enabled: true, amount: 1 }, range);
    expect(outcome.contribution).toEqual({ breakdown: { "2026-10-27": { alt: 42 } } });
  });
});
