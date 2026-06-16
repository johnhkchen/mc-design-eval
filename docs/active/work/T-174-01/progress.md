# T-174-01 — Progress

## Done

- **Spike runner** `experiments/eval-alignment/articulation-spike.mjs` — one throwaway script, composes the
  existing pure brushes (`quoin`, `eaveOverhang`, `dressOpenings`) over `builds/gatehouse/faithful/
  artifact.json` at varying amplitude/composition; renders each candidate beside the concept (judge-free).
- **Four beside-concept renders** in the work dir:
  - `baseline-beside.png` — token (quoin run=4 hd=1; proud=16). The E-42 "before".
  - `candidateA-beside.png` — grammar: full-height quoins hd2 (proud=120) + eave band(12) + verge(8) + arch(24).
  - `candidateB-beside.png` — pattern-book: bold quoins hd3 (proud=160) + 2-course band(16+8) + string(8) + arch(24).
  - `candidateD-beside.png` — critique: token→deepen(120)→arch(24), no band layer.
- **Glance judged** (renders Read back): see `review.md`. Headline — amplitude is the proven lever
  (token→amplified is the jump); A is the restraint-winner; B's extra string course reads busy; D under-finishes.

## Deviations from plan

- **Built A/B/D in one pass** rather than three separate commits — the script is small, deterministic, and
  cheap; staging it added no value for a throwaway scout. (Plan Steps 1–3 collapsed; verification per-step
  still done: path proved on baseline+A first, then B, then D.)
- **`dressOpenings` worked first try** on this build (24 placements/aperture) — the manual-reveal fallback was
  not needed.
- **Candidate C (concept-driven) not built** — deferred to S-176 with rationale (most expensive, least
  reusable; on a hand-authorable subject it can only match B at higher cost). Recorded, not silently dropped.
- The "subtle coursed field" for B was realized as a **water-table string course** (one belt at mid-height)
  rather than a relief belt — a relief course in the field's own `stone_bricks` is idempotent-skipped (same
  material), and the string course is the honest rustic read. It turned out to be B's busy element (finding).

## Remaining

- None for this ticket — decision + evidence delivered. `npm test` green check + commit are the last steps.
