# 02: Status: computeStatus + status stamp component + horizon strip component

**What to build:** The shared status logic and the two Libreta-styled visual building blocks that both the Today and Plan screens will reuse as-is, rather than each re-deriving their own version.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A pure `computeStatus(balance, safetyBuffer)` function returns `Short` (balance below zero), `Low` (zero or above but below the safety buffer), or `OK` (at or above it), with tests covering both boundaries exactly.
- [ ] A status stamp component renders one of the three states with its text label always visible — OK / Low / Short — never color alone, using the Libreta design tokens (ADR 0006) and meeting the same AA-contrast requirements as the rest of the palette.
- [ ] A horizon strip component takes a period's start/end and a "today" date and renders a marker at today's position within that range; when today falls outside the given range, it renders nothing, so a past or future period never shows a stray marker.
- [ ] Both components are generic enough that the Today screen and the Plan screen's current-period card can each use the same implementation with no screen-specific fork.
