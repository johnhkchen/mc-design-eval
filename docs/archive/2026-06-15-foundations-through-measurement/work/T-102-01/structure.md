# T-102-01 regularization-cage — Structure

File-level blueprint. Pure core in `src/view/`, impure evidence runner in `benchmarks/sculpture/`,
one chain touch-point, one lift-and-reuse.

## Created

### 1. `src/view/shell-regularize.mjs` (pure core, ~300 lines)

Header comment: the E-27 S-102 framing (mesh-voxelization noise enters at the shell; every
smoothing step caged against the GLB — the E-15 lesson as an invariant). PURE — no GL/I-O/Date/
random; under the `src/**/*.test.mjs` glob.

Imports: `componentLabels` (../form/voxel-components), `occupancyFromCells`, `bareBlock`
(./occupancy), `closureCheck` (./shell-integrity), `rasterizeSilhouette` (../form/glb-silhouette),
`normalizeSilhouette`, `iou` (../form/form-fidelity), `resolveAngle` (./multi-angle),
`MULTI_ANGLE_GATE` (../config).

Exports (public interface):

```
REGULARIZE_DEFAULTS = Object.freeze({ radius: 1, minKeep: 9, iouTolerance: 0.02, grid: 128 })

protrusionCensus(occ) → { byExposure: number[7], spikes }        // plain emptiness; pins 276
raggedColumnRate(occ) → { ragged, total, rate }                  // |Δtop|≥3 vs 4-neigh; pins 23.9%
protrudingStackRegion(occ, {minPlateau=4}) → {contains(pos), columns:Set, ridgeY}
                                                                 // LIFTED verbatim from spray-paint.mjs
openShell(occ, {radius, minKeep, protect=[]})
  → { occ, removedCells, removed:[{size}], restored:[{size,minY}] }
closeShell(occ, {radius, protect=[]})
  → { occ, addedCells, added:[{pos,block}] }
exposedFaceMesh(occ) → { positions:Float64Array, indices:Uint32Array, bounds }   // tri-soup adapter
voxelSilhouettes(occ, azimuths) → Map<azimuth, mask>             // exposedFaceMesh ∘ rasterizeSilhouette
silhouetteIoUs(occ, refSils, {grid}) → { [azimuth]: number }     // normalize-then-iou per azimuth
regularizeShell(occ, { refSils, regions=[], protect=[], radius, minKeep, iouTolerance, steps? })
  → { occ, trace:[StepRecord], accepted, rejected,
      census: {before:{spikes,ragged…}, after:{…}}, iou: {baseline, final} }
```

Internal (not exported): `erodeKeys(keys, bounds, protect)` / `dilateKeys(keys, bounds, protect)`
on key-sets with the 6-cross element, **ground-solid** for erosion (y < min[1] counts solid);
`majorityNeighborBlock(pos, cellsMap)` (lexicographic tie-break, build-dominant fallback) for
close's added cells; `protectViolations(before, after, protect)` for cage check (c).

Conventions carried: protect entries are `{name, contains(pos)}` predicates (the zoneFill regions
shape — spray-paint already passes `protrudingStackRegion(occ)` in exactly this form); occupancy
in/out via `occupancyFromCells` preserving `forms`/`states` for surviving cells (componentStrip
precedent); removal never patches placements — callers rebuild via `rebuildArtifact`.

`StepRecord` (the rollback record, revise-loop trace precedent):

```
{ step: "open"|"close", params: {radius, minKeep?},
  accepted: boolean, reasons: string[],            // [] when accepted; e.g. "iou:+x+z 0.83<0.86-0.02"
  iouByAzimuth: { [az]: {ref: n, candidate: n, floor: n} },
  closure: { closed, reached },
  protect: { violations: number },
  census: { spikes, ragged },                      // of the candidate
  cells: { removed?, restored?, added? } }
```

`regularizeShell` control flow: census(before) → baseline IoUs of the INPUT occupancy vs refSils
(the drift anchor) → for each step in `steps` (default `[open, close]`): produce candidate → cage
checks (a) every azimuth `candidateIoU ≥ baselineIoU − iouTolerance`, (b)
`closureCheck(candidate, {regions}).closed`, (c) zero protect violations → accept (current ←
candidate) or discard; either way push StepRecord → census(after) on the final current. Throws
only on malformed inputs (missing refSils for a gate azimuth, bad params) — a rejected step is a
*recorded outcome*, not an error (AC: "rolls back automatically and is recorded").

### 2. `src/view/shell-regularize.test.mjs` (~250 lines)

Synthetic-shell suites per design: spike/fin removal & census zeroing; chimney (2×2×4) restore via
minKeep; notch fill + majority-block assignment; protect predicate honored by ops AND verified by
cage; cage rejection path (tolerance 0 + wing-deleting step → `accepted:false`, reasons recorded,
output occupancy unchanged); closure-breach rejection; baseline-anchored cumulative drift;
determinism (two runs, byte-equal rebuilt artifacts); `exposedFaceMesh` on a unit cube (8 verts ×
duplicated per-face = counts asserted, bounds `[min, max+1]`); census functions vs hand-counted
shells; `protrudingStackRegion` behavior preserved (box + stack → ridge plateau found, stack
columns flagged).

### 3. `benchmarks/sculpture/regularize-shell.mjs` (impure evidence runner, ~220 lines)

Mirrors the shell-integrity runner's shape exactly (its header, `--offline`, double-run,
record+md, tryRender, frames):

- `SUBJECTS = { cottage: {shell: "styled/cottage/shell-artifact.json", glb: "glb/cottage.glb"},
  gatehouse: {shell: "styled/gatehouse/shell-artifact.json", glb: "glb/stone-gatehouse.glb"},
  church: {shell: "challenge/church/shell-artifact.json", glb: "glb/church.glb"} }` — these are
  *committed input paths*, not subject behavior constants (the same rule shell-integrity's
  SUBJECTS table follows).
- Baseline pins asserted (the ticket's measured numbers): cottage spikes=276, ragged 157/656;
  gatehouse 132, 191/679; church 602, 334/1376 — drift in the committed inputs fails loudly.
- Per subject: read shell artifact → `artifactOccupancy` → openingRegions → protect =
  `[{name:"chimney", contains: protrudingStackRegion(occ).contains}]` + opening AABBs adapted to
  predicates → load GLB → `loadMeshFromGlb` → refSils = 4 × `rasterizeSilhouette(mesh, {view:
  resolveAngle(az)})` → `regularizeShell` (twice; byte-identity of rebuilt artifacts) →
  `rebuildArtifact` → `assertArtifact` → write `regularize/<subj>/artifact.json` +
  `regularize/<subj>.{json,md}` → best-effort before/after renders at the oblique azimuth
  (`-x-z`, the durable-skin witness angle) → copy committed frames
  `pr/assets/frames/regularize-<subj>-{before,after}.png`.
- Record schema `shell-regularize/v1`: inputs, params (declared tolerance/radius/minKeep),
  baseline pins, census before/after + reduction %, declared targets vs measured, full step trace,
  iou table, reproducible.sha256, renders, frames. `--offline`: re-assert record↔artifact sha +
  zero cage regressions + census numbers, no GL.

## Modified

### 4. `benchmarks/sculpture/spray-paint.mjs`
Delete the local `protrudingStackRegion` (~35 lines) and import it from
`../../src/view/shell-regularize.mjs`. Behavior-identical (function lifted verbatim); its test
coverage moves into the new core's test file.

### 5. `benchmarks/sculpture/challenge-milestone.mjs`
- `runChain(def, paths)`: after resolving `base`, load `def.glb` bytes → `loadMeshFromGlb` →
  rasterize the 4 gate-azimuth refSils → `shellStage(base, refSils)`.
- `shellStage(baseArtifact, refSils)`: after `plugClosure`/closure assert, derive protect
  (chimney predicate + opening predicates), run `regularizeShell`, `rebuildArtifact` from its
  occupancy, `assertArtifact`, and extend the returned report with
  `regularize: {accepted, rejected, census, iou, trace}`. The written `shell-artifact.json` is now
  the regularized shell; `buildSkin` and styled-milestone are untouched (same file seam).
- The durable record's `shell` block and the md renderer gain the regularize line; `PIPELINE_ORDER`
  strings in challenge-/styled-milestone gain "→ regularize (T-102 cage)" after shell integrity.

### 6. `package.json`
```
"regularize:cottage":   "node benchmarks/sculpture/regularize-shell.mjs --subject cottage",
"regularize:gatehouse": "node benchmarks/sculpture/regularize-shell.mjs --subject gatehouse",
"regularize:church":    "node benchmarks/sculpture/regularize-shell.mjs --subject church",
```

### 7. `.gitignore`
Extend the existing benchmark-PNG rules to `benchmarks/sculpture/regularize/*/**.png` (committed:
the two `pr/assets/frames/` copies per subject; gitignored: the working renders) — match the
shell-integrity precedent exactly.

## Deleted
Nothing.

## Boundaries & ordering constraints

- Dependency direction: `benchmarks → src` only; the lifted `protrudingStackRegion` makes the
  spray-paint import legal (was: runner-local pure logic).
- `src/view/shell-regularize.mjs` must NOT import from `multi-angle.mjs`'s impure surface —
  `resolveAngle`/`VIEW_ANGLES` are pure exports; `renderViews`' GL import is lazy inside that
  function (verified), so the module import is test-glob safe.
- Build order: core (1) → tests (2) → lift swap (4) → runner+scripts (3, 6, 7) → chain wiring (5).
  The chain wiring lands last so the evidence runs validate the core before the milestone path
  depends on it.
- Records under `benchmarks/sculpture/{challenge,styled}/` are NOT regenerated this ticket (LLM
  judge cost; S-107 owns the milestone re-run). They remain internally consistent; the
  challenge `--verify` mode will report sha divergence against the new chain until then — named
  in review.
