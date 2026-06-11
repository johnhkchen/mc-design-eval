# T-118-01 roof-form-seam — Design

Decisions for (1) the roof-region diff instrument, (2) where its artifacts live, (3) the targeted
refit mechanism. Grounded in research.md; constraints: pure metrics unit-tested, no judge runs, no
subject constants, tolerance/fallback semantics unchanged, legacy `--repro` untouched.

## D1. Comparison space — whole-object XOR with region attribution

**Options considered:**

- **(a) Per-region mask pairs** — render build region (`exposedFaceMesh(occ,{cells})`) and GLB
  region (`rasterizeSilhouette(mesh,{region: AABB})`) separately, IoU each pair. *Rejected*: the
  GLB side has no region partition — 3-D AABB clipping is far too coarse for thin regions (ridge,
  eaves are 1-cell strips; their AABBs project to rects swallowing half the roof). Also region
  masks framed by their own bounds aren't comparable; framing fixes exist but the GLB-partition
  problem stands.
- **(b) Screen-rect `regionIoU`** — project region bboxes, use form-fidelity's `regionIoU`.
  *Rejected*: rects of the four roof regions overlap heavily at 30° elevation; mismatch px would
  double-count and attribution would be unanswerable.
- **(c) Whole-object XOR + nearest-region attribution** — **chosen.** Compute build and GLB
  whole-object silhouettes per azimuth exactly as the cage does (`voxelSilhouettes` /
  `rasterizeSilhouette` → `normalizeSilhouette` to a common grid, `fit:"aspect"`), take the XOR
  (mismatch) mask, and attribute every mismatch pixel to a region by nearest projected build-region
  cell center. Regions partition the mismatch (no double counting); pixels where the GLB has mass
  and the build doesn't (e.g. a missing ridge course) still attribute correctly — the nearest
  projected region IS the ridge. One comparison, the same one the cage already trusts.

Mechanics for (c): region cells (voxel coords) are projected with `projectPoint` under the same
`framedCamera` the build silhouette used, then mapped through the same bbox-crop + aspect
normalization `normalizeSilhouette` applies. `normalizeSilhouette` doesn't expose its transform —
add an optional `{withTransform:true}` return (or a sibling `normalizeTransform(mask, opts)`
helper) rather than re-deriving it in the new module. Attribution = nearest projected cell center
(squared px distance); ties broken by fixed precedence `ridge > ends > eaves > slopes` (thin
regions win over area regions, declared once, subject-independent). Mismatch direction is kept:
`extra` (build ∖ GLB) vs `missing` (GLB ∖ build) per region.

A pixel-distance cap (e.g. none / ∞) was considered to leave "far" mismatch unattributed —
rejected for v1: wall-band mismatch is excluded up front instead (see D2 regions include a
`wall` catch-all below the band floor), so everything left is roof-attributable.

## D2. Region decomposition — from the recorded gable parametrics

Both paths carry the same gable shape (roof-program `fit.gables` / provision-fit `roofs[].gables`).
Regions are derived purely from the record, no geometry re-fitting:

- **ridge** — the gable's ridge cells (cap-course columns) at the roof surface height.
- **gable ends** — per end, columns with run-coordinate beyond `ends.{lo,hi}.faceCoord` (the face
  plane and verge overhang strip); when `ends` is absent (refused/hip), the outermost footprint
  column band at that end (width 1) — same rule everywhere, no per-subject width.
- **eaves** — per side, the `eaveEdge` column strip along `eaveDir` (the overhang/sheet columns).
- **slopes** — remaining footprint columns.
- **wall** — everything below the band floor; mismatch attributed here is reported but is not a
  roof delta (keeps the partition total — nothing silently dropped).

Cell y for projection = the build's actual occupied top per column (heightfield), so the
attribution reflects what was built, not the parametric ideal. **Fallback roofs** (church tower
flat-cap; any `roof-unfitted`): no gable parametrics exist — the whole roof band is one named
region `unpartitioned`, recorded with the fallback's finding code. Honest, and it still localizes
mismatch to the roof band.

## D3. Height profiles — voxel space, aligned-triangle sampling, differential anchoring

Silhouettes can only refute (memory); the ridge question needs height evidence. Per gable:

- **Build profiles**: from the build heightfield — ridge profile h(v) = max column height across
  the gable at each ridge-axis coordinate v; rake profiles h(u) along each gable-end face column
  line (run coordinate u from ridge to eave).
- **GLB profiles**: sample the same column lines against the GLB triangles transformed into voxel
  space by the existing `alignedTriangles(mesh, alignment)` (the end-fit path) — per column, the
  max y of triangle coverage over that cell footprint. Reuses `aabbAlignment` exactly as roof-fit
  does.
- **Anchoring**: the doctrine says aabb vertical absolutes are never *applied*; this is
  *measurement*. Report both raw Δh(v) and eave-relative Δ((h−eaveY_build) − (h_glb−eaveY_glb)),
  where each side's eave anchor is measured in its own frame (build: gable `eaveY`; GLB: median
  sampled height over the recorded eave-edge columns). The eave-relative profile is the
  refit-grade evidence (differential, doctrine-compliant); raw is context.
- Summary numbers per region: rmse + max |Δ| + signed mean, 3-decimal rounded (record convention).

*Rejected alternative*: voxelizing the GLB (`voxelizeGlb`) and diffing heightfields — a second
grid with its own scale/origin doubles alignment surface; triangle sampling under the one existing
alignment is strictly less machinery.

## D4. Module/runner split and artifact home

- **Pure core**: `src/form/roof-region-diff.mjs` — region derivation from a gables record,
  mismatch attribution, height-profile sampling, record assembly. Unit tests
  (`roof-region-diff.test.mjs`) on synthetic gables/masks/triangles — no fs, no GL, byte-stable.
  Small pure extensions where needed: `normalizeSilhouette` transform exposure (form-fidelity) and
  a `frameBounds` opt for `rasterizeSilhouette` if subset framing is needed for overlays.
- **Runner**: `benchmarks/sculpture/roof-diff.mjs` (`npm run diff:roof [-- --subject s] [--path p]`).
  Per subject × path {generated, reconstructed}: load build artifact
  (`generated/<s>/artifact.json` / `challenge/<s>/artifact.json`), the path's gables record, the
  GLB; produce `benchmarks/sculpture/roof-diff/<s>-<path>.json` (schema `roof-region-diff/v1`,
  committed — beside the gate records) + a committed contact sheet
  `pr/assets/frames/roof-diff-<s>-<path>.png` (4 azimuths, mismatch overlay tinted by region,
  caption bar via the existing node-canvas pattern). Loose per-view PNGs go under
  `roof-diff/<s>-<path>/` and are gitignored (extend the existing multi-angle gitignore pattern).
  Subjects iterate from the `SUBJECTS` registry; barn emits a named skip record
  (`status: "skipped", reason: "T-117 not landed — no committed build on either path"`).
- Determinism: the runner is GL-free (pure rasterizer); double-run sha256 recorded like
  roof-program does (`--repro` style proof comes free).

## D5. Findings artifact

`docs/active/work/T-118-01/findings.md` PLUS a committed copy
`benchmarks/sculpture/roof-diff/findings.md` (the AC wants the analysis committed beside the
instrument). Per subject: which regions carry the mismatch px / profile error behind the failing
verdicts, with the gatehouse 315° regression decomposed explicitly (its diff at `-x+z`).
Written from the instrument's numbers only — no judge calls.

## D6. Targeted refits — mechanisms named now, selection gated on findings (E-30 Rule 2)

Candidate mechanisms (build only what the findings justify):

- **Gatehouse ridge** — the intersect failed by 0.103 cells ("y 26.397 not above eaves 26.5") while
  the GLB apex line is strong (rmse 0, span 26). Candidate rung: **`ridge-apex-differential`** —
  ridge y = voxel eave anchor + round₂(glbApex − glbEave), each measured in its own frame. This is
  a *differential* application (doctrine-compliant; never applies the absolute apex). Inserted in
  the ladder where `-ridge-fit` flavors sit; judged by the unchanged cage. If the diff shows the
  315° regression is *not* ridge-height (e.g. hip mass), the impossibility is named with the diff
  evidence instead — that is an accepted AC outcome.
- **Cottage gable ends** — accepted fits carry faceRmse 1.0–1.5 (tolerance-passing but the worst
  accepted values in the fleet); `cross-lo` is a buried interior end (correctly refused — not a
  refit target; named). Candidate: end-fit *evidence* refresh — re-cluster with the rake-profile
  evidence (verge tip from the profile knee rather than the face-cluster offset) as a new
  end-fit source tried only when faceRmse exceeds a declared (shared, non-tuned) evidence
  threshold... **only if** the diff attributes cottage mismatch to the ends. If the ends turn out
  clean at the silhouette/profile level (the faceRmse may be GLB-cluster noise), record that
  finding and do not refit — "no speculative rungs".
- All refits run through `roof-program.mjs` re-runs for the affected subjects (cage outcomes +
  fit errors land in `roof/<s>.json` as today), and before/after `roof-diff` records + sheets are
  the movement proof. No styled/gate re-runs (S-121 owns verdicts). Legacy single-mass subjects'
  code paths untouched; their `--repro` is asserted post-change.

## Rejected wholesale

- Rendering diffs with the GL viewer (prismarine) — the instrument must be deterministic and
  cheap; the pure rasterizer is already the cage's evidence source. GL stays out.
- A new alignment scheme (ICP/feature-based) to fix vertical absolutes — out of scope; the
  differential anchoring sidesteps it and matches E-27/E-28 doctrine.
- Putting diff records inside `multi-angle/` — those are judge-gate records (S-121's domain);
  a sibling `roof-diff/` keeps the no-judge boundary legible.
