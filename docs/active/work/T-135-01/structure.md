# T-135-01 proportion-conformance — Structure

## Files

| # | Path | Change |
|---|------|--------|
| 1 | `src/form/silhouette-proportion.mjs` | NEW — pure metric core |
| 2 | `src/form/silhouette-proportion.test.mjs` | NEW — synthetic-silhouette unit tests |
| 3 | `src/pack/conformance.mjs` | MODIFY — `proportionCheck` + declaration-driven activation |
| 4 | `src/pack/conformance.test.mjs` | MODIFY — check tests |
| 5 | `src/workshop/loop.mjs` | MODIFY — ratio-aware regression predicate |
| 6 | `src/workshop/loop.test.mjs` | MODIFY — rollback + ledger tests |
| 7 | `src/workshop/replay.mjs` | MODIFY — `replayLedger` prefix option |
| 8 | `src/workshop/replay.test.mjs` | MODIFY — prefix tests |
| 9 | `benchmarks/sculpture/proportion-witness.mjs` | NEW — witness runner (cottage/barn, `--repro`) |
| 10 | `package.json` | MODIFY — `proportion:{cottage,barn,repro}` scripts |
| 11 | `packs/README.md` | MODIFY — proportion-conformance docs |
| 12 | `benchmarks/sculpture/proportion/<runKey>.{json,md}` | NEW committed records (witness output) |

Untouched on purpose: `packs/*.json` (packRef shas pinned in ledgers), committed seeds/ledgers,
`critique.mjs`/BAML (numbers ride the existing `conformance_block`), `seed.mjs`, judge anything.

## 1. `src/form/silhouette-proportion.mjs` (pure; no GL, no I/O, no Date/random)

Convention: ALL masks are image-style — `{w, h, data:Uint8Array(w*h), bbox}` with **row 0 at the
top** — so occupancy projections and `extractSilhouette` outputs flow through one set of
functions. bbox is half-open, as in form-fidelity.

```js
export const PROPORTION_SCHEMA = "silhouette-proportion/v1";
export const PROPORTION_DEFAULTS = Object.freeze({
  tolerance: 0.15,          // relative |measured−target|/target acceptance band
  absoluteFloor: 0.05,      // |target| below this → compare absolute delta instead
  ridgeMinWidthFrac: 0.25,  // row narrower than this × maxWidth never reads as ridge (chimney guard)
  eaveWidthFrac: 1.0,       // a row within this × maxWidth counts as the eave layer
});

// --- occupancy → masks (iterates occ.cells "x,y,z"→block; no imports needed) ---
export function elevationMask(occ, axis /* "x"|"z" = projection direction */, opts?)  // opts.bbox: {x0,x1,z0,z1} column restriction (per-mass)
export function planMask(occ, opts?)                                                  // y-projection → (x,z) mask

// --- mask metrics (substrate-agnostic: occupancy or extractSilhouette masks) ---
export function maskProportions(mask, opts?)  // → {ridgeRow, eaveRow, totalH, eaveH, maxWidth} | null constituents
export function ratiosFromMask(mask, opts?)   // → {ridgeToEave, roofShare} (null per unmeasurable)

// --- assembly over an occupancy ---
export function proportionRatios(occ, opts?)  // → {ridgeToEave, roofShare, aspect, perMass?: [{id, ridgeToEave, roofShare, aspect}]}
//   elevations both axes; eaveH = max of the two per-view eaves; ridgeRow = global thresholded top;
//   aspect from planMask bbox; opts.masses: [{id, bbox}] → per-mass rows (restricted projections)

// --- targets (concept-first, sketch fallback; impure decode stays in the caller) ---
export function targetsFromConceptMask(mask)   // {ridgeToEave, roofShare} (null on degenerate detection)
export function deriveProportionDeclarations({ conceptMask, sketch, tolerance?, masses? })
//   → {targets:{ridgeToEave, roofShare, aspect}, sources:{ratio→"concept"|"sketch"}, tolerance, masses?}
//   aspect ALWAYS sketch; null concept constituents fall back per ratio; throws if neither side measures a ratio
export function assertProportionDeclarations(decl)  // shape gate for declarations.proportions

// --- comparison (the gate's arithmetic) ---
export function compareRatios(measured, declared)
//   → {pass, rows:[{ratio, measured, target, source, delta, relDelta, withinTolerance}]}
//   relative compare; absolute under absoluteFloor; null measured ⇒ finding (unmeasurable build)
```

Import: `sketchTargetRatios` from `../recognition/measured-program.mjs` (pure; no cycle —
recognition/* never imports src/pack/conformance or src/form/silhouette-proportion).

## 2. `src/pack/conformance.mjs`

- `CONFORMANCE_CHECK_NAMES` += `"proportion-vs-concept"`; `CHECK_IMPL` entry.
- `export function proportionCheck(occ, { proportions } = {})`:
  - undeclared → vacuous pass (symmetry precedent) — only reachable via a pack listing it;
  - declared → `assertProportionDeclarations`, `proportionRatios(occ, {masses})`,
    `compareRatios`; verdict `{name, passed, findings, ratios}` where `ratios` = compare rows
    (whole-object, plus per-mass rows when the declaration carries per-mass targets; measured
    per-mass values without targets are recorded in `ratios` but never produce findings);
  - findings strings carry the numbers: `roofShare 0.6190 vs target 0.2930 (sketch) — Δrel 1.11 >
    tolerance 0.15`.
- `runConformance`: after the pack-listed loop, append `proportionCheck` iff
  `declarations?.proportions` is present AND the pack didn't already list it (no double-run).
  Header documents the deliberate exception: subject-declared targets activate the check; packs
  may also list it explicitly.

## 3. `src/workshop/loop.mjs`

- `export function proportionRegression(before, after)`: pull the `"proportion-vs-concept"`
  check's `ratios` rows from both reports (absent in either → `false`); regression iff some row
  (matched by `ratio` + mass id) ends `!withinTolerance` with strictly larger
  `relDelta` (or `delta` under the absolute floor — compare the field `compareRatios` flags) than
  before. Returns the offending ratio name (string | null) for the reason.
- `isRegression(before, after)` → lexicographic-worse OR `proportionRegression(...) !== null`.
  Reason string in the round entry names the ratio: `regressed: roofShare 1.11→1.24 beyond
  tolerance` (keep the existing `passed a→b, findings x→y` form for the lexicographic arm).
- No other loop changes: before/after reports already land verbatim in round entries and
  `final.conformance` — the ledger "carries the ratios" by construction.

## 4. `src/workshop/replay.mjs`

- `replayLedger({ ledger, throughRound })`: skip rounds with `round.round > throughRound` when
  the option is a finite integer ≥ 0 (`0` = seed only). Default (undefined) replays all — the
  existing byte-identity contract is untouched. One-line filter inside the existing loop.

## 5. `benchmarks/sculpture/proportion-witness.mjs`

Impure shell; no model, no GL, no judge seams. CLI: `--subject cottage|barn` (default cottage),
`--all`, `--repro`, `--rotate-pins`.

```
SUBJECTS: key → { ledger: chainRels(key).ledger, final: chainRels(key).final,
                  sketch: benchmarks/sculpture/form-sketch/<key>.json,
                  concept: <durable-skin registry concept rel> }
derive(key):
  ledger, sketch, conceptImg(decodeImage) → conceptMask(extractSilhouette, CONCEPT_BG)
  decl = deriveProportionDeclarations({conceptMask, sketch})
  for r in 0..rounds: artifact = replayLedger({ledger, throughRound:r})
                      occ → proportionRatios → compareRatios vs decl  (r=0 is the seed row)
  record = { schema:"proportion-witness/v1", subject, conceptRef(sha), sketchRef(sha),
             declarations: decl, rounds:[{round, accepted, decision, ratios, pass, findings}],
             final:{ratios, pass, findings}, defect:{ratio, relDelta} (the worst failing row) }
write mode: preflightPins + guardedWriteRecord(domain "workshop") →
  benchmarks/sculpture/proportion/<runKey>.json + .md
--repro: re-derive, byte-compare against committed record, exit 0/1
md digest: target sources table, per-round ratio table beside the rounds' critique severities,
  and the named defect line tying roofShare's number to the round-1/2/4/6 critique text and the
  judge-side band1-occlusion description (quoted from committed records as prose, not read live).
```

## 6. Tests

- `silhouette-proportion.test.mjs` (NEW): synthetic occupancy house (shell + gable + chimney) →
  elevation/plan masks; eave = widest layer top, chimney never the ridge; ratios match hand
  arithmetic; image-convention masks built directly (Uint8Array gables) for `maskProportions`;
  degenerate masks → nulls; `compareRatios` relative + absolute-floor arms;
  `deriveProportionDeclarations` concept-first / sketch-fallback / aspect-always-sketch / throws
  when unmeasurable; per-mass bbox restriction.
- `conformance.test.mjs` (+): declared → check appended with findings + ratios payload;
  undeclared → 6 checks exactly (byte-stability of old reports); pack-listed + undeclared →
  vacuous pass; numbers appear in findings strings.
- `loop.test.mjs` (+): synthetic exchange worsening an out-of-tolerance ratio → rolled back with
  ratio-named reason; improving → accepted; ledger rounds carry the ratios; reports without the
  check → predicate inert (old-ledger compatibility).
- `replay.test.mjs` (+): `throughRound` prefix returns intermediate artifacts; default unchanged
  (byte-compare against full replay).
- Witness verification is exercised via `proportion:repro` (runner, like `measured:repro`), not
  via the unit-test glob.

## Ordering

1. Metric core + tests (no dependents touched) — commit.
2. Conformance check + loop predicate + replay option + their tests; `workshop:{replay,offline}`
   and `patternbook:offline` must stay green — commit.
3. Witness runner + npm scripts + committed cottage/barn records + `proportion:repro` green —
   commit.
4. Docs (`packs/README.md`), full `npm test`, review.md — commit.
