# T-123-01 glb-conditioning — Structure

Blueprint: files, boundaries, interfaces, ordering. (Per `docs/knowledge/pipeline-philosophy.md`
Stage 2 — this module IS the "then code" half of Form Evidence; textures are never read, so the
core consumes `parseGlbMesh` only, never `parseGlbColoredSurface`.)

## Files

### Created — pure core (runs under the `src/**/*.test.mjs` glob, no IO/GL/network)

**`src/form/form-sketch.mjs`** — the conditioning core. One module; the four AC steps are
exported separately for testing and composed by one entry point.

```
export const FORM_SKETCH_SCHEMA = "form-sketch/v1";

// every declared constant in one frozen block (AC: "declared target/tolerance/confidence")
export const SKETCH_PARAMS = Object.freeze({
  sampleScale: 48,            // internal occupancy substrate (voxelizeGlb scale, [8..64])
  faceTarget: 100,            // decimation cap — coarse faces kept by descending area
  weldEpsFrac: 1e-4,          // vertex weld grid, fraction of bbox diagonal
  symmetryConfidence: 0.80,   // below → no mirror applied, score still recorded
  footprintSnapTolFrac: 0.06, // jog snap tolerance, fraction of longer plan dimension
  eaveAreaFrac: 0.80,         // eave = highest layer with planArea ≥ frac · footprintArea
  pitchBucketsDeg: { flat: 15, low: 35, pitched45: 55 }, // upper bounds; above 55 = steep
  storeyBandBlocks: [3, 6],   // plausible per-storey height band (block-equivalents)
});

// the Minecraft grammar: 6 axes + the 45° roof family (4 up + 4 down diagonals) = 14
export const GRAMMAR_ORIENTATIONS;            // Object.freeze([{ key, n: [x,y,z] }, ...])

export function triangleGeometry(positions, triangleCount);
//  → { normals: Float64Array, areas: Float64Array, centroids: Float64Array } per triangle

export function snapNormal(nx, ny, nz);       // → { key, index, residualDeg }

export function coarseFaces(positions, triangleCount, params = SKETCH_PARAMS);
//  weld → adjacency → region-grow within snapped orientation → cap at faceTarget
//  → { faces: [{ orientation, normal, offset, areaFrac, meanResidualDeg, maxResidualDeg }],
//      stats: { triangleCount, regionCount, keptFaces, droppedAreaFrac,
//               areaShareByOrientation, meanResidualDeg } }

export function detectSymmetry(occ, faces, params = SKETCH_PARAMS);
//  occ = internal occupancy (see substrate below); candidates x=c / z=c, c swept on half-cell
//  positions over the middle half of the plan bbox; score = reflection IoU; better half by
//  mean face snap-residual per side
//  → { axis, offset, score, threshold, applied, keptSide,
//      occ: symmetrizedOcc, faces: symmetrizedFaces }   // pass-through when !applied

export function fitFootprint(occ, params = SKETCH_PARAMS);
//  plan mask → outer boundary trace (rectilinear at cell resolution) → merge collinear →
//  snap jogs < tol → { polygon: [[x,z],...] CCW from min corner, isRectangle, toleranceCells,
//                      maskArea, polygonArea }

export function pitchClass(normals, areas, params = SKETCH_PARAMS);
//  PRE-SNAP dominant tilt of upward non-horizontal faces → { class, dominantTiltDeg }

export function proportionsOf(occ, masses, params, { registryScale });
//  → { eaveLayer, ridgeLayer, heightCells, eaveFrac,
//      storeyCandidates: [{ n, perStoreyBlocks, plausible }], massCount,
//      masses: [{ bbox, areaCells, kind }] }   // masses from segmentMasses (reused)

export function buildSketch(glbBytes, { subject, registryScale, params = SKETCH_PARAMS });
//  the composition: parseGlbMesh → triangleGeometry/pitchClass → coarseFaces →
//  voxelizeGlb(sampleScale) → adapter → segmentMasses → detectSymmetry → fitFootprint →
//  proportionsOf → the full form-sketch/v1 record (deterministic; no timestamps)
```

Internal (non-exported) helpers: vertex weld + edge adjacency builder, reflection of the sparse
occupancy about a half-cell plane, rectilinear boundary walker, jog simplifier. The **occupancy
substrate adapter** is internal too: `occupiedCells(voxelizeGlb(...))` → `{pos, block:"stone"}`
list → `occupancyFromCells` (src/view/occupancy.mjs) — the shape `heightfield`/`segmentMasses`
(src/form/component-decompose.mjs) read.

**`src/form/form-sketch.test.mjs`** — synthetic-mesh tests. Local soup builders (no GLB needed —
core geometry functions take `positions/triangleCount` directly; `buildSketch` is exercised via a
tiny in-memory GLB built the way `glb-mesh.test.mjs` builds fixtures):
box, noisy box (deterministic per-vertex perturbation, no Math.random), gabled prism (parametric
pitch), L-plan, tower+nave two-mass, one-side-noisy symmetric house. Asserts per Design §test
strategy, incl. double-run `JSON.stringify` byte equality.

**`src/form/sketch-plot.mjs`** — pure raster composition (RGBA buffers in, RGBA sheet out; pngjs
encoding stays in the runner so this module remains IO-free):

```
export function renderSketchSheet({ sketch, occ, silhouettes });
//  → { width, height, data: Uint8Array }  — 3 panels:
//  plan (mask + footprint polygon + mirror-plane line), front & side elevations
//  (occupancy projection + eave/ridge lines), GLB mesh silhouette outline overlaid
//  on the elevations (rasterizeSilhouette output, downsampled) for the at-a-glance check
```

**`src/form/sketch-plot.test.mjs`** — dims, determinism (byte-equal double render), polygon
stroke pixels present, panel separators present.

### Created — runner (IO; not under the test glob)

**`benchmarks/sculpture/form-sketch.mjs`**
- Args: `--subject <key>` | `--all`, `--repro`, `--rotate-pins` (forwarded to the guard).
- Resolves subjects via `import { SUBJECTS } from "./durable-skin.mjs"` — **registry-only**; the
  runner contains no subject names except the generalization-grep-safe registry lookup.
- Per subject: read GLB (path from registry), `buildSketch(bytes, { subject: key,
  registryScale: def.generated.scale })`, render sheet, then:
  - `preflightPins` + `guardedWriteRecord` (src/form/pin-guard.mjs) for
    `benchmarks/sculpture/form-sketch/{key}.json` and `{key}.md` (records = pins);
  - PNG `{key}-sheet.png` written directly (PNGs are evidence, never routed through the guard —
    pin-guard module contract, though this PNG is deterministic).
- `--repro`: re-derive in-process, sha256-compare against the committed JSON (the
  `challenge-milestone.mjs:347` pattern); exit nonzero on divergence.
- Markdown `{key}.md`: small table (grammar area shares, residuals, symmetry verdict, footprint
  vertex count / isRectangle, masses, proportions) — the human-review surface next to the PNG.

### Created — committed records

`benchmarks/sculpture/form-sketch/{cottage,barn,gatehouse,church}.json|.md|-sheet.png`

### Modified

- **`package.json`** — scripts (direct `node`, flag-swallowing-safe):
  `"sketch:cottage" ... "sketch:barn" ... "sketch:gatehouse" ... "sketch:church"`, and
  `"sketch:all": "node benchmarks/sculpture/form-sketch.mjs --all"`.

### Explicitly NOT modified (the no-coupling guarantee, checked in Review)

- `glb-voxelize.mjs`, `form-routing.mjs`, `durable-skin.mjs`, every milestone runner — no consumer
  is rewired in this ticket. Nothing outside `form-sketch*`/`sketch-plot*` imports
  `FORM_SKETCH_SCHEMA` or reads `benchmarks/sculpture/form-sketch/`. No tolerance constant
  referencing the sketch exists anywhere.

## Module boundaries

- **form-sketch.mjs depends on**: `glb-mesh.mjs` (parse), `glb-voxelize.mjs` (substrate),
  `../view/occupancy.mjs` (adapter), `component-decompose.mjs` (`segmentMasses`). It does NOT
  import silhouette, kit, material, or judge modules.
- **sketch-plot.mjs depends on**: nothing in src/form except types-by-convention (it receives
  plain data). The runner is the only place mesh silhouettes (`glb-silhouette.mjs`) are produced
  and handed in.
- **Runner depends on**: the two new modules + registry + pin-guard + pngjs + node:crypto/fs.

## Ordering

1. `form-sketch.mjs` grammar + `snapNormal` + `triangleGeometry` + tests (smallest provable unit).
2. `coarseFaces` (weld/adjacency/region-grow/cap) + tests.
3. Substrate adapter + `detectSymmetry` + tests.
4. `fitFootprint` (trace + simplify) + tests.
5. `pitchClass` + `proportionsOf` (segmentMasses reuse) + `buildSketch` + tests.
6. `sketch-plot.mjs` + tests.
7. Runner + npm scripts; run all four subjects; commit records.
8. `--repro` pass, full `npm test`, no-coupling grep.

Each numbered step is a committable unit (matches Plan).
