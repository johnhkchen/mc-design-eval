# Plan — T-140-01 ruler-calibration

Ordered, independently-verifiable steps. Each step ends green (`npm run test:unit`) before the
next; the `--repro` byte-identity checks run at the end of the relevant steps and once more at the
close. Commit after each meaningful unit.

## Step 1 — Lens enum + occupancy labels (src/form/silhouette-proportion.mjs)
- Add `PROPORTION_LENS` export.
- `proportionRatios`: stamp `lens: PROPORTION_LENS.OCCUPANCY` on the returned object (whole + perMass
  shape).
- `compareRatios(measured, declared, opts = {})`: thread `opts.lens` (default `OCCUPANCY`) onto the
  result and every row.
- **Tests (append to silhouette-proportion.test.mjs):** SP-lens-1 (labels present + override).
- **Verify:** `npm run test:unit` green; existing SP1–SP11 unaffected (additive field).
- **Commit:** `feat(T-140-01): name the occupancy lens on proportionRatios + compareRatios`.

## Step 2 — Program labels (src/recognition/measured-program.mjs)
- `silhouetteRatios` / `sketchTargetRatios`: add `lens: "program"`.
- **Tests (measured-program.test.mjs):** MP-lens-1 (label present, equals `PROPORTION_LENS.PROGRAM`).
- **Verify:** test:unit green; MP* unaffected.
- **Commit:** `feat(T-140-01): name the program lens on silhouetteRatios + sketchTargetRatios`.

## Step 3 — The 3× reproduction test (AC1)
- SP-lens-2: build a synthetic program (silhouetteRatios input or a hand `{ridgeToEave≈1.5,
  lens:"program"}`) and a synthetic occupancy whose bottom band latches the eave (occupancy
  ridge:eave ≈4.5, `lens:"occupancy"`); assert both labeled, ratio ≈3, each internally correct.
- **Verify:** test:unit green.
- **Commit:** folded into Step 1's commit if quick, else `test(T-140-01): cottage 3× lens divergence
  reproduced as two labeled instruments`.

## Step 4 — Concept pitch + precedence (src/form/silhouette-proportion.mjs)
- `conceptPitchRatio(conceptMask, opts)`: segmentability-gated roof slope (rise/half-span); null on
  unusable/degenerate.
- `derivePitchTarget({conceptMask, sketch, pack})`: concept-first precedence, source citation,
  `snapPitch` into pack pitchClasses, `steepDoor = pitchClass > 1`, divergence both ways. Import
  `snapPitch` from measured-program (no cycle — same direction as existing import).
- **Tests:** SP-pitch-1 (conceptPitchRatio: measures steep synthetic, null on over-coverage),
  SP-pitch-2 (derivePitchTarget: measurable concept ⇒ "concept" wins; unsegmentable ⇒
  "sketch-fallback" + steepDoor reflects snapped class).
- **Verify:** test:unit green.
- **Commit:** `feat(T-140-01): pitch-target precedence — concept wins when segmentable, source cited`.

## Step 5 — Tolerance calibration metadata (src/form/silhouette-proportion.mjs)
- `TOLERANCE_CALIBRATION` export (provenance + evidence rows + conclusion); comment on
  `PROPORTION_DEFAULTS.tolerance` pointing to it. Value stays 0.15.
- **Tests:** assert `TOLERANCE_CALIBRATION.value === PROPORTION_DEFAULTS.tolerance` and the
  conclusion string is non-empty (a freeze-guard, not a behaviour change).
- **Verify:** test:unit green.
- **Commit:** `docs(T-140-01): bank the 0.15 tolerance calibration evidence (survives, recorded)`.

## Step 6 — The calibration runner + record (benchmarks/sculpture/ruler-calibration.mjs)
- New runner per structure.md: `lensDivergence` (cottage), `toleranceCalibration` (table +
  conclusion), `pitchPrecedence` (barn + barn--saltcrag). Reads committed witness records + concept
  PNGs + sketches + packs; replays the cottage ledger for the program lens. `guardedWriteRecord`
  (new path, no rotation). `--repro` byte-compares.
- npm: `ruler:calibrate`, `ruler:repro`.
- **Run:** `npm run ruler:calibrate` (writes record) → inspect the three sections by eye (numbers
  sane: cottage program≈1.4–1.7 vs occupancy 4.5 ≈3×; both barns source `sketch-fallback`,
  steepDoor false; tolerance conclusion "survives").
- **Verify:** `npm run ruler:repro` exits 0 (byte-identical on a second derive).
- **Commit:** `feat(T-140-01): ruler-calibration record — lens divergence, tolerance evidence,
  pitch precedence (both barns)`.

## Step 7 — Docs + full regression
- `packs/README.md`: lens vocabulary + tolerance-calibration pointer + pitch-precedence note.
- **Run the full guard set:**
  - `npm test` — expect 2009 + new tests (SP-lens-1/2, SP-pitch-1/2, MP-lens-1, calibration freeze).
  - `npm run proportion:repro` — byte-identical (no witness change).
  - `npm run measured:repro` — byte-identical (no compile-path change; concept unsegmentable ⇒ pitch
    still sketch-sourced). NOTE: this and `proportion:repro` carry the **pre-existing T-138-02
    concern-3 retired-pin FAILs** (review concern 3); confirm any non-zero exit is that
    pre-existing class (same diff as a `caf0d13` baseline worktree), NOT a regression from this
    ticket's additive fields. If they were already red at HEAD, document that they remain identically
    red and nothing here moved them.
  - `npm run milestone:proportion:repro` — byte-identical.
  - `npm run ruler:repro` — exit 0.
- **Commit:** `docs(T-140-01): packs/README lens + tolerance + pitch-precedence notes`.

## Testing strategy
- **Unit (`src/**/*.test.mjs`):** lens labels, the 3× reproduction, conceptPitchRatio,
  derivePitchTarget precedence, calibration freeze-guard. These are the AC's "reproduced in a test"
  and "concept wins when measurable" proofs.
- **Integration (`*:repro`):** the new `ruler:repro` proves the new record is deterministic; the
  three existing `:repro` modes prove the additive `lens` fields and the recording-only pitch
  change did **not** perturb any committed replay (AC4 byte-identity).
- **No judge runs, no pin rotations** anywhere — all writes are to the one new record path.

## Risks / mitigations
- **Circular import** (silhouette ↔ measured-program): mitigated — only `snapPitch` is pulled, same
  direction as the existing `sketchTargetRatios` import; measured-program imports nothing from
  silhouette. Program-lens label uses a string literal, not a back-import.
- **Replay drift from lens fields:** mitigated — lens is added to *live function returns*, not to
  serialized committed records; witness/measured/milestone records are recomputed from the same
  inputs and never include lens (those runners are unchanged), so their bytes are identical.
- **Pre-existing concern-3 reds** (`proportion:repro` etc.): not owned here (T-142/T-143). Plan only
  requires *not worsening* them — proven by a baseline-diff if any are red at HEAD.
- **T-139 collision:** same file, disjoint regions. If T-139 lands first and bumps a schema string,
  re-base the additive edits; the lock serializes commits.
