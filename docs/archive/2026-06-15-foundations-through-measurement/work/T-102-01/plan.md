# T-102-01 regularization-cage — Plan

Six steps, each atomically committable. Build order from structure.md: core before runner, runner
before chain wiring, evidence runs before docs.

## Step 1 — Census + morphology cores (commit 1)

Create `src/view/shell-regularize.mjs` with: `REGULARIZE_DEFAULTS`, `protrusionCensus`,
`raggedColumnRate`, internal `erodeKeys`/`dilateKeys` (6-cross, ground-solid erosion, protect
mask), `majorityNeighborBlock`, `openShell` (erode→dilate, diff-component labeling via
`componentLabels`, minKeep restore, declared removed/restored lists), `closeShell`
(dilate→erode, majority-block adds). Create `src/view/shell-regularize.test.mjs` covering:

- census vs hand-counted synthetic shells (isolated cube = 6 exposed faces → spike; flat slab →
  zero ragged; stepped slab → known ragged count);
- open removes 1-cell spikes and 1-thick fins from a solid box; census drops to 0; box mass
  otherwise intact (dilate regrows the peeled surface exactly);
- 2×2×4 chimney on a box roof: removed by raw open, **restored** by minKeep=9; restored list
  declares its size;
- close fills a 1-wide notch; added cell's block = majority 6-neighbor, lexicographic tie-break;
- protect predicate: cells inside are never removed (open) nor added (close);
- ground-solid: the box's bottom layer survives open (no peel from beneath);
- forms/states survive on kept cells (occupancyFromCells round-trip).

**Verify**: `npm test` green (1217 existing + new). Nothing else touched.

## Step 2 — Pure silhouette path (commit 2)

Add `exposedFaceMesh`, `voxelSilhouettes`, `silhouetteIoUs` to the core + tests:

- `exposedFaceMesh` on a unit cube: 6 faces × 2 tris, 4 verts/face; bounds `[min, max+1]`;
- a 2×2×2 cube's mesh rasterized at `+x+z` (via `resolveAngle`) yields a non-empty mask whose
  normalized form IoUs ≈ 1.0 against itself, < 1 against a stretched box;
- `silhouetteIoUs` against refSils built from a *different* mesh scale of the same shape ≈ 1.0
  after normalization (the framing-cancellation property the cage relies on).

**Verify**: `npm test` green; no GL anywhere on the import path (test glob runs it).

## Step 3 — The cage + the lift (commit 3)

- Add `regularizeShell` (control flow per structure.md: baseline-anchored IoU floors, closure
  check with caller regions, protect verification, StepRecord trace, rejected ⇒ rollback).
- Lift `protrudingStackRegion` verbatim from `spray-paint.mjs` into the core (exported); swap
  spray-paint to import it; delete the local copy.
- Tests: cage acceptance happy path (spiky box + box refSils → open accepted, census improves,
  trace records IoUs); rejection on IoU (tolerance 0 + a step deleting a wing → rejected, output
  unchanged, reason string names the azimuth); rejection on closure breach; rejection on protect
  violation (defense-in-depth: a deliberately protect-ignoring step fn); cumulative drift anchored
  to input baseline; determinism (two runs byte-equal); `protrudingStackRegion` box+stack
  behavior (ridge plateau, stack columns).

**Verify**: `npm test` green. `grep -c protrudingStackRegion benchmarks/sculpture/spray-paint.mjs`
shows import-only. `node --check` both files.

## Step 4 — Evidence runner + scripts + ignore rules (commit 4)

Create `benchmarks/sculpture/regularize-shell.mjs` (structure §3: SUBJECTS input table, baseline
pins, protect = chimney predicate + opening-AABB predicates, GLB refSils, double-run
byte-identity, record schema `shell-regularize/v1`, md renderer, `--offline`, tryRender oblique
`-x-z` before/after, frames copy). Add the three `regularize:*` npm scripts and the gitignore
rule for `benchmarks/sculpture/regularize/` PNGs.

**Verify** (the AC #4/#5 evidence run):
- `npm run regularize:cottage && npm run regularize:gatehouse && npm run regularize:church`
- Each run prints census before/after; **declared targets**: spikes ≥50% reduction
  (276/132/602 baselines), ragged ≥10% relative reduction; **zero cage regressions** (no accepted
  step violating a check — assert in-runner: every accepted StepRecord has empty reasons; any
  rejected step is fine but must be recorded).
- Before/after renders exist; frames copied to `pr/assets/frames/`.
- `npm run regularize:cottage -- --offline` re-asserts the committed record.
- If a target is missed: record the measured number and the named residual (the AC allows honest
  gaps — do NOT tune subject-specific constants to force it; adjust the *shared* radius/minKeep
  only if it helps all three subjects, and record the choice).

Commit: runner + scripts + gitignore + records + artifacts + frames (PNG working renders stay
ignored).

## Step 5 — Chain wiring (commit 5)

Modify `challenge-milestone.mjs`: `runChain` loads `def.glb` → refSils → `shellStage(base,
refSils)`; `shellStage` appends regularize after plugClosure (protect/chimney + openings,
rebuildArtifact, assertArtifact) and returns the `regularize` report block; extend the record's
`shell` section + md line; update `PIPELINE_ORDER` strings in challenge- and styled-milestone.

**Verify**:
- `node --check` on both runners; `npm test` still green (no src change).
- Chain smoke: `npm run challenge:cottage -- --verify` — must execute the full
  provision→shell(+regularize)→skin chain without crashing; the sha comparison is EXPECTED to
  report divergence vs the committed (pre-regularize) record — that is the named, documented
  consequence (structure.md "Boundaries"), not a failure of this step. If `--verify` turns out to
  need unavailable externals (dwebp/GL hard-fail), fall back to a one-off node invocation of
  `runChain` on cottage with temp output paths, and record that deviation.

## Step 6 — Progress + review artifacts (commit 6)

Write `progress.md` (steps completed, deviations, AC checklist) and `review.md` (files
created/modified, test coverage and gaps, open concerns: stale challenge/styled records until
S-107 re-run, residuals per subject, anything flaky). Final commit of docs.

## Testing strategy summary

- **Unit (npm test)**: all pure cores — census, morphology, silhouette path, cage, lifted region
  detector. Synthetic shells only; no fixtures from disk; no GL.
- **Integration (on-demand npm scripts)**: the three-subject evidence runs ARE the integration
  tests, with in-runner hard asserts (baseline pins, zero-regression check, double-run
  byte-identity) — the shell-integrity runner pattern.
- **Chain**: `--verify` smoke for crash-freedom; full milestone re-runs are S-107 scope.

## Commit messages (Co-Authored-By footer per repo convention)

1. `feat(E-27 T-102-01): shell-regularize pure core — protrusion census, ragged-column rate, open/close with minKeep restore`
2. `feat(E-27 T-102-01): pure voxel silhouettes at the gate azimuths — exposedFaceMesh ∘ rasterizeSilhouette, normalize-then-IoU`
3. `feat(E-27 T-102-01): the regularization cage — baseline-anchored IoU floors, closure + protect checks, recorded rollback; protrudingStackRegion lifted to src`
4. `feat(E-27 T-102-01): regularize:* evidence runner — cottage/gatehouse/church before/after census, renders, frames`
5. `feat(E-27 T-102-01): regularize stage wired into the shell chain after plugClosure`
6. `docs(E-27 T-102-01): RDSPI artifacts`
