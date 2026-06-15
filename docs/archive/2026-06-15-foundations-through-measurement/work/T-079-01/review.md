# Review — T-079-01 spray-paint-materials

Handoff for a human reviewer. The judgement path (S-079) is built and the cottage's 215→8 plaster
collapse is reversed (**white_terracotta 8 → 315**). All six RDSPI artifacts present; `npm test` green
(896, +6 from this ticket). The metered LLM refine is wired but opt-in (`--refine`) and not exercised.

## What changed

### New pure cores (`src/view/`, under the `src/**/*.test.mjs` glob)
- **`palette-cans.mjs`** (72 ln) — the "4 cans": `allowedPalette(artifact, additions)` (the membership
  oracle, bare ids), `withAdditions` (AJV-consistent manifest growth for concept-justified add-back),
  `filterToPalette` (defensive cell gate for the LLM-refine path).
- **`face-paint.mjs`** (109 ln) — the heart. `paintFace(occ, dir, targetGrid, {allowed, source})`
  projects a face (T-078 Path P) and back-projects a per-cell material target to **recolor placements**
  (`{op:"voxel", pos, block}`) on the front-most surface voxels — geometry-safe by construction
  (append-only, last-write-wins; no air op). `mergePaints` resolves shared-corner collisions by source
  priority (concept > glb). `applyPaint` appends.
- **`glb-splat.mjs`** (136 ln) — the side/roof target. `glbVoxelOccupancy` (snap GLB texture → per-voxel
  palette block via the shipped `sampleSurfaceColors`/`colorVoxelsToArtifact`), `splatFromGlbOccupancy`
  (project that colour-true occupancy through the same Path-P dir → same-angle by construction),
  `resampleBlockGrid` (the shared alignment primitive), `loadGlbSplat` (the lazy impure decode leaf,
  injected `decodeTexture`).
- **`face-resemblance.mjs`** (56 ln) — `faceResemblance` (reuse E-22 `zoneAgreement`/`setAgreement` per
  face, block-grounded, no new colour math) + `acceptIfCloser` (mirror revise/loop's `after > before +
  epsilon`, P14-safe).

### New impure runner + record (`benchmarks/sculpture/`)
- **`spray-paint.mjs`** (244 ln) — the cottage front+side run. Concept-splat the front (+z), GLB-splat a
  side (+x), paint, gate the front vs the concept, merge corners. `--refine` (metered LLM), `--offline`
  (deterministic re-derivation). The durable record `spray-paint/cottage.{json,md}` +
  `spray-paint/cottage/artifact.json` (the painted, AJV-valid build) are committed; face PNGs gitignored.

### Modified
- `package.json` — `spray:paint` script. `.gitignore` — spray-paint face PNGs.
- 4 reused-unchanged seams consumed (not modified): `reference-quantize.mjs` (concept splat),
  `image-grid.mjs` (whitelist palette enforcement), `resemblance.mjs` (per-face gate),
  `glb-voxel-build.mjs` (GLB colour sampling), `revise/loop.mjs` (the accept-gate contract, mirrored).

## Acceptance criteria — status
1. **Face-paint tool** ✓ — `paintFace` + the runner present the build face beside the concept's same face.
2. **Splat path** ✓ — concept splat for the front (`quantizeToFace`), textured-GLB splat for the side
   (`loadGlbSplat`). Both fired live (front 526 cells, side 520).
3. **Enforced palette ("4 cans")** ✓ — `allowed` = manifest; the concept splat snaps within it
   (`outOfPalette=0`); the painted manifest stayed **6 blocks** (no 91-block bloat). Off-palette is
   structurally impossible (whitelist + `paintFace` membership test). Add-back implemented (`withAdditions`)
   but not needed for the cottage (plaster is already in the manifest).
4. **Back-projection** ✓ — paint lands on the front-most surface voxel (stored `SurfaceCell.voxel`,
   unambiguous because ortho/45°); 53 corner collisions resolved concept>glb; occluded interior never a
   front cell → keeps its block (fallback). Unit-tested.
5. **Per-face accept-if-closer** ✓ — front gate **0.25 → 0.40**, accepted (P14-safe: the rollback branch
   is exercised in `face-resemblance.test.mjs`). The side has no concept face → gated by-construction
   (GLB truth), recorded as a named gap.
6. **Cottage front+side run** ✓ — **plaster `white_terracotta` 8 → 315, regression reversed**; per-face
   resemblance before/after recorded; painted/skipped/offPalette per face.
7. **Pure cores unit-tested; paint judgement is the metered call; `npm test` green** ✓ — 19 new unit
   tests across the 4 cores; the metered call is isolated to `--refine`; 896 tests pass.

## Test coverage
- **palette-cans** (4): union, add-back idempotence + sort, off-palette drop.
- **face-paint** (6): recolor-every-filled-cell, **geometry-safe round-trip** (the load-bearing
  invariant — expand positions identical, only painted blocks change), no-change/off-palette skip,
  occluded-interior-untouched, corner concept>glb, non-colliding union/dedup.
- **glb-splat** (5): face-grid sizing, 1:1 alignment, texture→palette snap, empty occupancy,
  `resampleBlockGrid` up/down-sample + null passthrough.
- **face-resemblance** (4): concept-match scores higher, set-agreement wiring, accept strict-improve /
  reject equal-worse-undermargin (rollback), null-score handling.
- **Live integration** (not in `npm test`): the cottage run + the `--offline` re-derivation (reversal
  CONFIRMED).
- **Gaps:** the impure leaves are untested by design (documented, per `multi-angle.mjs`/`material-correct.mjs`
  precedent): `loadGlbSplat`'s GLB decode, the GL face renders, the metered `--refine` call.

## Open concerns / TODO (for human attention)
1. **Side-face gate is by-construction, not a resemblance delta.** The concept never shows a side, so the
   side splat is accepted because it is the GLB truth — there is no per-face accept-if-closer signal for
   sides until a textured-GLB→PNG render (or a GLB-render reference) exists. Honest gap; recorded per-face.
   A future ticket could add the GLB render reference (the design's pluggable `splatTarget` seam allows it).
2. **`--refine` (the metered LLM face-vs-face call) is wired but not exercised** this pass. The splat+gate
   path stands alone and is what the run demonstrates; the refine is the one metered call left to drive.
3. **Front gate is a render-pixel proxy** (E-22 Rule 2): 0.25→0.40 is a diagnostic nudge, not the verdict.
   The verdict remains the human face triptych + categorical judge — not produced here (out of S-079 scope).
   The concept↔+z-face correspondence is assumed from the run's gate acceptance (0.25→0.40 confirms the +z
   face is the concept's front); if a subject's designed front sits elsewhere, the `DIR_TO_ANGLE` mapping +
   the chosen face must be revisited.
4. **GLB-splat depends on `dwebp`** on the host (TRELLIS textures are WebP). Absent it, the side splat
   skips with a clear message and the front-only run still reverses the plaster band — but a CI host
   without `dwebp` gets no side coverage. The PNG/JPEG path needs no external codec.
5. **Plaster overshoot (315 vs the original 215).** The concept splat paints every concept-cream front
   cell to `white_terracotta`, which is *more* plaster than the original feature placement intended (the
   concept's whole upper storey reads cream). This reverses the regression decisively but is a coarser
   distribution than a storey-band-aware placement; the per-face resemblance gain (0.25→0.40) confirms it
   moves toward the concept, and the LLM `--refine` is the intended path to sharpen it.
</content>
