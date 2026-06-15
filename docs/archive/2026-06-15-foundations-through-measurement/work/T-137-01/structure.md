# T-137-01 visibility-aware-census — Structure

## Files

### Modified: `src/view/face-resemblance.mjs` (pure core, +~90 lines)

- New export `VISIBILITY_COVERAGE_SCHEMA = "visibility-coverage/v1"`.
- New export `visibilityAwareCoverage({views, zones, exposure, threshold, metric})`.
  - `views`: `[{angle, coverage}]` — one ownCoverage/dominantCoverage-shaped record per gate view
    (rows need only `total` + the metric's fraction, so committed byZone rows replay directly).
  - `zones`: the gated policy (keys = gated bands). `exposure`: a `surfaceZoneHistogram(...,
    {skin:"exposure"})` record — the existence basis (required; `{}` means "no band has cells").
  - Classification per gated band: `visibleViews = [angles with (coverage[band]?.total ?? 0) > 0]`;
    `exposedCells = exposure[band]?.total ?? 0`; status = `visible` | `not-visible-from-any-view`
    (no visible view, exposedCells > 0 → pushes `{band, reason}` onto `visibility.failures`) |
    `not-on-skin` (no visible view, exposedCells = 0).
  - Per view: gated set = bands visible at THIS view ∪ `not-visible-from-any-view` bands (they fail
    on total=0 exactly as legacy — today's failure, sharper name). `aware =
    coverageGate(coverage, {threshold, zones: subset, metric})`, then excluded bands re-attached to
    `aware.byZone` as `{total: 0, fraction: null, dominant: null, passed: null, excluded: true,
    notVisible: true, status: "not-visible-from-view"}` (recorded, never gated). `legacy =
    coverageGate(coverage, {threshold, zones, metric})` — the full set, byte-equal to today.
  - Returns `{schema, views: [{angle, aware, legacy}], visibility: {byBand, failures, passed}}`.
  - `coverageGate` itself: **zero changes** (three buildSkin sites + all consumers untouched).
  - Validation: non-empty views, unique string angles, zones/exposure objects; throws on misuse.

### Modified: `src/view/face-resemblance.test.mjs` (+~110 lines)

Unit tests (V-series):
- V1 all-visible ⇒ aware ≡ legacy (failures and per-band gating equal).
- V2 band empty at one view, visible+passing elsewhere ⇒ that view passes with the annotated
  excluded row; visible views gate it.
- V3 band empty everywhere + exposed ⇒ every view's aware fails the band;
  `visibility.failures = [{band, reason:"not-visible-from-any-view"}]` (the AC's named failure).
- V4 band empty everywhere + unexposed ⇒ excluded everywhere (`not-on-skin`), views can pass.
- V5 visible-but-failing band still fails the views that see it (cottage-baseline shape).
- V6 monotone property over a case grid: legacy pass ⇒ aware pass, view by view.
- V7 both arithmetics always present; `metric:"own"` forwarded (rows with ownFraction).

### New: `src/view/visibility-monotone.test.mjs` (~120 lines, T-110 replay pattern)

- **Committed-record replay** over every `benchmarks/sculpture/multi-angle/*.json` (glob via
  readdirSync, skip non-records): rebuild per-view rows from recorded `coverage.byZone` (total +
  recorded fraction), `exposure: {}` (exposure only influences all-invisible bands — it cannot
  affect a previously-passing view; comment states this), recorded threshold; assert every view
  with recorded `coverage.passed === true` passes aware (the monotone proof, AC3).
- **The T-127 witness assertion**: `cottage-patternbook.json` — all four views aware-pass; band1
  row at every view is `excluded/not-visible-from-view`; legacy still fails (both arithmetics
  recorded truth); `exposure: {}` here is the measured truth (band1 has 0 cells on the exposure
  skin — verified in research, witnessed live by the runner).
- **Synthetic geometry fixture** (the AC's synthetic test, occupancy-grounded): a ring of 8 cells
  at y0 around a center cell ("hidden" band) — the center shares (col,row) with a nearer ring cell
  in ALL four diagonal projections but its top face is air-exposed. Census via
  `surfaceZoneHistogram` per diag + exposure skin; `visibilityAwareCoverage` ⇒ named
  `not-visible-from-any-view` failure, every view fails. Variant: a declared band with no cells at
  all ⇒ `not-on-skin`, views pass. Proves "invisible from ALL views is a named failure, not a free
  pass" with real projection machinery.

### Modified: `benchmarks/sculpture/multi-angle-gate.mjs` (runner, ~40 lines net)

- Export `GATE_SUBJECTS`, `deriveZones`, `policyInShippedPalette` (bodies unchanged) for the
  witness (one derivation/composition point — no refork).
- Census wiring: before the render loop, compute the four per-view `ownCoverage` censuses + the
  exposure census (`surfaceZoneHistogram(occ, gateCensusZoneOf, {skin:"exposure"})`), call
  `visibilityAwareCoverage` once; inside the loop consult `vis.views[i].aware` for the T-088
  short-circuit. Per-view record field becomes `coverage: {passed, threshold, byZone(aware,
  annotated), legacy: {passed, failures}}`; record gains top-level `visibility`. All additive.
- `--offline` checker: one additive, presence-optional check (`visibility` well-formed iff
  present; pre-T-137 records remain valid).
- `recordMd`: coverage cell renders `not-visible` for excluded rows.
- NOT executed live here (T-138 owns judge runs); `--offline` only.

### New: `benchmarks/sculpture/visibility-witness.mjs` (~200 lines, proportion-witness pattern)

- CLI: `--subject <key> --label <label>` | `--all`, `--repro|--offline`, `--rotate-pins`,
  `--ticket`. NO judge import anywhere (isolation).
- Per committed record `multi-angle/<key>-<label>.json`: replay recorded byZone rows through
  `visibilityAwareCoverage` with the exposure census re-derived from the record's pinned artifact
  via the gate's exported `deriveZones`/`policyInShippedPalette`/`planCensusZoneOf` chain
  (deterministic, GL-free). Re-derived per-view totals cross-checked against recorded totals —
  mismatch recorded as named `censusCheck.drift` (the record is still written from RECORDED
  numbers; the exposure basis is then flagged `basis:"drifted"`).
- Artifact pin check (sha256 vs record) before any work — drift throws (T-114 precedent).
- Writes `benchmarks/sculpture/visibility/<key>-<label>.{json,md}` via
  `guardedWriteRecord`/`preflightPins` (new paths; `multi-angle/*` pins untouched). Record:
  source pins, contract (copied, unmoved), per-view `{aware, legacy}`, `visibility`, headline
  `precondition: {legacyPassedViews, awarePassedViews}`, `judge: "not-called"` note.
- `--repro`: re-derive + byte-compare committed witness records, exit-coded.
- `generalizationGrep` self-check (no subject keys in source).

### Modified: `package.json` (+3 scripts)

`visibility:cottage` (the T-127 witness: `--subject cottage --label patternbook`),
`visibility:all`, `visibility:repro` (`--all --repro`).

## Boundaries

- zone-fill.mjs, surface-grid.mjs, component-plan.mjs, multi-angle-gate.mjs (pure module),
  config.mjs, judge prompt/parser, aggregateMultiAngle, composeKitAwareVerdict,
  gateInstrumentDiff: **untouched**.
- Committed `multi-angle/*.json|md`: **untouched** (pin policy).
- No per-building constants anywhere: thresholds from the record/config; witness registry-driven.

## Order

1. Pure core + V-tests (face-resemblance) — commit.
2. Replay + synthetic tests (visibility-monotone) — same or second commit.
3. Runner wiring + exports + offline re-assert — commit.
4. Witness runner + npm scripts + live witness records + `--repro` proof — commit.
5. progress.md / review.md — commit.
