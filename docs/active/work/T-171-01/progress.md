# T-171-01 — Progress

## Step 0 — Pre-flight
- GL available (headless-gl context OK from `render/`).
- Assets present: gatehouse concept, `form-sketch/gatehouse.json`, `gatehouse-sheet.png`.
- `recognition/gatehouse.*` absent → live run writes fresh drafts (no `--rotate-pins`).
- OLD build baseline (`builds/gatehouse/new-roof`): 35.8% polished_basalt walls, 0.04% cobblestone,
  52.8% spruce_planks roof prism.

## Step 1 — Live recognition run ✓
- `node benchmarks/sculpture/recognize.mjs --subject gatehouse --ticket T-171-01`
- LIVE claude-opus-4-8, **1 ask, conformance PASS, grep clean**, 2287 cells / 7 elements.
- Model reading: "a small square grey stone gatehouse, one tall hall under a steep gable …
  coursed dressed-stone wall fields with rough rubble quoins … arched passage on the gable end …
  roof reads dark (whole-roof darkened toward oak)."
- Program roles: walls.ground/upper = `wall.dressing` (stone_bricks); dressing/quoins =
  `wall.field.ground` (cobblestone); roof field = `roof.trim` (dark_oak_planks), trim = `wall.dressing`.
- **NEW build block distribution:** 46.5% `stone_bricks` (walls), 53.1% `dark_oak_planks` (roof),
  0.2% cobblestone (quoins), 0.2% dark_oak_log. **`polished_basalt` gone.**
- **Material faithfulness (walls): ACHIEVED** — walls went near-black basalt → grey dressed stone.
- Note: model chose `roof.trim` (dark oak) for the roof field, which does NOT match the pack's
  spruce stair-course family → roof realizes as solid dark_oak cubes (chunky), still roof-dominant.
  That is the roof-prism / roof-as-construction gap → **S-172** (not this ticket).
- Committed (recognition drafts + RDSPI artifacts).

## Step 3 — Beside-concept render (AC #2) ✓
- `renderBesideConcept` → `docs/active/work/T-171-01/beside-concept-gatehouse.png` (5 panels).
- Glance: grey stone walls + dark gable roof + arched gate — reads as the concept's stone gatehouse,
  not the old near-black basalt + light-spruce build. AC #2 material-faithfulness satisfied.

## Step 4 — Self-concept scorer
(in progress)
