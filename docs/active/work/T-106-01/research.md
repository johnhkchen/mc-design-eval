# T-106-01 component-aware-skinning — Research

Descriptive map of what exists. The ticket: make the E-24/E-26 skin pipeline consume the
parametric component definitions (T-103 records, T-104 roof programs, T-105 shaped heads) instead
of re-deriving structure from noisy occupancy, with recorded occupancy fallback, full re-skin of
all three subjects, and a church band0 re-measure. E-27 Rule 4: components are the contract;
re-derivation where a definition exists is a bug.

## 1. The skin chain today

Orchestration is two nested runners, both registry-driven (`SUBJECTS` in
`benchmarks/sculpture/durable-skin.mjs:94–206`, no central loader):

- `runChain(def, paths)` (`challenge-milestone.mjs`, exported) — provision (challenge subjects,
  GLB voxelize) → shell integrity (T-091) → **regularize cage (T-102)** → `buildSkin` (E-24).
- `styledChain(def, kitRec, paths, track)` (`styled-milestone.mjs:86–131`) — `runChain` →
  placement grammar (T-098) → opening dressing (T-099) → grammar settle fixpoint (T-100, max 4
  iterations) → spawned kit-aware multi-angle gate (T-100 ∘ T-093).

`buildSkin(def, {zoneSource})` (`durable-skin.mjs:300–540`) is the deterministic skin core:
value-true substitution (T-086) → kit overrides (T-096) → seal (S-084 `sealRoof`/`sealWalls`) →
concept zone map (T-092) → full-shell base coat (T-085/T-090 `zoneFill` exposure skin) →
secondaries splat (E-23, front concept / side GLB) behind the T-088 coverage precondition →
coherence ops (T-087) → terminal gates (T-088 coverage + T-090 band evidence + plaster invariant).

Stage artifacts: `styled/<subj>/{base,shell,grammar,}artifact.json` + `styled/<subj>.json` record;
the chain runs twice and asserts byte-identical shas (`styled-milestone.mjs:364–394`).

## 2. The four occupancy re-derivations the ticket names

**Roof courses from the blob's top.** `regularizeRoofCourses(occ, {dominant})`
(`src/view/surface-pattern.mjs:165`) basin-fills the `+y` height field from `topHeightMap`
(`:36`) — i.e. it samples whatever top the build has and adds course blocks to flatten pits.
Roof zone *membership* is likewise occupancy-derived: `structuralZones(occSealed, def.zoneOpts)`
(durable-skin.mjs:355) yields `upperTop` + `roofKeys`, consumed by `zonesFromBands`
(`src/view/zone-map.mjs:51`) so `zoneOf` says "roof" for `y >= upperTop || key in roofKeys`.

**Frame lines from heuristics.** `frameLines(occ, {floorLines, upperTop, roofKeys})`
(`src/view/frame-lines.mjs:95`) classifies wall cells as `cornerPost` (convex corner columns,
`:63`), `roofline` (topmost wall cell meeting roof, `:83–86`), `floorLine` (`:87–89`) — all read
from occupancy. The grammar (`benchmarks/sculpture/placement-grammar.mjs`, `grammarStage`
exported) binds kit entries to these lines and re-runs zone-fill, then re-asserts the gates.

**Wall fields from the exposure shell.** `zoneFill(occ, {zoneOf, zones, skin:"exposure"})` and
`surfaceZoneHistogram` (`src/view/zone-fill.mjs:136/187`) census the whole 6-direction exposure
shell per zone band; nothing knows which cells are the *wall slab faces* the T-103 record defines
(`wallSlabs[]`: `dir`, `axis`, `value`, `boundsWorld`, `coverage`).

**Zone maps pinned to the old geometry.** `extractConceptZoneMap` (`src/color/band-profile.mjs`)
maps concept rows → voxel y via floor-lines and a widest-silhouette anchor measured on the
*current* occupancy; an agreement check vs the committed `zone-map/<subj>.json` runs every build
(durable-skin.mjs:380–390). T-095 review open concern #4 (the ticket's "re-pin protocol"): zone-map
divergence on repaired shells is recorded, not gated — "if the repaired-shell chain becomes
canonical, re-pin the zone-map records."

**The church refusal point.** `coverageGate(cov, {threshold: 0.5, zones})`
(`src/view/face-resemblance.mjs:78`, `DEFAULT_COVERAGE_THRESHOLD = 0.5` at `:59`) is called as
splat precondition (durable-skin.mjs:432) and terminal gate (`:487`). `challenge/church.json`:
`status: "pipeline-failed"`, stage `skin`, error "coverage gate FAILED on the final skin: band0
stone=0.332 < 0.5" — measured on the blob shell. `styled/church.json` fails earlier at stage
`kit`: no committed kit record, because kit extraction requires a committed zone-map record, which
requires the skin chain to have succeeded (circular until the skin passes).

## 3. The component-record layer (inputs T-106 consumes)

All records live at `benchmarks/sculpture/<stage>/<subj>.json` (+ `<subj>/artifact.json` for
rebuilt shells), chained by explicit sha256 pins; drift throws (E-27 provenance rule).

- **T-102 `regularize/<subj>/artifact.json`** — the regularized shell, all three subjects
  committed. Cage mechanics in `src/view/shell-regularize.mjs` (26-cube open/close, per-azimuth
  IoU vs GLB ≥ input − tolerance at 4 frozen azimuths, closure no-regress, protected regions
  byte-identical; `protectViolations` exported since T-104).
- **T-103 `components/<subj>.json`** (`component-record/v1`, schema
  `schema/component-record.schema.json`) — `source.{shellPath,sha256}` pins the shell it
  decomposed; `masses[]` (role primary/attached/protrusion, plan runs, junctions); `roofPlanes[]`
  (kind pitched/flat, `voxelFit`/`glbFit` planes, `extent`, `eave.{cells,dir}`,
  `ridge.{withPlane,axis,y,cells}`); `wallSlabs[]` (above); `openingGroups[]` (`openings[]` with
  `extent`, `jambs[]` — `at` are aperture columns —, `headProfile[]`, `archCandidate`, `spring`);
  `findings[]` named gaps. Cells encoded as row runs (`columnRuns`/`runCells`,
  `src/form/component-decompose.mjs:34–66`).
- **T-104 `roof/<subj>.json` + `roof/<subj>/artifact.json`** (`roof-program/v1`) — fitted gables
  (`fit.gables[]`: ridge axis/y, per-side pitch + `pitchSource`, eave y/edge, overhang, footprint),
  `family` `{field, stairs, slab}` derived from the kit row (`roofFamily`,
  `src/view/roof-generate.mjs:45`), `swap` (accepted, attempt ladder, IoU, carve/generated counts),
  and the **swapped shell** with generated stair/slab states. Status: cottage + gatehouse
  `accepted`; **church never run** (T-104 review concern #6 — registry-generic, null kit would
  yield a named `kit-roof-field-missing` full-block fallback). Parametric surface exported:
  `gableSurfaceHeight` (`src/form/roof-fit.mjs:186`), heightfield: `roofHeightfield`
  (`src/view/roof-generate.mjs:96`).
- **T-105 `shaped/<subj>.json` + `shaped/<subj>/artifact.json`** (`shaped-vocabulary/v1`) — all
  three subjects committed (church: 6 squared heads, 26 fixpoint noops). `openings.detail[]`
  (kind arch/flat/none, spec, fitError, carved/filled, headCells/jambCells), `planeFits.detail[]`
  (`stairRun`/`slabStep` specs per roof plane — fitted but **not applied** to the shell), `cage`
  accept evidence. Pure generators in `src/form/shaped-vocab.mjs` (`stairRun`, `slabStep`,
  `archRing`, `flatHead`).

**Critical fork:** roof and shaped runners *both* take `regularize/<subj>/artifact.json` as input
(verified in committed records' `inputs`). `roof/<subj>/artifact.json` and
`shaped/<subj>/artifact.json` are **parallel reconstructions of the same shell** — nothing
composes them, and no stage in `benchmarks/` or `src/` reads `components/`, `roof/`, or `shaped/`
outputs downstream (grepped). T-106 is the first consumer.

## 4. Known hazards recorded by the upstream reviews

- **Stateless zone-fill cubes stairs** (T-104 review concern #1, by design deferred to S-106):
  `zoneFill`/`paintFace`/`stripStraySalt` placements are stateless block ids; last-write-wins over
  the roof artifact would replace every generated stair/slab with full blocks. Equally,
  `regularizeRoofCourses` basin-fill on a stepped stair surface would "fix" the steps it sees as
  pits, and `sealRoof` may mutate the generated band.
- **Gable-end triangles are roof-field material** (T-104 concern #5): the swap carves the whole
  band and regenerates it as the wedge, so previously wall-colored gable triangles are now
  spruce/deepslate planks — exactly the "zone maps re-pinned on rebuilt geometry" work this ticket
  names. `gableEndsVariant` (`src/form/roof-fit.mjs:350`) exists as a fitted alternative.
- **Stairs are invisible in renders** (pinned T-097 lens gap, prismarine-viewer 1.33.0; T-104
  concern #2): geometry is proven by the unmapped-state THROW gate + pure-rasterizer IoU, not
  pixels. Any T-106 gating must not depend on stair pixels; resemblance stays evidence
  (reproducible runs gate on coverage only — project rule).
- **Shaped `ring-unsupported` labels** (T-105 concern #3): church mirrored ±z window groups
  produced 594 named, unfilled interior ring cells — "worth a look when S-106 consumes these
  labels."
- **Cottage flat-head fallbacks** (T-105 concern #4): two heads stay sampled
  (`flat-out-of-tolerance`, rmse 0.707 > 0.6) — consumption must tolerate `kind:"none"` openings.
- **Aperture reference is the RAW pre-seal build** (`styledChain` line 102:
  `extractApertures(artifactOccupancy(base))`) — T-099's concept-declared reference. The shaped
  artifact *changes* opening heads (arches), so the dressing's aperture read and the rebuilt
  geometry can disagree.

## 5. Conventions and constraints the work must keep

- **Registry pattern**: each runner embeds a `SUBJECTS`/`EXTRAS` const with explicit input paths +
  expectation pins; CLI `--subject` selects; no subject-specific constants in core modules.
- **Determinism contract**: pure cores (`src/form`, `src/view`) with synthetic-fixture
  `node --test` suites (1341 passing); impure runners double-run and assert byte-identical sha256;
  `--repro` re-verifies committed records byte-identically; `--offline` skips renders; GL output is
  evidence, never a decision input.
- **Honest failure**: throw → `{status:"pipeline-failed", stage, error}` record, exit 1; named
  findings instead of silent fallbacks; fallback-to-occupancy must be *recorded* (the ticket's AC
  wording) the way `pitchSource`/`fit-source-voxel` findings are.
- **Byte-identity of existing behavior**: AC requires subjects/stages without a component record
  to re-verify byte-identical through today's occupancy derivation — the fallback is the current
  code path, untouched.
- **Gate semantics frozen**: `coverageGate` threshold 0.5 and the T-090 band-evidence targets are
  declared constants; the church AC is "passes or the residual is named with its measured cause" —
  not threshold tuning (E-25 Rule 6).

## 6. Open questions carried to Design

1. **Composition of the two reconstructions**: roof artifact ∥ shaped artifact fork from the same
   regularized shell — compose deltas, chain the runners (roof output → shaped input), or re-run
   one atop the other inside the styled chain?
2. **Where reconstruction enters the chain**: inside `runChain` (between regularize and skin) vs.
   pre-staged committed artifacts consumed by reference (the T-104 review calls
   `roof/<subj>/artifact.json` "its input").
3. **How skin ops respect generated cells**: exclusion regions, state-preserving paint, or
   program-aware roof zone (`zoneFill` already accepts a `regions` option, `zone-fill.mjs:136` —
   currently unexplored here).
4. **Re-pin mechanics**: what "re-derived/re-pinned on rebuilt geometry" means against the
   committed `zone-map/<subj>.json` agreement assert (durable-skin.mjs:380–390) without breaking
   cottage/gatehouse byte-reproducibility.
5. **Church kit absence**: roof:church needs a roof field block with `kitRecord: null` — named
   fallback exists; whether the styled chain's kit precondition stays a church blocker is a
   milestone call, but the band0 re-measure (AC #4) only needs the skin chain, which runs kit-less.
