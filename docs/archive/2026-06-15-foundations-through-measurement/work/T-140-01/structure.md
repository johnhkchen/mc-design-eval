# Structure — T-140-01 ruler-calibration

File-level blueprint. Five touched files (2 src, 1 new runner, 1 package.json line, 1 packs/README
doc note), plus tests and one new committed record. Disjoint from T-139-01's `maskProportions`
internals.

## MODIFIED — `src/form/silhouette-proportion.mjs`

The home of the occupancy lens, the comparison arithmetic, the tolerance, and concept-vs-sketch
precedence. Additive changes only; no edits to `maskProportions`/`ratiosOver` internals (T-139's
region).

1. **`PROPORTION_LENS`** (new export, after `RATIO_NAMES`):
   ```js
   export const PROPORTION_LENS = Object.freeze({ PROGRAM: "program", OCCUPANCY: "occupancy" });
   ```
2. **`TOLERANCE_CALIBRATION`** (new export, beside `PROPORTION_DEFAULTS`): frozen provenance metadata
   — `{ value: 0.15, derivedFrom: "E-33 committed proportion-witness records", evidence: [...subject/
   ratio/excess/within...], conclusion: "survives — tightest value consistent with passing post-loop
   ~0.03 and flagging the barn seed 0.164 the loop chased", ticket: "T-140-01" }`. Comment on
   `PROPORTION_DEFAULTS.tolerance` cites it. The value stays the single source of truth; the metadata
   only *explains* it.
3. **`proportionRatios`** return: add `lens: PROPORTION_LENS.OCCUPANCY` to both the whole and the
   `{ ...whole, perMass }` shapes.
4. **`compareRatios(measured, declared, opts = {})`**: accept `opts.lens` (default
   `PROPORTION_LENS.OCCUPANCY` — the measured side is occupancy). Stamp result `{ pass, tolerance,
   lens, rows }` and each pushed row gets `lens`. Existing callers (loop, conformance, witness) keep
   working — the third arg is optional and defaults correctly.
5. **`conceptPitchRatio(conceptMask, opts = {})`** (new export): segmentability-gated concept roof
   slope. `maskProportions(conceptMask)` → `rise = eaveRow − ridgeRow`, `run = maxExtent/2`,
   `ratio = rise/run`; returns `null` when mask unusable or `maskCoverage > conceptMaxCoverage` or
   degenerate. Pure.
6. **`derivePitchTarget({ conceptMask, sketch, pack })`** (new export): the precedence + headline,
   per design Decision 3. Imports `snapPitch` from `measured-program.mjs` (same import direction as
   the existing `sketchTargetRatios` import — no new cycle). Sketch ratio computed locally as
   `tan(sketch.pitch.dominantTiltDeg · π/180)`. Returns the pitch-contract object.

## MODIFIED — `src/recognition/measured-program.mjs`

Program-lens label only (tiny, two functions):
1. **`silhouetteRatios`** return: add `lens: "program"`.
2. **`sketchTargetRatios`** return: add `lens: "program"`.
   (String literal "program" to avoid importing `PROPORTION_LENS` back from `silhouette-proportion`
   and creating a cycle; the value is asserted equal to `PROPORTION_LENS.PROGRAM` in a test.)

## NEW — `benchmarks/sculpture/ruler-calibration.mjs`

Modeled on `proportion-witness.mjs`. Imports: `extractSilhouette`/`CONCEPT_BG`
(form-fidelity), `decodeImage` (palette-extract), `PROPORTION_DEFAULTS`/`PROPORTION_LENS`/
`proportionRatios`/`compareRatios`/`conceptPitchRatio`/`derivePitchTarget`/`maskCoverage`
(silhouette-proportion), `silhouetteRatios` (measured-program), `replayLedger`/`serializeArtifact`
(replay), `artifactOccupancy` (occupancy), `loadStylePack` (style-pack), pin-guard helpers,
`chainRels`/SUBJECTS. Structure:
- `RULER_CALIBRATION_SCHEMA = "ruler-calibration/v1"`, `OUT_REL = "benchmarks/sculpture/proportion/
  ruler-calibration.json"`.
- `generalizationGrep()` (E-25 self-grep — subjects come from committed records, not source).
- `lensDivergence()` — for cottage: replay committed ledger → program (`silhouetteRatios`, program
  lens) vs witness occupancy ratios (`proportionRatios` / quoted from `proportion/cottage.json`,
  occupancy lens); emit both labeled rows + the program/occupancy ratio (~3×).
- `toleranceCalibration()` — assemble the cross-subject excess/verdict table from committed witness
  records + the `TOLERANCE_CALIBRATION` conclusion.
- `pitchPrecedence()` — for barn + barn--saltcrag: load concept mask + sketch + rustic/saltcrag
  pack, call `derivePitchTarget`, record source / conceptRatio / sketchRatio / steepDoor / why.
- `compose()` → record object; default mode writes via `guardedWriteRecord` (no rotation needed —
  new path); `--repro` re-derives + byte-compares, exit 0/1. Markdown sidecar optional (keep JSON
  only to bound scope).

## MODIFIED — `package.json`

Two scripts:
```
"ruler:calibrate": "node benchmarks/sculpture/ruler-calibration.mjs",
"ruler:repro":     "node benchmarks/sculpture/ruler-calibration.mjs --repro",
```

## MODIFIED — `packs/README.md`

One paragraph under the proportion detection-rules section: the **lens vocabulary** (program vs
occupancy — what each measures) and the **tolerance calibration** pointer (0.15 is frozen,
evidence in `TOLERANCE_CALIBRATION` / T-140-01 design.md). Pitch precedence (concept > sketch) noted
beside the existing concept-as-contract rule. No detection-rule *numbers* change (T-139 owns those).

## NEW TESTS — `src/form/silhouette-proportion.test.mjs` (append)

- **SP-lens-1**: `proportionRatios` carries `lens:"occupancy"`; `compareRatios` result + rows carry
  `lens`; explicit `opts.lens:"program"` overrides.
- **SP-lens-2 (the 3× reproduction, AC1)**: synthetic program-lens ≈1.5 vs occupancy-lens ≈4.5,
  both labeled, ratio ≈3, each correct for its lens.
- **SP-pitch-1**: `conceptPitchRatio` measures a synthetic steep concept mask; returns null on an
  over-coverage / degenerate mask.
- **SP-pitch-2 (AC3)**: `derivePitchTarget` — measurable concept (pitch ≠ sketch) ⇒ source
  `"concept"`, concept wins; unsegmentable concept ⇒ source `"sketch-fallback"`, sketch value,
  `steepDoor` reflects the snapped class; divergence recorded both ways.

## NEW TESTS — `src/recognition/measured-program.test.mjs` (append)

- **MP-lens-1**: `silhouetteRatios` and `sketchTargetRatios` returns carry `lens:"program"` and the
  literal equals `PROPORTION_LENS.PROGRAM`.

## NEW RECORD — `benchmarks/sculpture/proportion/ruler-calibration.json`

The only new committed artifact. Covered by `ruler:repro` (integration idiom). No committed record
modified; no pin rotated.

## Ordering
1. `PROPORTION_LENS` + lens on `proportionRatios`/`compareRatios` (src) → tests SP-lens.
2. Program-lens labels (measured-program) → test MP-lens.
3. `conceptPitchRatio` + `derivePitchTarget` (src) → tests SP-pitch.
4. `TOLERANCE_CALIBRATION` metadata + comment.
5. New runner + npm scripts + record (`ruler:calibrate`), then `ruler:repro` proves byte-identity.
6. packs/README note. Full `npm test` + all `*:repro` green.

## Interfaces unchanged (regression guard)
`maskProportions`, `ratiosFromMask`, `deriveProportionDeclarations`, `assertProportionDeclarations`
signatures and outputs are **untouched** (lens is additive on `proportionRatios`/`compareRatios`
only). Existing callers and committed-record replays therefore stay byte-identical — verified by
`proportion:repro`, `measured:repro`, `milestone:proportion:repro` in Plan/Implement.
