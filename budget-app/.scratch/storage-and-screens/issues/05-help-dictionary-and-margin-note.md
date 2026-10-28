# 05: Help dictionary and margin-note ⓘ component

**What to build:** The single source of plain-language explanations and the ⓘ affordance that renders them next to whatever they explain, plus the breakdown-rendering "explain this number" behavior.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A hand-authored help dictionary holds one entry per label/setting/computed-amount term, worded consistently with `GLOSSARY.md` and the workbook's own glossary (`reference/build_budget.py`'s `G` dict) — not a build-time scrape of that file.
- [ ] A margin-note component renders a dictionary entry inline beneath the row it explains below 768px wide, and connected by a leader line out to the margin at or above it.
- [ ] Tapping a computed total renders the breakdown already returned for it (e.g. "₱2,811 start + ₱6,000 pay − ₱5,755.54 bills − ₱490 living = ₱2,565.46 left") by formatting existing data — no separate recomputation path.
- [ ] A coverage test fails if any ⓘ key referenced anywhere has no matching dictionary entry.
