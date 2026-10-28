# 03: App shell — responsive navigation and routing

**What to build:** The actual app entry point and the responsive navigation shell every screen will render inside — the first ticket that makes the app buildable and runnable at all.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] An app entry point exists, mounts the app, and `npm run build` succeeds from this ticket onward (it currently fails: `index.html` already references an entry module that doesn't exist yet).
- [ ] The design tokens (`src/styles/tokens.css`) and the self-hosted fonts (`@fontsource/fraunces`, `@fontsource/ibm-plex-sans`) are loaded once at the app root.
- [ ] Light/dark mode follows the system `prefers-color-scheme` setting; no manual toggle yet (per ADR 0006 — the `[data-theme]` override hook exists in the tokens for later, but no UI drives it in this ticket).
- [ ] All 9 navigation destinations are reachable via real `react-router-dom` routes: Today, Plan, and Days render a simple placeholder for now (replaced ticket-by-ticket as 08–10 land); Reports, Bills & loans, Setup, Settings, Backup & sync, and Help render a "coming soon" stub.
- [ ] Below 768px wide, navigation renders as a bottom tab bar; at or above it, as a sidebar.
- [ ] Every nav tap target is at least 44px, and the layout works at 360px wide.
