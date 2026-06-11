# T-104-01 roof-as-program — Review

Self-assessment / handoff. The sampled roof — the source of every `form @ roof` gate failure — is
now replaced by a roof **generated from fitted parameters** on both AC subjects, under the T-102
cage, behind named `npm run` commands, reproducibly.

## What changed

**Created**
- `src/form/roof-fit.mjs` (+ 16 tests) — pure fit core. Ridge pairs → parametric gables: ridge
  axis/y; per-side pitch with **glb-first source selection** under a declared 15° agreement gate
  (voxel fallback is a named `fit-source-voxel` finding); voxel-anchored eave line; **measured
  overhang** (null + finding when no wall slab matches); hip-demand detection; footprint
  (extents ∪ ridge, rows/ribs made contiguous). Exports the shared parametric surface
  (`gableSurfaceHeight`), the ladder variants (`pitchVariant`, `gableEndsVariant`), and the
  recorded fit error (`programFitError`). Non-participating planes (flat, unpaired, insane pairs)
  are named `roof-region-unfitted` — the regularized mass stays (E-27 Rule 1).
- `src/view/roof-generate.mjs` (+ 10 tests) — pure generator. Per-column max over each gable's
  min-of-planes surface (valleys at intersections, hip ends when demanded); **solid wedge** in the
  kit roof-field block; surface program: **stair treads** facing the ridge (T-097 CARD_ROWS
  states), **slabs** at half-steps, full blocks where pitch demands. Course family derived from
  the E-26 kit row and verified against an injected block vocabulary — missing shaped blocks are
  findings with full-block fallback, never invented ids.
- `src/view/roof-swap.mjs` (+ 13 tests) — pure swap. Carve the band over the generated footprint
  (chimney columns pass through), compose, judge ONE step with the cage's own checks: per-azimuth
  silhouette IoU vs the GLB on a **mass view** (generated stair/slab cells count as silhouette
  mass — scoped to the swap, every other fixture stays dressing), closure no-regress, protected
  regions byte-identical (`protectViolations`, now exported from shell-regularize — the only
  T-102 module change, one line). Chimney **re-seated** (gap to a floating stack base filled with
  its own block, additions listed, protect judged without them). **Attempt ladder** (as-fitted →
  voxel-pitch → each with gable ends), duplicates skipped, every rung recorded with
  reasons/iou/findings; all rejected → input returned unchanged. Banded protrusion census
  (solid-only) before/after. Per-gable fit-error gate drops out-of-tolerance gables, named.
- `benchmarks/sculpture/roof-program.mjs` + `roof:{cottage,gatehouse,church}` scripts — impure
  runner: input pins (component record `source.sha256` vs the on-disk regularized shell),
  registry-driven (no subject constants), double-run byte-identity (sha256 recorded), **unmapped
  THROW gate** (every stair/slab state through the live `blockStateId` path), declared residual
  budget asserted (6 line-end cells per gable), before/after renders at 135°/225°/315°,
  `roof/<subj>.{json,md}` + `roof/<subj>/artifact.json` + evidence frames; `--repro`/`--offline`;
  honest-failure record on throw.

**Modified**: `src/view/shell-regularize.mjs` (export only), `package.json` (scripts),
`.gitignore` (roof render PNGs). **Committed evidence**: `benchmarks/sculpture/roof/*`,
`pr/assets/frames/roof-{cottage,gatehouse}-{before,after}.png`.

## Acceptance criteria

1. **Fit core** ✅ — pure, synthetic-tested; eave/pitch/overhang/ridge fitted; fit error recorded
   per side (rmse vs the parametric surface + glb agreement angles + both gradients); outside
   tolerance → regularized roof stays, failure named.
2. **Generator** ✅ — stair courses with correct facing/half (proven state path; legality asserted
   in tests against CARD_ROWS), slab transitions, full blocks for steep pitch; cottage = spruce
   family from the kit, gatehouse = deepslate_brick; render `unmapped` = 0 on both (THROW-gated).
3. **Replacement under the cage** ✅ — IoU within tolerance at all 4 frozen azimuths on both
   accepts; closure stays closed; chimney byte-protected (re-seat exercised in unit tests; 0 cells
   needed live); auto-rollback observed live — 4 rungs rejected across the two subjects, every
   rejection recorded with named reasons.
4. **Cottage + gatehouse runs** ✅ with one reading note — roof-band protrusions **16→0** and
   **18→2** measured on the regularized inputs (the AC's "146/165" were measured on the
   pre-regularize styled artifacts; the cage had already shaved most band spikes before this
   ticket). Before/after renders at exactly the gate-failed azimuths; fit errors + cage IoU/closure
   tables in the committed records.
5. **Named chain, no subject constants, tests green** ✅ — `roof:*` scripts; registry-only
   subjects; `npm test` 1341 pass.

## Test coverage

39 new unit tests across the three cores (synthetic records, shells, families): pitch-source
selection/boundaries, hip detect/suppress, footprint fill, overhang/null path, all finding codes,
stair facing per slope direction, slab half-steps, steep-pitch risers, valley composition, solid
infill, state legality, family morphology + vocabulary gating, swap accept path, IoU/protect
rollbacks, fit-error gable drop, ladder rungs (pitch + gable-ends), census restriction, chimney
re-seat, determinism (fit, generation, swap). Integration is the live runner with hard asserts
(pins, double-run, unmapped, budget). **Gaps**: the closure-regression rollback branch is
structurally hard to reach for solid wedges (the wedge seals the band by construction) — the check
stands as defense-in-depth but only its arithmetic, not a live trip, is exercised; hip generation
is synthetic-only (both live subjects resolved to plain gables — gatehouse's detected hip was a
fragmented-ridge false positive the cage refuted).

## Open concerns (for the human reviewer)

1. **The chain does not consume the new roof yet — by design.** Zone-fill repaints surface cells
   with stateless placements; last-write-wins would cube every stair. Component-aware skinning is
   S-106 (epic DAG: S-104 → S-106); the swapped artifact (`roof/<subj>/artifact.json`) is its
   input. Consequently the multi-angle judge has NOT been re-run on these roofs (that re-verdict
   is S-107's claim to test).
2. **Stairs are invisible in renders** (pinned T-097 lens gap, prismarine-viewer 1.33.0): the
   committed after-frames show the solid wedge with notch lines where stair treads sit, and ridge
   caps can read as floating beams. Geometry is proven by the unmapped gate + committed states +
   the pure-rasterizer IoU, not pixels. If S-106/S-107 need stair pixels, the lens must be fixed
   first (an E-22-style task, deliberately out of scope here).
3. **The gatehouse accepted rung is the 4th hypothesis** (voxel pitches + suppressed hip). Both
   glb pitches and the hip demand were refuted by the cage — consistent with the record's own
   evidence (glb rmse to 8.35, ridge fragment x 1..5). If a reviewer prefers the glb gradients to
   win more often, the fix belongs in T-103's alignment (scale-exact instead of aabb-affine), not
   in loosening this ticket's gates.
4. **Census semantics changed for this measurement**: banded census counts solid cells only and
   budgets 6 line-end cells per gable (geometric formula). The pinned T-102 whole-shell census is
   untouched. Flagging because "protrusions ≈0" now has two definitions in the codebase, scoped
   by module and documented in both.
5. **Gable-end walls become roof-field material**: the carve regenerates everything in the band as
   the wedge, so gable-end triangles that were wall-colored are now spruce/deepslate. Form is this
   ticket's contract; material zoning on the rebuilt geometry is exactly S-106's re-pinning work.
6. **Church not run live** — the script exists and is registry-generic (its null kit record would
   produce a named `kit-roof-field-missing` fallback today); the AC names cottage + gatehouse. The
   church belongs with S-106/S-107 where its skin-gate unblock is the measured claim.
7. **Concurrency**: T-105-01 (shaped-vocabulary) was live in a sibling session during this work;
   package.json was staged line-selectively so only `roof:*` landed here. Their `shaped:*`
   working-tree edit is preserved uncommitted. No shared module conflicts (they consume the cage's
   injectable step seam; this ticket only added an export).

## Commits
77ee1f5 fit core · 09faaf0 generator · 667faac swap + protect export · f1a3a82 runner/scripts ·
b72d8a9 pitch-source attempt ladder · 965d1ac gable-ends/surface/census refinements ·
5235b38 records + artifacts + frames.
