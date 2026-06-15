# T-103-01 component-decomposition — Review

E-27 / S-103. The blob is now named components with geometry: a pure, deterministic decomposition
core segments a shell into masses, roof planes (GLB-fitted), wall slabs, and opening groups, and
writes the `component-record/v1` JSON that every downstream E-27 consumer (S-104 roof-as-program,
S-105 arches, S-106 component-fed skin) reads as the single contract.

## What changed

**Created**
- `src/form/component-decompose.mjs` (955 lines) — pure core: `fitPlane` (exact incremental LSQ),
  column-run codec, heightfield + 3×3 median analysis surface, `segmentMasses` (ring-outlier
  protrusion pass + gap-clustered height classes + junction surfaces), `roofPlanes`
  (planarity-seeded, angle-gated region growing; seam-band absorption; eave edges; ridge
  candidates), `wallSlabs` (modal-depth planes + coverage), `openingGroups` (head/jamb lift from
  `openings(..., {withCells:true})`, arch candidates with spring/crown), `decompose` orchestration.
- `src/form/component-decompose.test.mjs` — 23 tests on synthetic shells (gabled box + chimney,
  two-prism church-like, pyramid/hip, arched doorway, flat box, spiked variants; ajv schema gate;
  double-run determinism; mesh-withheld fallback).
- `src/form/component-glb-fit.mjs` + test (5 tests) — `triangleStats`, exact-scale (`registry-scale`)
  and AABB-affine mesh→voxel alignments, per-plane area-weighted normal fits.
- `schema/component-record.schema.json` — JSON Schema 2020-12 for `component-record/v1`.
- `benchmarks/sculpture/component-decomposition.mjs` — impure runner: registry-driven input
  resolution (regularized shell preferred, raw fallback, `--shell` override), double-run byte
  determinism, ajv gate, pinned per-subject minimum expectations (a miss throws), component-colored
  renders, `--offline` re-assert.
- `benchmarks/sculpture/components/{cottage,gatehouse,church}.{json,md}` — committed records;
  `pr/assets/frames/components-*.png` — committed evidence renders.

**Modified**
- `src/view/structural-read.mjs` — additive `{withCells}` opt-in on `openings()`; default path
  byte-identical (the one shared-module touch, kept minimal by design).
- `package.json` (`components:*` scripts), `.gitignore` (regenerable PNGs).

Commits: `6b538fe`, `bce40a4`, `0ada03a`, `76538bc`, `a76791e`, `d0bc267`, `d997801`, `c00d939`,
`858b17b`. Deviations from plan (5, all documented in progress.md): ring-outlier protrusion pass,
angle-gated BFS growth (hip-line snaking), seam-band absorption, mean-normal-seeded GLB fit,
one schema-test fix.

## Acceptance criteria — all met

- Pure deterministic core, unit-tested on synthetic shells; tolerant of raw and regularized inputs.
- Records committed and visualized: cottage = two dominant gable planes split at the ridge + red
  protected chimney; gatehouse = colored roof + the gate's **2 arch candidates**; church = tower and
  nave as distinct colored masses with their own roof forms. Renders human-checked against these
  criteria (plan step 9).
- Single contract: `component-record/v1`, ajv-gated in runner and tests; no consumer variants.
- Registry-only; `npm run components:{cottage,gatehouse,church}`; `npm test` 1274/1274 green.
- Determinism: double-run bodies byte-identical (sha256 pinned per record); `--offline` passes for
  all three subjects with no recompute and no GL.

## Test coverage

- Unit (GL-free): every exported core function on synthetic shells; GLB-fit math on synthetic
  triangle soups; schema validated in-test. 23 + 5 + 1 new structural-read test.
- Integration: the runner on the three committed shells with hard-asserted minimums + determinism +
  ajv; `--offline` as the cheap re-verifier.
- Visual: committed component-colored oblique frames.

**Gaps:** the real-GLB path (gltf parse → alignment → fit on MB-scale meshes) is exercised only by
the runner, not unit tests (deliberate — glb-mesh tests own the parse). GL renders run on demand,
never in `npm test`. Junction-surface geometry is asserted on synthetics only; no real-subject
assert beyond "junctions exist".

## Open concerns

1. **Roof over-segmentation on real shells.** Cottage records 8 planes (2 dominant gables + small
   fragments over dormers/edges), church 17. Minimums are met and the dominant planes are correct,
   but S-104 needs a selection convention (e.g. by extent area) — the record carries area, so this
   is a consumer-side rule, not a schema change.
2. **AABB-affine GLB alignment quality.** glbFit angular deviation reaches ~24° on cottage and ~20°
   on church fragment planes. `angleToVoxelDeg` is recorded per fit so consumers can threshold;
   the voxel fit stays authoritative (design D3). If S-104 needs tighter reference anchoring on
   non-church subjects, alignment refinement (e.g. ICP-lite on plane inliers) is the follow-up.
3. **Degenerate gatehouse protrusion masses.** `mass-1`/`mass-3`: plan area 4, volume 0, inverted
   yRange (26..25) — ring-outlier artifacts on the crenellated parapet. They are `protected: true`
   (conservative — nothing will edit them) but near-empty masses in the record are noise; a
   min-volume floor on protrusion masses is a one-line candidate fix if downstream chokes.
4. **Low wall-slab coverage on cottage** (0.36–0.45, all four walls): the regularized raw-skin wall
   is not a single-depth plane. Recorded as `slab-low-coverage` findings, not hidden; S-106 should
   treat coverage as the re-author trigger, not an error.
5. **`glb-fit-missing` on fragment planes** (cottage roof-7; gatehouse roof-4..8): no aligned
   triangles in the normal cone over those extents — consistent with concern 1 (fragments are
   voxel-noise planes the mesh never had). Honest fallback per design.

## For the human reviewer

- Glance check: the three frames at `pr/assets/frames/components-*.png` against the AC wording.
- The contract worth a careful read is `schema/component-record.schema.json` — Rule 4 makes this
  the interface for three downstream stories; renaming fields later is expensive.
- Not wired into styled/challenge chains by design (downstream stories unbuilt; avoids T-102 file
  collisions). The chain integration belongs to the first consumer (S-104).
