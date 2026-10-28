# 06: Storage module — autosave, snapshots, safe recovery, and the profile store

**What to build:** The persistence layer every screen reads and writes the active profile through, plus the thin store wiring it to React — the second confirmed testing seam for this stage.

**Blocked by:** 01 (test fixtures should exercise the final `actuals` shape, not the one being replaced).

**Status:** ready-for-agent

- [ ] Load/save functions wrap the existing Stage 1 parser (`parseProfile`) against `idb-keyval`; tests run against `fake-indexeddb`.
- [ ] Edits autosave roughly 800ms after the last change.
- [ ] Backgrounding the app (`visibilitychange` / the Capacitor app-state-change equivalent) triggers an immediate save, independent of the debounce timer.
- [ ] The last 5 saved versions are retained as snapshots in storage separate from the live profile key, pruned oldest-first.
- [ ] A corrupted or otherwise invalid saved profile leaves the raw file untouched, loads the most recent good snapshot instead, and reports that this happened, so the UI can tell the user plainly.
- [ ] A profile with one broken module section loads with that module disabled rather than failing the whole load — confirming Stage 1's existing per-module isolation is surfaced correctly by this layer, not re-testing that isolation logic itself.
- [ ] A thin zustand store exposes the active profile and these operations as the one shared way to read and save a profile; no screen talks to `idb-keyval` directly.
