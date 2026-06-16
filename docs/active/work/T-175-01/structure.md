# T-175-01 — Structure: files, interfaces, ordering

The blueprint for the compositional treatment grammar. One new pure module + its tests, one impure runner,
one serialized spec, the work renders. No edits to existing production modules (compose over them).

## Files

| path | action | what |
|---|---|---|
| `src/view/treatment-grammar.mjs` | **new** | the engine: spec schema, `deriveEdges`, `composeTreatment`, `recessClosureGuard` |
| `src/view/treatment-grammar.test.mjs` | **new** | unit tests on synthetic square / rectangle / with-opening |
| `experiments/eval-alignment/treatment-beside.mjs` | **new** | impure runner: gatehouse render beside concept (treated + token baseline) |
| `docs/active/work/T-175-01/rustic-gatehouse.treatment.json` | **new** | the serialized spec (reusable for S-176) |
| `docs/active/work/T-175-01/treatment-beside.png` | **new (generated)** | the treated gatehouse beside concept |
| `docs/active/work/T-175-01/baseline-beside.png` | **new (generated)** | the token build beside concept (the before) |
| `docs/active/work/T-175-01/FINDINGS.md` | **new** | the busy-vs-rich call on the render + closure/report numbers |

**No existing source/schema/pack/instrument file is modified.** `measurements/` + pin-guard untouched.

## `src/view/treatment-grammar.mjs` — public interface

Imports (all already present, none from `opening-dressing` — the brush-door rule):
`bareBlock, occupancyFromCells` (occupancy), `surfaceRelief` (surface-relief), `quoin` (facade-articulation),
`closureOf` (wall-generate). Dressing is **injected**, never imported.

```js
export const TREATMENT_GRAMMAR_SCHEMA = "treatment-grammar/v1";

// Pure geometry → serializable edge descriptors. The load-bearing engine.
//   occ, {faces=["+x","-x","+z","-z"], floor?, eaveY?} →
//   { footprint:{xMin,xMax,zMin,zMax}, corners:[[x,z],...](≤4), cornerKey:Set<"x,z">,
//     top:{row:eaveY}, bottom:{row:floor}, band:{yLo:floor,yHi:eaveY} }
// corners: per-face faceSkin along-extrema (aMin/aMax) over the band, intersected to footprint corners.
// floor/eaveY default to min/max skin y across faces when omitted.
export function deriveEdges(occ, opts = {}) { /* ... */ }

// Pure-modulo-injected-dressing. Apply the spec's layers in order over occ.
//   occ, spec, { faces?, floor, eaveY, extractApertures?, dressOpenings? } →
//   { occ, placements, edges, report:{ layers:[{layer,brush,placed}], byLayer:{...} },
//     closure:{ ok, before, after, droppedColumns } }
// Layer order: base(surfaceRelief@floor) → field(recess: no-op) → corners(quoin) →
//   top(surfaceRelief@eaveY, cornerKey-excluded zoneOf) → opening(injected dressOpenings).
export function composeTreatment(occ, spec, ctx = {}) { /* ... */ }

// Pure. Recess-by-exclusion closure guard, restricted to the BEFORE footprint bbox.
//   occBefore, occAfter, {floor, eaveY} →
//   { ok:boolean, before:number, after:number, droppedColumns:string[] }
// ringIn(occ, bbox, floor, eaveY): Set of "x,z" cols occupied in-band AND inside bbox.
// ok = closureOf(after') >= closureOf(before') && droppedColumns.length === 0.
export function recessClosureGuard(occBefore, occAfter, { floor, eaveY } = {}) { /* ... */ }
```

### Internal helpers (not exported)
- `faceSkinExtrema(occ, f)` — re-derive `{aMin,aMax,yMin,yMax}` the way `facade-articulation.faceSkin` does
  (projectSurface first-hit per ray). (Kept private; `faceSkin` is not exported there.) → corners.
- `overlay(occ, placements)` — last-writer-wins fold (the wall-skin precedent), returns fresh occupancy.
- `cornerColumns(occ, faces, band)` — the 4 footprint corners as `[x,z]` from the per-face extrema.
- `bandRow(...)` — resolve a row layer (floor/eaveY) honouring an explicit value or skin extreme.

### Layer→brush mapping (the compositor body)
1. **base** present → `surfaceRelief(occ,{material, faces, depth:amp.depth, rhythm:{axis:"row",every:1,span:1},
   zone:"base", zoneOf:pos=>pos[1]===floor?"base":null})`.
2. **field.recess** → record `recess:true`, emit nothing (the exclusion). `byLayer.field = {recess:true}`.
3. **edges.corners** → `quoin(occ,{material, faces, run: eaveY-floor+1, headerDepth: amp.headerDepth})`.
4. **edges.top** → for each requested course `k` in `0..courses-1`: `surfaceRelief(o,{material, faces,
   depth:amp.depth, rhythm:{axis:"row",every:1,span:1}, zone:"top",
   zoneOf:pos => (pos[1]===eaveY-k && !cornerKey.has(`${pos[0]},${pos[2]}`)) ? "top" : null})`. The
   cornerKey exclusion = the crisp quoin/cornice junction (spike fix). Default `courses:1` (restraint).
5. **edges.opening** present AND dressing injected → `apertures = extractApertures(o)`; if any,
   `dressOpenings(o, apertures, {slots:{door:{block},frame:{block},light:{block}}})`; fold placements.
   No injection → skip (graceful).

Each step folds via `overlay`; placements accumulate; per-layer counts recorded.

## `src/view/treatment-grammar.test.mjs` — coverage map

Synthetic fixtures (mirroring `facade-articulation.test.mjs`): `boxStub(w,h,d)` (square + rectangle),
`boxWithOpening()` (a box with a punched 1×2 door void on -z). Tests:

- **TG1 deriveEdges/square** — 4 corners at the footprint extrema; `cornerKey` has 4 keys; top.row/bottom.row
  = skin extrema.
- **TG2 deriveEdges/rectangle** — non-square box: corners still the 4 true footprint corners (proves it is
  geometry, not an assumption of squareness).
- **TG3 deriveEdges/with-opening** — derivation unaffected by an interior void (corners from the outer shell).
- **TG4 compose layers/order** — base+corners+top spec over a box: placements at floor row (base), corner
  columns (quoins), eave row non-corner (cornice); report.byLayer counts > 0 for each.
- **TG5 cornice excludes corners** — no `top` placement sits on a `cornerKey` column (the crisp junction).
- **TG6 recess by exclusion (no air op)** — every placement is additive (`op:"voxel"`, a known block, never
  an air/removal); the field columns keep their cells.
- **TG7 recessClosureGuard ok on additive** — guard `.ok === true`, `droppedColumns` empty, after ≥ before.
- **TG8 recessClosureGuard TRIPS on a carve** — synthesize an occAfter with a field column removed → `.ok
  === false`, the column listed (proves the guard has teeth).
- **TG9 in-plane no-regress** — `reliefNoRegress(occBefore, placements, {faces})` inPlanePreserved &&
  ratiosPreserved for the relieved faces.
- **TG10 idempotent** — composing twice yields the same final occupancy size (relief never re-emits).
- **TG11 opening seam injected** — with injected stub `extractApertures`/`dressOpenings`, the opening layer
  runs and its placements appear; without injection, compose still succeeds (opening skipped).
- **TG12 fail-loud** — missing `spec`, bad amplitude (non-int depth), unknown face → throw.
- **TG13 purity/serializable** — `deriveEdges` output is JSON-round-trippable (no functions); composing does
  not mutate the input occupancy.

## `experiments/eval-alignment/treatment-beside.mjs` — runner shape

Mirrors `articulation-spike.mjs`. Steps:
1. `raw = JSON.parse(read(BASE))`; `occ0 = artifactOccupancy(raw)`; `floor=0, eaveY=19`.
2. `spec = JSON.parse(read(SPEC))` (the serialized rustic spec).
3. **baseline** panel: token build = `quoin(occ0,{material:cobblestone,faces,run:4,headerDepth:1})` folded
   → render beside concept → `baseline-beside.png` (the before).
4. **treated** panel: `composeTreatment(occ0, spec, {faces, floor, eaveY, extractApertures, dressOpenings})`
   (the real injected dressing) → `rebuildArtifact` → render beside concept → `treatment-beside.png`.
5. Print `report.byLayer`, `closure`, and `reliefNoRegress` verdict to stderr; assert `closure.ok`.
6. Lives under `experiments/` so it may import `opening-dressing` and inject the seam.

CONCEPT path: `benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-…/concept.png`. OUT:
`docs/active/work/T-175-01/`.

## Ordering of changes
1. `treatment-grammar.mjs` (engine) → 2. `treatment-grammar.test.mjs` (green, `npm test`) → 3. serialized
spec JSON → 4. runner → 5. render (treated + baseline) → 6. FINDINGS.md (the glance call). Commit after the
green module+tests, then after the runner+renders.

## Boundaries / invariants
- The new `src/view` module **must not** import `opening-dressing` (brush-door tripwire) — dressing injected.
- The spec is **pure data** (functions only constructed inside the compositor at compose time).
- Everything additive (proud relief + dressing replace) — **recess by exclusion, no air op**; the guard
  proves closure is not regressed.
- Frozen instrument untouched; `npm test` green and grows by the new suite.
