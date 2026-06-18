# T-204-01 — Research: roof to its picture (slate colour + correct pitch)

Story **S-204** / Epic **E-52**. The two E-50/E-49 roof residuals: (1) roof reads warm brown vs the concept's
dark charcoal-slate; (2) framing eyes flagged **SCALE: ridgeToEave 1.6316 vs 1.35 (major)** — the gable too
steep. This maps the code; it does not prescribe (design.md does that). Descriptive only.

## Live evidence already on disk (T-201)

`docs/active/work/T-201-01/trajectory.json` is the metered re-climb of record. The roof facts read straight
from it:

- **Colour.** Round-5 ROOF item (line 942): `present: "A warm orange-brown wood-plank roof"`, `missing: "The
  dark charcoal-grey color family ... the concept's dark slate"`, `kind: "replace"`. The agent's terminal pick
  was `recolor_roof` — **it never ran** (`stopReason: "round cap"`, `maxRounds=5`).
- **Pitch (the crux).** The per-round `framing.scale` block:
  - r2 (`apply_gable_roof`, the honest pitch-1 gable): `ridgeToEave 1.55`, `deltas.ridgeToEave 0.1481`,
    **`flagged: false`** — within the 0.2 tolerance.
  - r3 (`carve_arch` rolled back → build unchanged): still `1.55`, `flagged: false`.
  - r4 (`relief_walls` accepted): `ridgeToEave 1.6316`, `deltas.ridgeToEave 0.2086`, **`flagged: true`,
    `severity: "major"`**.
  - i.e. **the flag was raised by `relief_walls`, not by the roof.** The genuine roof pitch is within
    tolerance; proud detail moved the *measurement*.

## 1. The colour path (`recolor_roof`) — already fully wired

`experiments/eval-alignment/picture-climb.mjs`:
- `recolor_roof(occ)` (lines 157–174): loads program+pack+material-map, calls the **pure decision**
  `reconcileRoofMaterial`, and (if corrected) rebuilds the roof keeping cells `< eaveY+1`, recomputing the
  footprint at `eaveY`, building a `gableRecord` **identical geometry to `apply_gable_roof`**
  (`ridgeY: eaveY + floor(perp/2), pitch: 1`), with `FAMILY = { field: roofBlock, stairs:null, slab:null }`.
  Honest no-op when not corrected.

`src/recognition/roof-material.mjs` (PURE, the material-identity seam):
- `roofMaterialFamily(block)` → `"timber"|"stone"|"other"` by name regex.
- `reconcileRoofMaterial({program, pack, materialMap})` (lines 59–80): `programBlock = roleBlock(pack,
  mass.roof.fieldRole)`; `conceptBlock = materialMapRoofBlock(materialMap)`; the map **wins only on a genuine
  timber↔stone flip** (`corrected`), else no-op.

**Resolved for the gatehouse (verified):**
- program `roof.fieldRole = "roof.trim"` → `roleBlock(rustic, "roof.trim")` = `dark_oak_planks` (**timber**).
- material-map `benchmarks/sculpture/material-map/gatehouse.json` roof entry =
  `minecraft:deepslate_tiles` (**stone**), rationale: *"dark, tight, cool-grey tiling — markedly darker than
  the walls ... Distinct dark tone, not the lighter wall stone."*
- ⟹ `corrected: true`, `roofBlock = deepslate_tiles`. **The slate is value-true by construction** (the
  recognition map read the concept and picked the dark family); recolor_roof passes it straight through.

So **no colour code change is required** — recolor_roof already lands value-true dark slate. The only gap is
*demonstration* (it never ran in the capped climb). There is already a zero-spend glance harness:
- `ROOF_MATERIAL_PROBE=1` (picture-climb.mjs lines 494–505) renders three beside-concept sheets:
  `seed-beside.png`, `gable-brown-beside.png` (apply_gable_roof timber), `recolored-beside.png` (recolor_roof
  slate) to `builds/gatehouse/picture-climb/roof-material/`, prints the reconcile reason, exits **before any
  LLM spend**. `ROOF_MATERIAL_DIAGNOSE=1` (lines 521–535) scores brown vs grey by the critique (metered).

## 2. The roof generator + where pitch lives

`src/view/roof-generate.mjs` (PURE):
- `gableRecord({footprint, ridgeAxis, eaveY, ridgeY, pitch, hip})` (lines 105–125) — builds the 2-sided gable
  program record. **`ridgeY` and `pitch` are caller-supplied** — this is the pitch surface.
- `generateRoof(gables, family, opts)` (lines 257–349) — emits voxel cells (stairs on whole steps, slabs on
  halves, full blocks else). Material from `family.{field,stairs,slab}`.
- `roofFamily`, `roofHeightfield` (quantizes heights to halves via `roundHalf`), `roofMaterialFraction`.

`src/form/roof-fit.mjs` — pitch *fitting* (GLB/voxel) — `evalSideHeight(side, ridgeY, x, z) = min(ridgeY,
eaveY + pitch·dist)`. Not on the picture-climb path (the hands hardcode geometry). `roof-steep.mjs` enforces
integer pitch classes (steep). `roof-swap.mjs` exposes `pitchVariant`/`pitchKey` as registry rungs.

**The lever site:** both roof hands hardcode `ridgeY: CFG.eaveY + Math.floor(perp/2), pitch: 1`
(apply_gable_roof line 107; recolor_roof line 170). There is **no ratio-targeting** computation anywhere —
the ridge rise is purely `floor(perp/2)` regardless of the eave height, so the achieved `ridgeToEave` is a
function of the build's perp-vs-eave proportions, which differ from the program's declared `15×15 / eave 20`.

## 3. The framing eyes (`ridgeToEave`) — `src/view/framing.mjs` (PURE)

- `proportionRatios(occ)` (build side): `eave = eaveY − box.y0 + 1`, `total = box.y1 − box.y0 + 1`,
  `ridgeToEave = total/eave`. `eaveYOf(occ, ridgeAxis)` (lines 114–135): highest `y` where the perp-to-ridge
  extent is still ≥ `EAVE_FULL` (**0.9**) of max — **this is what proud quoins/plinth pollute** (they raise
  the per-y extent, dropping the detected `eaveY`, shrinking `eave`, inflating the ratio).
- `targetRatiosOf(program)` (target side): `eave = storeys·storeyHeight`; `perp = ridgeAxis==="x" ? rect.d :
  rect.w`; `rise = floor(perp/2)·(pitchClass??1)`; `ridgeToEave = (eave+rise)/eave`.
- For gatehouse: `eave=4·5=20`, `perp=15`, `rise=floor(15/2)·1=7`, `total=27`, **`ridgeToEave = 27/20 =
  1.35`** — the "concept" target is the recognised program geometry, **not** an image read. Constant `1.35`
  appears only in derived records/tests.
- `scaleFraming(program, occ, {tol=SCALE_TOL=0.2})` (lines 170–187): flags `aspect`/`ridgeToEave` when
  `relDelta > 0.2`; note string is the exact trajectory text.
- Tests: `src/view/framing.test.mjs` FR4 (`1.35` both), FR5 (flags), FR6 (uniform-scale quiet), FR7 (purity).

## 4. The accept-gate + E-50 override (rollback-keep)

`src/workshop/climb-gate.mjs`:
- `TOOL_DEPARTMENTS.recolor_roof = ["ROOF"]`; `TOOL_STAGE.recolor_roof = "form"`; excluded from
  `closureDecidedMove` (ROOF doesn't move wall closure).
- `acceptsRound(before, after, opts)` (262–307): after `delta≥margin`, the **department-dominant override**
  (E-50 / T-191): a tool that cleared a major in a targeted department, added no new major, grew no targeted
  burden → **KEEP even on a whole-build scalar regression**. recolor_roof clearing the ROOF wrong-style
  `replace` is exactly this case. Covered by climb-gate tests (CG17 + recolor_roof digest cases ~151/238/269).

## 5. Tests & invariants

- `npm test` 2397/2397 green (T-201). The roof hands live in `experiments/**` — **outside** the
  `src/**/*.test.mjs` glob — so hand changes don't break the suite; the **pure helper** I add must be unit
  tested in `src/view/roof-generate.test.mjs`.
- Frozen instrument: `measurements/` must stay byte-clean. Evidence renders go under `builds/`.
- GL: renders need `assertGlAvailable()` (render/ project); the pure framing/lever evidence needs no GL.

## Constraints / assumptions surfaced

- **The pitch flag is largely a measurement artifact.** The honest pitch-1 roof is within tolerance (1.55);
  `relief_walls` proud detail trips it via `eaveYOf` — the **same proud-detail-pollutes-measurement** family
  as T-202's `eaveRingClosure` collapse (sibling function). Fixing `eaveYOf` would be T-202-adjacent scope; do
  not touch it here.
- **Anti-hedge tension:** force-flattening a within-tolerance roof to 1.35 to mask the measurement bug is
  exactly the "fake a lever" the ticket forbids. The lever must be real and tolerance-gated (byte-identical
  for in-tolerance subjects), with the residual flag named honestly.
- Independent of T-202/T-203 (parallel); converge at T-205.
