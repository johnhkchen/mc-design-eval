# T-052-01 — Design: surgical loop on the GLB-voxel builds

## The decision in one line

Add **one new benchmark harness** — `benchmarks/sculpture/glb-voxel-surgical.mjs` — that re-runs the
**unchanged** `reviseLoop` on the **T-051-01 GLB-voxel artifacts** with `glbFormTarget({glbPath})` pointed
at the **same GLB the build came from**, records the per-region tweak trace + before/after GLB IoU +
categorical verdict, and reuses (not clones) the sibling harness's verdict logic. No `src/` change.

## Why this is mostly a wiring job (and where it differs)

T-049-01 already proved the seam: concept→GLB swap, zero loop change. T-051-01 already produced valid
GLB-voxel artifacts. This ticket is the **composition** — point the proven loop at the proven build with
the proven target. The genuine design choices are narrow:

1. **Input source** — `glb-voxel/<subj>/artifact.json` (not `runs/<run>/artifact.json`). The build *is* a
   voxelized GLB, so `buildBounds = artifactBounds(artifact)` and the GLB share a coordinate origin by
   construction — the cleanest alignment the `mapVoxelRegionToMesh` map will ever see.
2. **Regions** — must target the *voxelization* artifacts (this build's defects), not the text→JSON
   line-loss defects the T-049-01 regions targeted. Chosen from the occupancy histogram (Research).
3. **Route coverage** — the AC explicitly wants "procedural vs LLM-edit". So run **two regions per
   subject**: one routed to the deterministic procedural pass, one to the LLM block-editor.

## Options considered

### A. Clone `glb-formtarget-ab.mjs`, repoint paths (rejected as-is)
Fastest, but (a) the single forced-`curve` region shows only the LLM route — the AC wants both; (b)
cloning `formVerdictOf`/`VERDICT_GLOSS` duplicates exported logic. The
`parallel-roots-duplicate-shared-deps` memory and T-050-01's duplicate-parser scar both say: **reuse the
exported symbol, don't copy it.** → Adopt the *structure* of A but import its verdict helpers and run a
two-region (two-route) list.

### B. Generalize `glb-formtarget-ab.mjs` to take an input dir + region list (rejected)
DRYest in theory, but it would edit a committed T-049-01 deliverable (its recorded numbers + header are
part of that ticket's evidence), risking its reproducibility, and force a parameterization the sibling
never needed. Two small sibling harnesses that each tell one clean story beats one parameterized harness
that tells two muddled ones. The shared *logic* (verdict) is already factored out as exports — that's the
right seam to reuse. → Rejected; import the helpers, keep harnesses separate.

### C. New harness, import shared helpers, two-route region list (**chosen**)
- Reuses `formVerdictOf` + `VERDICT_GLOSS` from `glb-formtarget-ab.mjs` (DRY, no clone).
- Reuses `reviseLoop` / `liveFormScore` / `glbFormTarget` / `makeFormEditor` / `region.mjs` unchanged.
- Adds only harness-local glue: the two subjects' region lists, a per-region **critic** that assigns the
  configured route, the I/O (read glb-voxel artifact, write `glb-voxel-surgical/<subj>/` renders + the
  `.json`/`.md` summary), and a small **P14 reporter** derived from the loop's own `locked`+`trace`.

## The per-region critic (how both routes get exercised)

`makeFormEditor` routes `relief`/`material` → procedural (`scopedTweakFor`), any other route → LLM. The
default `proceduralDiagnose` would route everything flat→procedural, so the harness injects a **critic
closure** that maps the *current region* (matched by its spec) to its configured `{defect, where, route}`:

- **LLM region** → `route: "curve"` → the editor proposes a bounded block-edit via `baml-revise.mts`.
- **Procedural region** → `route: "relief"` → the deterministic E-11 relief pass, scoped to R.

This is exactly how T-049-01 forced the route, generalized to two regions. The loop body is still
untouched — the route assignment lives entirely in the injected `diagnose` seam.

## The regions (from the occupancy histogram)

| subj | region | bbox | route | defect → where |
|------|--------|------|-------|----------------|
| koi | tail fin | `min[9,0,-2] max[15,16,9]` | curve (LLM) | thick-fin / stair-stepping → the caudal fin (a thin sheet voxelized into a chunky stack) |
| koi | mid-flank | `min[-6,3,-4] max[2,12,4]` | relief (proc) | flat-skin → the dense mid-body flank |
| heart | aortic arch | `min[-8,18,-10] max[8,26,10]` | curve (LLM) | almost-closed-arch → the great vessels (a near-solid taper, not an open loop) |
| heart | ventricle | `min[-8,4,-8] max[8,14,8]` | relief (proc) | flat-skin → the ventricular wall |

Order: LLM region first (the headline artifact), procedural second. The four regions per subject do not
overlap, so locking is not *forced*; P14 is still demonstrated by (a) the loop's `locked[]` (any accepted
region is recorded and structurally never re-entered) and (b) the kept-vs-rolled-back counts. Contriving an
overlap just to trip the lock would be theatre — the invariant is real and unit-tested in `loop.test.mjs`.

## The accept signal & the verdict (the measurement)

- **Per-region accept gate** = `glbFormTarget.scoreRender(renderPath, R)` — the **true per-region 3-D
  IoU** (R-framed build render vs the GLB silhouette clipped to R's mapped mesh box). Recorded as
  `scoreBefore→scoreAfter` in each trace entry. A tweak is kept iff it strictly raises this.
- **Whole-object verdict** = `wholeObjectScore` before vs after, classified by the **imported**
  `formVerdictOf` (GLB-after vs GLB-before, `improved|held|regressed|unknown`). This is the "judge
  categorical". `regressed` is structurally impossible under the rollback gate → it is an *alarm*, kept in
  the vocabulary as a self-check (the same guard that caught the T-049-01 baseline-mixing bug).

## Honesty stance (what the report must say plainly)

The builds start at IoU 0.62 (koi) / 0.88 (heart). Improving an already-close form with a *local* edit is
hard; a **held** outcome is the honest, expected base case and will be reported as such — with explicit
kept-vs-rolled-back counts per route, and a sentence on **whether** the surgical pass cleaned the targeted
voxelization artifact (and where it didn't). No score-chasing. The deliverable is the honest trace, not a
number going up.

## Testing strategy

- The harness is GL + metered → **not** in `npm test` (every sibling A/B is the same). `npm test` must stay
  green by **not touching `src/`** — the loop's P14 cage and the form-target math are already unit-tested
  there. New *pure* logic is ~nil by design (verdict reused; the P14 reporter is a 3-line read over the
  loop's own outputs).
- Verification = a **live run** producing committed `glb-voxel-surgical.{json,md}` + renders, plus
  `npm test` green. An `--offline` regen path (re-derive verdicts from committed numbers) mirrors the
  sibling for reproducibility without GL/model.
