# T-093-01 — multi-angle-same-object-gate — Structure

## Files

| File | Action | Role |
|---|---|---|
| `src/config.mjs` | modify | `MULTI_ANGLE_GATE` frozen contract (azimuth names, gap budget) |
| `src/form/multi-angle-gate.mjs` | create | Pure core: v2 prompt/parser, aggregation, outcome labels |
| `src/form/multi-angle-gate.test.mjs` | create | Parser/aggregation/sheet unit tests |
| `src/form/resemblance.mjs` | modify | `composeSheet` (N-panel); `composeTriptych` delegates, contract preserved |
| `benchmarks/sculpture/multi-angle-gate.mjs` | create | Impure runner (`npm run gate:multi`) |
| `package.json` | modify | `"gate:multi"` script |
| `.gitignore` | modify | per-view renders under `benchmarks/sculpture/multi-angle/**/*.png` (sheets are committed under pr/assets) |
| `benchmarks/sculpture/multi-angle/<subj>[-baseline].{json,md}` | generated+committed | the proof records |
| `pr/assets/frames/multi-angle-cottage[-baseline].png` | generated+committed | the verdict sheets |

Untouched: `resemblance.mjs` runner, `resemblance-consolidation.mjs`, all v1 schemas/prompt/parser,
`multi-angle.mjs`, `face-resemblance.mjs`, `zone-fill.mjs` (the gate only CALLS them).

## `src/config.mjs` addition (pure data)

```js
export const MULTI_ANGLE_GATE = Object.freeze({
  azimuths: Object.freeze(["+x+z", "+x-z", "-x-z", "-x+z"]), // 45/135/225/315° @ elevation 30
  gapBudget: 2,            // max named minor gaps across all views (E-25 S-093 pass rule)
});
```
No runner flag may alter these (E-25 Rule 4). Render contract stays the render DEFAULTS (512², ss 3).

## `src/form/multi-angle-gate.mjs` (pure; imports resemblance.mjs vocab + sdk-binding stripToJson + config)

```js
export const MULTI_ANGLE_VERDICT_SCHEMA = "multi-angle-verdict/v1";
export const MULTI_ANGLE_GATE_SCHEMA = "multi-angle-gate/v1";
export const GAP_SEVERITIES = Object.freeze(["minor", "major"]);

buildMultiAngleViewPrompt(angleName, azimuthDeg)
  // FIXED per-view prompt: triptych described (CONCEPT 3/4 reference | MESH silhouette at this
  // azimuth | MINECRAFT at this azimuth); states the concept does not rotate; demands strict JSON
  // {verdict, gaps:[{region, attribute, severity}], rationale}; reuses VERDICTS + GAP_ATTRS verbatim.

parseMultiAngleVerdict(text)
  // → {schema, verdict, gaps:[{region, attribute, severity}], rationale}
  // Rules (throw on violation, v1-strict): verdict ∈ VERDICTS; gaps an array (≤3);
  // each gap {region: non-empty, attribute ∈ GAP_ATTRS, severity ∈ GAP_SEVERITIES};
  // "same object" → all gaps minor; "drifted"/"different object" → ≥1 gap and ≥1 major.

aggregateMultiAngle(views, { azimuths = MULTI_ANGLE_GATE.azimuths, gapBudget = MULTI_ANGLE_GATE.gapBudget })
  // views: [{angle, rendered: bool, coverage: {passed}|null, verdict: {verdict, gaps}|null,
  //          unparsed?: bool}]
  // 1. REFUSE  → {schema, decided:false, refusal:"missing-view:<a>"|"unparsed:<a>", views}
  //    when an expected azimuth is absent/unrendered, or a judged view's verdict is unparsed.
  //    (coverage-failed is NOT a refusal: verdict null + coverage.passed=false is a decided fail.)
  // 2. DECIDE  → {schema, decided:true, passed, gapCount, gaps:[{angle, region, attribute}],
  //               failures:[{angle, reason:"coverage"|"drifted"|"different object"|"gap-budget"}],
  //               views}
  //    passed ⇔ all coverage passed ∧ all verdicts "same object" ∧ Σ gaps ≤ gapBudget.

viewOutcomeLabel(view)  // → "same object" | "drifted: <attr>" | "different object" | "coverage" |
                        //    "missing" — the sheet's per-panel caption (pure, tested)
```

## `src/form/resemblance.mjs` change

`composeSheet(panels, {gutter})` — N≥1 equal square panels, identical math to today's
`composeTriptych` minus the length check; `composeTriptych` becomes
`(panels, opts) => { if (panels.length !== 3) throw ...; return composeSheet(panels, opts); }`.
Existing exports, defaults, schemas untouched.

## `benchmarks/sculpture/multi-angle-gate.mjs` (impure runner)

CLI: `--subject cottage|gatehouse` (required) · `--artifact <path> --label <name>` (proof baseline
only; default = `durable-skin/<subj>/artifact.json`, label "current") · `--offline`.
No angle/resolution/budget flags.

Flow (live):
1. Registry: `SUBJECTS` imported from durable-skin.mjs (concept/map/glb/policy — registry data only).
2. Load artifact (AJV via assertArtifact), decode concept, load matMap.
3. Zones (T-092 reuse): `structuralZones(occ)` + `extractConceptZoneMap` (same gridFromPixels
   inputs as durable-skin) → `zonesFromBands`; registry `policy` fallback recorded. Zone source in
   the record.
4. Render: `renderViews(artifact, MULTI_ANGLE_GATE.azimuths, {outDir})` — any throw/missing file →
   write a REFUSAL record (decided:false), draw the sheet with a "MISSING" placeholder panel,
   exit 1. Never a silent skip.
5. Per view: coverage = `coverageGate(dominantCoverage(surfaceZoneHistogram(occ, zoneOf,
   {faces:[angle], skin:"projection"}), zones), {threshold: DEFAULT_COVERAGE_THRESHOLD, zones})`.
   Coverage fail → judge NOT called (`verdict:null, reason:"coverage"`).
6. Judge per surviving view: mesh silhouette `rasterizeSilhouette(mesh, {view: resolveAngle(angle)})`,
   triptych via `composeTriptych`, ONE `requestTextWithImage` call (PHASE1_MODEL_ID),
   `parseMultiAngleVerdict`; parse failure → recorded unparsed → aggregation refuses.
7. `aggregateMultiAngle` → record `{schema, subject, label, artifact: {path, sha256}, zoneSource,
   coverageThreshold, views:[{angle, render, coverage, verdict, judgeUsage}], aggregate}`.
8. Sheet: `composeSheet([concept, ...4 views])` + label bar (angle + `viewOutcomeLabel`, node-canvas
   with label-free fallback) → `multi-angle/<subj>-<label>-sheet.png` + copy to
   `pr/assets/frames/multi-angle-<subj>-<label>.png`. Record + md written last; exit ≠ 0 unless
   decided && passed (baseline run is EXPECTED to exit 1 — the proof).

`--offline`: read the committed record; assert schema, decided/refusal shape, per-view contract
(coverage-failed views have null verdicts), sheet file exists; no GL, no judge.

## `multi-angle-gate/v1` record shape

```js
{ schema:"multi-angle-gate/v1", subject, label, artifact:{path, sha256},
  contract:{azimuths, elevationDeg:30, width:512, height:512, gapBudget, coverageThreshold},
  zoneSource:"concept"|"prior-fallback", views:[{angle, azimuthDeg, render:{path}|{error},
    coverage:{passed, byZone}|null, verdict:{verdict, gaps, rationale}|null, reason?,
    judge:{model, usage}|null}],
  aggregate:{decided, refusal?, passed?, gapCount?, gaps?, failures?},
  sheet:"pr/assets/frames/multi-angle-<subj>-<label>.png" }
```

## Test plan (src/form/multi-angle-gate.test.mjs — pure, no GL/network)

- Parser: valid same-object with 0/1/2 minor gaps; same-object with a major gap → throw;
  drifted without gaps → throw; drifted with only minor gaps → throw; bad attribute/severity →
  throw; fenced/prose-wrapped JSON accepted (stripToJson path); non-JSON → throw.
- Aggregation: all-pass (0 gaps); pass at exactly gapBudget (2); fail at 3 (reason "gap-budget");
  one drifted view → fail named with angle; coverage-failed view (null verdict) → decided FAIL not
  refusal; missing azimuth → refusal `missing-view:<angle>`; unparsed verdict → refusal; extra
  unexpected angle ignored-or-error (decide: error — the contract is exact).
- `viewOutcomeLabel` per state.
- `composeSheet`: N-panel width math (N·P + (N−1)·gutter), triptych delegation unchanged
  (3-panel throw preserved).

## Ordering

1. config + pure core + tests (no deps).
2. `composeSheet` refactor (+tests) — keep `npm test` green.
3. Runner + npm script + gitignore.
4. Proof runs: baseline (expect FAIL on a non-front azimuth) + current cottage (pass candidate;
   gatehouse as the second candidate); commit records + sheets.
5. Full suite + review.
