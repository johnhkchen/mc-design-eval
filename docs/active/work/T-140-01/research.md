# Research — T-140-01 ruler-calibration

Descriptive map of the proportion-measurement code the ticket touches. Three gaps (E-34/S-140,
from T-138-02 review finding 4 + concerns 1/2/6): **unnamed lens, uncalibrated tolerance,
flattened pitch targets.** Workshop-side only; the frozen judge contract is untouched.

## The two instruments (the "unnamed lens")

There are genuinely **two proportion rulers**, both alive, neither labeled:

1. **Program lens** — ratios from program *parameters* (compiled geometry, not voxels):
   - `silhouetteRatios(workshopProgram)` — `src/recognition/measured-program.mjs:344`. Reads
     `roof.spec.eaveY` / `roof.spec.ridgeY` (eave = min, ridge = max) and `shell.spec.footprint`.
     `total = ridge + 1`; returns `{ridgeToEave, roofShare, aspect}`.
   - `sketchTargetRatios(sketch)` — `measured-program.mjs:365`. Same definitions from the sketch's
     `eaveBlocks` / `heightBlocks` / `planDims`. The *targets* the loop aims at.
   These read clean, intended numbers — no realized-voxel artifacts.

2. **Occupancy lens** — ratios over *realized voxels*:
   - `proportionRatios(occ)` — `src/form/silhouette-proportion.mjs:200`. Projects the occupancy to
     both elevations + plan, runs `maskProportions` (eave = topmost row ≥ `eaveWidthFrac`·maxExtent;
     ridge = topmost row ≥ `ridgeMinWidthFrac`·maxExtent). `eaveH = min` across views, `totalH = max`.
   - The conformance gate `proportionCheck` (`src/pack/conformance.mjs:213`) and the witness runner
     both measure on this lens.

These can disagree 3×. The committed **cottage** witness (`benchmarks/sculpture/proportion/
cottage.json`) records **occupancy** ridge:eave **4.5** / roofShare 0.7778; the program-lens /
sketch target is **1.4145** / 0.293 — a ~3× gap (the realized plinth band latches the occupancy
eave; T-139-01 owns *fixing* that detection, T-140-01 owns *naming the lens* so the gap reads as
two instruments, not a contradiction). **No record or row carries a `lens` field today.**

### Where lens labels must land (AC1 "every producer")
- `proportionRatios` return (occupancy) — `silhouette-proportion.mjs:200`.
- `compareRatios` result + rows (the workshop gate's arithmetic) — `silhouette-proportion.mjs:317`.
- `silhouetteRatios` / `sketchTargetRatios` returns (program) — `measured-program.mjs:344,365`.
- The milestone composer `proportion-milestone.mjs:121` reads `silhouetteRatios` (program lens) for
  before/after; the witness runner reads `proportionRatios` (occupancy lens).

## Tolerance (the "uncalibrated 0.15")

`PROPORTION_DEFAULTS.tolerance = 0.15` — `silhouette-proportion.mjs:41`. Frozen op parameter
(the `CONFORMANCE_DEFAULTS` posture: declared, never subject-tuned). Relative band per ratio;
targets below `absoluteFloor` (0.05) switch to absolute delta. **Declared, never derived.**

Committed cross-subject evidence to calibrate against (all `proportion-witness/v1`, judge verdicts
in the milestone record):
- **barn** (`proportion/barn.json`, rustic, T-135 seed/witness): ridge:eave excess **0.164**
  (the recorded `defect`, withinTolerance **false** — the one near-boundary point); roofShare
  0.1281 (within); aspect 0 (within). T-138-01's *post-loop* barn landed ratios into tolerance
  (~0.03, review finding 2).
- **barn--saltcrag**: same form, pack swap; same ratio family.
- **cottage** (`proportion/cottage.json`): ridge:eave excess **2.1813**, roofShare **1.6546**
  (both withinTolerance false), aspect 0.1261 (within). Wildly out — but this is the *occupancy*
  lens reading the plinth artifact (so the cottage is also a lens-confound, not clean evidence).

The populations are **bimodal**: in-tolerance cluster ≤~0.16, out-of-tolerance ≥~1.65, a wide
empty valley between. 0.15 is *not contradicted* by the data, but the data under-determines it
(any threshold in [0.16, 1.6] separates identically). The single discriminating point is barn's
ridge:eave 0.164, which reads FAIL and which the loop *did* treat as a real defect to chase.

## Pitch targets (the "flattened pitch")

Pitch flows sketch → program today, with no concept precedence:
- `sketchMeasurements(sketch)` — `measured-program.mjs:58` — `pitchRatio = tiltToRatio(sketch.
  pitch.dominantTiltDeg)` = `tan(deg)`.
- `snapPitch(ratio, pitchClasses)` — `measured-program.mjs:117` — nearest pack class, ties low.
- `applyMeasuredProportions` — `measured-program.mjs:199` — snaps pitch from the sketch; the
  compiler's `roofIdiomForPitch(idiom, pitchClass)` (`src/recognition/compile.mjs:103`) opens the
  **steep door** (`roof.gable` → `roof.gable.steep`) only when **pitchClass > 1** (T-134).

The E-33 honesty rule already ranks **concept = contract, sketch = fallback** for ridge:eave /
roofShare (`deriveProportionDeclarations`, `silhouette-proportion.mjs:240`, records `sources`).
**Pitch does not yet follow it** — it is sketch-only. Both E-33 barn sketches measured ≤45°
(TRELLIS stair-step flattening), so the steep door went unused even though the barn concept prompt
reads "steep gabled roof" (review finding 3).

### The concept-segmentability constraint (the honest catch)
The concept silhouette is gated by `conceptMaxCoverage = 0.5`: a mask covering more of its frame
than this "did not background-segment" → unusable, recorded fallback. **Both committed barn and
cottage concepts FAIL this gate** (barn coverage **0.5148**, cottage **0.9673** — both
`segmentable: false`). So a concept-precedence pitch target, applied to the committed subjects,
falls back to the sketch anyway → the realized build path is unchanged → replays stay byte-identical.
The *headline* the AC wants ("would the steep door now be demanded?") for both barns is therefore:
**no** — the concept silhouette is unsegmentable, so concept pitch is unmeasurable here; the steep
door stays unused; the gap is a segmentation problem for S-141/S-143, recorded honestly.

## Concept silhouette extraction (reusable, GL-free)
`extractSilhouette(decodeImage(png), CONCEPT_BG)` — `src/form/form-fidelity.mjs:87` /
`src/color/palette-extract.mjs`. The witness runner (`proportion-witness.mjs:99`) already does this
deterministically (PNG decode, no GL) and has a byte-identical `--repro` path. `maskCoverage`
(`silhouette-proportion.mjs:178`) and `maskProportions` give the concept's eave/ridge geometry from
which a concept *pitch* (roof rise / eave half-width) can be read with the same machinery.

## Records, schemas, replay
- No standalone JSON Schema for proportion records — validation is code (`assert
  ProportionDeclarations`). Schemas are inline version strings (`silhouette-proportion/v1`,
  `proportion-witness/v1`, `measured-record/*`, `proportion-milestone/v1`). Versioning = bump the
  string; new fields land in NEW records (AC4 forbids touching committed ones).
- Writes go through `guardedWriteRecord` / `preflightPins` (`src/form/pin-guard.mjs`); byte-identical
  rewrites always pass, otherwise refuse without `--rotate-pins`. T-140-01 writes **new** records, so
  no rotation is needed.
- `--repro` idiom: re-derive deterministically, byte-compare, exit 0/1 (`measured:repro`,
  `proportion:repro`, `milestone:proportion:repro`).

## Tests
- `node --test "src/**/*.test.mjs"` (`npm run test:unit`); `npm test` adds artifact validation.
  Current: 2009 passing (T-138-02 review).
- `src/form/silhouette-proportion.test.mjs` (SP1–SP11): masks, ratios, derive, compare.
- `src/recognition/measured-program.test.mjs` (MP*): silhouetteRatios, sketchTargetRatios, snapPitch.
- `src/pack/conformance.test.mjs`: proportionCheck. `src/workshop/loop.test.mjs` L8: regression.

## Constraints / assumptions
- **Workshop-side only**; frozen judge, azimuths, thresholds unmoved.
- **No per-building constants**; tolerance stays a single frozen op parameter wherever it lands.
- **Committed records untouched**; lens/pitch fields land in NEW records + live code paths only.
- **Sibling collision**: T-139-01 edits `maskProportions` *internals* (skirt exclusion) in the same
  file. T-140-01's additions (lens labels, pitch precedence, calibration metadata) are disjoint
  regions; the lock serializes commits. Both should reuse, not duplicate, any cottage fixture
  (memory: parallel-roots-duplicate-shared-deps). T-140-01 reads committed records rather than
  pinning a new cottage artifact, to stay out of T-139's way.
