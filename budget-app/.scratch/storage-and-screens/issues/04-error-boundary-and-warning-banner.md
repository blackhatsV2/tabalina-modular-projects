# 04: Error boundary and module-warning banner components

**What to build:** The two reusable resilience primitives every screen will wrap its widgets and simulation result in — demoed here against synthetic test widgets, not yet wired into a real screen.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A reusable per-widget error boundary shows an inline fallback card with a plain message and a "try again" action when the wrapped widget throws.
- [ ] "Try again" remounts only that one widget, not the whole screen.
- [ ] A test proves that when one widget (wrapped in its own boundary) throws, sibling widgets on the same screen, each wrapped in their own boundary, continue to render normally — the actual claim the design makes, not just "a boundary exists."
- [ ] A separate warnings banner component renders the engine's `simulation.warnings` (e.g. "Loans couldn't be calculated: totals exclude them"), visually and structurally distinct from the crash fallback above — it renders data the engine returned, never a caught exception.
- [ ] Both components are generic: no screen-specific logic lives inside either one.
