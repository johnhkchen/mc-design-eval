# T-104-01 roof-as-program — Progress

## Done (all plan steps complete)
- **Step 1** — `protectViolations` exported from the cage (folded into 667faac).
- **Step 2** — `src/form/roof-fit.mjs` + tests (77ee1f5): gables from ridge pairs, glb-first pitch
  under the 15° agreement gate, voxel-anchored positions, measured overhang, hip demand, findings.
- **Step 3** — `src/view/roof-generate.mjs` + tests (09faaf0): max-of-gables heightfield, solid
  wedge, stair/slab/full surface program, kit-derived vocabulary-checked family.
- **Step 4** — `src/view/roof-swap.mjs` + tests (667faac): carve/compose/judge (IoU mass view,
  closure, protect), chimney exclusion + re-seat, banded census, auto-rollback.
- **Step 5** — `benchmarks/sculpture/roof-program.mjs` + `roof:*` scripts (f1a3a82): input pins,
  double-run determinism, unmapped THROW gate, renders at 135/225/315, durable record + md.
- **Step 6** — live evidence (5235b38): **cottage ACCEPTED** (voxel-pitch rung; band protrusions
  16→0; 168 stairs/179 slabs; unmapped 0/10363); **gatehouse ACCEPTED** (voxel-pitch-gable-ends
  rung; 18→2 ≤ 6/gable line-end budget; 50 stairs/139 slabs; unmapped 0/9481). `--repro` and
  `--offline` re-prove both records.
- **Step 7** — full `npm test` green (1341 unit + schema gates); review.md written.

## Deviations from design/plan (all named, all mechanism-not-tuning)
1. **eaveY/positions anchor to the voxel fits**, not the chosen (possibly glb) plane — glbFit
   vertical offsets under aabb-affine alignment are unreliable (offsetDelta to 4.4 cells).
2. **Pitch-source attempt ladder** (54bd141 area / 965d1ac): live cottage showed a glb gradient can
   pass the angle gate yet never reach the recorded ridge — the swap now tries as-fitted, then
   all-voxel pitches, with the cage as arbiter; every rung recorded.
3. **Gable-ends rungs**: the gatehouse's fragmented ridge (cells x 1..5 under a footprint x
   −12..13) invented a hip demand that deleted real end mass — hip-suppressed variants added to
   the ladder; the cage refuted the hip and accepted the plain gable.
4. **programFitError measures the hip-aware parametric surface** (gableSurfaceHeight, one shared
   definition with the generator) — measured against bare side planes, hip clipping read as error
   and killed the gatehouse gable.
5. **Footprint fill-between** (rows/ribs contiguous): the blob extent's segmentation notches gave
   the generated eave line gaps whose flanks exposed 4 faces — a parametric roof has straight edges.
6. **Band census counts solid cells only** and the declared residual budget is 6/gable (ridge +
   eave line END cells expose 4 faces by geometry; slab/stair half-steps are declared vocabulary,
   not sampled noise). The AC's "146/165" are pre-regularize styled-artifact provenance; measured
   on the regularized inputs the band reads 16/18 before, 0/2 after.

## Concurrency note
A sibling session is live on T-105-01 (shaped-vocabulary); its uncommitted `shaped:*` npm scripts
share package.json — my commit staged only the `roof:*` lines, their working-tree edit is intact.
