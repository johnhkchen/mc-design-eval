# T-098-01 placement-grammar — Structure

## Files

| File | Action | Role |
|---|---|---|
| `src/view/frame-lines.mjs` | create | Pure geometry: frame-line cells, field instances (no materials) |
| `src/view/frame-lines.test.mjs` | create | Synthetic-occupancy unit tests |
| `src/form/placement-grammar.mjs` | create | Pure binding: kit entries → feature instances → placements |
| `src/form/placement-grammar.test.mjs` | create | Binding + end-to-end grammar unit tests |
| `benchmarks/sculpture/placement-grammar.mjs` | create | Impure runner (I/O, GL, record, frames) |
| `package.json` | modify | `grammar:cottage`, `grammar:gatehouse` scripts |
| `.gitignore` | modify | `benchmarks/sculpture/placement-grammar/**/*.png` stanza |

Nothing else changes. `durable-skin.mjs`, `zone-fill.mjs`, `structural-read.mjs`, committed records:
untouched (Design Decision 1).

## Module 1 — `src/view/frame-lines.mjs` (pure, no GL, no materials)

Imports: `bareBlock, solidOccupancy` (occupancy), `projectSurface, gridMaskOf, orthoSpec`
(surface-grid), `airComponents` (structural-read).

```
export const FRAME_KINDS = Object.freeze(["cornerPost", "roofline", "floorLine"]);  // precedence order

/** Convex corner columns of the footprint: (x,z) columns whose outline exposure includes two
 *  perpendicular horizontal air directions. → Set<"x,z"> */
export function cornerColumns(occ)

/** Wall cell = occupied, side-exposed (±x/±z air neighbor), not a roofKeys member.
 *  → iterable [{key, voxel, block}] */
export function wallCells(occ, roofKeys)

/** Classify frame-line cells. Precedence: cornerPost > roofline > floorLine (a cell gets ONE kind).
 *  - cornerPost: wall cell in a corner column.
 *  - roofline:   wall cell 6-adjacent to a roofKeys cell, or top-of-column with y >= upperTop-1
 *                (eave beams on flat sides; gable rakes trace the slope on gable ends — one rule).
 *  - floorLine:  wall cell with y in interiorFloorLines = floorLines strictly above the ground
 *                layer and strictly below upperTop (storey boundaries only).
 *  @returns {cells: Map<key, kind>, byKind: Record<kind, string[]>, counts} */
export function frameLines(occ, {floorLines, upperTop, roofKeys})

/** Bounded fields BETWEEN frame lines, per ortho side face: face mask where 1 = air ∪ frame cell,
 *  airComponents' 0-components = field instances. Returns per face:
 *  [{dir, instances: [{bbox, cellsUV, voxels, cells}]}]. Placement source remains the world-cell
 *  predicate (wallCells minus frame) — instances are identity/stats (T-090: projection under-covers).
 */
export function fieldInstances(occ, frame, {roofKeys})
```

All functions take/return plain data; `solidOccupancy` applied at entry so fixture cells are never
classified (never recolored). No zone/material knowledge here.

## Module 2 — `src/form/placement-grammar.mjs` (pure binding + composition)

Imports: `frameLines, fieldInstances, wallCells` (view/frame-lines), `openings` (view/structural-read),
`zoneFill` (view/zone-fill), `overlayPlacements` (view/surface-pattern), `bareBlock, solidOccupancy`
(view/occupancy).

```
export const GRAMMAR_SCHEMA = "placement-grammar/v1";

/** Deterministic candidate order: whereUsed-specificity (fewer terms first), then confidence
 *  (high>medium>low), then block id. Exported for tests. */
export function rankCandidates(entries)

/** Bind kit entries (NAMED space) to feature classes. Cube entries only for frame/panel/course;
 *  entries with valueCheck.verdict === "flagged-mismatch" excluded everywhere.
 *  - frame:  "trim" ∈ whereUsed
 *  - panel(band): bandName ∈ whereUsed, frame-bound block excluded
 *  - course: "roof" ∈ whereUsed
 *  - openingTreatments: fixture/rail entries with "openings" ∈ whereUsed
 *  Missing candidates ⇒ null binding + a row in `skipped` (collect-don't-throw, kit.mjs precedent).
 *  @returns {frame, panels: Record<band, block>, course, openingTreatments, skipped[]} */
export function bindKit(kit, {bandNames})

/** Per-instance opening binding: door-kind → candidate whose bare id ends in "door";
 *  window-kind → highest-ranked remaining candidate. Returns [{dir, kind, bbox, cells, dressing,
 *  treatment, candidates}] — bindings only; placements are T-099's. */
export function bindOpenings(instances, treatments)

/** THE GRAMMAR. occ = solid view of the shipped artifact. All in SHIPPED space: caller passes
 *  `sub` (named→shipped rename; default identity) applied to bound blocks once.
 *  Steps (all pure):
 *   1. frameLines(occ, geom) → frame placements [{op:"voxel", pos, block: sub(frame)}], diffed
 *      against current blocks (no-op cells dropped).
 *   2. overlayPlacements(occ, framePlacements) → occ'.
 *   3. zoneFill(occ', {zoneOf, zones, skin:"exposure"}) where zones = caller's shipped policy
 *      (dominant = panel/course per band — asserted equal to sub(binding), `bindingAgreesWithPolicy`).
 *      The fill realizes fields→panel and courses→course under the T-090-01 keep contract
 *      (declared secondaries in runs survive: chimney shaft/cap, splat studs).
 *   4. frameRefilled = fill placements ∩ frame cells (MUST be 0 — reported, runner throws).
 *   5. fieldInstances + openings per side dir → instances + bindOpenings.
 *  @returns {bindings, frame: {counts, byKind, placements}, fill, fields, openings,
 *            placements: frame.placements ++ fill.placements, preconditions: {frameInPreserve,
 *            bindingAgreesWithPolicy}, frameRefilled, stats} */
export function placementGrammar(occ, {kit, bandNames, policy, zoneOf, floorLines, upperTop,
                                       roofKeys, sideDirs = ["+x","-x","+z","-z"], sub})
```

Preconditions *reported*, not thrown (pure core collects; the impure runner enforces):
`frameInPreserve[band]` = sub(frame) ∈ policy[band].preserve ∪ {dominant} for every wall band a
frame cell lands in; `bindingAgreesWithPolicy[zone]` = sub(binding) === policy[zone].dominant.

## Module 3 — `benchmarks/sculpture/placement-grammar.mjs` (impure runner)

Header comment records THE PIPELINE ORDER (AC#2): `durable-skin (value-true → seal → zone-fill →
splat → coherence → gates) → placement-grammar (frame lines → field/course re-fill → gates) →
T-099 (opening treatments)`.

Flow (mirrors durable-skin/challenge conventions):
1. CLI: `--subject` (key into the imported durable-skin `SUBJECTS`), `--offline`.
2. Load committed inputs: `durable-skin/<subj>/artifact.json` (the build), `durable-skin/<subj>.json`
   (record → `valueTrue.substitution`, `kit.overrides`, `fill.policy` = shipped policyS,
   `zoneMap.{bands, roof}`), `kit/<subj>.json` (entries for binding). Missing kit/zone-map/record ⇒
   THROW with "run skin:<subj> / kit:extract first" (honest precondition, not a fallback).
3. Reconstruct geometry: `artifactOccupancy` → `structuralZones` (floorLines, upperTop, roofKeys) →
   `zonesFromBands({bands, roof, roofKeys, upperTop})` → zoneOf. `sub` = combined
   `{...substitution, ...kit.overrides}` lookup (same composition as buildSkin:340).
4. Deterministic core TWICE: `placementGrammar(...)`; byte-equal final artifacts
   (`applyPaint(build, placements)`) or THROW.
5. Gates (deterministic, THROW on failure → no record, E-25 Rule 6):
   - `frameRefilled === 0` and every `preconditions.*` true (AC#2 fill-survival).
   - `coverageGate` (threshold `DEFAULT_COVERAGE_THRESHOLD`) on the final exposure-skin census.
   - band evidence re-check (roof own-materials ≥ 0.9, wall foreign residue ≤ 0.05) — runner-local
     arithmetic mirroring durable-skin stage 9 (commented cross-reference; not exported from there
     to keep this ticket's footprint zero on E-24 files).
   - `assertArtifact` on the final build (live AJV gate).
6. Renders (evidence, best-effort): before = durable-skin artifact, after = grammar artifact, at the
   four config azimuths (`MULTI_ANGLE_GATE.azimuths` from src/config.mjs — E-25 Rule 4) via
   `renderViews`; per-angle PNGs gitignored; 4-panel sheets via `composeSheet` →
   `pr/assets/frames/grammar-<subj>-{before,after}.png` (committed).
7. Write `placement-grammar/<subj>.json` + `.md` + `<subj>/artifact.json` (sha256, committed).
   Record fields: schema `placement-grammar/v1`, inputs, pipelineOrder, bindings (incl. candidates +
   skipped), frame counts byKind, fieldInstances per face, openings bindings (T-099 handoff),
   fill/coverage/bands, preconditions, reproducible{sha256}, renders, frames, notes.
8. `--offline`: re-assert record + artifact sha + gate booleans, exit code accordingly.

## Record/JSON shapes (new)

`placement-grammar/v1` (committed at `benchmarks/sculpture/placement-grammar/<subj>.json`) — as in
step 7. Opening binding rows carry everything T-099 needs: `{dir, kind, bbox{u0,v0,u1,v1}, cells,
dressing, treatment, candidates[]}`.

## Test plan (structure level)

- `frame-lines.test.mjs`: synthetic gabled two-storey hut (extend zone-fill.test.mjs's 5×5 hut with a
  ridge gable + a chimney column): cornerColumns finds exactly the 4 outline corners; floorLine cells
  sit only at the storey-divide y on wall faces; roofline traces both the flat eave and the gable
  rake diagonal; chimney cap is NOT classified (roofKeys); fields exclude frame/openings; counts
  hand-verified; empty/degenerate occupancies return empty structures.
- `placement-grammar.test.mjs`: entry factory; rankCandidates total order; flagged-mismatch excluded;
  panel excludes the frame block; cottage-shaped fixture kit binds frame/panels/course as expected;
  door/window treatment selection; null bindings recorded in skipped; end-to-end on the hut: frame
  placements land only on existing cells, `frameRefilled === 0`, fill keeps chimney run, placements
  byte-deterministic across two calls, rebuilt artifact passes the live AJV gate.

## Ordering of changes

1. `frame-lines.mjs` + tests (green) — commit.
2. `placement-grammar.mjs` + tests (green) — commit.
3. Runner + package.json + .gitignore — commit.
4. `npm run grammar:cottage` (live) → record + artifact + frames — commit (the AC#3 evidence).
5. `npm run grammar:gatehouse` — second-subject generalization proof (no subject constants) — commit.
