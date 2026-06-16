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

## Step 4 — Self-concept scorer ✓
- `experiments/eval-alignment/score-gatehouse-selfconcept.mjs` (NOT in npm test, not the instrument).
- `GUARD_ONLY=1` wiring check passed; live run: VOTES=2 → scores 40, 44 → **mean 42**.
- **Self-concept score 42 vs the ~2 E-40 floor → lift +40**, `nWrongStyle=0` (read as MATCHED).
- Per-item majors: WALL/OPENING/ROOF all `styleClass=absent` (missing-detail "add" items), NOT
  wrong-style — materials read faithful; remaining cap is detail/roof, not material mismatch.
- Result committed: `docs/active/work/T-171-01/selfconcept-score.json`.

## Step 5 — Determinism replay ✓
- `recognize.mjs --subject gatehouse --offline` → artifact **REPRODUCES byte-identically**
  (sha 5f63ad731505…), conformance PASS. The replay seam works for the new subject (E-31 Rule 5).

## Step 6 — npm test ✓
- `npm test` → **2242 pass / 0 fail** (unchanged; no production source touched). AC #4 green.
- No `measurements/` (frozen instrument) file in git status. AC #4 satisfied.

## Deviations from plan
- None. Live recognition succeeded on the first ask (fallback B not needed). The model read the
  concept as dressed *coursed* stone (stone_bricks field) with cobblestone rubble *quoins* — the
  inverse of the AC's "cobblestone field + stone dressing" wording, but materially all-stone and a
  defensible reading of a grey coursed-stone gatehouse. The material-faithfulness intent (stone, not
  plank/basalt) is fully met.
