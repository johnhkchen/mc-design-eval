# Design — T-140-01 ruler-calibration

Three decisions, one per AC. Guiding constraints from Research: workshop-side only, no
per-building constants, committed records untouched (new fields in NEW records + live paths),
byte-identical `--repro`, and stay disjoint from T-139-01's `maskProportions` internals.

---

## Decision 1 — Name the lens (`lens: "program" | "occupancy"`)

**Chosen:** A frozen two-value enum `PROPORTION_LENS = {PROGRAM:"program", OCCUPANCY:"occupancy"}`,
stamped at every *producer* as an additive field on its return/rows:
- `proportionRatios` (occupancy projection) → `lens:"occupancy"`.
- `compareRatios` result → top-level `lens` + each row `lens` (the measured side is occupancy by
  construction; the function takes an explicit `lens` opt so a program-lens comparison can also be
  labeled, defaulting to occupancy).
- `silhouetteRatios` / `sketchTargetRatios` (program parameters) → `lens:"program"`.

The lens is a property of **which substrate was measured**, orthogonal to the existing `source`
field (`concept` | `sketch`), which says **where a target came from**. Both coexist: a row can be
`source:"sketch", lens:"occupancy"` (a sketch-derived target compared against realized voxels).

**Why additive, not a schema rewrite.** AC4 forbids touching committed records. A new optional
`lens` field is backward-compatible: old records simply lack it; `assertProportionDeclarations`
is unchanged (lens is on *measurements/comparisons*, not on *declarations*, which carry targets).
The schema-version bump lives where new records are emitted (the new `ruler-calibration/v1`
record, §below), not on the frozen declaration schema — so T-139-01's potential
`silhouette-proportion` edits and T-140-01 don't both fight over that version string.

**Rejected:**
- *Lens on declarations.* Declarations are targets, not measurements — a lens there is a category
  error and would force a `silhouette-proportion/v1`→v2 bump that collides with T-139.
- *Separate program/occupancy comparison functions.* Doubles the surface; the single labeled
  `compareRatios` is simpler and the loop already calls it once.
- *Inferring lens at the reader.* The whole defect is that divergence reads as contradiction; the
  label must be emitted at the producer, in the data, per AC1.

**The 3× reproduction (AC1).** A unit test builds a synthetic program (clean params, ridge:eave
≈1.5) and a synthetic occupancy carrying a wider bottom band (ridge:eave ≈4.5 under the current
detector), runs both producers, and asserts: program row `lens:"program"` reads ≈1.5, occupancy
row `lens:"occupancy"` reads ≈4.5, the ratio of the two ≈3, and **both are individually correct
for their lens**. Self-contained — does not depend on T-139's cottage fixture. The real cottage
3× is also quoted in the new calibration record from committed numbers.

---

## Decision 2 — Calibrate the tolerance (and record the finding)

**Chosen:** Keep `tolerance = 0.15` as a single frozen op parameter, and attach its calibration
**evidence** as an exported metadata object `TOLERANCE_CALIBRATION` (provenance pointer +
conclusion), with the full methodology in this design.md and a reproduced cross-subject table in
the new `ruler-calibration/v1` record.

**Methodology (cross-subject, from committed E-33 records — never per-building):**
Pull every committed `proportion-witness/v1` ratio row's `excess` with its judge verdict beside:

| subject | ratio | excess | basis | within @0.15 | judge (milestone) |
|---|---|---|---|---|---|
| barn (rustic, seed) | ridge:eave | 0.164 | rel | **false** | gate 4/4 same-object, all-minor |
| barn | roofShare | 0.1281 | rel | true | — |
| barn | aspect | 0 | rel | true | — |
| barn (post-loop, review finding 2) | ridge:eave | ~0.03 | rel | true | ratios into tolerance |
| cottage (occupancy lens) | ridge:eave | 2.1813 | rel | false | 2 drifted views name roof-heavy |
| cottage | roofShare | 1.6546 | rel | false | — |
| cottage | aspect | 0.1261 | rel | true | — |

**Finding:** the in-tolerance and out-of-tolerance populations are **bimodal** — an in-cluster at
excess ≤ 0.164 and an out-cluster ≥ 1.65, with a wide empty valley. The data does **not** uniquely
determine 0.15: any threshold in [0.165, 1.65] partitions the committed evidence identically. The
single discriminating point is barn's seed ridge:eave **0.164**, which (a) reads FAIL at 0.15 and
(b) the loop independently chased as a real defect across all six rounds — so a threshold that
*passed* 0.164 would have silenced a defect the model itself kept naming. The post-loop barn at
~0.03 sits comfortably inside. **Conclusion: 0.15 survives calibration** — it is the tightest value
consistent with both (i) passing the achieved post-loop ratios (~0.03) and (ii) flagging the
0.164 seed the loop treated as real — and that survival is the recorded finding (AC2: "if 0.15
survives calibration, that is the recorded finding"). The cottage's 1.65/2.18 are *lens-confounded*
(plinth artifact, T-139's fix) and so corroborate only the out-cluster, not the boundary.

**Why metadata, not a new number.** Changing the value would alter every committed verdict's
replay. The honest output of calibration here is "0.15 holds, and here is why" — banked as
provenance, not a silent re-tune.

**Rejected:** deriving a fresh number (e.g. max-in-cluster midpoint ≈ 0.9) — over-fits the
bimodal gap, loosens the gate past the one real boundary point, and would break committed replays.

---

## Decision 3 — Pitch-target precedence (concept wins, source cited)

**Chosen:** Add `derivePitchTarget({conceptMask, sketch, pack})` in `silhouette-proportion.mjs`
(home of the existing concept-vs-sketch precedence `deriveProportionDeclarations`). It returns a
recorded pitch contract:
```
{ ratio, source: "concept" | "sketch-fallback", deg,
  conceptRatio, sketchRatio, divergence,           // both sides, divergence null if concept N/A
  snapped: { pitchClass, residual },               // snapPitch into pack.proportions.pitchClasses
  steepDoor: boolean,                              // snapped.pitchClass > 1 (compile.mjs door)
  conceptSegmentable: boolean }
```
- **conceptRatio** from the concept mask roof geometry: `maskProportions(conceptMask)` → rise =
  `eaveRow − ridgeRow` (rows), run = `maxExtent/2` (half-span), ratio = rise/run — **gated by the
  same `conceptMaxCoverage` segmentability guard** as ridge:eave/roofShare. Unsegmentable → null.
- **Precedence:** concept if `conceptRatio != null`, else sketch (`tan(dominantTiltDeg)`); source
  `"concept"` | `"sketch-fallback"`. Concept measurable ⇒ concept wins (AC3), proven by a unit
  test with a synthetic measurable concept whose pitch ≠ the sketch's.
- **steepDoor headline** for both barn subjects, recorded in the calibration record: with the
  committed barn concept **unsegmentable (coverage 0.5148 > 0.5)**, source = `sketch-fallback`,
  sketch ≤45° ⇒ `snapped.pitchClass ≤ 1` ⇒ `steepDoor: false`. The steep door is **not** demanded —
  and the record names *why* (concept silhouette unsegmentable + rustic pack lacks a class-2 pitch),
  handing the real lever to S-141 (rustic-headroom) / S-143 (re-verdict). barn--saltcrag shares the
  barn form/concept/sketch (pack swap only) ⇒ same answer; both recorded.

**Why recording-only for the build path.** The realized geometry still snaps pitch from the sketch
in `applyMeasuredProportions` (unchanged). Because *every committed subject's concept is
unsegmentable*, a concept-preferred target would resolve to the sketch anyway — so wiring
precedence into the compile path is a no-op on committed replays (byte-identical, AC4) while the
*declared* pitch target (the contract the AC is about) now carries concept precedence + source,
provable on a synthetic measurable concept. Keeping the build path untouched is the lowest-risk
way to honor "concept wins when measurable" without re-deriving any committed build.

**Rejected:** mutating `applyMeasuredProportions`'s pitch input directly — risks a non-identical
replay if any concept were borderline-segmentable, and conflates the *declared target* (T-140's
job) with *demanding the steep door in the build* (S-141/S-143's job).

---

## The carrier: one new runner + record

`benchmarks/sculpture/ruler-calibration.mjs` → `benchmarks/sculpture/proportion/
ruler-calibration.json` (`ruler-calibration/v1`), modeled on `proportion-witness.mjs` (PNG decode,
no GL, no judge, `--repro` byte-identical, pin-guarded write, E-25 self-grep). Three sections:
`lensDivergence` (cottage program vs occupancy, both labeled), `toleranceCalibration` (the table +
conclusion above), `pitchPrecedence` (both barns). npm: `ruler:calibrate`, `ruler:repro`. This is
the single new committed record — existing witness/milestone records stay byte-for-byte.
