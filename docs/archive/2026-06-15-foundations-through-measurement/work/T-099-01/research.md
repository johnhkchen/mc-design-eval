# T-099-01 opening-dressing — Research

Descriptive map of what exists for the dressing op: where openings come from, what the kit declares,
what fixture machinery is proven, and where the cottage run plugs in. No solutions proposed here.

## 1. The witnessed gap

The cottage concept shows trapdoor-shuttered, lattice-infilled windows; the shipped durable skin
(`benchmarks/sculpture/durable-skin/cottage/artifact.json`) has bare rectangular holes. Everything
upstream of "place the fixtures" now exists: openings are detected geometrically, the kit names the
fixture ingredients, the artifact→world→render path for fixtures is proven, and closure semantics
treat a dressed aperture as a dressed *opening*. Nothing walks the openings and places the treatment.

## 2. Opening detection (src/view/structural-read.mjs)

- `openings(occ, dir)` — ortho side faces only. Projects the **solid view** (`solidOccupancy`) so
  already-placed fixtures don't change detection (T-097 AC #5). Air components in the face mask are
  classified: enclosed → `window`; touching only the bottom border → `door`. Returns per opening:
  `bbox {u0,v0,u1,v1}` (solid grid uv space), `kind`, `cells`, `dressing {cells, blocks}`. The uv
  cell list (`cellsUV`) is internal — only the bbox is exposed.
- `airComponents(mask)` is the shared enclosed-vs-border definition (exported).
- `openingRegions(occ, dirs)` (src/view/shell-integrity.mjs) back-projects each opening bbox through
  the **full depth axis** to a world AABB `{kind, dir, min, max}` using the solid bounds — the
  allow-list consumed by `fillVoids`/`closureCheck`. A dressed aperture's region is identical to its
  undressed twin (back-projection deliberately uses solid bounds).
- Geometry helpers: `orthoSpec(dir)` gives the axis map (axisU/axisV/axisW, signs, near min/max);
  `cellWorldPos(occ, spec, u, v, w)` is the uv→world inverse at a chosen depth coordinate. Both PURE,
  both already used by the seal/void ops for exactly this kind of synthesis-at-a-hole.

Note: `openings` bboxes are in the **solid grid's** uv frame; converting to world cells requires the
same `solidOccupancy` bounds that `openingRegions` uses. The region AABB spans the whole depth axis —
it does not say *where along depth* the wall plane sits at that opening.

## 3. The kit declares the treatment (T-096, src/form/kit.mjs + kit/cottage.json)

Kit entries: `{block, role, formClass: cube|fixture|rail, whereUsed, confidence, rationale}` with
`whereUsed` drawn from band names + `WHERE_FEATURE_TERMS = ["openings","trim","corners-edges","base"]`.
Cottage kit (committed, kit/v1):
- `spruce_trapdoor` — fixture, whereUsed `[openings]`, role "window shutters / lattice infill".
- `spruce_door` — fixture, whereUsed `[openings, base]`, role "front entrance door".
- `lantern` — fixture, whereUsed `[openings, base]`, role "exterior light beside the door".
- **No fence/rail entry**: the inner window grille was honestly declared `unidentified`
  (iron_bars vs wood lattice vs shadow indistinguishable) with recorded `fallback: {mode:"color-snap"}`.
Gatehouse kit ships `stone_brick_stairs` (fixture, openings/trim) — stairs are a known lens residual.

So "the kit declares each opening's treatment" holds for shutters/door/lantern but the cottage's
**fence infill must come from somewhere other than a named kit row** — the AC nevertheless demands
fence infill on every window. The mapping kit→treatment-slots (infill/shutter/door/light) does not
exist yet; `derivedFormClass` (cube iff in the 305-block Lab table, else rail by name pattern
`/(fence|wall|pane|bars|rail|chain)$/`, else fixture) is the ground-truth classifier available to
route entries to slots. (`*_trapdoor` and `*_door` are fixture; `*_fence`/`iron_bars` are rail.)

## 4. The proven fixture vocabulary (T-097, src/form/fixture-card.mjs)

`CARD_ROWS` is THE state vocabulary the S-099 grammar is supposed to import rather than restate:
- trapdoor: open at all four facings (`facing: north|south|west|east, half: bottom, open: "true"`),
  both closed halves. All four open poses are render-proven.
- fence: explicit connection booleans (no neighbor updates in the in-memory world — an unstated
  fence renders as a lone post). Proven patterns: post, east+west, north+south, corner-ne, tee-new.
- door: lower/upper pairs sharing a column (`facing: east, hinge: left`, open true/false). Only
  facing=east is on the card; other facings are the same mesh family rotated (unproven by render,
  accepted by schema/world).
- lantern: `hanging: "false"|"true"` both proven.
- stairs: placed and read back correctly but **render invisibly** (prismarine-viewer 1.33.0 meshes
  no stair block — `fixture-path-proven-stairs-lens-gap`). S-099 must not rely on stair pixels.
- slab: all three types; top-vs-bottom nearly indistinguishable at oblique gate angles.
State values are STRINGS throughout (`"true"`/`"false"`), matching the schema's `blockState` map
(src/artifact.mjs `state` is `Record<string,string>`, accepted on `op:"voxel"`; the live AJV gate
admits every card state — pinned offline in fixture-card.test.mjs).

## 5. Occupancy third class + closure semantics (T-097)

- `occupancyFromCells` accepts `{pos, block, form?, state?}`; sparse `forms`/`states` maps;
  `solid(x,y,z)` = occupied AND not fixture/rail; `solidOccupancy(occ)` returns occ itself for
  cube-only builds (identity back-compat witness).
- `artifactOccupancy(artifact)` carries each voxel's `state` and classifies via `derivedFormClass`
  (injectable `opts.formOf`).
- `closureCheck(occ, {regions})`: skin = solid cells + allow regions; a fixture inside a region is a
  *dressed opening* (`dressed.cells` tally; closed verdict); a fixture outside every region adds no
  skin and is flagged by `strayFixtures(occ, regions)` — a separate detector that never changes the
  verdict. **Implication for shutters**: a trapdoor flanking the aperture (outside the opening bbox,
  one cell proud of the facade) falls outside `openingRegions` AABBs → it would appear in
  `strayFixtures` unless the dressing op's own placement regions are composed into the allow-list
  the consumer passes.
- `rebuildArtifact`/`componentStrip`/`plugClosure` carry forms/states through rebuilds;
  `hollow-carve.mjs` does NOT (known pre-existing gap, flagged in T-097 review).
- `expandArtifact` (src/expand.mjs) carries `state` per voxel; last write wins WHOLE (block+form+state
  replace together) — appending a cube placement over a fixture cell un-fixtures it, and vice versa.

## 6. The artifact contract and "edits"

No air op (`facade-recess-by-exclusion`): the contract is ADD + RECOLOR-by-append (last-write-wins).
Fence infill and shutters are pure ADDs into air cells. A lintel/sill "from the frame block" over an
existing wall cell is a recolor-by-append (the `applyDeltas`/`applyPaint` precedent in
surface-coherence/face-paint). Deleting anything would require a full `rebuildArtifact`.

## 7. Where the cottage run plugs in

- Input artifact: `benchmarks/sculpture/durable-skin/cottage/artifact.json` (committed, the E-24/E-26
  skinned build; sha-pinned in durable-skin/cottage.json). The kit record: `kit/cottage.json`.
- Runner conventions (fixture-card.mjs is the closest template): impure wiring only; pure core under
  src/; deterministic steps gate (exit code), renders are evidence; records committed as
  `<name>/v1` JSON + md; PNGs gitignored except `pr/assets/frames/*` evidence copies; npm script per
  command (`card:fixtures`, `skin:cottage`, `challenge:cottage`...).
- Render path: `renderViews(artifact, angles, {outDir, label})` (src/view/multi-angle.mjs);
  named angles include ortho `front` and the four gate diagonals; `MULTI_ANGLE_GATE.azimuths =
  ["+x+z","+x-z","-x-z","-x+z"]` (src/config.mjs). Cottage windows live on the front (+z) face —
  the gate angles containing +z are `+x+z` (45°) and `-x+z` (315°); ortho `front` shows them best.
- Reproducibility idiom (E-24 Rule 2): deterministic core runs twice, byte-identical artifacts,
  sha256 recorded; `--offline` re-asserts the committed record.

## 8. Tests and purity rules

- Pure cores run under `node --test "src/**/*.test.mjs"` (1156 tests green at T-097 close). No GL,
  no I/O, no Date/random in src/view + src/form modules. Synthetic-occupancy tests are the idiom
  (shell-integrity.test.mjs's hut patterns; structural-read.test.mjs builds walls with windows).
- Benchmark runners are outside the test glob — their pure helpers should live in src/ (T-096 review
  flagged buildSkin's kit composition as an untested orchestrator; same trap to avoid here).

## 9. Constraints and open questions for Design

1. **Fence source on the cottage**: kit has no rail entry (honest `unidentified`); AC requires fence
   infill. Some deterministic, non-subject-specific derivation (or a recorded reduction) is needed.
2. **Shutter cells sit outside opening regions** → strayFixtures interplay; the op must declare its
   placement footprint so consumers can compose the allow-list.
3. **Orientation tables**: wall exterior normal → trapdoor `facing` (open pose flat against facade),
   door `facing`, fence connection axis (face ±z → run along x → east/west; face ±x → north/south).
   Only trapdoor facings are render-proven at all four orientations; doors proven at east only.
4. **Lintel/sill "from the frame block"**: no kit slot names the frame; the opening's perimeter cube
   census (solid occupancy) is the available deterministic source.
5. **Too-small openings** (honesty rule): 1-cell windows, 1-wide doors, jamb columns that are
   themselves openings or bbox edges — each needs a named reduction, never silent.
6. **Stairs are lens-invisible** — any treatment slot that would reach for stairs (gatehouse lintels)
   must not rely on stair pixels for the render evidence.
7. **Which faces**: `openings` is ortho-side-only (4 elevations); roof openings out of scope.
8. **Depth placement**: regions span full depth; the op needs the wall plane depth per opening —
   derivable from the solid surface grid's per-cell `depth`/`voxel` around the component, or from
   perimeter cells. Front-most wall plane at the opening is the natural anchor.
9. Door upper-half hinge sweep was only eyeballed at one angle (T-097 concern #5) — programmatic
   door placement should add a hinge-specific check or note it.
