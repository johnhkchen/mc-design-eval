# T-105-01 shaped-vocabulary — Review

## What changed

**Created (src, all pure, under the test glob):**
- `src/form/shaped-vocab.mjs` — the three generators: `stairRun` (4 cardinal ascents × 2
  windings, states from the T-097-proven vocabulary), `slabStep` (bottom/top/double), `archRing`
  + `flatHead` (voxel-circle / lintel head constructs with `headCells`/`jambCells` labeled for
  the dressing pass). `SHAPED_DEFAULTS` = the declared tolerances. Subject-agnostic; no block or
  dimension constants.
- `src/form/shaped-fit.mjs` — the fit-from-component seam (E-27 Rule 1): `fitCircle` (Kåsa LSQ),
  `fitOpeningHead` (arch|flat|none dispatch; every miss a named finding; fit error recorded on
  hit *and* miss), `stairRunSpecFromPlane`/`slabStepSpecFromPlane` (GLB fit preferred, voxelFit
  substitution itself a named finding; pitch legality 1:1 / 1:2).
- `src/view/opening-reconstruct.mjs` — the application: `openingDepthRun` (wall thickness at the
  flanking columns), `reconstructOpeningHeads` (carve/fill to the fitted spec; full-cubes-only
  carving so dressing survives; supported-only fills; neighbor-majority blocks; order-independent
  edits), `openingHeadStep` (the T-102 cage's injectable-step adapter).
- `benchmarks/sculpture/shaped-vocabulary.mjs` — impure runner; `npm run shaped:{cottage,
  gatehouse,church}` (+ `--offline`); records `shaped/<subj>.{json,md}` + `<subj>/artifact.json`
  + frames `pr/assets/frames/shaped-*` committed.

**Modified:** `package.json` (the three `shaped:*` scripts — note: this commit also carries the
sibling T-104 thread's concurrent `roof:*` lines verbatim, see Concerns), `.gitignore` (shaped
render stanza).

Commits: `0cd915f` (generators), `c4b87d9` (fits), `c0efbd6` (application), `a008ec9`
(runner + evidence), this docs commit.

## Acceptance criteria

- **Three pure generators, exhaustively unit-tested** ✅ — 8 stair orientations hand-written;
  all slab axes×kinds; the arch's aperture/ring/jamb/head sets hand-enumerated; determinism and
  fail-loud validation throughout.
- **Fit-from-component seam, fit error recorded, tolerance-or-named-fallback** ✅ — mirrors the
  `glbFitForPlane` honest-miss contract; the real gatehouse/church/cottage records are test
  fixtures; every gate's miss path pinned.
- **Applied under the cage** ✅ — gatehouse: both gate arches rebuilt (vertical rmse 0.439,
  mouths symmetric arcs; 723 carved / 118 filled; cage accepted, per-azimuth IoU unchanged at 4
  decimals, closure no-regress); church: arch/flat per geometry (6 squared, 26 fixpoint noops);
  before/after renders, after-render `unmapped` = 0 *enforced* (runner throws); the
  dressed-opening + closure integration case is a unit test (T-097/E-25 semantics byte-checked).
- **Subject-agnostic library, documented, npm test green** ✅ — 1335 pass / 0 fail.

## Test coverage

28 new tests across three suites: generators (10), fits (11), application+cage (7). Notable:
the caged integration runs the *real* `regularizeShell` on a synthetic dressed wall (accept,
reject/rollback, and protect paths all exercised); real-record fixtures pin the witnessed
subjects' outcomes. **Gaps:** the runner itself is untested (impure-wiring convention here —
its determinism/offline checks are self-asserting); `stairRun`/`slabStep` are not yet *applied*
to any subject (consumed by S-104; only their fits are witnessed in the records).

## Findings a reviewer should weigh

1. **The arch gate was strengthened during implementation** (recorded deviation): radial Kåsa
   RMSE alone passes a zigzag head (0.668 on alternating 10/15s) — the gate now also requires
   disc coverage of every column and gates on *vertical* RMSE vs the upper arc. This is stricter
   than the design text; the witnessed gatehouse arches still pass with margin (0.439 vs 0.8).
2. **Gatehouse passage interior** — the head construct's edit window is the head (spring-center
   to extrados); pre-existing sampled mass *inside* the gate passage below/behind the spring
   (e.g. a residual ledge at y=7 mid-passage, one ground-solid column at z=4) is out of scope
   and stays. The mouths read as arches; the bore is not fully cleared. If S-106/S-107 want a
   clear bore, that is a separate, named op.
3. **Through-depth semantics** — `openingDepthRun` measures the full solid run at the flanks,
   so the gatehouse arch correctly tunnels the building; for the church, mirrored ±z window
   groups witness through-holes and produce overlapping (deduped) edits, and 594 interior ring
   cells were skipped as `ring-unsupported` (named, not filled). Honest but worth a look when
   S-106 consumes these labels.
4. **Cottage `flat-out-of-tolerance` ×2** (rmse 0.707 > 0.6): two window heads stay sampled by
   the Rule 1 fallback. If squaring them matters, the declared `flatRmseTol` would need a
   recorded, shared (never per-subject) revision.
5. **Stairs remain invisible in the render lens** (T-097 named residual, unchanged): the arch
   ring is full cubes partly for this reason; stair-run correctness is read-back-proven only.
6. **Shared-file concurrency**: `package.json` was edited by both this ticket and the in-flight
   T-104 sibling; my commit carries their `roof:*` lines verbatim. Lisa's DAG should ideally
   have an edge or a shared upstream for script registration (the
   `parallel-roots-duplicate-shared-deps` pattern) — flagging for the epic retro.

## Open TODOs (none blocking)

- S-104 consumes `stairRunSpecFromPlane`/`stairRun` for roof courses; the per-plane legality
  evidence is already in `shaped/<subj>.json` → `planeFits`.
- The dressing pass can now target `headCells`/`jambCells` labels from the records.
