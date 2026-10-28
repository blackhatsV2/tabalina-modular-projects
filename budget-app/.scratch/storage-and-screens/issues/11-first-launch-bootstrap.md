# 11: First-launch bootstrap and sample-profile loading

**What to build:** What a brand-new install actually shows before any profile exists.

**Blocked by:** 06, 08

**Status:** ready-for-agent

- [ ] With no saved profile, a short, friendly form asks only for name, starting money (cash/e-wallet/bank, any may be zero), and pay frequency (optional, skippable).
- [ ] `planStart` defaults to today, `planEnd` to 12 months later, and currency to PHP, without asking.
- [ ] Submitting the form saves a valid profile through the store (ticket 06) and lands on a rendering Today screen (ticket 08).
- [ ] A "Load sample profile" option loads the existing Jayrold example fixture unchanged and lands on the same working Today screen — offered for exploration/testing, not as a starter template for the user's own data.
- [ ] Exactly one active profile is supported; no profile-switcher UI exists at this stage.
