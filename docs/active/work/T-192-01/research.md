# T-192-01 — RESEARCH: where the resumed climb stalls, and the primitives the hands can reuse

Descriptive map. The job (S-192 / E-50): build the construction *hands* the picture-driven climb now
stalls on, in order, reusing the E-43 treatment grammar / S-179 arch idiom as primitives. No new metric, no
frozen-instrument change.

## 1. The climb and where it stops today (the stall is recorded, not guessed)

`experiments/eval-alignment/picture-climb.mjs` is the metered runner (NOT in `npm test`). Loop:
render four azimuths → `DiagnoseBuild` picture-critique (VOTES=3 median) → `agentPick` chooses one tool →
apply → re-critique → `acceptsRound` gate keeps/rolls-back → `stoppingDecision`. The accept-gate lives pure
in `src/workshop/climb-gate.mjs` (T-190/T-191): the **department-dominant override** keeps a tool that
cleared a major *in a department it targets* and grew no targeted dept's total burden, even on a whole-build
scalar regression (`acceptsRound`, `departmentDominant`, `deptItemCounts`).

The four existing HANDS are defined **inline in the runner** (they wrap already-tested src modules):
- `apply_gable_roof(occ)` — `gableRecord`+`generateRoof` (ROOF form). **Hardcodes `CFG.ridgeAxis:"z"`.**
- `recolor_roof(occ)` — `reconcileRoofMaterial`+`generateRoof` (ROOF material, grey).
- `construct_walls(occ)` — `constructWalls`+`wallSkin` (WALL envelope+skin, incidental OPENING dressing).
- `add_timber_framing(occ)` — `infillPanel` (WALL half-timber).

`TOOL_DEPARTMENTS` (climb-gate.mjs:31): roof tools→`[ROOF]`, construct_walls→`[WALL,OPENING]`,
timber→`[WALL]`. The override reads these.

**The recorded stall (T-191-01 `trajectory.json`, `review.md`):** trend `0→0→0→0→32`, climbed=true,
all-accepts, then `agent-done`. The final scored critique items (the gradient at the plateau):
1. `WALL major/replace` — grey coursed-stone field + continuous closed wall surface
2. **`OPENING major/replace` — the arch head and the dark-timber frame around the passage**
3. `WALL major/add` — contrasting rough rubble corner quoins
4. `ROOF minor/add` — the lighter stone eave/verge band
5. `OPENING minor/add` — narrow slit windows on the ±z walls

The agent picked `done` because **no tool builds a framed arch** (T-191 review §3). So the climb stalls,
in order: the arched OPENING (major) first, then the WALL rubble-quoin contrast (major), then the ROOF
eave/verge band (minor). This is the ticket's order, confirmed by the run, not speculation.

## 2. The recognition program — what the concept actually declares

`benchmarks/sculpture/recognition/gatehouse.program.json` (one mass `hall`, rect 15×15, `style:rustic`):
- **`roof.ridgeAxis:"x"`** — "Ridge runs x so the arched gable end faces −x and the slope-and-window eave
  sides face ±z." The runner builds with **`"z"`** → the gable is rotated 90° from the gate face. The
  footprint is near-square (15×15, `minArchWidth` aside) so geometry alone is ambiguous; the **program
  disambiguates** and the runner ignores it. This is the reviewer's "ridge rotated 90° vs the gate."
- Openings: `-x door head:"arch" headRole:"frame.timber"`; `+z`/`-z window head:"flat"`. Only ONE door is
  declared (-x) — but the build carves a **through-passage**, so the seed has door apertures on **both ±x**
  (probed below). "Dress both passages" therefore falls out of iterating all door apertures.
- Material inversion (the `reading.summary`): field = `wall.dressing` (dressed), quoins =
  `wall.field.ground` (rubble). `walls.dressing.role:"wall.field.ground"`. Roof `trimRole:"wall.dressing"`.

Pack `packs/rustic.json` via `roleBlock(pack, role)` (the single material authority):
- `frame.timber → dark_oak_log` · `wall.field.ground → cobblestone` (rubble) ·
  `wall.dressing → stone_bricks` (dressed) · `roof.trim → dark_oak_planks`.

So: **arch frame = dark_oak_log**, **rubble quoins = cobblestone**, **field/band = stone_bricks**.

## 3. The seed build — probed, not assumed

`benchmarks/sculpture/generated/gatehouse/artifact.json` → `artifactOccupancy`; bounds
`min[-13,0,-13] max[13,24,13]`. `extractApertures(occ)` finds:
- `+x/door` (cells=13, **isArch=false**) · `-x/door` (cells=13, **isArch=false**) ·
  `+z/window` (1) · `-z/window` (1).

**Both passage mouths are flat rectangular holes** — `deriveOpeningEdges(ap).isArch === false`. This is the
load-bearing constraint for the arch hand (§5): the existing voussoir path (`composeTreatment` →
`archHeadPlacements` → `deriveArchHead`) only **recolors stones that already form an arch** (`isArch` gate).
It is a no-op on a flat opening. **The arch must be CONSTRUCTED**, not recolored.

## 4. The reuse inventory (three layers — confirmed by sub-agent sweep)

**(a) Edge derivations** (`src/view/treatment-grammar.mjs`, pure coordinate sets, no voxels):
`deriveEdges` (footprint/corners/cornerKey), `deriveOpeningEdges(aperture)→{reveal,head,isArch}`,
`deriveArchHead(aperture)→{crown,voussoirs,curve}` (recolor of an *existing* arch only),
`deriveRoofEdges`, `deriveRakingVerge`. **Composers:** `composeTreatment(occ,spec,ctx)` (base→field-by-
exclusion→corners(quoin)→top(cornice)→opening(dress+voussoir), returns `{occ,placements,edges,closure}`),
`composeRoofTreatment(occ,roofSpec,ctx)` (eave-overhang + ridge cap + raking verge). Both carry
`recessClosureGuard` (closureOf-not-regressed, the AC's closure check) for free.

**(b) Proud-emission brushes** (`src/view/facade-articulation.mjs`, each `{placements,report}`, all delegate
to `surfaceRelief` in `src/view/surface-relief.mjs`): `quoin(occ,{material,faces,run,headerDepth})` (corner
stepped accent), `eaveOverhang(occ,{material,faces,depth,eaveRow})`, `pilaster`, `infillPanel`. Reached
through the registry DOOR `applyArticulation(occ,[{brush,params}])` (`src/recognition/compile.mjs:429`) —
never a direct technique import (the brush-door tripwire). `composeTreatment` already routes quoins/cornice
through this door.

**(c) Constructive shaped vocabulary** (`src/form/shaped-vocab.mjs`, spec→cells, the missing arch builder):
- **`archRing(spec)→{aperture,ring:[{pos,block}],headCells,jambCells}`** — voxel-circle: a cell is aperture
  iff its center is inside the fitted disc (`(u−u0)²+(y−y0)²≤r²` for y≥y0, full span below the spring);
  `ring` = head-window cells OUTSIDE the disc, as FULL CUBES (the Minecraft-native arch). `spec` =
  `{center:[u0,y0], radius, span:{axis,range}, yRange, depth:{axis,range}, block}`. **This builds the
  spandrel/voussoir solids that turn a flat rectangle top into an arch.** `jambCells` label the flanking
  wall columns (the frame sides). Pure, fail-loud, exhaustively orientation-tested.
- `flatHead(spec)` (degenerate squared lintel), `stairRun`, `slabStep`.
- Defaults `SHAPED_DEFAULTS`: `minArchWidth:5`, `minArchRise:2`, `rmseTol:0.8`.
- Fit seam (only needed when *recovering* an arch from a profile, NOT our case): `fitOpeningHead` in
  `src/form/shaped-fit.mjs`; registry wrappers `archConstruct`/`flatHeadConstruct` in
  `src/pack/idiom-registry.mjs`. We IMPOSE a known semicircle, so we build the `archRing` spec directly and
  skip the fit.

**Opening axes** (`treatment-grammar.mjs` OPENING_AXES): `±x` faces → `{u:z, v:y, w:x}`; `±z` →
`{u:x, v:y, w:z}`. The `dressOpenings` depth-probe idiom (first-solid-from-camera along w) is the precedent
for resolving the exterior wall plane.

## 5. Constraints, seams, and risks (surfaced, not solved)

- **Arch is constructive, additive.** Placing `archRing.ring` cubes where the opening top corners are
  currently AIR is an *add* (air→solid), narrowing the rectangle into an arch — NOT an air op, honors
  `facade-recess-by-exclusion` (we never remove). Closure can only rise; `recessClosureGuard` holds by
  construction. The aperture (disc interior) stays open.
- **Pure-vs-runner split.** Existing hands are inline because they wrap tested modules. The arch is genuinely
  NEW pure geometry (impose-an-arch on a flat hole) → it earns its own tested `src/` module; the quoin and
  banding hands wrap already-tested composers (`composeTreatment`/`composeRoofTreatment`) so they can be thin
  inline runner wrappers like the existing four. Keeps `npm test` covering the new logic.
- **The override is MAJOR-gated.** `departmentDominant` fires only when a *major* in a targeted dept clears.
  Arch (OPENING major) and quoins (WALL major) qualify. **The eave band targets a ROOF *minor*** — clearing
  a minor does NOT trip the override, so banding can only be KEPT by a scalar improvement or a tie-coverage
  win. This is a real falsification risk the ticket names ("eave banding, trim, minor") and a candidate
  S-191 finding (the override does not generalize to minor-only levers).
- **Orientation is a CRITIQUE-COVERAGE gap.** The recorded critique never names rotation/orientation — the
  loop cannot *stall* on what it cannot *see*. Per the ticket, orientation is therefore NOT a climb-driven
  hand; it is a recognition-declared correction (use `program...roof.ridgeAxis`). Fixing it is right and
  cheap, but must be reported as recognition-driven, with the eyes-gap flagged for E-50 "CRITIQUE COVERAGE"
  / E-49 (the 2026-06-17 glance audit's named frontier).
- **construct_walls already adds quoins** (`wallSkinPlan` item 3) — but in *dressed* stone (stone_bricks),
  the SAME as the inverted field, so they don't contrast; the critique still names "rubble quoins". The
  quoins hand's lever is the **material inversion** (cobblestone rubble), not the geometry.
- **`measurements/` untouched**; the new module is creation-loop only; `npm test` must stay green.

## 6. Open questions for Design
- One mega-hand (`composeTreatment` does arch+quoins+band at once) vs. three separate hands? The per-hand
  "critique fires → lever → clears → gate keeps it" falsification wants them SEPARATE.
- Arch depth: single exterior wall plane per face, or through the passage depth? (Cleaner read vs. vault.)
- Whether to also fix orientation now (recognition-driven) or defer — the ticket says fix + flag.
