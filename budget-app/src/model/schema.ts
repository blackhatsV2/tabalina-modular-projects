import { z } from "zod";

/** Centavos: an integer count, never a float. Shared by every money field in the schema. */
const centavos = z.number().int();

const dayOfMonth = z.union([z.number().int().min(1).max(31), z.literal("last")]);

const monthlyRuleSchema = z.object({ type: z.literal("monthly"), day: dayOfMonth });
const semiMonthlyRuleSchema = z.object({
  type: z.literal("semiMonthly"),
  days: z.tuple([dayOfMonth, dayOfMonth]),
});
const weeklyRuleSchema = z.object({ type: z.literal("weekly"), weekday: z.number().int().min(0).max(6) });
const biweeklyRuleSchema = z.object({
  type: z.literal("biweekly"),
  weekday: z.number().int().min(0).max(6),
  anchor: z.string(),
});
const customRuleSchema = z.object({ type: z.literal("custom"), dates: z.array(z.string()) });

/** Shared by `periodSchedule` (core) and every income source's `schedule`. */
export const payScheduleRuleSchema = z.discriminatedUnion("type", [
  monthlyRuleSchema,
  semiMonthlyRuleSchema,
  weeklyRuleSchema,
  biweeklyRuleSchema,
  customRuleSchema,
]);

const currencySchema = z.object({
  code: z.string().min(1),
  symbol: z.string().min(1),
  decimalDigits: z.number().int().min(0),
});

const metaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  currency: currencySchema,
  planStart: z.string(),
  planEnd: z.string(),
  updatedAt: z.string(),
  deviceId: z.string().optional(),
  lastSyncedAt: z.string().optional(),
});

const accountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["cash", "gcash", "bank", "other"]),
  startingBalance: centavos,
});

const savingsGoalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetAmount: centavos,
  targetDate: z.string().optional(),
  kind: z.enum(["emergency", "general"]).optional(),
});

const periodOverrideSchema = z.object({
  savings: centavos.optional(),
  extra: centavos.optional(),
});

const actualEntrySchema = z.object({
  amount: centavos,
  note: z.string().optional(),
});

/**
 * Core fields: always present, strictly validated. A profile with an invalid core field is
 * rejected entirely (see src/model/parse.ts). `modules` is accepted here as an opaque,
 * unvalidated blob — each module's own schema validates its own section at simulate() time.
 */
export const profileSchema = z.object({
  schemaVersion: z.literal(1),
  meta: metaSchema,
  accounts: z.array(accountSchema),
  periodSchedule: payScheduleRuleSchema,
  savingsGoals: z.array(savingsGoalSchema),
  safetyBuffer: centavos,
  periodOverrides: z.record(z.string(), periodOverrideSchema),
  actuals: z.record(z.string(), actualEntrySchema),
  paid: z.record(z.string(), z.literal(true)),
  modules: z.record(z.string(), z.unknown()).optional().default({}),
});

export type Profile = z.infer<typeof profileSchema>;
export type Account = z.infer<typeof accountSchema>;
export type SavingsGoal = z.infer<typeof savingsGoalSchema>;
export type PeriodOverride = z.infer<typeof periodOverrideSchema>;
export type ActualEntry = z.infer<typeof actualEntrySchema>;
export type Currency = z.infer<typeof currencySchema>;
export type ProfileMeta = z.infer<typeof metaSchema>;
