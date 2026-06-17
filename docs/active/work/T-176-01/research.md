# T-176-01 — Research: source treatments, close the critique→amplitude loop, generalize to roof + openings

Story **S-176**, epic **E-43**. T-175-01 built the compositional treatment grammar (`deriveEdges` +
`composeTreatment` + `recessClosureGuard`) and proved it on the gatehouse with a **hand-authored** spec. This
ticket closes the epic on three fronts: (1) **source** the spec from recognition + a style pack instead of
authoring it; (2) wire the **E-39 structured critique** to an **amplitude-refinement** pass (the feedback→
construction loop); (3) **generalize** the `edges`-from-geometry vocabulary to **roof** and **openings**. This
is descriptive: what exists, where, how it connects.

## The foundation this builds on (T-175-01)

`src/view/treatment-grammar.mjs` (pure, 13 tests, no GL):
- `deriveEdges(occ, {faces, floor, eaveY})` → `{footprint, corners, cornerKey, top:{row}, bottom:{row}, band}`.
  Edges are computed from the in-band occupied columns (footprint bbox → ≤4 corner columns; top/bottom rows).
- `composeTreatment(occ, spec, ctx)` — layers base → field(recess-by-exclusion) → edges.corners(quoins) →
  edges.top(corner-excluded cornice) → edges.opening(injected dressOpenings). Single last-writer-wins fold.
  Returns `{occ, placements, edges, report, closure}`. **Amplitude is first-class** (depth/headerDepth/
  courses/run).
- `recessClosureGuard(before, after, {floor,eaveY})` — proves the recess reopened no holes; has teeth (trips
  on a synthesized carve).
- Charter (inherited from surface-relief): proud cells only in front of existing shell; **recess by
  exclusion — no air op**; pure; brushes reached only through the **registry door** (`applyArticulation →
  getBrush`); the opening-dressing technique is **dependency-injected** (the brush-door tripwire).
- The serialized hand-authored artifact: `docs/active/work/T-175-01/rustic-gatehouse.treatment.json`.

**Two named open concerns inherited (the spine of this ticket):** (a) edge material must differ from the
field material or `surfaceRelief` silently no-ops; (b) `deriveEdges` is tested on single-box geometry only,
and roof/openings are unattempted.

## 1. Sourcing — recognition program + style pack → spec

**Building program** `benchmarks/sculpture/recognition/gatehouse.program.json` (schema
`schema/building-program.schema.json`, `building-program/v1`). Materials are declared as **roles, never raw
blocks**:
- `masses[0].walls.ground.role = "wall.dressing"`, `.upper.role = "wall.dressing"`,
  `.dressing.role = "wall.field.ground"` (the quoin/dressing role).
- `masses[0].roof = {idiom:"roof.gable", ridgeAxis:"x", fieldRole:"roof.trim", trimRole:"wall.dressing",
  gableRole:"wall.dressing"}`.
- `masses[0].openings[]`: a `-x` `door` (w4 h8, `head:"arch"`, `headRole:"frame.timber"`), and `±z`
  `window`s (`head:"flat"`, `headRole:"wall.field.ground"`).
- The `reading.summary` states the inversion explicitly: *"field is coursed stone (wall.dressing), corners are
  rubble (wall.field.ground)"* and *"Roof reads dark … with a lighter stone eave/verge course banding the
  edges"*. The program **already encodes** the field/edge split and the roof-trim-as-distinct-role — sourcing
  is a role-lookup, not a guess.

**Style pack** `packs/rustic.json` (schema `schema/style-pack.schema.json`, `style-pack/v1`). The relevant
role→block mappings (`palette[]`):
- `wall.field.ground → cobblestone` (rubble), `wall.dressing → stone_bricks` (dressed),
  `frame.timber → dark_oak_log`, `roof.field → spruce_planks`, `roof.trim → dark_oak_planks`,
  `door.main → spruce_door`, `window.shutter → dark_oak_trapdoor`.
- `decoration[]`: `{item:"door-lantern", block:"lantern", where:["door"]}`.
- `proportions` carries `storeyHeight/pitchClasses/openingRhythm` but **no `articulation`** block — so the
  pack supplies **no amplitude**; amplitude defaults live in the engine and are tuned by the critique loop.

**Role→block authority:** `src/recognition/compile.mjs::roleBlock(pack, role)` (lines 28–32) — the single
lookup, fails loud if a role is absent. `validateProgramAgainstPack` already guarantees every program role is
in the palette (palette-in-pack), so sourcing cannot reference a missing role.

**The sourcing result, hand-derived for the gatehouse** (proof the source reproduces the hand-authored spec):
field = `roleBlock(wall.dressing) = stone_bricks` (recess); edges (corners/base/top) =
`roleBlock(wall.field.ground) = cobblestone`; opening.frame = `roleBlock(frame.timber) = dark_oak_log`,
opening.door = `roleBlock(door.main) = spruce_door`, opening.light = decoration `door-lantern = lantern`.
**Edge (cobblestone) ≠ field (stone_bricks)** — the no-op guard passes. This matches
`rustic-gatehouse.treatment.json` exactly.

## 2. The E-39/E-41 critique → amplitude loop

**CritiqueItem** (`baml_src/department.baml`, mirrored by `src/workshop/diagnose.mjs`):
`{department: ROOF|WALL|OPENING|CHIMNEY|ROOM, expected, present, missing, kind:"add"|"replace"|"remove",
severity:"minor"|"major"}`. The departments are single-sourced from `src/pack/departments.mjs`.
- `kind="add"` ⇒ element absent; `replace` ⇒ present-but-wrong-style (capping); `remove` ⇒ unwanted.
- `src/workshop/bakeoff-score.mjs::itemStyleClass` reads `kind` first (then a structural present/missing
  fallback). `styleFidelityScore`: each item subtracts a severity penalty; any `replace`/wrong-style item caps
  the score at `WRONG_STYLE.cap = 40`. So **a build with right materials but missing detail (`add`) is NOT
  capped** — this is the E-41 fix and why the token-relief build can reach ~42.

**The bridge** `src/baml/bridge.mjs` (`bamlRender`/`bamlParse`) over `bridge.mts` (the sole `baml_client`
import). `DiagnoseBuild` is a **live LLM** call (rides the `claude -p` shim from `.mjs` runners; the bridge
only renders/parses). But there is a **deterministic fixture path**: `src/baml/fixtures/diagnose/`
(`reply.txt`, `expected.json`) — `bamlParse({fn:"DiagnoseBuild", text:reply})` yields a typed critique with no
spend. The fixture critique already contains a WALL `kind:"add"` item *"missing the stone_bricks quoins, piers
and plinth band"* and a ROOF `kind:"replace"` item — exactly the "quoins under-realized / trim thin" signal
the loop must consume.

**Loop seam (the key finding):** the amplitude refinement — `(spec, critique) → spec'` mapping
department+kind+missing → amplitude bumps — is a **pure function**, unit-testable on fixture critique items
with no LLM and no GL. Only the *initial* and *final* `DiagnoseBuild` (to see thin detail and to measure the
lift) are metered live calls, kept in an impure runner (the `score-gatehouse-selfconcept.mjs` pattern).

## 3. The re-score (AC #3) and the two baselines

`experiments/eval-alignment/score-gatehouse-selfconcept.mjs` is the existing scorer: asset-guard-first, VOTES
loop, no re-ask, writes `selfconcept-score.json`. It diagnoses the build against its **own** rustic concept
and reports `styleFidelityScore`. **Two baselines must not be conflated:** the **E-40 floor (~2)** is the
program-less `polished_basalt` build (wrong material → capped); the **token baseline (42)** the ticket names
is the `styleFidelityScore` of the **token-relief faithful gatehouse** (right materials + missing detail ⇒
`add` ⇒ uncapped ≈ 42). AC #3 asks the **sourced + refined** build to score **above 42**.

## 4. Generalization — roof + openings

**Roof.** `src/view/roof-generate.mjs::generateRoof(gables, family)` builds the roof from fitted gable params
(`ridge.{axis,y}`, `sides[].{eaveDir,pitch,eaveY,eaveEdge}`, `footprint`, `ends`). For the **gatehouse
faithful build** the roof is already in the occupancy: wall band `floor=0..eaveY=19`, **roof band y20..28**
(`ridgeY=28`), ridge axis x (15×15 footprint). The eave row, ridge row and gable-end (verge) columns are
derivable from the **roof-band** occupancy the same way wall edges are from the wall band. The door-reachable
brush `eave-overhang` (`src/view/facade-articulation.mjs::eaveOverhang`, registry `"eave-overhang"`, params
`{material, faces, depth, eaveRow}`) places a proud course at one row — exactly an eave/ridge band.

**Openings.** `src/view/opening-dressing.mjs::extractApertures(occ)` → aperture records with `perim`
(solid perimeter ring = the **reveal**), `lintel`, `sill`, and `cells` (arch corners marked solid for an
arched head). `dressOpenings` already realizes the reveal (frame/door/light) — proven in T-175-01. The
**arch head** is the new edge.

**Where the unification leaks (the ticket's named failure mode, confirmed by exploration):**
- **Roof eave/verge are sloped lines, not axis-aligned rows.** A single row-course (`rowCourse`/`eaveOverhang`
  at one y) treats only the eave/verge cells at that y — fine for the eave bottom band and ridge cap, but a
  fully-correct *raking* verge that follows the pitch needs per-column edge derivation the wall's `top.row`
  abstraction does not express.
- **The arch head is a curve, not a row.** `deriveEdges`'s corner/row model cannot name a voussoir arc;
  `extractApertures` exposes the arch cells, so the reveal generalizes but the head needs an opening-local
  derivation, not the footprint-corner one.

These leaks are exactly what the falsifiable claim says to **report**, not hide.

## Constraints & assumptions

- **`npm test` must stay green, no GL, no LLM** — the pure core (sourcing, refinement, roof/opening
  derivation) goes under `src/**/*.test.mjs`; renders + live diagnose are impure runners under `experiments/`.
- **Frozen instrument untouched** — `measurements/`, pin-guard, gate vocabulary. This is creation-loop work.
- **Brush-door + recess-by-exclusion + purity** charters carry over verbatim from T-175-01.
- The roof faithful build's roof IS in the occupancy (so we can derive from geometry); we do **not** refactor
  `roof-generate.mjs` to persist gable metadata (agent-flagged as a separate, larger concern — out of scope).
</content>
</invoke>
