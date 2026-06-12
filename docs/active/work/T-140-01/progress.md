# Progress — T-140-01 ruler-calibration

## Status: complete — all three AC clusters landed, `npm test` 2018/2018, repros as expected.

## Commits (this ticket)
- `37804cf` (fix(T-139-01)) — the sibling's skirt-aware commit **swept in my uncommitted
  `silhouette-proportion.mjs` source** (shared file on the same branch — the entanglement the
  memory `parallel-roots-duplicate-shared-deps` warned about). My `PROPORTION_LENS`, `tagLens`,
  `TOLERANCE_CALIBRATION`, `conceptPitchRatio`, `derivePitchTarget`, and the `compareRatios`
  `opts.lens` all rode along; the source is committed and HEAD-clean. Attribution is muddied but
  no work was lost; the tree was green at that commit.
- `c856137` test(T-140-01) — the unit tests (SP-L1/L2/L3, SP-P1/P2); co-includes T-139's SP13–16
  (same shared test file, sibling's uncommitted tests).
- `2455067` feat(T-140-01) — the `ruler-calibration.mjs` runner + `ruler-calibration/v1` record +
  `pr/assets/ruler-calibration.md` + npm `ruler:calibrate`/`ruler:repro`.
- `7c463cc` docs(T-140-01) — `packs/README.md` lens/tolerance/pitch notes.

## What landed, per AC

**AC1 — lens named at every producer + the 3× reproduced.** `PROPORTION_LENS` enum + `tagLens()`
(producer opt-in stamp) + `compareRatios(…, {lens})` (gate stamps rows only when handed a lens).
The ruler-calibration record names program vs occupancy on every committed witness subject —
**cottage 3.18×, barn 1.16×** — and SP-L2 reproduces the 3× as two labeled instruments. SP-L1
proves the labels and the byte-identical default.

**AC2 — tolerance carries calibration evidence.** `TOLERANCE_CALIBRATION` metadata (provenance +
cross-subject evidence + conclusion); methodology in design.md §Decision 2. The record's
`toleranceCalibration` section reproduces the split from committed data: **in-cluster max 0.1281 ≤
0.15 < out-cluster min 0.164 → separates: true**. 0.15 **survives** (recorded finding); it stays
one frozen op parameter (value asserted == `PROPORTION_DEFAULTS.tolerance`, SP-L3). Never
per-building.

**AC3 — pitch-target precedence + source cited + barn divergence recorded.** `derivePitchTarget`
(concept wins when segmentable, else `sketch-fallback`); SP-P1/SP-P2 prove concept-wins on a
measurable synthetic concept and the fallback otherwise. The record's `pitchPrecedence` covers
**both barn subjects + cottage**: all `sketch-fallback` (both E-33 concepts unsegmentable), snapped
class 1, **steep door NOT demanded** — the headline. The honest twist surfaced by the data:
**saltcrag offers a class-2 pitch but the TRELLIS-flattened sketch never reaches it** (rustic has
no steep class at all), so the lever is concept segmentation + sketch flattening, not the pack
vocabulary — handed to S-141/S-143.

**AC4 — committed records untouched, no judge, npm test green, replay byte-identical.** No pin
rotations; the only new committed artifact is `ruler-calibration.json` (+ its md). `npm test`
2018/2018. `ruler:repro` and `milestone:proportion:repro` byte-identical (exit 0). The two
pre-existing concern-3 reds (`proportion:repro`, `measured:repro`) remain exit 1 — **unchanged by
this ticket** (my lens labels are opt-in/default-off and the pitch path is recording-only, so the
default outputs of `proportionRatios`/`silhouetteRatios`/`compareRatios` are byte-identical). They
are owned by T-142/T-143; T-139's skirt fix legitimately changes their numeric divergence content.

## Deviations from plan/structure (documented)
1. **No edit to `measured-program.mjs` returns.** Structure.md proposed adding `lens:"program"` to
   `silhouetteRatios`/`sketchTargetRatios`. **Rejected during implement**: `proportion-milestone.mjs:99`
   **spreads** `silhouetteRatios(program)` into committed (currently-green) rows and
   `measured-proportions.mjs` embeds the whole objects — always-stamping would flip
   `milestone:proportion:repro` green→red, violating AC4. Instead the program lens is applied at the
   consumer via `tagLens(…, PROGRAM)` (in the new record); `measured-program.mjs` is untouched. The
   planned MP-lens-1 test was dropped (nothing to test there); the lens-equality assertion lives in
   SP-L1 instead. This is the **byte-identical-by-default** reconciliation of AC1 ("emitted at every
   producer") with AC4 ("committed records untouched"): the capability + vocabulary is wired at the
   producers, the new record names both lenses, and retro-stamping committed pins is T-142/T-143's.
2. **`conceptPitchRatio`/`derivePitchTarget` live in `silhouette-proportion.mjs`**, not
   measured-program — to keep `maskProportions` access local and avoid an import cycle (only
   `snapPitch` is pulled, same direction as the existing `sketchTargetRatios` import).
3. **`SP-L2` fixture extents** changed `[1,1,2,3,12,12]`→`[1,1,2,3,4,4]` (the former cleared the
   ridge threshold and read 3×; the latter is a clean roof-heavy silhouette reading ridge:eave 6).

## Verification ledger (exit-coded at HEAD)
- `npm test` → 2018 pass / 0 fail.
- `node --test src/form/silhouette-proportion.test.mjs` → 21/21 (SP-L*/SP-P* + T-139's SP13-16).
- `ruler:calibrate` → grep clean, writes the record; `ruler:repro` → exit 0 (byte-identical).
- `milestone:proportion:repro` → exit 0 (unchanged green — AC4 byte-identity proof).
- `proportion:repro` / `measured:repro` → exit 1 (pre-existing concern-3 reds, unchanged by me).
