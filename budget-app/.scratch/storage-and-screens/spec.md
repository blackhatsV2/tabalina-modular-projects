# Storage & safety, and the first screens: Today, Plan, Days

Status: ready-for-agent

## Problem Statement

Stage 1 gave Budget Buddy a validated data model and a pure engine, but there's nothing a person can actually use yet: no way to save a profile between sessions, no way to recover from a corrupted save, and no screens to see a plan, log spending, or tell at a glance whether a day or pay period is on track. A first-time budgeter (Jayrold, and people like him) needs to trust that their numbers are right and that their data won't disappear — without being able to audit a save file or a recovery mechanism themselves.

Separately, the engine's `actuals` field currently holds one lump `{amount, note?}` per day, but real spending doesn't happen as one number — fare, lunch, and water get logged separately, as they happen. Forcing every day into a single overwritable figure loses that.

## Solution

Build the storage layer — autosave, snapshots, and safe recovery from a corrupted save, each degrading gracefully rather than losing data or crashing — and the first three screens (Today, Plan, Days) on top of the existing Stage 1 engine, used as-is. Screens render in the "Libreta" visual direction (passbook ledger — see the project's ADR 0006), with an inline ⓘ "margin note" help affordance on every label/number, and a per-widget error boundary so one broken piece of a screen never takes the rest of it down. Also fix the `actuals` gap: a day's actuals becomes a list of independently editable/deletable spending entries (see ADR 0007), summed on read, never cached as a separate total.

No setup wizard, no suggestions engine, no backup/sync/reminders, and no screens beyond Today/Plan/Days are in scope — those are later stages.

## User Stories

1. As a user, I want my profile saved automatically as I edit it, so I never have to remember to hit save.
2. As a user, I want the app to save immediately when I switch away from it or it goes to the background, so a change made right before closing isn't lost.
3. As a user, I want the last 5 versions of my profile kept as snapshots, so I can recover from a bad edit or a corrupted save.
4. As a user whose saved profile fails validation or is corrupted, I want the app to keep the broken file untouched, load my last good snapshot instead, and tell me plainly what happened, so I never lose data or see silently wrong numbers.
5. As a user with one corrupted module section (e.g. loans) in an otherwise fine profile, I want only that module disabled on load, not the whole profile rejected, consistent with how Stage 1's parser already treats module sections independently.
6. As a first-time user with no profile yet, I want a short, friendly form asking only my name, my starting money, and how I'm paid (skippable), so I can get started without being asked about things I don't understand yet.
7. As a first-time user, I want sensible defaults — today as my plan's start, 12 months ahead as its end, PHP as the currency — applied without being asked, so setup stays short.
8. As someone exploring or testing the app, I want a "Load sample profile" option on the first-launch screen, so I can see Today/Plan/Days working against a fully real example (Jayrold's own profile).
9. As a user, I want the app to support exactly one active profile for now, so I'm not confused by a profile switcher I don't need yet.
10. As a budgeter, I want to log each thing I spend (fare, lunch, water) as its own entry with an amount and an optional note, so a day's log matches how I actually spend, not one lump guess.
11. As a budgeter, I want to tag a spending entry with an optional category, so I can group similar spending later.
12. As a budgeter, I want to edit or delete any individual spending entry, so I can correct a mistake without clearing out the whole day.
13. As a budgeter, I want a day's actual total to always be the sum of that day's entries, so it's never out of sync with what I actually logged.
14. As a user, I want to see today's planned spending broken down into its real terms (income, bills, fare, savings, etc.), so I understand where today's number comes from.
15. As a user, I want to log what I spent today directly from the Today screen, so logging doesn't require navigating elsewhere.
16. As a user, I want to see my balance right now, so I know where I stand.
17. As a user, I want to see how many days until my next income arrives, so I can pace my spending.
18. As a user, I want to see which bills are due in the next 7 days, so nothing catches me by surprise.
19. As a user, I want a clear status indicator (OK / Low / Short) for today, so I immediately know whether I'm on track.
20. As a user, I want that status always shown with a text label, not color alone, so it's clear even if I can't distinguish the colors.
21. As a user, I want each part of the Today screen to keep working even if another part breaks, so one bad widget doesn't take down the whole screen.
22. As a user, I want to see each pay period as its own card with status, a breakdown, and a closing balance, so I can check my plan at the period level.
23. As a user, I want to override the automatic savings suggestion for any period, so I stay in control when I know better than the algorithm.
24. As a user, I want to set an extra amount aside for any period, independent of savings, so I can earmark money for something specific.
25. As a user, I want to see exactly where I am within the current pay period, so I have a sense of pacing without checking dates manually.
26. As a user, I want that "where am I" marker to only appear on the current period's card, since past and future periods don't have a "today" to mark.
27. As a user, I want my edits to a period's savings or extra amount reflected immediately in that period's numbers, so I can see the effect of my change right away.
28. As a user, I want to see my days grouped by week, so I can review my plan at a familiar rhythm.
29. As a user, I want to see each day's type, costs, and any bill/income markers, so I understand what's driving that day's number.
30. As a user, I want to log or edit actual spending for today or any past day, so my records stay accurate.
31. As a user, I want to be prevented from logging an actual for a future date, since I haven't spent that money yet.
32. As a first-time budgeter, I want a small ⓘ next to any label or number I don't understand, so I can get a plain-language explanation without leaving the screen.
33. As a first-time budgeter, I want that explanation to appear right next to what it explains — inline below it on my phone, connected by a line on a bigger screen — so I don't lose context switching to a popup.
34. As a first-time budgeter, I want to tap a computed number and see exactly which real figures added up to it, so I can trust the number instead of taking it on faith.
35. As a user, I want the wording in these explanations to match the rest of the app and its glossary, so the language stays consistent everywhere I look.
36. As a user, I want a widget that crashes to show a small "something went wrong, try again" message in its own corner, so the rest of the screen keeps working.
37. As a user, I want a "try again" action on a crashed widget to retry just that widget, so I don't have to reload the whole app over one glitch.
38. As a user, I want a clear message when a whole feature (like loans) couldn't be calculated, separate from any crash message, so I know my numbers are incomplete rather than wrong.
39. As a user, I want the app to look calm and approachable rather than like a corporate finance dashboard, so budgeting feels less intimidating.
40. As a user with low vision or color blindness, I want every status indicator to carry a text label and meet strong contrast standards, so I'm never relying on color alone.
41. As a user in low light, I want a dark mode that follows my device's system setting automatically, so I don't have to think about it.
42. As a user offline or on a slow connection, I want the app's fonts bundled with it rather than fetched from the internet, so the app still looks right with no connection.
43. As a user who increases my device's text size or reduces motion, I want the app to respect those settings, so it stays usable for me.
44. As a user on a small phone screen (as narrow as 360px), I want every tap target big enough to hit reliably (at least 44px), so I don't mis-tap on a cramped layout.
45. As a user on a tablet or desktop, I want the layout to use the extra space (a sidebar instead of a bottom tab bar) rather than just stretching the phone layout, so the app feels native to the device I'm on.

## Implementation Decisions

- **Storage module**: a small set of functions — load the active profile, save it, list the retained snapshots, restore from one — sitting between the existing Stage 1 parser and a thin zustand store. Autosave debounces ~800ms after the last edit. Independently of the debounce, a save is also triggered immediately whenever the app is backgrounded (the page's visibility change, or the Capacitor app-state-change equivalent), so a change right before closing is never lost. The last 5 saved versions are retained as snapshots in storage separate from the live profile, pruned oldest-first.
- **Load-time safety**: on load, the existing Stage 1 `parseProfile` validation runs first. If core validation fails outright, the raw (broken) save is left untouched, the most recent good snapshot is loaded instead, and the result reports that this happened so the UI can tell the user plainly. If only a module section is invalid, Stage 1's own parse-time behavior (treat that section as absent/disabled, not a failed parse) is preserved unchanged — the storage layer doesn't duplicate or override that logic, only surfaces its result.
- **First-launch bootstrap**: when no profile exists yet, a minimal form collects name, starting money (cash/e-wallet/bank; any may be zero), and pay frequency (optional, skippable). `planStart` defaults to today, `planEnd` to 12 months later, and currency to PHP, none of which are asked. A second option on the same screen loads the existing Jayrold example profile fixture unchanged, for exploration/testing — not offered as a starter template for a new user's own data. Both paths end at the same place: a valid profile handed to the storage module's save function.
- **`actuals` becomes a list of spending entries** (ADR 0007): each date maps to a list of `{id, amount, note?, category?}` entries (category is free text, optional, same convention as a bill's category) rather than one `{amount, note?}`. Each entry is independently addressable by its own `id` for editing or deleting. A day's actual total is always the sum of its entries at read time — never a separately stored or cached value. This only touches the model/parser layer; `simulate()` never reads `actuals`, so the engine and its parity test are unaffected.
- **Status computation**: a new pure function, living alongside the existing engine core (not inside any screen), takes a balance and the profile's `safetyBuffer` and returns one of three states — `Short` (balance below zero), `Low` (zero or above but below the buffer), or `OK` (at or above the buffer). Both the Today and Plan screens consume this one function; no screen computes status on its own.
- **Screen view-models**: for each of Today, Plan, and Days, one pure function takes the already-validated `Profile`, the engine's `SimulationResult`, and whatever else that screen needs (today's date, the day's actuals, which period is current) and returns exactly the plain data that screen renders — breakdown lines, status labels, bills-due lists, the current period's "where am I" position, and so on. Screens themselves are thin renderers over their view-model and contain no computation of their own, including the "explain this number" breakdown display, which renders the breakdown the view-model/engine already produced rather than recomputing anything.
- **Navigation shell**: real routes (the existing, previously-unused `react-router-dom` dependency) under a responsive shell — a bottom tab bar under 768px wide, a sidebar at or above it. Today/Plan/Days get real routes and content; the other six destinations from the full navigation (Reports, Bills & loans, Setup, Settings, Backup & sync, Help) get placeholder "coming soon" routes now, so the shell's shape is complete and later stages only need to fill routes in.
- **Help ⓘ / margin notes**: a hand-authored help dictionary (plain-language entries keyed by term, worded consistently with the project's glossary and the original workbook's own glossary) backs every ⓘ affordance. On a screen, an explanation renders as a note attached to the row it explains: inline beneath the row under 768px, connected by a leader line out to the margin at or above it — never a floating tooltip or popover.
- **Error boundaries**: each widget on a screen (for Today: the breakdown, quick-log, balance, days-to-next-income, bills-due list, and status stamp) is individually wrapped. A crashing widget shows a small inline fallback card with a plain message and a "try again" action that remounts only that widget. Each screen also carries one top-level boundary as a backstop in case the simulation call itself throws unexpectedly, rather than one specific widget. This is distinct from the module-exclusion warnings the engine already returns (e.g. "Loans couldn't be calculated") — those aren't crashes, and render as a separate warnings banner reading the simulation result directly.
- **Visual direction**: screens are built against the already-finalized "Libreta" design tokens (ADR 0006) — colors, type, and spacing come from that single token set, never hardcoded per component. Dark mode follows the system setting; no manual toggle UI exists yet (that needs a Settings screen, out of scope here), though the tokens already support one being added later without retouching the palette.
- **New dependencies**: `@testing-library/react` and `@testing-library/jest-dom` (component tests) and `fake-indexeddb` (storage tests) as dev dependencies. `@fontsource/fraunces` and `@fontsource/ibm-plex-sans` (runtime, self-hosted fonts) are already installed.

## Testing Decisions

A good test here asserts on observable behavior — what a view-model returns, what a storage function persists or reports, what text renders — never on internal structure. Screen components in particular should be tested through their view-model's output, not by re-deriving business logic inside a component test.

- **Screen view-models**: one thorough pure-function test suite per screen (Today, Plan, Days), in the same style as the existing engine tests (`periods.test.ts`, `autoSavings.test.ts`, etc.) — no DOM involved.
- **Status function**: a small, thorough pure-function test suite covering the three thresholds and their boundaries (exactly zero, exactly at the buffer).
- **Storage module**, beyond the save/load happy path:
  - A corrupted or otherwise invalid saved profile leaves the raw save untouched, loads the most recent good snapshot, and reports that this happened.
  - Snapshots are pruned to the 5 most recent.
  - Backgrounding the app (simulated visibility-change/app-state-change event) triggers an immediate save independent of the debounce timer.
  - A profile with one broken module section loads with that module disabled rather than failing the whole load (confirming the storage layer surfaces Stage 1's existing per-module isolation correctly — not re-testing that isolation logic itself, which Stage 1 already covers).
  - A fresh install with no profile, taken through the bootstrap form, ends with a valid saved profile that the Today view-model can render; the "Load sample profile" path is covered the same way.
- **Component smoke tests** (`@testing-library/react`, jsdom via a per-file `@vitest-environment` pragma rather than a global environment change, so Stage 1's existing node-environment tests are untouched): each screen renders the right text given a known view-model, and does not crash given an empty/minimal one. One specific test is required per screen that supports it: a widget made to throw shows its own inline "try again" fallback while the other widgets on the same screen still render normally — this is the actual claim the error-boundary design makes, not just "a boundary exists."
- **Help dictionary coverage**: a test asserting every ⓘ key referenced by any screen or view-model has a matching entry in the help dictionary, so a missing explanation is a build-time test failure, not a silent gap discovered later.
- **Ticket ordering**: the `actuals` → spending-entries change (ADR 0007) is its own early ticket, ahead of anything that reads or writes actuals. The existing Jayrold centavo parity test must still pass, unchanged, after that ticket — it's the regression check proving the change is confined to `actuals` and never touches `simulate()`'s inputs.

## Out of Scope

- A profile switcher or support for more than one active profile.
- The full rule-based setup wizard and suggestions engine (build-plan step 4) — only the minimal bootstrap form described above.
- The Reports, Bills & loans, Setup, Settings, Backup & sync, and Help screens — placeholder routes only, no real content.
- The full Help/glossary screen, a first-run walkthrough, and a "turn tips off" setting.
- A manual light/dark toggle UI — the tokens support one, but it needs a Settings screen that doesn't exist yet.
- Backup/export, online sync, and reminder notifications (build-plan steps 7–9).
- Android packaging work (build-plan step 10) beyond whatever the backgrounding-save hook already needs from the Capacitor App plugin.

## Further Notes

- The visual direction is fully specified in ADR 0006 and already implemented as a design-token set (colors, type, spacing), checked against WCAG AA for every pairing actually used.
- The `actuals` schema change is fully specified in ADR 0007.
- `GLOSSARY.md` already carries the vocabulary this stage introduces (spending entry, status stamp, margin note, horizon strip) and a correction to a stale entry describing daily spending as a single either/or mode.
- This spec is expected to be broken into numbered tickets under one feature directory (per the project's local-markdown issue tracker convention), mirroring how Stage 1 bundled its own build-plan steps into `budget-engine-core`; writing those individual tickets is a separate step from this spec.
