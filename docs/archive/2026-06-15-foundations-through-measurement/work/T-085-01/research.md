# T-085-01 zone-fill-dominant — Research

Descriptive map of everything the deterministic zone-fill touches. No solutions proposed here.

## 1. The problem as witnessed

- The E-23 spray-paint (`benchmarks/sculpture/spray-paint.mjs`, `npm run spray:paint`) applies material by
  splatting a **concept-COLOR target per cell** (`quantizeToFace` for the front `+z`, `loadGlbSplat` for the
  side `+x`) and back-projecting recolors via `paintFace`. On the cottage this converted only **9%** of the
  upper-storey wall to plaster; **64% stayed stone** (quantization collapses cream/stone near-tones; the
  concept→face resample misaligns bands).
- Commit `e8062fa` shows the inline fix: **only `benchmarks/sculpture/spray-paint/cottage/artifact.json` and
  the triptych PNG changed** — *no code*. The fill logic ("upper band [floorLines 7..14]: wall-field stone →
  plaster, keep `dark_oak_log` studs") exists nowhere in the repo. Result: upper-band surface **77% plaster /
  19% timber** (was 9% / 23%), `white_terracotta` 88 → 975. Re-running `npm run spray:paint` regenerates the
  9% version — the exact Rule-1 violation E-24 exists to fix.

## 2. The runner: `benchmarks/sculpture/spray-paint.mjs` (impure wiring only)

Sequence (numbered comments in the file):

- **§0 seal-before-paint**: `sealRoof`/`sealWalls` + `applyDeltas` (`src/view/surface-coherence.mjs`) →
  `artifact` (sealed) and `occ = artifactOccupancy(artifact)`. All downstream work uses the sealed build.
- **§0b zone mask**: `structuralZones(occ)` → `{ zoneOf, storeyDivide }`. Hard-coded `ZONE_MATERIALS`
  (cottage policy, "derived from material-map/cottage.json roles, intersected with the build manifest"):
  `base=[stone_bricks,cobblestone,dark_oak_log]`, `upper=[white_terracotta,dark_oak_log,stone_bricks]`,
  `roof=[spruce_planks,dark_oak_planks,cobblestone,bricks]`. Mapped to `allowedByZone: Map<zone,Set<bare>>`
  after `∩ allowedPalette(raw)` (the manifest "4 cans").
- **§1 per-face targets**: front `+z` ← concept quantized (`quantizeToFace` + `resampleBlockGrid`); side `+x`
  ← textured-GLB splat (`loadGlbSplat`, dwebp-backed `decodeTexture`).
- **§2 paint passes**: `paintFace(occ, dir, target, { allowed, source, zoneOf, allowedByZone })` — the
  T-079-02 zone gate (a plaster target on base/roof is `zoneRejected`).
- **§2b unmasked proof**: the same splat *without* the zone mask, applied to a throwaway build, recorded as
  the "before" histogram (`histogram.unmasked`).
- **§3** optional metered LLM refine (off by default; a note only today).
- **§4 per-face accept-if-closer gate**: GL renders via `tryRenderFace` (best-effort — headless-GL failure
  degrades to a recorded gap), `faceResemblance`/`acceptIfCloser`. Front gated vs the concept; side is
  GLB-truth, accepted by construction when it painted anything.
- **§5 commit**: `stripOffZonePlaster(occ, …)` (recolor pre-existing base/roof surface plaster to the zone
  primary, `ZONE_MATERIALS.{base,roof}[0]`) + `mergePaints` (priority concept>glb) + `applyPaint` +
  `assertArtifact`. Writes `spray-paint/cottage/artifact.json`.
- **§5b structural guard**: `surfacePlasterByZone(painted, zoneOf)` over `SURFACE_FACES =
  ["+x","-x","+z","-z","+y"]` (dedup by voxel) — **throws** if base/roof surface plaster ≠ 0. Plus
  `interiorPlaster` (pre-existing strays, reported, untouched).
- **§6 durable record**: `spray-paint/cottage.json` (`schema: "spray-paint/v1"`, with `zones.histogram
  {masked,unmasked}`, `plaster.before/after`, `materialCounts`, `faces`, `cornerCollisions`) +
  `cottage.md` via `renderMd`.
- **`--offline` mode**: re-reads the committed record and asserts plaster reversal + base/roof=0 — a
  deterministic re-check with no GL/model.

Inputs: `concept-materials/cottage/after-artifact.json` (raw build), `runs/014-vConcept-a-cottage/concept.png`,
`glb/cottage.glb`. Outputs under `benchmarks/sculpture/spray-paint/` (record + md committed; PNGs gitignored).

## 3. The pure cores (all `src/view/*`, no GL/I-O, tested on synthetic occupancy)

- **`occupancy.mjs`** — `artifactOccupancy(artifact)` / `occupancyFromCells(list)` → `{bounds, dims, size,
  cells:Map<"x,y,z",block>, has, block}`; `bareBlock(id)` strips `minecraft:`. Built on `expandArtifact`
  (last-write-wins / full-replace).
- **`surface-grid.mjs`** — `projectSurface(occ, dir)` → `SurfaceGrid {dir, kind, n, m, cells[m][n], filled}`;
  each `SurfaceCell = {block, depth, voxel:[x,y,z], normal}` stores its source voxel, so back-projection is a
  stored-voxel read (the Path-P invariant). Ortho 6 dirs + 4 ground diagonals; everything else throws.
- **`structural-read.mjs`** — `structuralZones(occ, opts)` → `{zoneOf(voxel)→"base"|"upper"|"roof",
  storeyDivide, upperTop, roofKeys, floorLines}`. Geometry-derived (floor-slab lines + the `+y` top-exposed
  roof shell), deliberately NOT dominant-block-derived (the raw cottage's materials are the corrupted
  signal). `roof` = roofRegion membership OR `y >= upperTop`; `upper` = `y >= storeyDivide`; else `base`.
  Also `wallFields(occ)` (4 side elevations: surfaceCells/holes/blockCounts) and `storeyBands`/`roofRegion`.
- **`face-paint.mjs`** — `paintFace(occ, dir, targetGrid, {allowed, source, zoneOf, allowedByZone})` →
  `PaintPass {placements, painted, skipped, offPalette, zoneRejected}`. **Paint is a recolor, not a move**:
  an appended `{op:"voxel", pos, block}` at an existing surface voxel; no air op. `mergePaints(passes,
  {priority})` (corner collisions: concept > glb); `applyPaint(artifact, placements)` (shallow clone, append).
- **`palette-cans.mjs`** — `allowedPalette(artifact)` → Set of bare manifest ids.

Test conventions (`face-paint.test.mjs`, `structural-read.test.mjs`): `node:test` + `assert/strict`,
synthetic occupancy via `occupancyFromCells` (cube/box helpers), run by `npm run test:unit` =
`node --test "src/**/*.test.mjs"`. `npm test` = artifact validate self-tests + unit tests. Currently ~980+
tests green.

## 4. The E-21 material map (`benchmarks/sculpture/material-map/cottage.json`)

`map[]` of `{role, block, placementRule, rationale}` with `placementRule ∈ {walls, corners-edges, trim,
roof}`. Cottage roles: `stone_bricks` (ground-floor wall field, *walls*), `cobblestone` (quoins/plinth/
chimney shaft, *corners-edges*), `dark_oak_log` (half-timbering frame, *trim*), `white_terracotta`
(upper-storey plaster infill, *walls*), `spruce_planks` (main roof field, *roof*), `dark_oak_planks`
(eaves/verge, *roof*), `bricks` (chimney cap, *trim*). The runner's `ZONE_MATERIALS` is the hand-derived
zone projection of this map; zone→dominant is: base=`stone_bricks`, upper=`white_terracotta`,
roof=`spruce_planks` (each the *walls*/*roof* field role; the rest are secondaries). The map itself has no
explicit "zone" or "dominant" field — the storey association lives in the role text.

## 5. Constraints & assumptions surfaced

- **Recolor-only invariant**: any fill must emit `{op:"voxel"}` recolors at existing voxels (no air op, no
  geometry change) — `expandArtifact` last-write-wins makes appended placements override.
- **Surface-only**: the visible defect and the 77% measurement are on **surface** cells (the 5
  `SURFACE_FACES` projections, deduped by voxel); interior cells are explicitly out (interior plaster strays
  are reported but untouched). The eval lens only sees the skin.
- **Zone classification quirks** (from in-repo comments): a spruce **gable** cell classifies `upper` (roof
  material on an upper-zone voxel — legitimate, must not be greyed/plastered); the **chimney**
  (cobble shaft + brick cap) classifies `roof`; `roofRegion` under-covers a noisy pitched roof, hence
  `upperTop` bounds upper from above.
- **The §5b guard** (base/roof surface plaster = 0) must keep holding after any fill.
- **`--offline`** asserts against the committed record — record fields added must keep that path consistent.
- **GL is best-effort**: the deterministic core must produce the coverage numbers without GL.
- **Sibling scope (do not build here)**: T-087-01 owns roof-course regularization + *post hoc* stray-salt
  stripping; T-088-01 owns the coverage **gate** (threshold/fail semantics) and depends on this ticket —
  this ticket *reports* coverage, it does not gate on it. T-086-01 (parallel) owns which block the plaster
  role resolves to (value-true cream vs pink `white_terracotta`) — this ticket takes the map's block as
  given. T-086-01 may also touch `spray-paint.mjs`; Lisa serializes commits via the file lock.
- **Numbers to reproduce**: upper-band surface ≈77% plaster (was 9%), timber ≈19% preserved,
  `white_terracotta` count rising from ~88 (sealed, pre-paint ~7 surface+interior on the *raw* artifact;
  the sealed/painted baseline in the current record is the comparison the runner prints).

## 6. Open questions carried to Design

1. Exact preserve semantics: which non-dominant materials survive the fill in each zone, and what counts as
   a "run" vs an isolated cell (the AC: timber studs stay; salt does not).
2. Where the fill sits relative to §2's splat, and what the splat's per-zone palette becomes once it is
   demoted to secondaries (today `upper` still allows `stone_bricks` — the very material the fill must
   displace).
3. How the ≈9%-vs-≈77% before/after is produced *by the pipeline* for the record (AC #3) without GL.
