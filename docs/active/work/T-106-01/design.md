# T-106-01 component-aware-skinning — Design

Goal restated: where a component definition exists (T-103 record, T-104 roof program, T-105 shaped
heads), the skin chain consumes it; where none exists, today's occupancy derivation runs unchanged
and the fallback is recorded. Four seams (roof courses, frame lines, wall fields, zone re-pin),
full re-skin of three subjects, church band0 re-measured.

## D1 — Composing the two reconstructions: delta-compose (chosen)

`roof/<subj>/artifact.json` and `shaped/<subj>/artifact.json` both fork from
`regularize/<subj>/artifact.json` (verified in committed `inputs` pins). Options:

- **(a) Delta-compose — CHOSEN.** Pure core: diff each reconstruction artifact against the shared
  regularized base (both runners pinned to its sha256), take the two edit sets (cell→block changes,
  additions, removals), assert they are **disjoint**, apply both. Overlap → THROW with the
  overlapping cells named (a real overlap means the roof band and an opening head collided — a
  geometry fact a human must see, not a merge policy). Roof edits touch the carved band above
  `bandFloor`; shaped edits touch opening heads/jambs in walls — disjoint by construction on all
  three subjects, so the assert is a tripwire, not a planner.
- (b) Chain the runners (shaped consumes roof output) — REJECTED: invalidates every committed
  sha-pin (shaped's `recordSha` pins the component record cut from the *regularized* shell),
  forces re-running T-103/T-105 against a moving input, and contradicts the record architecture
  where each stage pins one upstream truth.
- (c) Re-derive roof/shaped inline per chain run — REJECTED: duplicates the committed-record
  runners, discards their attempt-ladder/cage evidence, and re-derivation where a definition
  exists is the exact bug E-27 Rule 4 names.

Fallback semantics: a subject with no roof record (or `status:"fallback"`/`"pipeline-failed"`)
contributes **no roof delta** — named finding `roof-program-missing`/`roof-program-fallback`; same
for shaped. Both absent → composed shell ≡ regularized shell byte-identical (the AC's
graceful-fallback path is structural, not a code branch to test into existence).

## D2 — Insertion point: a reconstruct stage in `runChain`, via the existing disk seam

`runChain` already writes the regularized shell to disk and hands `buildSkin` a *path*
(`challenge-milestone.mjs:237`, "a deliberate, inspectable file seam"). Chosen wiring:

- After `shellStage` (which ends in the T-102 cage), compute sha of the in-chain regularized
  shell, load the committed `roof/<subj>/artifact.json` + `shaped/<subj>/artifact.json`, **verify
  their recorded input pins equal that sha** (drift → THROW: the committed reconstructions were
  cut from a different shell; nothing silently degrades to occupancy). Compose (D1), write
  `<paths>/reconstructed-artifact.json`, pass that path to `buildSkin` along with the consumption
  plan (D3). No records → skip, pass the shell path exactly as today.
- REJECTED: doing this only in `styledChain` — church's band0 re-measure runs through
  `challenge:church` (kit-less), which calls `runChain` directly; the seam must live where both
  chains share it.

## D3 — The consumption plan: one pure builder, optional argument, per-seam fallback

New pure module builds a **component plan** from `(componentRecord, roofRecord, shapedRecord)`:

```
plan = {
  roof:   { heightAt(x,z), cells:Set<key>, family:{field,stairs,slab}, source:"program" } | null,
  frames: { cornerPost:[], roofline:[], floorLine:[], source:{perKind} } | null,
  wallFaces: { contains(voxel)->bool, slabs:[...], source:"record" } | null,
  provenance: { findings:[...], pins:{...} },
}
```

`buildSkin(def)` gains `def.componentPlan` (default null) and `grammarStage` gains
`opts.componentPlan`. Every consumer is `if (plan?.X) use definition else derive`, and the chosen
source lands in the stage record (`seamSources: {roofCourses, frameLines, wallFields, zoneMap}` —
"recorded fallback" is a field, not a log line). With `componentPlan` absent the code path is
today's, untouched — byte-identity for record-less subjects is structural.

### Seam 1 — roof courses follow the generated planes

- **Protection**: the plan's generated roof cells become a `zoneFill` *declared sub-region*
  (`regions` — the T-090-01 unconditional-keep mechanism built for exactly "a declared design
  element keeps its material"). Stateless recolor placements (`{op:"voxel",…}`) would replace
  `spruce_stairs`/`spruce_slab` cells with full blocks (T-104 review concern #1); region-kept
  cells are never recolored. The same cell set is threaded as a skip-set to the splat
  (`paintFace`) and to `stripStraySalt` (which today has no region parameter — it gains one with
  the same `{name, contains}` shape).
- **Courses**: `regularizeRoofCourses` (basin-fill of the sampled top) is **replaced, on the
  program footprint, by a conformance check**: compare the build's top heights against
  `roofHeightfield(gables)` (already exported); deviations are recorded placements-needed counts,
  not auto-fixed (the program is the contract; a mismatch is evidence of a composition bug).
  Off-footprint columns (chimney) keep today's behavior. No plan → basin-fill unchanged.
- **Gate compatibility**: the roof zone's declared vocabulary gains the program family
  (`preserve += [family.stairs, family.slab]`), so the existing own-materials band evidence
  (`ownCoverage`, the E-26 metric) counts treads/slabs as roof material instead of failing
  roof ≥ 0.9 on the diluted dominant. The 0.9 target itself is untouched.

### Seam 2 — frame lines from component edges

New pure `frameLinesFromComponent(componentRecord, roofRecord)` producing the *same shape*
`frameLines` returns (`{cornerPost, roofline, floorLine}` cell lists):

- `cornerPost`: vertical edges where two `wallSlabs` of perpendicular `dir` meet (slab
  `boundsWorld` intersections), clipped to each slab's y-extent.
- `roofline`: the wall cells under the program's eave/rake — from the accepted gables' eave edges
  (`eaveY`, `eaveEdge`) and gable-end rakes (`gableSurfaceHeight` boundary at the end walls);
  fallback to the component record's `roofPlanes[].eave.cells` when no roof program.
- `floorLine`: stays geometric (structural floor lines are not a component; the record has no
  storey definition) — explicitly recorded as `source: "occupancy"` per the honest-fallback rule.

`grammarStage` uses the component frame lines when the plan provides them; the binding, paint,
line-continuity and fill logic downstream is unchanged (it consumes the same shape). Per-kind
source recorded. REJECTED: deriving corners from masses' plan bboxes — wallSlabs are the defined
wall geometry; masses include protrusions (chimney) that must not grow corner posts.

### Seam 3 — wall fields are the slab faces

The T-088 gate today censuses the whole 6-dir exposure shell per band; on a blob, a wall band is
polluted by non-wall geometry — the church refusal (band0 stone 0.332) is measured over everything
y-classified into band0. Chosen mechanism — **census decomposition, gate unchanged**:

- When the plan has `wallFaces`, the coverage census for wall bands runs over **slab-face cells
  only** (`surfaceZoneHistogram` with a wrapped `zoneOf` that returns `band<i>` for on-slab cells
  and `band<i>:offslab` otherwise). `coverageGate` (threshold 0.5, untouched) gates the wall-field
  zones; the `:offslab` complement is measured and **recorded** (composition, fraction) — no
  silent truncation, and the church residual gets its measured cause for free (AC #4's "named with
  its measured cause" is the offslab decomposition itself).
- Zone-fill behavior is NOT restricted to slab faces: every exposed cell still gets painted
  (plan-view-coverage lesson: defects live on un-enumerated surfaces). Only the gate's census
  basis becomes the defined wall field.
- REJECTED: gating offslab cells too (re-creates the blob problem the ticket exists to fix);
  threshold tuning (E-25 Rule 6 forbids it); restricting fill to slab faces (visible junk cells
  would keep stale material).

### Seam 4 — zone maps re-derived/re-pinned on rebuilt geometry

In-chain zone derivation already re-runs on whatever shell it is fed (`zoneMapRecord: null` inside
`runChain`), so the *derivation* is automatically on the reconstructed geometry. The re-pin
protocol (T-095 review concern #4) is about the **committed** `zone-map/<subj>.json` records going
stale. Chosen: the T-106 runner diffs the bands derived on the reconstructed shell against the
committed record (`diffZoneMaps` exists) and, where shifted, **re-commits the zone-map record**
with provenance (`source: reconstructed shell sha, repinnedBy: T-106`) and the diff embedded. The
durable-skin agreement assert then holds against the new pin. Church gets its *first* zone-map
record if its skin passes. REJECTED: loosening the agreement assert (it is the drift tripwire).

## D4 — Runner and the named chain

New impure runner `benchmarks/sculpture/component-skin.mjs`, scripts
`reskin:{cottage,gatehouse,church}` (one named command per subject, registry-driven, no subject
constants — the established pattern). Per subject it:

1. Verifies the reconstruction inputs (records present? pins consistent?) — absences are named
   findings, not errors.
2. Runs the component-aware chain: styled chain for kit-bearing subjects (grammar, dressing,
   settle, spawned kit-aware gate — AC #3); challenge chain for church (kit-less; the band0
   measurement lives in the skin stage — AC #4).
3. Writes `component-skin/<subj>.{json,md}`: seam sources used, composition stats (delta sizes,
   disjointness), wall-field census decomposition (on-slab vs offslab per band), zone-map re-pin
   diff, kit-presence outcome, double-run sha256, `--repro`/`--offline` like every sibling runner.

`styled:*`/`challenge:*` become component-aware in place (the chain modules change underneath
them); `reskin:*` is the T-106 evidence record over that chain. Prerequisite run: `roof:church`
(never executed; registry-generic; its null kit yields the named `kit-roof-field-missing`
full-block fallback per the T-104 review) so church has a roof delta to compose.

## D5 — Church endgame (what "the milestone decides" means here)

Expected path: regularized church shell + roof program + shaped heads → skin chain → band0
measured over the defined wall field. Outcomes, all acceptable per AC #4: (a) gate passes →
re-pin church zone-map record; styled:church still stops at the kit precondition (kit extraction
is a live-model stage, scoped out — named finding pointing at the now-unblocked path); (b) gate
still fails → the offslab/on-slab decomposition names the measured cause in the record. No
tuning in either branch.

## Testing strategy (expanded in Plan)

Pure cores get synthetic-fixture `node --test` suites in the established style: delta-compose
(disjoint accept, overlap throw, missing-record passthrough byte-identity), plan builder (per-seam
presence/absence), `frameLinesFromComponent` vs `frameLines` on a synthetic gabled box (the AC's
"component record vs occupancy fallback" per seam), census decomposition (on/offslab split sums to
the old census), conformance check (program-true roof → zero deviations; perturbed → named).
Integration = the runners' hard asserts (pins, double-run byte identity, unmapped, gates), as
everywhere else in E-25..27.
