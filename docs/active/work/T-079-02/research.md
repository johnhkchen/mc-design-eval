# T-079-02 — Research: spray-paint structural-mask fix

Epic **E-23** / Story **S-079**, a **fix** of the shipped spray-paint (T-079-01). Descriptive map of
the code, data, and boundaries the fix touches. No solutions here.

## The defect, restated from evidence

The shipped spray-paint smears plaster (`white_terracotta`) across the whole cottage face — base, walls,
and roof — plus floating painted strays. The ticket's histogram of the *wrong* painted build:

```
y0:65  y4:45  y8:51  y12:48  y16:52  y20:44  y24:10     (315 total; base y0–7=110, roof y24=10)
```

Plaster lands in every height band. It should sit in the **middle storey only**.

## The build the paint runs on (measured)

`benchmarks/sculpture/concept-materials/cottage/after-artifact.json` — the raw cottage, 6429 voxels,
bounds `min[-13,0,-16] max[12,26,15]`. Its structural read (pure, occupancy-only):

- `footprint`: cottage footprint, ~26×32 span (with eaves).
- `storeyBands.floorLines = [0, 7, 14]` — three floor slabs: ground (y0), upper storey (y7), attic (y14).
- `storeyBands.bands` (grouped by *current* dominant block — note the raw build's plaster has already
  collapsed, so the bands reflect the wrong materials, not intent):
  - y0: `dark_oak_log` (sill/floor), fill 0.642
  - y1–15: `stone_bricks` (base **and** the upper storey, which should be plaster but collapsed to stone)
  - y16–22: `spruce_planks` (roof + gable)
  - y23–26: caps (`stone_bricks`/`spruce_planks`/`cobblestone`)
- `roofRegion`: 660 top-exposed cells, yRange [7, 26] (eaves low, ridge/chimney high), coverage 0.793.

**Raw plaster inventory:** 8 `white_terracotta` voxels total — 3 on the surface skin, 5 interior. These
are pre-existing strays, *not* from paint. Sealing (below) strips ~1 surface stray → 7 total remain
(the 5 interior + 2 surface). The visible *skin* plaster in the raw build is ≈0.

The design intent (`runs/014-vConcept-a-cottage/design-doc.md`, §1, §5) is explicit and matches the
geometry: **three stacked material bands** — *stone base (~6 high) / timber+plaster middle storey (~7
high) / dark plank gable roof (~10 high)*. floorLines `[0,7,14]` line up: base = y0–6, upper storey =
y7–13/15, roof = y14+ (spruce dominant from y16; eaves/gable below). The `material-map/cottage.json`
roles confirm: `stone_bricks`/`cobblestone` = base walls/quoins; `dark_oak_log` = upper-storey timber
frame; `white_terracotta` = **"upper-storey plaster infill between the timbers"**; `spruce_planks`/
`dark_oak_planks` = roof; `bricks`/`cobblestone` = chimney.

## The four root causes, located in code

### RC1 — the splat ignores the structural read
`src/view/face-paint.mjs::paintFace(occ, dir, targetGrid, {allowed, source})`. For every filled surface
cell whose target block is in the global `allowed` palette **and differs** from the current block, it
emits a recolor. The only gate is `allowed.has(bareTarget)` (the manifest "4 cans") — there is **no
storey-zone mask**. `src/view/structural-read.mjs` computes `storeyBands`, `roofRegion`, `wallFields`,
but `paintFace` never consumes them. The whole epic's structural axis is available and unused by paint.

### RC2 — concept→face alignment is a naïve stretch + quantization collapse
Runner `benchmarks/sculpture/spray-paint.mjs` (and the milestone) builds the front target via
`quantizeToFace(CONCEPT, frontGrid, {manifest})` → `resampleBlockGrid(...)` to the face dims. No
registration of the concept's bands to the build's storeys; cream plaster / tan timber / light stone all
snap to `white_terracotta` (`concept-image-not-color-value-preview`), so the target proposes plaster
high *and* low. The mask in RC1 is what would contain that; the alignment alone cannot.

### RC3 — it painted the raw, un-sealed surface
Ordering. The standalone runner loads the **raw** `after-artifact.json` and paints it directly; S-084's
seal (`src/view/surface-coherence.mjs::sealRoof`/`sealWalls`, which strip stray specks and seal holes)
runs *nowhere* in `spray-paint.mjs`. In the milestone (`hollow-cottage-milestone.mjs`) the order is
**paint raw → seal painted → hollow → floorplan**, i.e. seal runs *after* paint. So strays get painted →
floating painted blocks. The fix wants **seal then paint**.

### RC4 — refine skipped + gate fooled
`spray-paint.mjs` reports `Refine: skipped` unless `--refine`, which itself is only a note (the metered
call is not wired). The per-face gate is `acceptIfCloser({before, after})` from
`src/view/face-resemblance.mjs`; when GL is blind (no ref) the runner accepts "by construction"
(`frontGate.before == null ? true : ...`). A marginal numeric gain rubber-stamps a zone-wrong skin —
there is no structural post-check that plaster stayed in its band.

## Key modules & contracts (boundaries the fix must respect)

- **`src/view/face-paint.mjs`** — `paintFace` (per-face recolor), `mergePaints` (corner precedence
  concept>glb), `applyPaint` (append placements). **PURE**, no GL/IO. Paint is a *recolor* (append
  `{op:"voxel"}` at an existing surface voxel; `expandArtifact` last-write-wins), **never** an air op
  (`facade-recess-by-exclusion`). Counters: `painted/skipped/offPalette`.
- **`src/view/structural-read.mjs`** — `footprint`, `storeyBands` (→ `bands`, `floorLines`),
  `roofRegion` (→ `cells:[{x,z,y,block}]`, `yRange`, `coverage`), `wallFields`, `airComponents`,
  `openings`, bundled `structuralRead(occ)`. **PURE**. This is the storey axis the mask derives from.
- **`src/view/surface-coherence.mjs`** — `sealRoof`, `sealWalls`, `applyDeltas`, `watertightCheck`,
  `overlay`. **PURE**. `applyDeltas(artifact, deltas)` mirrors `applyPaint` (clone + append). Strips
  embedded specks (`faceIntrusions`: a non-field cell whose strict-majority neighbours are the field)
  and seals enclosed holes. Intended openings (air) are never touched.
- **`src/view/palette-cans.mjs`** — `allowedPalette(artifact, additions)` → `Set<bare id>` (the
  manifest ∪ additions). `withAdditions`, `filterToPalette`. The single palette source of truth.
- **`src/view/surface-grid.mjs`** — `projectSurface(occ, dir)` → `SurfaceGrid` whose cells carry
  `{block, depth, voxel:[x,y,z], normal}`. Ortho + 45° only (throws otherwise). The back-projection
  invariant: each cell stores its source voxel, so recolor lands unambiguously.
- **Runners** — `benchmarks/sculpture/spray-paint.mjs` (standalone front+side, GL face gate, durable
  `spray-paint/cottage.json`); `benchmarks/sculpture/hollow-cottage-milestone.mjs` (the T-083 chain;
  refreshes `pr/assets/cottage-face-after.png` + `cottage-multi-angle.png`). Both **IMPURE** (GL, GLB
  decode, metered calls); degrade gracefully when GL/dwebp/shim are absent.

## Tests (the harness the fix extends)

- `src/view/face-paint.test.mjs` — synthetic cube occupancy, `fillTarget` helper, asserts geometry
  safety (positions identical, only blocks change), off-palette drop, occluded-interior never painted,
  corner precedence. The pattern the new zone-mask unit tests follow.
- `src/view/structural-read.test.mjs` — synthetic ring/slab builds; `storeyBands`, `roofRegion`,
  `openings`. The pattern for a new `structuralZones` test.
- `src/view/surface-coherence.test.mjs` — seal ops. All `src/**/*.test.mjs` run under `npm test` (PURE;
  no GL). 976 tests currently green.

## Constraints & assumptions

- **Paint never moves geometry** — only blocks change. The zone mask can only *reject* a recolor, never
  add/remove a voxel.
- **Off-zone paint must be impossible by construction**, mirroring how off-palette was made impossible
  (`voxel-palette-must-be-design-doc`) — a measured-after check is not enough.
- **The measurable is the visible skin.** Pre-existing *interior* plaster strays (5 voxels) are not on
  any face, so neither seal nor paint touches them; they are not the pink smear. "0 plaster below the
  storey line / in the roof" is honestly a statement about **surface** cells.
- `floorLines[1] = 7` is the base/upper divide; `roofRegion` membership (top-exposed) is the roof zone —
  this handles the pitched roof / low eaves / tall chimney cleanly (a y-threshold alone cannot, because
  the roof's y-range overlaps the wall's).
- Both runners are GL-bearing and run on demand, **not** in `npm test`; the pure cores carry the tests.
</content>
</invoke>
