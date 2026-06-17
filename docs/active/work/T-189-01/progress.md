# T-189-01 — PROGRESS

## Done
- **Step 1–2** — `src/recognition/roof-material.mjs` (pure: `roofMaterialFamily`, `materialMapRoofBlock`,
  `reconcileRoofMaterial`) + `roof-material.test.mjs` (RM1–RM6). Green.
- **Step 3** — `climb-gate.mjs` `TOOL_DEPARTMENTS.recolor_roof = ["ROOF"]` + test assertion.
- **Commit 1** `1eab339` — pure core + dept map. `npm test` 2319/0.
- **Step 4–6** — `picture-climb.mjs`: imports, `MATERIAL_MAP_PATH` (+ guard), the `recolor_roof` hand,
  `TOOLS`/`MENU`/enum, and the zero-spend `ROOF_MATERIAL_PROBE` triptych branch.
- **Commit 2** `f01565b` — runner lever + probe.
- **Step 7** — ran `ROOF_MATERIAL_PROBE=1`; inspected the three beside renders (seed / brown gable / grey
  gable). Brown→grey confirmed on the glance; roof stays a distinct dark mass (no collapse into the walls).
- **Metered verification** — `ROOF_MATERIAL_DIAGNOSE=1` (2 runs): the ROOF `major/replace` roof-material
  defect fires on brown, clears on grey. **Commit 3** `7b6fed8` — the diagnose harness.

## Verified facts
- `reconcileRoofMaterial(gatehouse)` → `corrected:true`, `timber dark_oak_planks → stone deepslate_tiles`.
- `recolor_roof(occ)` cell **positions are byte-identical to `apply_gable_roof(occ)`** (8692 == 8692) —
  closure/silhouette unchanged, only the field block differs. The "without regressing closure" AC,
  discharged without GL.
- Grey roof-band census = `deepslate_tiles` only.
- Metered: brown ROOF `major/replace` ("reads light-wood instead of dark") → **GONE** on grey.

## Deviations from plan/structure
- **Material-map loading**: structure §File 4 said `parseMaterialMap`; that expects a RAW `{materials:[]}`
  model reply, but the committed `material-map/v1` file is the already-parsed `{map:[]}` form. The runner
  loads the JSON directly and calls `assertMaterialMap(mm.map)` (a 1-line `loadMaterialMap` helper).
  `reconcileRoofMaterial` reads `materialMap.map` so it consumes the committed shape unchanged.
- **Glance widened to a triptych**: the seed roof's FORM differs from a rebuilt gable, so seed-vs-recolored
  conflated form-cleanup with the colour change. Added `apply_gable_roof` (clean **brown** gable) so the
  triptych isolates colour at the gable level: seed → brown gable → grey gable.
- **Metered confirmation RUN, not deferred**: T-188 deferred spend; the anti-hedge directive (GOVERNING)
  requires the attack be run and reported. Ran `ROOF_MATERIAL_DIAGNOSE` — it both confirmed the clear AND
  surfaced the scalar-can't-steer finding (review §3).

## Not done (named, not forced)
- The **full sustained climb** with `recolor_roof` wired in is S-190's job (this ticket built + verified the
  hand). The scalar-gate-too-coarse-to-steer finding (review §3) is the input to S-190's accept-gate work.
- The **WALL quoin-contrast** divergence (the next-major once the roof clears) is `construct_walls`'
  territory — a hand that exists; not in scope here.
