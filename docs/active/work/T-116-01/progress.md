# T-116-01 fourth-subject-milestone — Progress

## Completed

- **Step 0 — preflight**: suite 1514/1514 green; key `barn` has zero substring hits in
  generated-milestone.mjs; `.gitignore` stanzas pattern-based (no edits needed); `.env` exports
  GEMINI_API_KEY + MODAL_ENDPOINT_URL. `glb/README.md` identified as the GLB manifest to update.
- **Step 1 — concept (commit `8498fe1`)**: `provision-concept.mjs` minted
  `runs/017-vBuilding-a-rectangular-stone-tithe-barn-…/` (design doc 2541 chars; Nano Banana pro).
  **S-094 checklist PASSED on attempt 1** — all 7 items, evidence in `concept-checklist.md`,
  including the **inn→barn fallback decision** with the three code-grounded reasons (no valley
  rung in the roof ladder; D2 height-class merge of same-height L-wings; jetty pruned as
  `mass-unsupported`). RDSPI research/design/structure/plan committed alongside.
- **Step 2 — GLB + smoke (commit `d31fd0c`)**: `trellis-glb.mjs` → `glb/barn.glb` (6,511,456 B,
  138,513 verts / 141,220 tris, 322 s; sha256 `38de9931…` pinned in the checklist).
  **DEVIATION (named, accepted):** strict glb-smoke single-component gate FAILS at every scale
  (32/40/48/56/64 → 8/4/2/7/2 components) but largestFraction ≥ 0.9813 everywhere; at the chosen
  scale 48 the residue is exactly ONE floating cell (35,15,17)/3,579 — not the moai defect class
  (0.52). Probed through the runner's own evidence path (voxelize@48 → keysToArtifact →
  `shellStage`): **conditioned evidence = 1 component, 7,157 cells** — the speck never reaches the
  fit, and the artifact has zero blob cells by construction. Re-rolling TRELLIS is a no-op (seed 42
  pinned); regenerating a checklist-clean concept for one mesh cell was rejected as concept
  roulette. **Second deviation from design.md:** working scale pinned at **48** (not 32) — raw
  connectivity at 32 strictly worse (8 comps/19 strays); church building precedent.
- **Step 3 — material map (commit in step-3 message)**: barn DATA entry in material-map.mjs;
  live map → `material-map/barn.{json,raw.json}`: cobblestone walls / stone_bricks
  corners-edges+base / dark_oak_planks roof / oak_planks openings; near-tone brick≠cobble
  preserved (dL 2.082); the eave stair-lip honestly dropped (`unknown-block` — stairs are not in
  the survival voxel vocabulary).
- **Step 4 — registration (commit `4f294de`)**: SUBJECTS entry in durable-skin.mjs (church
  template; policy/legacy transcribed 1:1 from the map; `zoneMapRecord`/`kitRecord` null at first
  contact; provision/generated scale 48), kit-extract.mjs DATA entry, `challenge:barn` +
  `generated:barn` scripts, GLB manifest row. Suite 1514 green; registry loads
  cottage,gatehouse,church,barn; self-grep precondition clean. CHALLENGE_SUBJECTS
  (resemblance.mjs) deliberately NOT extended — it is the pre-promotion holding pen, consumed
  only by resemblance.mjs; barn entered SUBJECTS directly.

- **Step 5 — challenge comparator (commit `74dd9c4`)**: `challenge:barn` ran END-TO-END untuned:
  provision 3,579 cells/4 manifest blocks → shell (139→26 components, closure CLOSED) → regularize
  (spikes 754→361) → skin (zone prior-fallback, coverage PASS) → gate label `challenge`:
  **FAIL 12/2, 4/4 drifted** — major form@roof + major massing@walls on every azimuth, palette/
  zoning minors; kit presence not run (no-kit-record). Double-run byte-identical (sha 80b66189…).

## Step 6–8 — THE MILESTONE RESULT: a NAMED BOOTSTRAP STALL (the honest record)

`zone:map -- --subject barn --no-render` landed **`source: prior-fallback`, reason
`no-field-cells`** (zone-map/barn.{json,md}, committed). Diagnosis, reproduced offline through the
exact extraction path (decodeImage → gridFromPixels over the map palette → rowProfile):
**cobblestone dominates ZERO concept rows.** Wall rows 33–47 are stone_bricks-dominated (e.g. row
36: stone_bricks 49 / dark_oak_planks 28 / cobblestone absent from the top-2) — the piers/quoins/
plinth are genuinely prominent at this aspect AND the cobble panels quantize into stone_bricks
(near-tone pair, ΔL 2.082, far below shading variance). `fieldBlocks` = blocks with
placementRule "walls" = {cobblestone} only ⇒ `segmentLayerBands` yields no field band ⇒
`band-profile.mjs:424` refuses. This is the recorded E-21 mean-color collapse
(`material-identity-is-semantic`) surfacing in the T-092 zone lens.

The consequence chain is contractual, with receipts:
1. `kit-extract --subject=barn` throws `bandRefsFromZoneRecord: record is not a concept-derived
   zone map` (src/form/kit.mjs:122) — before any live call.
2. `generated:barn` throws `no committed kit record (registry kitRecord=null)`
   (generated-milestone.mjs:476) — the E-26 Rule 2 kit precondition.

**Decision (T-111 church precedent — "closure = the question answered with receipts, not the
gates passed"):** under E-25 Rule 3 the pipeline must consume a new subject UNTUNED; relaxing the
kit/zone contracts to let the barn through would be tuning-to-pass and a pipeline-code change the
AC forbids. The first-run milestone is recorded as **DID NOT RUN — named bootstrap stall in the
input-prep lens**, with the pinned bar (cottage T-111 profile) recorded as not reached. The
finding is routed, not fixed here (journal step). The asymmetry it exposes is itself the E-29
answer material: the repair path tolerates an unreadable concept (policy fallback — it ran to a
12/2 FAIL) while generate-first's kit precondition does not.

Registry note: `zoneMapRecord` stays **null** in SUBJECTS — the committed zone record is a
refusal (no derived bands to assert agreement with); the church flip precedent applies only to
successful derivations.

## Incident (named, resolved): npm flag swallowing

`npm run kit:extract --subject=barn` (missing `--`) dropped the flag and started the FULL live
sweep, re-recognizing cottage/gatehouse/church kits and overwriting the committed pins. Caught
immediately; `git restore benchmarks/sculpture/kit/` restored all pins byte-identically from HEAD;
the unsanctioned replies were discarded uncommitted. No record downstream consumed them. The barn
refusal was then re-captured with the direct `node benchmarks/sculpture/kit-extract.mjs
--subject=barn` invocation (which throws before any live call).

## Completed (continued)

- **Step 9 — residual closure (commit `1baf955`)**: `reskin:{cottage,gatehouse,church}` re-cut
  `component-skin/*.json` pins against the current styled shas — chain gated, kit presence PASS
  ×3 (T-111 residual 4). Residual 3 closed upstream (T-113/T-114, cited); residuals 1–2 routed in
  the journal (instrument frozen).
- **Step 10 — journal + sheet (commit `e704b0c`)**: `pr/assets/generate-first.md` fourth-subject
  section (stall receipts + the robustness-asymmetry finding + pinned-bar-missed record);
  `design-learnings.md` **Generate-first (E-29)** section (inversion measured, fourth-subject
  lesson, which-path-scales honest answer, residual ledger incl. declared-cell numbers, E-12
  handoff).
- **Step 11**: generalization grep recorded (`grep -c "barn"` = 0 over challenge-/generated-/
  styled-milestone, zone-map, multi-angle-gate, component-skin runners); suite **1514/1514 green**
  at every commit boundary; review.md written.

## Deviations from plan (running list)

1. Working scale 48, not 32 (smoke evidence; recorded in checklist sign-off).
2. glb-smoke strict gate accepted with named single-speck deviation (checklist sign-off has the
   full argument + conditioned-evidence proof).
3. `kitRecord`/`zoneMapRecord` registered as null-first (church history) instead of pointing at
   not-yet-existing paths — avoids buildSkin asserting absent files during the challenge run.
