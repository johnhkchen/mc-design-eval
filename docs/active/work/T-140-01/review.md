# Review — T-140-01 ruler-calibration

The straight ruler (E-34/S-140): name the lens, calibrate the tolerance, give the pitch target its
source. Workshop-side only; the frozen judge contract is untouched. Three calibration/vocabulary
gaps the E-33 milestone measured (T-138-02 review finding 4 + concerns 1/2/6), closed without
moving a single committed verdict.

## What changed

**`src/form/silhouette-proportion.mjs`** (committed in `37804cf` — shared-file entanglement, see
Concern 1):
- `PROPORTION_LENS` enum + `tagLens(ratios, lens)` — the producer's opt-in lens stamp (returns a
  labeled copy).
- `compareRatios(measured, declared, {lens})` — stamps the result + every row **only when handed a
  lens**; the no-lens default is byte-identical to the legacy shape.
- `TOLERANCE_CALIBRATION` — frozen provenance metadata for the `0.15` op parameter (evidence +
  conclusion); the value stays the single source of truth.
- `conceptPitchRatio(conceptMask)` — segmentability-gated concept roof slope (rise/half-span).
- `derivePitchTarget({conceptMask, sketch, pack})` — concept-wins precedence, source citation,
  snapped class, `steepDoor`, divergence; `PITCH_TARGET_SCHEMA = "pitch-target/v1"`.

**`src/form/silhouette-proportion.test.mjs`** (`c856137`): SP-L1 (labels + byte-identical default),
SP-L2 (the 3× as two labeled instruments), SP-L3 (tolerance calibration freeze + bimodal split),
SP-P1 (`conceptPitchRatio`), SP-P2 (concept-wins / sketch-fallback precedence + steep door).

**`benchmarks/sculpture/ruler-calibration.mjs` + record** (`2455067`): new runner over committed
inputs only → `benchmarks/sculpture/proportion/ruler-calibration.json` (`ruler-calibration/v1`) +
`pr/assets/ruler-calibration.md`. npm `ruler:calibrate` / `ruler:repro`. Three sections: lens
divergence (per-subject program vs occupancy), tolerance calibration (split reproduced from data),
pitch precedence (every chain-backed (subject, pack) pair).

**`package.json`** (`2455067`): two scripts. **`packs/README.md`** (`7c463cc`): lens / tolerance-
calibration / pitch-precedence notes beside T-139's skirt note.

## AC ledger

- **AC1 lens named at every producer + 3× reproduced — met.** Vocabulary (`PROPORTION_LENS`) +
  opt-in stamps wired at the producers; the new `ruler-calibration/v1` record names program vs
  occupancy on every committed subject (**cottage 3.18×, barn 1.16×**), schema-versioned; SP-L2
  reproduces the 3× as two correctly-labeled instruments. *Interpretation note:* the committed
  measured/milestone records are **not** retro-stamped (AC4 forbids it; rotation is T-142/T-143) —
  "emitted at every producer" is satisfied as capability-wired + named-in-new-records. See Deviation 1.
- **AC2 tolerance carries calibration evidence — met.** Methodology in design.md §2;
  `TOLERANCE_CALIBRATION` + the record's `toleranceCalibration` reproduce **in-cluster 0.1281 ≤
  0.15 < out-cluster 0.164 → separates**. 0.15 **survives** (the recorded finding); frozen op
  parameter, never per-building (SP-L3 asserts `value == PROPORTION_DEFAULTS.tolerance`).
- **AC3 pitch precedence + source + barn divergence — met.** `derivePitchTarget` concept-first;
  recorded for **both barn subjects + cottage**; all `sketch-fallback` (concepts unsegmentable),
  **steep door not demanded** — the headline for S-141/S-143, with the data-surfaced nuance that
  saltcrag *offers* class 2 but the flattened sketch never reaches it.
- **AC4 committed records untouched / no judge / npm test green / replay byte-identical — met.**
  No pin rotations; one new record. `npm test` 2018/2018. `ruler:repro` + `milestone:proportion:repro`
  byte-identical. The pre-existing `proportion:repro`/`measured:repro` reds are unchanged by this
  ticket (Concern 2).

## Test coverage

- **Unit:** 5 new tests (SP-L1/L2/L3, SP-P1/P2) cover lens labeling + byte-identical default, the
  3× reproduction, the tolerance freeze + split, concept pitch measurement + null fallbacks, and
  the concept-wins/sketch-fallback precedence with the steep-door bit. Full suite 2018/2018.
- **Integration:** `ruler:repro` proves the new record is deterministic; `milestone:proportion:repro`
  (green, unchanged) is the standing proof that the additive lens fields and recording-only pitch
  path perturbed no committed replay.
- **Gaps:** (a) no end-to-end test wires `compareRatios({lens})` through the live workshop loop —
  the loop still calls it lens-free (correct: the loop's records mustn't change); the labeled path
  is exercised only by the runner + SP-L1. (b) `derivePitchTarget` is **recording-only** — there is
  no test that a *measurable* concept changes a realized build, because no committed subject has a
  segmentable concept; the precedence-into-compile wiring is deliberately deferred (Deviation 1).

## Open concerns — for the reviewer

1. **Shared-file entanglement (process, not code).** T-139-01 and T-140-01 both target
   `silhouette-proportion.mjs` with `depends_on: []` (parallel). My source changes were committed
   **inside T-139's `37804cf`**; my test file commit co-includes T-139's SP13–16. Nothing is lost
   and the tree is green, but attribution is blurred. This is a **missing DAG edge** (the RDSPI
   concurrency note: "two tickets modifying the same file is a missing dependency edge") — S-139 and
   S-140 should have been sequenced, or the lens/pitch additions split into a file the skirt fix
   doesn't touch. Flagging for E-34 sequencing of S-141/S-142/S-143.
2. **Pre-existing concern-3 reds remain red.** `proportion:repro` / `measured:repro` exit 1 — the
   T-138-02 concern-3 retired-pin family (stale `ratios.before`, geometry-bearing ledger replay).
   **Unchanged by this ticket** (verified: red at baseline before any edit; my changes are
   opt-in/recording-only). T-139's skirt fix legitimately alters their *numeric* divergence (the
   corrected ruler). Both belong to T-142/T-143; no regression test for their SKIP-vs-FAIL semantics
   exists yet (still owed by the rotation tickets).
3. **The "lens" the AC wanted vs. what shipped.** AC1 lists the milestone composer as a producer
   that should name its lens. It is wired to be able to (the vocabulary + `tagLens` are exported and
   the program lens is named in the new record) but its **committed** record is not stamped — that
   would break `milestone:proportion:repro` and is a rotation. If the reviewer wants the milestone
   record itself to carry `lens`, that is a T-142/T-143 rotation, not a T-140 change.
4. **Pitch precedence is declared, not yet demanded.** `derivePitchTarget` produces the *declared*
   contract with concept precedence; the realized build still snaps pitch from the sketch in
   `applyMeasuredProportions`. Wiring concept-preferred pitch into the compile path is safe today
   (every committed concept is unsegmentable → no-op) but is intentionally left to S-141/S-143,
   which own *demanding* the steep door and fixing concept segmentation. The headline number this
   ticket hands them: **the steep door stays unused — the blocker is concept segmentation + sketch
   flattening, not the pack vocabulary** (saltcrag already carries class 2).

## Bottom line
Three instruments straightened, zero verdicts moved. The ruler now says which lens it is, why its
tolerance is 0.15, and where its pitch target comes from — all reproducible by replay, all
workshop-side. The one real risk is process (the shared-file race with T-139), not correctness.
