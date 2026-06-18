# T-204-01 — Progress

## Status: implementation complete; all steps done; `npm test` 2405/2405 green; `measurements/` byte-clean.

## Commits (incremental, on `main` per the RDSPI convention)
1. `ce58ab9` feat — pure `gableRidgeForRatio` pitch lever + tests (RR1–5).
2. `85edc19` fix — lever ridge follows the chosen pitch's clean apex (no plateau-topped truncation); RR3 retargeted.
3. `bb2ccef` feat — wire the lever into both roof hands + extend the zero-spend roof evidence probe.

## What was done, by plan step

- **Step 1 — pure helper.** `gableRidgeForRatio({eaveY, eaveHeight, perp, targetRatio, tol, pitchClasses})`
  in `src/view/roof-generate.mjs` (exported). Tolerance-gated; snaps to a supported pitch class
  `{0.5,1,2,3}`. Tests RR1–RR5 in `roof-generate.test.mjs`.
- **Step 2 — wiring.** `leverGable(occ, perp)` helper + both roof hands (`apply_gable_roof`, `recolor_roof`)
  in `experiments/eval-alignment/picture-climb.mjs` now take `ridgeY`/`pitch` from the lever (target =
  `targetRatiosOf(program).ridgeToEave`). Imports added: `gableRidgeForRatio`, `targetRatiosOf`.
- **Step 3 — evidence probe.** Extended `ROOF_MATERIAL_PROBE` (zero spend): slate roof-cell census, honest
  vs relief framing, synthetic lever fire. Output captured to `roof-evidence.log`; slate glance copied to
  `recolored-beside.png`.
- **Step 4 — gate coverage.** Investigated; recolor_roof's department-dominant keep is already covered in
  `src/workshop/climb-gate.test.mjs` (see review.md). No new test needed — verified, not rebuilt.

## Evidence (from `roof-evidence.log`, GL available, zero LLM spend)

- **COLOUR ✓ value-true.** `recolor_roof` reason: `timber dark_oak_planks → stone deepslate_tiles (concept
  reads stone)`. Roof-cell census: **2106/2106 cells = deepslate_tiles**. The glance
  (`recolored-beside.png`) reads dark charcoal-slate beside the concept — matches.
- **PITCH ✓ flag clears (primary AC branch).** honest closed+gabled build (with lever): **ridgeToEave 1.25,
  flagged:false**; after `relief_walls`: **1.32, flagged:false**. Compare the old pitch-1 path (T-201
  trajectory): gabled **1.55** (in-tol), after relief **1.6316, flagged major**. The lever both moves the
  roof closer to the concept (1.55 → 1.25; |Δ vs 1.35| 0.20 → 0.10) and gives margin so relief no longer
  trips the flag.
- **LEVER exists ✓.** synthetic out-of-tol target 1.1: `changed:true, ratio 1.63 → 1.32 via pitch 0.5`.

## Deviation from design.md (documented per RDSPI rule 5)

design.md predicted the lever would be a **byte-identical no-op on the gatehouse** ("honest gable 1.55 within
tol"). The empirical run **refuted** this: the lever's own proportion estimate is **1.63** (just out of its
0.2 tol, since `1.35 × 1.2 = 1.62`), so it **fires** and rebuilds the gatehouse roof at **pitch 0.5**. This is
**better than the predicted named-limit fallback**:

- The framing **eye** measured the pitch-1 roof at 1.55 (in-tol) but +0.20 from the concept — i.e. visibly
  steeper than the picture. The lever brings the **measured** ratio to 1.25, **closer** to the concept 1.35.
  So firing is a genuine improvement toward the picture, **not** the "fake a lever" the ticket forbids
  (we did not force a within-target roof off-target; we moved an at-the-edge roof toward the target).
- The lever's internal estimate (1.63) and the eye's measurement (1.55) **disagree** on eave height (the
  lever uses `eaveY − floor + 1`; the eye uses `eaveYOf` taper detection). Named as a follow-up — the two
  should share one proportion definition. It does not change the verdict (both candidate pitches rank the
  same by the eye: 0.5→1.25 beats 1→1.55).

## Honest caveats / named residuals
- **Pitch granularity limit.** No supported class lands exactly 1.35 on this footprint: pitch 1 → 1.55,
  pitch 0.5 → 1.25. The lever picks the closest (0.5); the gable now errs slightly shallow (−0.10), within
  tolerance. A finer pitch lever (or fractional ridge) would hit 1.35 — out of scope.
- **The relief/`eaveYOf` measurement pollution is real and remains.** The lever clears the *symptom* for the
  gatehouse by improving the roof + creating margin; the root cause (proud detail polluting the framing eave
  read) is the same family as T-202's `eaveRingClosure` collapse and is **deferred to T-202**, named not fixed.
