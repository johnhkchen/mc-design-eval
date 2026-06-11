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

## In flight

- **Step 5 — `npm run challenge:barn`** (background): mints `challenge/barn/base-artifact.json`
  (the zone-map bootstrap dependency); the remainder of the chain is the untuned repair-path
  comparator — its verdicts or its honest refusal commit as they land.

## Remaining

- Step 6: `zone:map -- --subject barn --no-render` → flip zoneMapRecord (durable-skin +
  kit-extract entries).
- Step 7: `kit:extract --subject=barn` → flip kitRecord.
- Step 8: THE MILESTONE — `generated:barn` + `--repro` + `--offline`.
- Step 9: residual closure — `reskin:{cottage,gatehouse,church}` re-cuts.
- Step 10: journal (design-learnings E-29 section) + pr/assets/generate-first.md barn columns +
  E-12 handoff.
- Step 11: final suite + review.md.

## Deviations from plan (running list)

1. Working scale 48, not 32 (smoke evidence; recorded in checklist sign-off).
2. glb-smoke strict gate accepted with named single-speck deviation (checklist sign-off has the
   full argument + conditioned-evidence proof).
3. `kitRecord`/`zoneMapRecord` registered as null-first (church history) instead of pointing at
   not-yet-existing paths — avoids buildSkin asserting absent files during the challenge run.
