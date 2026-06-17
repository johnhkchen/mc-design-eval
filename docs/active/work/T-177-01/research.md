# T-177-01 — Research

**Goal:** one gatehouse build faithful in **both** materials (S-171 stone walls) **and** roof (the
T-172-01 roof-as-construction covering). Produce a single crater-ready build dir (`artifact.json` +
`view-{az}.png`) whose roof reads as a *covered, eave-banded roof, not a solid prism*, materials still
faithful, `closureOf` not regressed. This is the build T-173-01 found we did not have.

Descriptive only. No solutions here.

## The two pieces and where they live

### Piece A — the materially-faithful walls (S-171 / T-171-01)
- `builds/gatehouse/faithful/artifact.json` (byte-copy of `benchmarks/sculpture/recognition/gatehouse.artifact.json`,
  renamed for the crater; see its `SOURCE.md`).
- Produced by the **recognition `compile→realize`** pipeline, NOT generate-first.
- Block census (2287 placements):
  - `minecraft:stone_bricks` 1064 — walls, **materially faithful** (polished_basalt gone).
  - `minecraft:dark_oak_planks` 1215 — the roof, a **solid prism** (53 % of the whole build).
  - `dark_oak_log` 4, `cobblestone` 4 — door-frame / quoin detail.
- Geometry (measured per-Y): walls `stone_bricks` fill **y=0..19** at footprint **x[0,14] z[0,14]**
  (y19 is a 56-cell perimeter ring — a hollow shell). Roof `dark_oak_planks` is a **solid triangular
  prism y=20..28**: 255 cells at y20 shrinking by 30/layer to 15 at y28. The z-width narrows 17→1 while
  the 15-length x stays constant ⇒ **ridge runs x** (overhangs z by 1 each side: 15×17=255 at the base).

### Piece B — the covering construction (T-172-01 / S-172)
- `src/view/roof-generate.mjs :: generateRoof(gables, family, {covering:true, gableBlock})`. Covering
  mode (default-off) hollows the wedge interior with a per-column riser-seal
  (`coverFloor = clamp(minNbrTop+1, floor, top)`) — watertight at any pitch, byte-identical legacy prism
  when `covering` absent. Sloped surface = stair treads / slabs / cap in the **roof field**; gable-END
  vertical triangles fill in `opts.gableBlock` (the wall envelope) and are returned in `gableWallKeys`.
- `gableRecord({footprint, ridgeAxis, eaveY, ridgeY, pitch, hip})` builds the 2-sided program gable.
- `roofMaterialFraction(placements, roofBlocks)` — the prism census helper (pure).
- The **runner that already composes carve+cover**: `experiments/eval-alignment/roof-climb.mjs`. It
  carves every cell with `y >= eaveY+1`, keeps the walls (forms/states intact), registers `masses[]`
  from `recognition/{subject}.program.json`, builds one gable per mass, generates the covering, renders
  4 azimuths + beside-concept to `builds/{subject}/roof-covering/`, and reports census + `closureOf`.

## The recognition program (the drive source)
`benchmarks/sculpture/recognition/gatehouse.program.json` (`building-program/v1`):
- One mass `hall`: `rect {x0:0,z0:0,w:15,d:15}`, `storeys:4`, `storeyHeight:5`.
- `roof: { idiom:"roof.gable", ridgeAxis:"x", pitchClass:1, fieldRole:"roof.trim",
  trimRole:"wall.dressing", gableRole:"wall.dressing" }`.
- Reading: "tall hall under a steep gable… roof reads dark (whole-roof darkened toward oak, as the barn
  does) with a lighter stone eave/verge course banding the edges… eave ~21, eave fraction 0.70."

**Key derivation available from the program (kills hardcoding):**
- `eaveY = storeys*storeyHeight − 1 = 4*5 − 1 = 19` — **exactly** the measured wall-top layer.
- `ridgeAxis = masses[0].roof.ridgeAxis = "x"` — **matches** the measured prism narrowing axis.
- `pitchClass 1 → pitch 1`.

So eave height, ridge axis and pitch are all recoverable from the program; the existing `roof-climb.mjs`
instead **hardcodes** `eaveY` (and the artifact path, and a spruce family) in a per-subject `SUBJECTS`
map. The gatehouse entry there even points at the **generate-first blob**
(`benchmarks/sculpture/generated/gatehouse/artifact.json`), not the faithful recognition build.

## The integration seam (named, per the AC)
The faithful walls and the covering construction are on **different pipelines**:
- Faithful walls: recognition `compile→realize`. Its roof prism comes from
  `compile.mjs::roofBlocks` (a *family-resolution* prism — solid `dark_oak_planks` cubes when the chosen
  roof field falls outside the pack's stair-course family), a **different code path** from the
  `generateRoof` prism T-172-01 killed.
- Covering: `generateRoof`, the generate-first/post-realize geometry path.

T-172-01's own review names this: "Wiring covering into the compile/realize path also trips the
not-yet-`gableWallKeys`-aware conformance gate and needs a judge-pin rotation — out of scope." So the
clean seam is **NOT** to teach `compile.mjs` covering. It is the same seam `roof-climb.mjs` already uses:
**carve the realized artifact above the eave and re-cover with `generateRoof`** — a post-realize geometry
swap on the finished artifact. The carve is material-agnostic (it cuts by `y`, not by block), so it cuts
the `roofBlocks` prism just as cleanly as it cut the generate-first blob.

## Material faithfulness constraint
The faithful roof material is `dark_oak_planks` ("whole-roof darkened toward oak"). To stay faithful, the
covering field must be the **dark-oak family** (`dark_oak_planks/_stairs/_slab`), NOT roof-climb's spruce.
The gable-end wall block must be the modal eave block = `stone_bricks` (= program `gableRole:wall.dressing`).
Namespace: the artifact uses `minecraft:` prefixes; emitted roof cells must match.

## Render / verification surface
- GL probe (authoritative, `render/src/render.mjs`): **`GL_AVAILABLE: true`** — witness renders work.
- `renderViews(artifact, angles, {outDir,label,width,height})`, `renderBesideConcept(artifact, conceptAbs,
  out, {label})`, `assertGlAvailable()` (`src/view/render-beside.mjs`).
- `closureOf(ring)` and `registerRect(masses, cols)` in `src/view/wall-generate.mjs`.
- `artifactOccupancy` / `occupancyFromCells` (`src/view/occupancy.mjs`); `rebuildArtifact(occ, raw)`
  (`src/view/shell-integrity.mjs`) — merges new cells back into the raw artifact's palette/metadata.

## Constraints / assumptions
- **Frozen instrument untouched** — nothing under `measurements/` may change.
- No air-op; recess/relief by exclusion ([[facade-recess-by-exclusion]]). The covering already hollows by
  *not placing* interior cells (exclusion), never by burying air.
- Single near-square mass ⇒ `registerRect` is **ambiguous** (T-172-01 logged this for the gatehouse); a
  single-bbox gable from the eave footprint + program `ridgeAxis` is the correct, non-ambiguous path.
- The covering introduces `dark_oak_stairs`/`dark_oak_slab` (absent from the solid prism) — both are
  standard blocks; must render (no `unmapped`). To verify at the glance.
- `npm test` currently green (per recent commits, 2277 tests). Must stay green; production change should
  be additive/runner-side.
