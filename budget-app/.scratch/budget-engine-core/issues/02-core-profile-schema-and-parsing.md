# 02: Core profile schema & strict parsing

**What to build:** the Profile's core fields as a validated schema, with the two-level parsing behavior (core strict, modules opaque for now) that every later module's own validation will plug into.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A function parses raw/unknown JSON into a typed Profile.
- [ ] Core fields (`meta`, `accounts`, `periodSchedule`, `savingsGoals`, `safetyBuffer`, `periodOverrides`, `actuals`, `paid`) are validated; a profile with an invalid core field is rejected entirely.
- [ ] `accounts` supports one or more named starting balances, pooled into a single spendable total.
- [ ] `periodSchedule` accepts the same `PayScheduleRule` shape used for income schedules, independent of any specific module.
- [ ] A `modules` section is accepted as present-but-not-yet-interpreted — real per-module validation arrives with each module's own ticket.
- [ ] Every item that carries an `id` (accounts now; module items in later tickets) is validated to require one.
