# T-172-01 — Progress

## Step 1 — covering engine + census helper ✓ (commit `feat … default-off`)
- `generateRoof` gained `opts.covering` (default false) + per-column `coverFloor` riser-seal rule.
- `roofMaterialFraction(placements, roofBlocks)` exported (the prism census).
- 29 existing roof-generate tests green (covering default-off ⇒ byte-identical).

## Step 2 — covering tests ✓ (commit `test … 7 cases`)
- 7 cases added: hollows interior; pitch-2 watertight (no daylight column); surface+caps
  byte-identical; gable-end walls + footprint closure preserved; slope-interior census = 0 (pitch 1);
  absent⇒legacy; multi-gable composition. `node --test roof-generate.test.mjs`: 36/36.

## Step 3 — generate-first covering ✓ (commit `feat … provision-generate`)
- One line: `generateRoof(roof.gables, family, { gableBlock, covering: true })`.
- Full suite green (2249/0) — no provision-generate / cage / shell-integrity pin asserted a solid
  roof interior, so the contingency (revert + scope to roof-climb) was NOT needed.

## Step 4 — multi-ridge + covering wiring ✓ (commit `feat … roof-climb`)
- `roof-climb.mjs`: loads `recognition/{subject}.program.json`, `registerRect` → one `gableRecord`
  per mass (axis-swap aware), covering mode, gable-end wall = modal eave block. Single-bbox covering
  fallback on no-program / ambiguous registration (logged). Census + `closureOf` printed. Output →
  `builds/{subject}/roof-covering/`. Metered `score()` gated behind `--score`. `node --check` clean.

## Step 5 — evidence (run, GL on, no metered scoring) ✓
Ran cottage / barn / gatehouse (no `--score`, ~0 model tokens). See FINDINGS.md. Renders inspected:
- **cottage**: TWO perpendicular gables + valley (main ridge=z, wing ridge=x) — reads as an
  L-plan gabled cottage, not a plank mountain.
- **barn**: single clean gable — prism gone.
- **gatehouse**: registration ambiguous (near-square) → single-bbox covering fallback (logged); prism
  still killed.

## Deviations from plan
- None substantive. The provision-generate change (Step 3) landed cleanly (no pin blocked it), so
  covering is live on BOTH build paths, not just `roof-climb`.
- The gatehouse per-mass ridge did not register (ambiguous near-square fit) — this is the
  falsifiable-claim's "doesn't register" branch; handled by the named fallback, reported (not forced).

## Remaining
- FINDINGS.md (census table + closure + render notes) — writing.
- review.md — writing.
