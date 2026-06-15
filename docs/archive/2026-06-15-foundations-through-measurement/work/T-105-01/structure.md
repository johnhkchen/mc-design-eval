# T-105-01 shaped-vocabulary — Structure

## Files

### Created

| File | Role |
|---|---|
| `src/form/shaped-vocab.mjs` | Pure generators: stair run, slab step, arch ring (+ voxel disc) |
| `src/form/shaped-vocab.test.mjs` | Exhaustive orientation/state tests for all three generators |
| `src/form/shaped-fit.mjs` | Fit-from-component seam: spec + fit error, or null + named finding |
| `src/form/shaped-fit.test.mjs` | Synthetic-profile fits (circle/segmental/flat/ragged/degenerate) + real-record smoke |
| `src/view/opening-reconstruct.mjs` | Occupancy application: carve/fill heads, cage step adapter |
| `src/view/opening-reconstruct.test.mjs` | Synthetic-wall reconstruction + T-097/E-25 dressed-opening integration case |
| `benchmarks/sculpture/shaped-vocabulary.mjs` | Impure runner: fits + caged application + record + renders |
| `docs/active/work/T-105-01/*` | RDSPI artifacts (this set) |

### Modified

| File | Change |
|---|---|
| `package.json` | Three scripts: `shaped:cottage`, `shaped:gatehouse`, `shaped:church` |

### Explicitly NOT touched (T-104 in flight in a sibling thread)

`shell-regularize.mjs`, `component-decompose.mjs`, `component-glb-fit.mjs`, the regularize/
components runners, anything roof-named. The cage is consumed through its existing injectable
step seam only.

## Module interfaces

### `src/form/shaped-vocab.mjs` (pure; imports nothing from view/)

```js
export const SHAPED_SCHEMA = "shaped-vocab/v1";
export const SHAPED_DEFAULTS = Object.freeze({
  rmseTol: 0.8, flatRmseTol: 0.6, minArchWidth: 5, minArchRise: 2,
  pitchTol: 0.25, slabPitchTol: 0.15,
});
export const ASCENT_FACING = Object.freeze({ "+x":"east", "-x":"west", "+z":"south", "-z":"north" });

// {origin:[x,y,z], ascent:"+x"|"-x"|"+z"|"-z", steps>=1, width=1, winding:"walk"|"soffit", block}
// → [{pos, block, state:{facing, half, shape:"straight"}}]  (walk: half=bottom, facing=ascent;
//   soffit: half=top, facing=reversed). Throws on invalid spec (fail-loud, like occupancyFromCells).
export function stairRun(spec)

// {origin:[x,y,z], axis:"x"|"z", length>=1, kind:"bottom"|"top"|"double", block}
// → [{pos, block, state:{type:kind}}]
export function slabStep(spec)

// {center:[u0,y0] (floats), radius, span:{axis:"x"|"z", range:[lo,hi]}, yRange:[spring..yTop],
//  depth:{axis, range:[lo,hi]}, block}
// → { aperture:Set<"x,y,z">, ring:[{pos, block}], jambCells:["x,y,z"], headCells:["x,y,z"] }
//   aperture = head-window cells with (u−u0)²+(y−y0)² ≤ r² (y ≥ y0) — the voxel disc;
//   ring = window cells outside the disc (solid, full blocks);
//   headCells = ring cells 4-adjacent (in the wall plane) to the aperture crown,
//   jambCells = ring cells adjacent to the aperture flanks at/below y0 — dressing-pass labels.
export function archRing(spec)

export function flatHead(spec) // {level, span, yRange, depth, block} → same shape (degenerate disc)
```

### `src/form/shaped-fit.mjs` (pure; imports SHAPED_DEFAULTS)

```js
// Kåsa circle LSQ over [{at, topY}] → {center:[u0,y0], radius, rmse} | null (degenerate/collinear)
export function fitCircle(points)

// One opening record (T-103 shape) → head fit:
//   { kind:"arch",  spec:{center, radius, span, yRange, depth:null}, fitError:{rmse}, provenance }
// | { kind:"flat",  spec:{level, ...},  fitError:{rmse}, noop:bool ("already-flat") }
// | { kind:"none",  finding:{code, detail} }   // the honest miss — sampled head stays (Rule 1)
// Dispatch: archCandidate && spring!=null → fitCircle gated by rmseTol/minArchWidth/minArchRise/
// center-in-span/radius-sane; non-candidates and arch misses on candidates → flat (own gate).
export function fitOpeningHead(opening, opts = SHAPED_DEFAULTS)

// Roof plane record (voxelFit/glbFit gradients) → stairRun pitch spec:
//   {ascent, riseOverRun:1, courses, source:"glbFit"|"voxelFit", fitError:{pitchDelta}, findings[]}
// | null + finding when |max-gradient| not within pitchTol of 1.0. glbFit preferred; voxelFit
//   fallback is itself a named finding (Rule 1 provenance).
export function stairRunSpecFromPlane(plane, opts)

// Same contract at slab pitch (|gradient| ≈ 0.5 within slabPitchTol) → slabStep spec | null.
export function slabStepSpecFromPlane(plane, opts)
```

### `src/view/opening-reconstruct.mjs` (pure; imports occupancy + shaped-vocab + shaped-fit)

```js
export const RECONSTRUCT_SCHEMA = "opening-reconstruct/v1";

// Measure the wall's solid depth run at the opening's jamb columns (geometric, no constants).
export function openingDepthRun(occ, opening, dir)   // → {axis, range:[lo,hi]} | null

// The whole application, occupancy → occupancy (PURE):
// for each openingGroup/opening: fitOpeningHead → archRing/flatHead → carve cells at/below the
// curve inside the head window, fill cells above it (majority-of-solid-6-neighbors block,
// closeShell's rule). Openings with kind:"none" untouched.
// → { occ, openings:[{groupId, dir, kind, spec, fitError, carved, filled, jambCells, headCells,
//      noop, findings[] }], carved, filled }
export function reconstructOpeningHeads(occ, record, opts)

// Cage adapter: returns the {op:"opening-heads", fn} step regularizeShell accepts; fn closes over
// record/opts and stashes its report for the runner (fn returns {occ, ...report} per the seam).
export function openingHeadStep(record, opts)
```

### `benchmarks/sculpture/shaped-vocabulary.mjs` (impure runner)

Registry (paths + pinned input expectations only):
```js
const SUBJECTS = {
  cottage:   { shellArtifact: "regularize/cottage/artifact.json",  record: "components/cottage.json",   glb: "glb/cottage.glb" },
  gatehouse: { shellArtifact: "regularize/gatehouse/artifact.json", record: "components/gatehouse.json", glb: "glb/stone-gatehouse.glb" },
  church:    { shellArtifact: "regularize/church/artifact.json",   record: "components/church.json",    glb: "glb/church.glb" },
};
```
Flow per subject: load + `assertArtifact` shell, ajv-validate record → **vocabulary fit evidence**
(every roofPlane through `stairRunSpecFromPlane`/`slabStepSpecFromPlane`; every opening through
`fitOpeningHead`; all errors/findings recorded — stair/slab specs are evidence only, not applied:
the roof swap is T-104) → build refSils from GLB at `MULTI_ANGLE_GATE` azimuths (the
regularize-shell.mjs recipe) → `regularizeShell(occ, { refSils, regions: openingRegions(occ),
protect: [protrudingStackRegion(occ)], steps: [openingHeadStep(record)] })` → `rebuildArtifact` →
core **run twice, artifacts byte-identical (sha256 recorded)** → best-effort renders before/after
(gate azimuths; `unmapped === 0` asserted on the after-render) → write `shaped/<subj>.{json,md}`,
`shaped/<subj>/artifact.json`, `pr/assets/frames/shaped-<subj>-{before,after}.png`. `--offline`
re-asserts the committed record + artifact hash without GL.

## Internal organization & ordering

1. `shaped-vocab.mjs` + tests — zero deps, unblocks everything.
2. `shaped-fit.mjs` + tests — needs only DEFAULTS; verify the **real gatehouse profile passes the
   arch gate** here (the design's named risk) before any application code.
3. `opening-reconstruct.mjs` + tests — needs 1+2 plus occupancy; includes the dressed-opening
   integration case (synthetic wall + trapdoor-dressed aperture + arch head → closure holds,
   dressing states survive `rebuildArtifact`).
4. Runner + package.json scripts; run gatehouse → church → cottage; commit records + frames.

## Boundaries

- No GL, IO, Date, or randomness in any `src/` module (the test-glob contract).
- Generators never see occupancy or records; fits never see occupancy; only
  `opening-reconstruct` sees occupancy, and only the runner sees disk/GL.
- Block choice for filled ring cells is derived (neighbor majority), never a constant — the only
  block names in src code are test fixtures.
