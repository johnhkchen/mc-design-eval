# T-106-01 component-aware-skinning — Structure

Blueprint. Two new pure cores + one new runner; surgical, plan-guarded edits to the existing chain
modules. Every new behavior hangs off an optional `componentPlan` argument that defaults to null —
the no-plan path is today's code, byte-identical by construction.

## Files created

### `src/view/reconstruct-compose.mjs` (pure, ~120 lines)

The D1 delta-composition core.

```
export const RECONSTRUCT_SCHEMA = "reconstruct-compose/v1";
export function occupancyDelta(baseOcc, reconOcc)
  // → { changed:[{key, from, to}], added:[{key, block}], removed:[key] }
  // cell-level diff of two occupancies (block ids compared as written, states included)
export function composeReconstruction(baseArtifact, deltas /* [{name, delta}] */)
  // → { artifact, stats:{ perDelta:{name, changed, added, removed}, totalCells },
  //     touched:Set<key> }            // touched = union, exported for the roof region seam
  // THROWS on inter-delta overlap: lists name pair + first 20 overlapping keys.
  // deltas:[] → artifact deep-equal to base (passthrough proven in tests).
```

Composition works on artifacts via `artifactOccupancy` and re-emits placements in deterministic
key order (the sibling runners' double-run sha asserts depend on stable serialization).

### `src/view/component-plan.mjs` (pure, ~220 lines)

The D3 plan builder + the per-seam definition readers.

```
export const COMPONENT_PLAN_SCHEMA = "component-plan/v1";
export function buildComponentPlan({ componentRecord, roofRecord, shapedRecord, shellSha })
  // → { roof, frames, wallFaces, provenance } | each member null when its record is
  //   absent/unusable, with a named finding in provenance.findings
  //   (codes: roof-program-missing, roof-program-fallback, component-record-missing,
  //    shaped-record-missing, pin-mismatch:<which> — pin mismatches THROW, they never degrade)
export function roofPlanFromRecord(roofRecord)
  // → { heightAt(x,z), cells:Set<key>, footprintCols:Set<"x,z">, family:{field,stairs,slab},
  //     eaves:[{y, edge, dir}], gables } | null unless swap.accepted
  //   heightAt delegates to gableSurfaceHeight; cells = generated cell keys from the roof
  //   artifact delta vs its recorded input (computed once by the caller, injected — keeps this pure)
export function frameLinesFromComponent(componentRecord, roofPlan, { floorLines })
  // → { cornerPost:[], roofline:[], floorLine:[], source:{cornerPost,roofline,floorLine} }
  //   same cell-list shape frameLines() returns; floorLine always source:"occupancy" (D3 seam 2)
export function wallFacePredicate(componentRecord)
  // → { contains(voxel)->bool, slabs:[{id, dir, axis, value, boundsWorld}] } | null
  //   true iff voxel lies on a wallSlabs face plane within its world bounds
export function splitZoneOf(zoneOf, wallFaces, bandNames)
  // → census zoneOf wrapper: band<i> stays for on-slab cells, else "band<i>:offslab";
  //   non-band zones (roof) pass through; used ONLY for the gate census, never for fill
export function programConformance(occ, roofPlan)
  // → { columns, conforming, deviations:[{col, want, got}] } — the seam-1 check that replaces
  //   basin-fill on the program footprint (deviations recorded, never auto-fixed)
```

### `src/view/reconstruct-compose.test.mjs`, `src/view/component-plan.test.mjs` (~350 lines total)

Synthetic fixtures in the `component-decompose.test.mjs` style (`boxCells`, `gabledBox`): disjoint
accept / overlap throw / empty-delta passthrough; plan members null per missing record; pin
mismatch throws; `frameLinesFromComponent` vs `frameLines` on a synthetic gabled box (the AC's
per-seam record-vs-fallback test); `splitZoneOf` partition sums to the unsplit census;
`programConformance` zero-deviation on a program-true roof, named deviations on a perturbed one.

### `benchmarks/sculpture/component-skin.mjs` (impure runner, ~330 lines)

The D4 runner behind `reskin:{cottage,gatehouse,church}`. Registry `const SUBJECTS` (paths to
regularize/components/roof/shaped records + which chain: `styled` | `challenge`), `--subject`,
`--repro`, `--offline`. Flow per D4; writes `component-skin/<subj>.{json,md}` with
`schema: "component-skin/v1"`, fields: `inputs` (all pins), `reconstruction` (compose stats,
findings), `seamSources`, `wallField` (per-band on-slab/offslab decomposition — church's AC #4
evidence), `zoneMapRepin` (diff + whether re-committed), `chain` (stage outcomes / honest-failure),
`kitPresence` (pointer into the spawned gate record, kit subjects only), `reproducible`
(double-run sha256). Re-pin writes `zone-map/<subj>.json` via the same record shape zone-map.mjs
commits, with `repinnedBy: "T-106-01"` + embedded `diffZoneMaps` output.

## Files modified

### `benchmarks/sculpture/challenge-milestone.mjs` — the reconstruct stage (D2)

In `runChain` between the shell stage and `buildSkin` (~line 232–237):

1. sha256 the in-chain regularized shell artifact.
2. `loadReconstruction(def, shellSha)` (new local helper): read `roof/<key>/artifact.json` +
   `shaped/<key>/artifact.json` and their records if present; verify each record's input pin
   equals `shellSha` (mismatch THROWS — D2); build deltas via `occupancyDelta`; compose; write
   `<paths.reconRel>` (`…/reconstructed-artifact.json`); `buildComponentPlan(...)`.
3. `buildSkin({ ...def, build: paths.reconRel ?? paths.shellRel, zoneMapRecord: null,
   componentPlan })`.
4. Return value gains `reconstruction` (stats/findings/null) and `componentPlan` so styledChain
   and the runners can record/thread them.

No records present → no reconstructed artifact written, `build: paths.shellRel`, plan null:
the existing path byte-for-byte.

### `benchmarks/sculpture/durable-skin.mjs` — the buildSkin seams (D3)

All guarded by `def.componentPlan`:

- **Seam 1a (protection)**: zone-fill call (~line 405) gains
  `regions: [...existing, { name: "roof-program", contains }]` built from `plan.roof.cells`;
  the splat passes (~409–441) thread the same cell set as `skip`; the coherence call site
  (~459–465) passes `regions` to `stripStraySalt`.
- **Seam 1b (courses)**: `regularizeRoofCourses` replaced by `programConformance` on
  `plan.roof.footprintCols`; off-footprint columns still basin-filled; conformance result in the
  skin record.
- **Seam 1c (vocabulary)**: roof zone policy `preserve += [family.stairs, family.slab]` before
  `mapPolicy` (one site, the renaming point — kit-verification-shading lesson: one seam, never
  scattered).
- **Seam 3 (wall fields)**: when `plan.wallFaces`, gate censuses (~line 431 precondition, ~486
  terminal) use `splitZoneOf(zoneOf, wallFaces, bandNames)`; `coverageGate` zones arg unchanged
  (offslab zones carry no policy → measured, not judged — `dominantCoverage` already reports
  null-dominant zones without gating them); the full decomposition lands in the skin record's
  `coverage` field alongside today's numbers.
- **Record**: `buildSkin` return gains `seamSources` + `wallField` + `conformance`.

### `src/view/surface-pattern.mjs` — `stripStraySalt` gains `regions = []`

Same `{name, contains}` contract as `zoneFill` (validated identically); region-contained cells are
never candidates for recolor. Default `[]` → behavior identical (existing tests stand).

### `src/view/face-paint.mjs` — `paintFace` gains `skip` (optional `(voxel)=>bool`)

Skipped cells counted as `regionKept` in the pass record. Default absent → identical.

### `src/form/placement-grammar.mjs` — `placementGrammar` gains `frames` override

`frames` (the `{cornerPost, roofline, floorLine}` shape) used verbatim when provided instead of
the internal `frameLines(...)` read; everything downstream consumes the same shape. Grammar record
gains `frameSource: "component" | "occupancy"` (+ per-kind detail when component).

### `benchmarks/sculpture/placement-grammar.mjs` — `grammarStage` threads it

`grammarStage(build, { ..., componentPlan })`: when `componentPlan?.frames`, re-anchor the
component frame lines (they are cut against the reconstructed geometry the build already has —
no transform needed, same world coordinates) and pass as `frames`. Recorded in the grammar record.

### `benchmarks/sculpture/styled-milestone.mjs` — thread + record

`styledChain` passes `r.componentPlan` from `runChain` into both `grammarStage` call sites
(grammar + settle loop — the settle re-runs the SAME op, so it must see the same frames source)
and surfaces `reconstruction`/`seamSources` into the styled record.

### `package.json` — `reskin:{cottage,gatehouse,church}` scripts. `.gitignore` — render stanza.

## Module boundaries

- `src/view/reconstruct-compose.mjs` and `src/view/component-plan.mjs` import only occupancy/
  roof-fit/roof-generate pure exports — no benchmark imports (the src→benchmarks direction is
  forbidden, as everywhere).
- Record *reading* (file I/O, pin checks) stays in the runners (`challenge-milestone.mjs`,
  `component-skin.mjs`); pure cores receive parsed objects (the established pure-core/impure-runner
  split).
- Gate logic (`coverageGate`, thresholds, band targets) untouched — seam 3 changes the census
  basis fed to it, visibly recorded, never the gate.

## Ordering of changes (matters)

1. `reconstruct-compose.mjs` + tests — no dependents, foundation.
2. `component-plan.mjs` + tests — depends on roof-fit exports only.
3. Parameter additions (`stripStraySalt.regions`, `paintFace.skip`, `placementGrammar.frames`) +
   their unit tests — independent, default-inert.
4. `durable-skin.mjs` buildSkin seams (uses 2+3).
5. `challenge-milestone.mjs` reconstruct stage (uses 1+2, feeds 4).
6. `placement-grammar.mjs` (bench) + `styled-milestone.mjs` threading.
7. `component-skin.mjs` runner + scripts.
8. Live runs in dependency order: `roof:church` → `reskin:cottage` / `reskin:gatehouse` (kit
   presence must PASS on cottage) → `reskin:church` (band0 measure) → zone-map re-pins → commit
   records/artifacts/frames.

## Deletions

None. No existing file is removed; no existing export changes shape.
