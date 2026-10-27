import type { ZodError } from "zod";
import { profileSchema, type Profile } from "./schema";

export type ParseProfileResult = { success: true; profile: Profile } | { success: false; error: ZodError };

/**
 * Parses raw/unknown JSON into a typed Profile. Core fields (meta, accounts, periodSchedule,
 * savingsGoals, safetyBuffer, periodOverrides, actuals, paid) are validated strictly — a
 * profile with an invalid core field is rejected entirely. The `modules` section is accepted
 * as present-but-not-yet-interpreted: each `modules.<name>` section gets its own validation
 * later, at simulate() time, so a malformed module never fails the whole parse.
 */
export function parseProfile(raw: unknown): ParseProfileResult {
  const result = profileSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, profile: result.data };
}
