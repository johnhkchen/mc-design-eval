# T-137-01 visibility-aware-census — Research

## The defect, located and measured

The T-127 cottage gate record is `benchmarks/sculpture/multi-angle/cottage-patternbook.json`
(artifact `workshop/cottage/final-artifact.json`, the pattern-book chain's final). All four views
are coverage-rejected and the judge was never called on any of them:

```
+x+z  band0:t354:f0.644  band1:t0:f-  roof:t411:f1     → coverage REJECT
+x-z  band0:t347:f0.695  band1:t0:f-  roof:t438:f1     → coverage REJECT
-x-z  band0:t350:f0.649  band1:t0:f-  roof:t415:f1     → coverage REJECT
-x+z  band0:t379:f0.604  band1:t0:f-  roof:t406:f1     → coverage REJECT
```

band1 (the upper storey, concept band y∈[8,10]) has **total 0 from every view**. I reproduced the
gate's census derivation exactly (deriveZones → planCensusZoneOf → surfaceZoneHistogram; re-derived
band0:354/roof:411 at +x+z — byte-identical to the committed record) and measured:

- Under the **raw** concept-band zoneOf (y-slices), band1 has 1,656 occupancy cells and 87/87/48/48
  cells in the four diagonal projections — the y-range is there and the camera grazes it.
- Under the **gate's census identity** — `planCensusZoneOf`, which routes roof-PROGRAM cells to
  "roof" (T-106/T-121: program cells are roof) — band1 has **0 cells in the entire occupancy**, 0 in
  every projection, and 0 on the exposure skin. The steep roof program (the T-135 ridgeToEave-4.5
  proportion defect) occupies band1's whole y-range; commit 4c43d39 already named it: "cottage
  coverage-refused on the buried upper storey".

So in the identity the census actually gates, band1 is not under-covered — it is **not visible** (in
fact not on the skin at all). `coverageGate` fails any gated zone with `total === 0` ("absence of
evidence is failure" — face-resemblance.mjs:63-66), which was right for a zone the camera CAN see
and wrong for one it cannot. Fourth instance of the measurement-identity class (T-095 kit-renamed
bands censused 0; T-101 dominant-only rejected supplied styling; T-110 literal-name vs role-family).

## The seam (who computes what, where)

- **Census** — `src/view/zone-fill.mjs`: `surfaceZoneHistogram(occ, zoneOf, {faces, skin})` over
  `skin:"projection"` (first-occupied per ray via `projectSurface`, incl. the four 45° diagonals —
  `src/view/surface-grid.mjs` DIAG_DIRS) or `skin:"exposure"` (every occupied voxel with any of 6
  faces air-exposed — "what a camera at ANY angle can see", T-090). `dominantCoverage` /
  `ownCoverage` decorate the histogram with fractions. **The per-view projection visibility the
  ticket says to reuse is exactly `faces:[<diag>]` projection enumeration** — a view's census
  denominator already IS that view's visible cells. The bug is solely in how the GATE treats an
  empty denominator.
- **Precondition** — `src/view/face-resemblance.mjs`: `coverageGate(coverage, {threshold, zones,
  metric})`. Gated zones = keys of `zones`; a zone missing from the census, empty, or null-fraction
  FAILS. `metric:"own"` (T-101) gates on `ownFraction`; default callers byte-identical (the
  established option-with-unchanged-default discipline). `DEFAULT_COVERAGE_THRESHOLD = 0.5`.
- **Per-view wiring** — `benchmarks/sculpture/multi-angle-gate.mjs:444-446` (impure runner): per
  rendered view `a`, `coverageGate(ownCoverage(surfaceZoneHistogram(occ, gateCensusZoneOf,
  {faces:[a], skin:"projection"}), zonesShipped), {threshold, zones: zonesShipped, metric:"own"})`.
  A failed view is the T-088 short-circuit: judge never called, `reason:"coverage"`, verdict null.
- **Aggregate** — `src/form/multi-angle-gate.mjs` `aggregateMultiAngle`: REFUSE on missing/unparsed;
  DECIDE with a coverage-failed view counting as a decided FAIL. `gateInstrumentDiff` compares named
  fields (schema/subject/label/artifact/contract/zones/kitPresence + per-view identity fields) —
  **additive record fields do not appear in the diff**.
- **Census identity** — `src/view/component-plan.mjs` `planCensusZoneOf`: roof-program cells →
  "roof"; defined-mass roof-band cells → "roof:gable" (measured, never gated); frames annotated.
- **Zone derivation** — runner-local `deriveZones` (structuralZones + gridFromPixels +
  extractConceptZoneMap + zonesFromBands) and `policyInShippedPalette` (composeVocabulary — the one
  composition point, T-113). Both currently NOT exported from the runner.

## Constraints that bind this ticket

- **E-33 Rule 3 / identity-class discipline**: monotone (every previously passing view still
  passes), both arithmetics reported in new records, committed records untouched and still valid,
  thresholds/azimuths/judge contract unmoved. The camera does not move.
- **T-138 owns all judge runs** ("this ticket's judge runs are the epic's only ones"; "cottage:
  reaches the judge via T-137"). So T-137 must make the precondition pass for the cottage WITHOUT
  executing a live gate. Consequence discovered above: since band1 is invisible from ALL four views,
  the cross-view "invisible everywhere" rule cannot be a blanket failure — it must distinguish a
  band that **exists on the exposure skin but no gate view can see** (a free pass the gate must
  refuse, the AC's synthetic case) from a band with **zero cells in the census identity anywhere**
  (the cottage: nothing to census; the form defect is T-135's named ratio and the judge's glance,
  not a coverage refusal).
- **Pin policy (T-119)**: gate verdict records are pins; nine writers use `guardedWriteRecord` +
  `preflightPins`. The witness must write to NEW paths (proportion-witness precedent:
  `benchmarks/sculpture/proportion/<runKey>.*`) and never touch `multi-angle/*.json`.
- **E-25 Rule 3**: runners are registry-driven; self-grep proves no subject keys in source
  (generalizationGrep in proportion-witness.mjs).
- **No per-building constants** (AC4); `npm test` green (suite ~1983, 2 known rustic-pack failures
  were fixed by T-135 per observations — verify at Implement).

## Precedents to copy

- **Monotone proof over committed records** — `src/view/coverage-monotone.test.mjs` (T-110):
  replays committed durable-skin censuses through the new arithmetic, asserts pass⇒pass zone by
  zone, plus a gate-level structural property and the witness census as a verbatim unit test.
- **Witness runner** — `benchmarks/sculpture/proportion-witness.mjs` (T-135): committed-inputs-only
  derivation, records at new paths, `--repro` byte-compare mode, pin-guarded writes, no judge seam,
  npm scripts `proportion:*`.
- **Option-with-unchanged-default** — T-101's `metric:"own"` on coverageGate: additive option,
  default byte-identical, strictly monotone, proven by replay.

## Witness-side facts for the record

- Per-view byZone rows in committed records carry `{total, fraction, dominant, own,
  dominantFraction, passed}` but NOT `byBlock` — a pure record replay can re-gate (visibility =
  `total === 0`, gating = recorded fraction vs recorded threshold) without re-deriving the census.
  The exposure-existence tally is the only thing requiring the artifact + zone re-derivation.
- Other cottage records for monotone replay: baseline (band1 t290 f0 — VISIBLE and failing: must
  STILL fail), current (+x+z f0.388 fail / three views pass), challenge/styled/generated (all views
  coverage-pass). The baseline case is load-bearing: visibility-awareness must not pardon a band the
  view CAN see.
- `aggregateMultiAngle` and `composeKitAwareVerdict` need no change if a hidden-but-existing band
  simply keeps failing each view's precondition (today's behavior, now with a sharper name).
- kitPresence on the cottage-patternbook record is failed/not-rerun — out of scope (presence never
  blocks the judge call; T-138 owns the overall verdict).

## Sibling-session check

No `docs/active/work/T-137-01/` existed at session start; no T-137 commits in the last 30 min; the
uncommitted tree changes belong to T-135/T-136 sessions (loop.test.mjs, bridge.mts, rerecognize.*) —
commits from this ticket must stage narrowly.
