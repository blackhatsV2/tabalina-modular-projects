# 07: Spending-entry editor component

**What to build:** The one add/edit/delete UI for a day's list of spending entries, shared by the Today screen's quick-log and the Days screen — built once so neither screen re-implements it.

**Blocked by:** 01 (operates on the spending-entry-list shape).

**Status:** ready-for-agent

- [ ] Given a date and its current entries, the component supports adding a new entry (amount, optional note, optional category), editing any existing entry, and deleting any entry.
- [ ] The component itself enforces no date restriction of its own — callers (Today, Days) decide which dates may be opened for editing.
- [ ] The displayed total for the day is always the sum of the current entries, recomputed on every change, never a separately tracked value.
