# T-102-01 regularization-cage — Design

Decision: a pure `src/view/shell-regularize.mjs` module — 6-neighborhood morphological open/close
with **selective restore** (size-thresholded), a protrusion/ragged-column census, and a cage that
accepts each candidate step only if (a) per-azimuth silhouette IoU vs pre-rasterized GLB
silhouettes stays within a declared tolerance, (b) six-direction closure still passes, (c)
protected regions are byte-untouched — rejected steps roll back and are recorded. Wired into
`shellStage` (challenge-milestone `runChain`, inherited by styled-milestone) and exposed standalone
as `npm run regularize:<subject>` for the three-subject evidence run.

## The central trade: opening kills spikes AND chimneys

Binary opening (erode→dilate) on a solid-filled shell removes exactly the mass that erosion
deletes and dilation cannot regrow — attached spikes and fins. But a chimney (2×2 column) or spire
is *also* erosion-fatal. Options considered:

1. **Naive open + cage-only protection** — run open(r); if the chimney vanishes the IoU cage
   rejects the whole step. REJECTED: all-or-nothing; one legit thin feature blocks all 276 spike
   removals. The cage becomes a veto on progress instead of a safety net.
2. **Hand-declared chimney AABBs per subject** — REJECTED outright: subject-specific constants are
   forbidden (E-25 Rule 3, restated in this ticket's AC).
3. **Selective opening (CHOSEN)**: compute `open(occ, r)`; take the removed set `occ \ opened`;
   label its 6-connected components (`componentLabels` reuse, the componentStrip adapter
   precedent); **restore components with size ≥ `minKeep`** (an op parameter, like fillVoids'
   `minDepth`). Spikes/fins are 1–8-cell crumbs; a chimney/spire is a coherent ≥`minKeep`-cell
   mass. This is geometry-derived, parameterized, and unit-testable on synthetic shells — and it
   IS the ticket's "protected: thin features", computed rather than enumerated.

On top of (3), the ops also take explicit **protect regions** (world AABBs, `inRegion` reuse): the
runner passes `openingRegions(occ)` (close must not fill a declared window slit) plus a
procedurally-derived chimney stack region (the `protrudingStackRegion` idea from spray-paint.mjs,
re-derived in the pure core from the occupancy's own ridge — defense in depth alongside the size
restore). Protect semantics: **no add, no remove** inside the region; the cage independently
verifies the sub-volume is identical (check c), so an op bug cannot slip through.

## Morphology mechanics

- **Structuring element**: the 6-neighborhood cross (von Neumann ball), iterated `radius` times.
  Chosen over the 26-cube: consistent with every connectivity decision in the codebase (NEIGH6 in
  shell-integrity, componentStrip's 6-conn), and gentler per radius step (less mass swing).
- **Ground-solid**: for erosion-neighbor tests, `y < bounds.min[1]` counts as SOLID — the
  closureCheck convention; a building must not be peeled from beneath because terrain isn't in the
  artifact. The *census* keeps the plain definition (no ground rule) because that is the
  definition the ticket's 276/23.9% baselines pin (verified by exact reproduction in Research).
- **Close (dilate→erode)** fills pits/notches/slots ≤ 2·radius wide. Added cells need a block id:
  majority block among solid 6-neighbors in the step-input occupancy, lexicographic tie-break,
  fallback = step-input dominant (buildDominant precedent). Deterministic by construction.
- **Removal has no artifact op** — the stage returns an occupancy; the caller rebuilds via
  `rebuildArtifact` (componentStrip precedent; carries forms/states).

## The cage

`regularizeShell(occ, opts)` runs a **declared sequence of candidate steps** — default
`[open(r=1) with minKeep restore, close(r=1)]` — each individually caged (a failing close must not
roll back an accepted open):

- **(a) Silhouette IoU drift**: per gate azimuth (`MULTI_ANGLE_GATE.azimuths`, config-frozen),
  `IoU(normalize(voxelSil(candidate)), normalize(glbSil))` must be ≥ the *input shell's* IoU at
  that azimuth minus `iouTolerance` (default 0.02, an op parameter the runner declares and
  records). Anchoring to the input shell (not the previous step) bounds *cumulative* drift at the
  tolerance — the E-15 lesson ("free-form voxel edits regress without a 3-D target") applied as an
  invariant, not a hope.
- **(b) Closure**: `closureCheck(candidate, {regions})` must report closed (same allow-list the
  shell stage used). An open that re-breaches a plugged shell is rejected, not patched.
- **(c) Protected regions**: the occupancy restricted to each protect AABB must be identical
  (cells AND blocks) before/after the step.
- **Rollback**: any failure → the step's output is discarded, `current` stays, and the trace
  records `{step, accepted:false, reasons:[...], iouByAzimuth, closure, censusAfter}` — the
  revise-loop trace precedent ("recorded — never silently kept"). Accepted steps record the same
  shape with `accepted:true`.

### How the candidate silhouette is produced — purely

REJECTED: GL-rendering each candidate (prismarine-viewer) and `extractSilhouette`. GL is excluded
from decision gates (`reproducibility-excludes-gl-from-decisions`; E-24 Rule 2 double-run
byte-identity would die), and per-step renders are slow.

CHOSEN: build a triangle soup from the occupancy's **exposed faces** (2 triangles per exposed
face, unit-cube geometry, float bounds `[min, max+1]`) and feed it to the *existing*
`rasterizeSilhouette(mesh, {view: resolveAngle(azimuth)})` — nothing in that function is
GLB-specific (`{positions, indices, bounds}` in, mask out), and it is the exact camera the GLB
reference silhouettes go through. Both masks then go through the shipped
`normalizeSilhouette(…, {grid:128, fit:"aspect"})` → `iou` (the formScores precedent), which
cancels the mesh-coords vs voxel-coords framing difference. Zero new projection math; one new
voxel→tri-soup adapter (~30 lines, pure, testable against hand-computable masks).

The GLB reference silhouettes are **data into the core**: the impure caller loads the GLB bytes,
`loadMeshFromGlb`, rasterizes the 4 azimuths once, and passes `refSils` in. The core never does
I/O.

## Census metrics (AC #1)

Same module, pure, definitions pinned by the Research reproduction:
- `protrusionCensus(occ)` → `{byExposure: {0..6: count}, spikes: count(≥4)}` — plain emptiness
  test (matches the 276 baseline).
- `raggedColumnRate(occ)` → `{ragged, total, rate}` — heightmap max-y per (x,z); cliff = |Δh| ≥ 3
  vs any present 4-neighbor (matches 23.9%/28.1%/24.3% baselines).

## Wiring (AC #3)

1. **Chain**: `challenge-milestone.mjs` `runChain` loads the subject GLB (it already has
   `def.glb`), rasterizes the 4 reference silhouettes, and passes them to
   `shellStage(base, {refSils})`, which appends regularization after `plugClosure` and returns the
   cage trace in its report. `shell-artifact.json` therefore *is* the regularized shell — the
   downstream file seam (buildSkin reads it) is unchanged, and styled-milestone inherits the stage
   with no edits to its own chain. Refusing a GLB-less run is correct (all three subjects have
   GLBs; a future subject without one fails loudly, honest-failure rule).
2. **Standalone evidence runner**: new `benchmarks/sculpture/regularize-shell.mjs` +
   `npm run regularize:{cottage,gatehouse,church}` — reads the committed shell artifact
   (styled/ for cottage+gatehouse, challenge/ for church), runs the same core, writes
   `regularize/<subj>.{json,md}` + `regularize/<subj>/artifact.json`, double-run byte-identity,
   before/after census, before/after oblique renders (best-effort lens, `tryRender` pattern) and
   committed frames `pr/assets/frames/regularize-<subj>-{before,after}.png`. This is where AC #4
   and #5's three-subject before/after evidence comes from — cheap (no LLM judge, no skin chain).

Rejected alternative wiring: regularize as a *separate* chain stage writing its own artifact file
between shell and skin — more file seams, two milestone runners to edit, no benefit; and
regularize-before-shell-integrity (ticket explicitly says after; closure machinery must already
have run so check (b) is meaningful).

Note the blast radius honestly: committed challenge/styled records hold pre-regularization shell
shas; they stay self-consistent (offline asserts compare record↔committed artifact) and refresh on
their next live run. This ticket re-runs only the shell-level evidence, not the full styled chain
(LLM-judge cost, out of scope — E-27 S-107 owns the milestone re-run).

## Declared targets (AC #4 — implementer-declared)

- **Protrusions (≥4-face)**: ≥50% reduction per subject vs baseline (276 / 132 / 602).
- **Ragged columns**: measurable reduction per subject (≥10% relative) — declared modest because
  ≥3-block cliffs are mostly *structural* steps in the decimated roof, which open/close cannot and
  must not re-author; that residual is named and owned by T-104 roof-as-program.
- **Zero cage regressions**: no accepted step with IoU below tolerance / closure broken /
  protected region touched, across all three subjects (the trace proves it).

## Parameters (all op parameters, no subject constants)

`radius=1` (open and close), `minKeep=9` (restore threshold: a 2×2×3 chimney stub = 12 survives;
≤8-cell crumbs go — same spirit as pruneStrays' minCells), `iouTolerance=0.02`, gate azimuths from
`MULTI_ANGLE_GATE` (never re-declared). Defaults live in the core; the runner states them in the
durable record.

## Test design (unit, `src/view/shell-regularize.test.mjs`)

Synthetic shells (no fixtures from disk): solid box + 1-cell spikes/fins → open removes all,
census drops to 0; box + 2×2×4 chimney → restored by minKeep; box + 1-wide notch/slot → close
fills, block = majority neighbor; protect AABB → cells inside identical after both ops; cage with
synthetic refSils (rasterized from a box tri-soup) → destructive step (tolerance 0, step that
deletes a wing) rejected with reasons recorded, accepted step records IoU per azimuth; closure
breach injection → rejected; determinism: two runs byte-equal; voxel→tri-soup adapter: known cube
→ known silhouette bbox. Plus census functions re-asserted against tiny hand-counted shells.
