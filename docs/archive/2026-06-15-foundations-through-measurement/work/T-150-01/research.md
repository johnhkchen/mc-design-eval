# T-150-01 Research — realistic-construction-gable-and-roof

Epic E-35 / Story S-150. Descriptive map of the gable/roof construction surface. No solutions here.

## The defect, grounded

The generator plots a gable roof as a **solid triangular prism of roof material** dropped on the
wall box. Construction reality is the inverse: a **wall envelope** (including the two gable-end
triangular walls) carries a **roof covering** (a sloped skin) that **overhangs** at eaves and verges.
Three concrete consequences in the code:

1. **Gable end is roof material, not wall.** `src/view/roof-generate.mjs:271-281` — `generateRoof`
   fills every column from `floor` to `top` with `family.field` (the roof block). For a ridge along
   x, surface height `h(z)` is independent of x (`gableSurfaceHeight`, roof-fit.mjs:223-229 — `min`
   over the two side planes; no x term), so the whole volume is one extruded triangle. The vertical
   triangular faces at the ridge-axis extremes (x=minX, x=maxX) are roof-block fill. Header comment
   line 8: *"gable-end walls fill to the ridge for free"* — the defect, stated as a feature.

2. **`gableRole` is declared, never consumed.** `benchmarks/sculpture/recognition/barn.program.json:42`
   declares `"gableRole": "wall.field.ground"`. Grep shows `gableRole` lives only in: the schema
   (`schema/building-program.schema.json:131-134`, *"defaults to the upper wall role"*), validation
   (`src/recognition/program.mjs:249` — `checkRole`, name-existence only), program fixtures, and
   recognition replies. **No generator, compiler, or zone module reads it.** It is purely diegetic.

3. **The gable end is zoned roof.** `src/view/structural-read.mjs:319-322` (`structuralZones`) and
   `src/view/zone-map.mjs:67-69` (`zonesFromBands`): `zoneOf` returns `"roof"` when
   `y >= upperTop || roofKeys.has(key)`. The gable-end fill cells sit above the eave line
   (`y >= upperTop`), so even though they are NOT top-exposed (the cell above covers them, so they
   are NOT in `roofKeys`), the `y >= upperTop` clause alone classifies them roof. `zoneFill`
   (`src/view/zone-fill.mjs:136-175`) then recolours them to the roof dominant.

4. **No verge/eave overhang in the program path.** `src/recognition/compile.mjs:225-231` widens the
   roof footprint by 1 cell at the **eave** sides only (`allEaves` false for a ridged gable → z±1
   when ridgeAxis=x), never at the **gable verge** (x ends). That widened eave column is a *solid*
   roof column to `bandFloor` (no open underside) — a crude lip, not a covering overhang. The
   open-underside `sheet` mechanism exists only for **fitted ends** (roof-generate.mjs:191-194,
   driven by `ends.faceCoord`), which the program/compile path never produces.

## The roof generation pipeline (two entry paths)

- **Generate-first / program path (the barn's live path):**
  `compileProgram` (compile.mjs:115) → roof spec `{footprint, ridgeAxis, eaveY, ridgeY, pitch, blocks}`
  (compile.mjs:237-240). `roofBlocks` (compile.mjs:87-97) resolves `{field, stairs, slab}` from the
  pack idiom row when the program `fieldRole` matches. The deterministic generate runner is
  `benchmarks/sculpture/generated-milestone.mjs` (`npm run generated:barn`), which calls
  `generateProvision` (`src/form/provision-generate.mjs:99-140`): for each `fit.roofs[]` it calls
  `generateRoof(roof.gables, family)`, recolours fascia (sheet + bandFloor course) to `sheetBlock`,
  excludes `sheetCols` from wall extrusion, and emits `roofPlan {cells, sheetKeys, capKeys, bandFloor}`.
- **Idiom-registry / construct path (preview + repair):** `roofGableConstruct` (idiom-registry.mjs
  ~92-105) builds a `gableRecord` (roof-generate.mjs:83-103) and calls `generateRoof`. Also
  `roof.gable.steep` (`src/view/roof-steep.mjs:78`), `roof.hip`, `roof.pyramid`, and the repair
  `roofSwapConstruct` (`src/view/roof-swap.mjs:119`).

`generateRoof` returns `{cells, counts, heights, owner, bandFloor, sheetKeys, capKeys}`. Every cell
is either a full block (`family.field`), a stair (`family.stairs`, the sloped tread), a slab
(`family.slab`, half-step), or a cap-course cell. `owner` (per "x,z") carries
`{gableId, downhill, sheet, cap, cornerEligible}`.

## The geometry of a gable end (barn)

Barn (`barn.program.json`): single 48×24 mass, `roof.gable`, `ridgeAxis: "x"`, `pitchClass: 1`,
`fieldRole: "roof.trim"` (dark_oak_planks), `gableRole: "wall.field.ground"` (the same fieldstone /
cobblestone as the upper wall — the reading says *"the gable end above the eave stays the same
fieldstone"*). `hip.demanded` is false (ridge spans the full length). So:

- The **two slopes** descend toward +z and −z; their +y surface is the **covering** (stair courses
  facing the ridge, pitch 1).
- The **two gable ends** are the vertical triangular faces at x=minX and x=maxX. In the current
  prism, every cell there is roof fill; the topmost cell of each such column is the slope/verge edge.
- **Eave-relative:** `gableSurfaceHeight` depends only on the run coordinate (z), so the end slice is
  identical to every interior slice — confirming the "extruded triangle" reading.

## Zone classification & skin

- `structuralZones` (structural-read.mjs:306-325): `roofKeys` = top-exposed `roofRegion` cells
  (roofRegion is the +y projected surface, structural-read.mjs:216-237). `zoneOf`:
  `y >= upperTop || roofKeys.has(key) → "roof"`. Gable-end sub-surface cells are *not* in roofKeys
  but *are* `y >= upperTop`.
- `zonesFromBands` (zone-map.mjs:51-76): same contract; wall zones named `band0..bandN` by y-range;
  roof zone `"roof"`. `zoneOf` checks `y >= upperTop || roofKeys.has(key)` first, then bands.
- `zoneFill` (zone-fill.mjs:136-175) recolours each visible-skin voxel to its zone's `dominant`
  (keeping `preserve` runs and declared `regions`). `surfaceZoneHistogram`/`ownCoverage` census it.
  For the barn, `gableRole` (cobblestone) == the upper wall band dominant (cobblestone) — so
  classifying the gable triangle into the upper wall band already yields the right colour.

## Overhang / relief reuse (S-147)

- `src/view/facade-articulation.mjs:180-196` — `eaveOverhang(occ, {material, faces, depth, eaveRow})`:
  a soffit course **proud** of the wall plane at the eave row, delegating to `surfaceRelief`
  (`src/view/surface-relief.mjs:64-126`). Proud cells emit only in front of existing exterior shell
  cells; idempotent; pure-integer placement order. `surface-relief.mjs:156-185` `reliefNoRegress`
  proves in-plane silhouette + E-34 ratios are byte-identical after relief (perpendicular widening is
  *honest* — recorded in `expectedWidening`, never gated).
- The generator's own overhang is `sheet` columns (open underside) from fitted ends only; the program
  path has none. The compile eave-widening is solid.

## The E-34 ruler & the silhouette gate

- `src/form/silhouette-proportion.mjs` — `maskProportions` (~209-250) reads `ridgeRow/eaveRow/
  groundRow/eaveH` from an orthographic mask. `eaveReference` (184-197, T-139-01 skirt-aware):
  eave = topmost row whose extent ≥ `eaveWidthFrac (0.98)` × reference, where reference is the body
  max *above* the bottom `skirtBandFrac (0.2)` band (a wide plinth doesn't become the eave basis). An
  **overhanging eave course is wider than the wall** → it *is* the widest layer → it becomes the eave
  reading. The ruler reads the overhang AS the eave line; this is architecturally correct but must be
  verified/recorded (AC3 note).
- `reliefNoRegress` (surface-relief.mjs:156-185) is the no-regress harness: own-face mask +
  whole-build `ridgeToEave`/`roofShare` ratios byte-identical.

## Determinism & the glance

- `generated-milestone.mjs`: pure `evidence→fit→generate→skin→stretch`, runs **twice**, byte-compared;
  `--repro` re-proves from a fresh process; **GL renders are evidence, never inputs**; **judge is
  on-demand, not in `npm test`**. `--skip-gate` for instrument-first. `benchmarks/sculpture/roof-diff.mjs`
  (`npm run diff:roof -- --subject barn [--repro]`) emits per-azimuth mismatch + `pr/assets/frames/
  roof-diff-barn-*.png`. Generated barn artifact: `benchmarks/sculpture/generated/barn.json`.
- Unit tests for the pure cores: `src/view/roof-generate.test.mjs` (synthetic gables, `byPos` map
  assertions), `src/form/provision-generate.test.mjs`, `src/view/zone-map`/`zone-fill` tests.

## Constraints & assumptions

- **Byte-identity is load-bearing.** Committed records (cottage/church/gatehouse) and the barn slopes
  must not move. Any generator change must be byte-identical when its new input is absent (opt-in).
- **No per-building constants** (E-25 Rule 3); subjects come from the registry / program data.
- **No judge run** — the glance (deterministic render sheet) is the proof; GL is operator-run.
- **`gableRole` default** = the wall ground field when absent (AC1).
- Multi-gable subjects (cottage) have intersecting valleys — "gable end" is only well-defined for a
  gable whose ridge reaches the footprint edge with an exposed triangular face (`hip.demanded` false).
