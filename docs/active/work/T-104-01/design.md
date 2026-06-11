# T-104-01 roof-as-program — Design

Decisions with rationale, grounded in research.md. Each option set lists what was rejected and why.

## D1 — Delivery shape: standalone runner; chain integration is S-106's

**Decision.** Ship `npm run roof:{cottage,gatehouse,church}` — a standalone impure runner
(`benchmarks/sculpture/roof-program.mjs`) consuming the committed regularized shell, the committed
component record, the kit, and the GLB (cage silhouettes only). It writes a durable record, the
swapped artifact, before/after renders, and evidence frames — the T-102/T-103 runner precedent.

**Rejected: insert into `runChain`'s shellStage now.** Zone-fill recolors surface cells by appending
stateless `{op:"voxel"}` placements; last-write-wins-whole would cube every stair (research §5). The
epic DAG routes that integration through S-106 (component-aware skinning: "roof courses follow the
generated planes"). Wiring the swap pre-skin today would have the chain destroy the program roof and
the gate would judge a flattened wedge — worse than honest deferral. The runner's output artifact is
exactly what S-106 will thread through the chain.

## D2 — Fit core consumes the component record, not the GLB

**Decision.** The fit core (`src/form/roof-fit.mjs`, pure) reads `roofPlanes[]` from the
component-record JSON. The GLB roof region's least-squares fit **already exists per plane as
`glbFit`** (area-weighted LSQ of aligned triangles, T-103); re-fitting triangles here would re-derive
what the contract provides (E-27 Rule 4: components are the contract). The GLB file itself is loaded
only by the runner, for cage reference silhouettes — same as T-102.

**Parameter sourcing per gable (a ridge pair of pitched planes):**
- `ridgeAxis`, `ridgeY` — from the pair's `ridge {axis, y}` (rounded to int / half).
- `pitch` per side — from `glbFit.gradient` when present **and** `angleToVoxelDeg ≤ pitchAgreeDeg`
  (declared default 15°); otherwise from `voxelFit.gradient` with a named finding
  (`fit-source: voxel — glb fit missing|disagreed`). Rationale: aabb-affine glbFits are
  known-approximate (cottage roof-0 rmse 8.35, offsetDelta 4.42; roof-4 gradient 7.47 at 20.4° —
  research §3); the voxel fit measures the regularized shell, which is itself cage-held against the
  GLB. Either way the chosen source, the GLB agreement angle, and both gradients are **recorded** —
  Rule 1's "fit error recorded", never silent.
- `eaveY` per side — chosen-fit plane evaluated over that side's `eave.cells`, rounded to halves.
- `footprint` — union of the pair's `extent.runs` (the as-built plan region; it already includes any
  real overhang the mesh had).
- `overhang` per side — **measured and recorded**: horizontal distance from the eave edge to the
  matching wall-slab plane (`wallSlabs`), `null` + finding when no wall slab matches (cottage has
  slab-low-coverage findings). Reported, not re-imposed — the footprint is the as-built truth.
- **Fit error** per side: (a) `angleToGlbDeg` (chosen vs glbFit, when present); (b) `programRmse` —
  RMSE of the *generated discrete surface* against the chosen fit plane over the side's extent —
  computed after generation and recorded. **Tolerance gate** (declared `ROOF_FIT_DEFAULTS`):
  `programRmse ≤ 0.75` cells and geometric sanity (ridge above both eaves, run ≥ 2 cells, pitch in
  (0, 4]). A gable outside tolerance → **that gable is not generated**; the regularized roof stays
  for its region and the failure is a named finding (E-27 Rule 1 — never an invented shape).

**Hip "where the fit demands".** Demand is detected per gable from the record: eave cells of either
plane (or step-down height profile of the combined extent) on the **ridge-axis end columns** mean the
roof slopes down at the ends instead of meeting a gable wall. Generation handles it naturally
(D3's min-of-planes heightfield adds end slopes at the same pitch, clipping the ridge). The committed
cottage/gatehouse records show constant-y full-length ridges (pure gables), so hip is exercised by
synthetic tests, not real subjects — recorded honestly in the runner output.

**Out of scope per record reality:** flat planes (cottage roof-1, gatehouse roof-2 — real terraces)
and small unpaired pitched fragments (areas 9–52) stay regularized; each non-participating plane is a
named finding (`roof-region-unfitted`). They are inside the cage anyway; inventing geometry for them
would violate Rule 1.

## D3 — Generator: solid wedge + native surface program

**Decision.** `src/view/roof-generate.mjs` (pure) regenerates each accepted gable as a **discrete
heightfield**: `h(x,z) = min(ridgeY, eaveY_side + pitch_side · dist_from_eave, [end slopes when
hipped])`, quantized to half-steps. The volume is **filled solid** with the kit roof-field block from
`bandFloor` (min eave y) up to `⌊h⌋`; the surface program then expresses the slope Minecraft-native:
- step rise 1 between neighbor columns → the tread cell becomes a **stair** (`facing` = uphill toward
  the ridge, `half: bottom`, `shape: straight` — the proven CARD_ROWS vocabulary);
- fractional top (h ends in .5) → **slab** (`type: bottom`) on the solid below — the half-step
  transition;
- rise ≥ 2 per run (steep pitch) → **full blocks** carry the riser, stair only at the tread edge —
  "full blocks where pitch demands";
- ridge cells where opposing slopes meet at equal height → full block (slab cap when h is half).

Solid infill is what makes the cage tractable: closure holds on the standard solid view because every
stair/slab sits on solid wedge (no flood path), and gable-end walls come for free (the wedge fills to
the ridge at end columns when not hipped).

**Rejected: stairs as an overlay veneer above the wedge** — adds a course of mass beyond the fitted
plane (silhouette inflation, fake overhang). **Rejected: full-block-only stepped wedge** — fails the
AC's explicit stair-course requirement and loses half-step fidelity. **Rejected: hollow roof shell**
— opens closure at gable ends and under-eave, and buys nothing this ticket needs (interiors are
E-23's concern).

## D4 — Replacement under the cage: carve, compose, judge on a mass view

**Decision.** `src/view/roof-swap.mjs` (pure) performs the swap as **one judged step** with T-102's
own checks, reused not re-implemented:
1. **Carve**: remove cells in the replacement region — columns of the accepted gables' footprints,
   cells with `y ≥ bandFloor(column)` — excluding **chimney columns** (D5). Fixtures inside the
   region are removed with it (they were sampled-roof dressing).
2. **Compose**: write the generated wedge + surface program into the carved occupancy
   (`occupancyFromCells` semantics: block+form+state together).
3. **Judge** — the three cage checks, with one explicit adaptation:
   - **Silhouette IoU per frozen azimuth** vs the GLB reference, on a **mass view**: a pure helper
     returns the candidate occupancy with form marks cleared **for generated roof keys only**, so
     stairs/slabs count as silhouette mass. Justification: at the 128-cell raster a bottom-half stair
     fills the cell's silhouette from every gate azimuth, and solid wedge backs it; leaving the
     standard fixtures-are-dressing rule in place would erase the entire roof surface course from the
     IoU view and produce a spurious regression (research §5). The adaptation is scoped to the swap
     judge — `regularizeShell` and the chain's cage are untouched.
   - **Closure no-regress** via `closureCheck` on the standard solid view (sound because of D3's
     solid infill) — candidate `reached` must not exceed the input's.
   - **Protect byte-identity** via the T-102 check: chimney cells and any caller-supplied regions
     unchanged (chimney re-seat cells are an explicit, recorded exception — D5).
4. **Accept/rollback**: any failed check → the input occupancy is returned unchanged with
   `{accepted: false, reasons[]}` — auto-rollback, regularized roof stays, failure named.

**Rejected: judging IoU on the solid-only view** (surface course invisible → false regressions or
pressure to drop the stair program). **Rejected: extending `solidKeys` globally to count fixtures**
(changes frozen T-102 semantics for every caller; trapdoors/lanterns genuinely are dressing).

## D5 — Chimney: protected through, re-seated on the new surface

The chimney is identified as the intersection of the record's `protrusion`-role mass footprints with
the roof footprint, unioned with `protrudingStackRegion(occ)` (the cage's own derivation). Its
columns are excluded from the carve and byte-protected in the judge. **Re-seat**: after composing,
any gap between a chimney column's lowest protected cell and the new `h(x,z)` is filled downward with
the chimney's own bottom block; the added cells are listed in the swap result (`reseat.added`) so the
record and the protect check stay honest (original cells byte-identical; additions named, never
silent). A chimney base now below the new surface simply stays buried — no removal.

## D6 — Roof-band census: the AC's "146/165 → ≈0" measurement

`protrusionCensus` gains no behavior change; the swap module adds a **banded census**: the ≥4/6
exposed-face count restricted to cells with `y ≥ bandFloor(column)` over the roof footprint,
chimney columns excluded (a chimney top legitimately has 5 exposed faces). Recorded before/after in
the runner record beside the whole-shell census and the cage IoU table. The 146/165 figures were
measured on the *styled* artifacts in epic planning; the record reports the same statistic on this
runner's actual input (the regularized shell) and output, with the target ≈0 on the after side.

## D7 — Block family from the kit, vocabulary-checked

Pure derivation, no subject constants: take the kit's roof row with `formClass: "cube"` and
`whereUsed` containing `"roof"` (preferring a role matching /field/). Derive course blocks by name
morphology — `*_planks → <wood>_stairs/<wood>_slab`; `*_bricks → *_brick_stairs/_brick_slab`; else
`<block>_stairs/_slab` — then verify each candidate against an injected **vocabulary set** (the
runner supplies minecraft-data block names via the proven `render/src/version.mjs` registry). A
missing stair/slab in the vocabulary → named finding and full-block fallback for that role (honest,
not invented). Cottage resolves to `spruce_planks/spruce_stairs/spruce_slab`; gatehouse to
`deepslate_bricks/deepslate_brick_stairs/deepslate_brick_slab`. The gatehouse kit's
`stone_brick_stairs` (eave/verge *edging*) is dressing vocabulary for S-106, not the course family.

## D8 — Runner, record, determinism, renders

`benchmarks/sculpture/roof-program.mjs`, registry-driven (`SUBJECTS`), no subject branches:
- Pure stretch (fit → generate → swap → census) runs **twice in-process**; artifacts must be
  byte-identical; sha256 recorded. `--repro` re-runs and compares against the committed record
  without GL; `--offline` re-asserts the committed record (T-102 runner conventions).
- **Record** `benchmarks/sculpture/roof/<subj>.json`, schema `roof-program/v1`: inputs (shell path +
  sha256, component-record sha256, kit), per-gable fit (parameters, sources, angles, rmse,
  tolerance verdict), generation (family, counts by stair/slab/full), swap (cage IoU
  baseline/final per azimuth, closure, protect, reseat, accepted/reasons), censuses (banded + whole,
  before/after), reproducibility, renders, findings. Markdown twin beside it.
- **Artifact** `roof/<subj>/artifact.json` via `rebuildArtifact` (carries states). The runner builds
  the world (`buildWorldFromVoxels`) and asserts **`unmapped` is empty** — an AC, enforced as a
  THROW, which also proves every stair/slab state through the live `blockStateId` gate.
- **Renders**: before/after PNGs at the gate-failed azimuths 135°/225°/315° (plus 45° for the full
  contract view), gitignored; before/after frames copied to `pr/assets/frames/roof-<subj>-*.png`.
  The record carries the pinned **stairs-invisible lens note** (prismarine-viewer 1.33.0 meshes no
  stair; placement is proven by read-back + unmapped-empty instead — research §6). Renders remain
  evidence, never decision inputs.
- **Honest failure**: an unfittable roof (all gables out of tolerance) still writes the record with
  the named findings and keeps the regularized artifact; exit 0 with `status: "fallback"` — the
  fallback is a *correct* outcome per Rule 1, not a pipeline failure. A thrown stage writes
  `{status: "pipeline-failed", stage, error}` and exits 1 (T-101 convention).

## D9 — Testing strategy (synthetic-first, per epic orchestration note)

All pure cores unit-tested on synthetic specs under `src/**/*.test.mjs`: a hand-built synthetic
gable/hip component record (both glbFit agreement regimes + missing glbFit), generator surface
program assertions (stair facing/half per slope direction, slab half-steps, steep-pitch full blocks,
ridge caps, solid infill, footprint containment, CARD_ROWS-valid states), swap-cage assertions
(accept on clean replacement; rollback on injected IoU regression, closure regression, protect
violation; chimney exclusion + re-seat), family derivation (planks/bricks/unknown), banded census.
The runner is exercised live on cottage + gatehouse (GL + records), like T-102/T-103.
