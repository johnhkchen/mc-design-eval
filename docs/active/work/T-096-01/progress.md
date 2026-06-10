# T-096-01 kit-extraction — Progress

## Completed

- **Step 1 — vocabulary** (`53a9a2c`): `scripts/build-block-vocab.mjs` + committed
  `src/form/block-vocab.json` (978 survival-placeable 1.20.1 blocks via the palettes workspace's
  `minecraft-data`; NON_SURVIVAL denylist; byte-stable re-runs). Verified: trapdoors/fences/
  doors/lantern/smooth_sandstone members; barrier/air/command_block excluded.
- **Steps 2+3 — pure core** (`75819e8`): `src/form/kit.mjs` + `kit.test.mjs` (20 tests; suite
  1125 green). *Deviation: committed as one commit, not two — the module is one cohesive unit;
  the plan's step split was artificial.*
- **Step 4 — runner** (`48df686`): `benchmarks/sculpture/kit-extract.mjs`, `npm run kit:extract`
  (+ `build:block-vocab` script). `--offline` skip-clean verified.
- **Step 5 — live extraction**: both subjects extracted on the strong tier (subscription shim),
  raw replies on disk. Results:
  - cottage: 7 kept (4 cube / 3 fixture), 0 dropped — `smooth_sandstone` at band1 (the
    white_terracotta correction, AC #4), `spruce_trapdoor` + `spruce_door` + `lantern`
    recovered, 1 honest `unidentified` (window grille). All 4 cubes `flagged-mismatch`.
  - gatehouse: 5 kept, 2 verified, override `deepslate_tiles → deepslate_bricks` fires.

## Deviation under way (documented before proceeding — plan §Implement rule)

Live data exposed two design flaws, both fixed in the pure core before committing records:

1. **Global concept shading confounds the value check.** Cottage swatch−block ΔL is ≈ −14 to
   −16 for 3 of 4 cubes simultaneously — the documented "concept previews hue, not value"
   property, not per-block misrecognition. Fix: `verifyKitValues` estimates the SHARED
   lightness offset (median swatch−block ΔL over cube entries with sufficient cells, applied
   only when ≥ `KIT_OFFSET_MIN_SAMPLES` contribute) and verdicts on the offset-corrected ΔEw;
   the uncorrected `rawDeltaE` is recorded per entry (the "report true ΔE separately" rule).
   Flag semantics unchanged: mismatch flags, never snaps.
2. **Diff visibility tied to shipping.** `diffKitVsMap` derived corrections from verified
   overrides only, so cottage's flagged `smooth_sandstone` vanished from the diff — but AC #4
   requires the correction *visible*. Fix: `kitOverrides` now emits `flagged-candidate` rows
   when a band's only candidates are unverified (still NO override — verified-only shipping is
   the AC #2/#3 hard rule); `diffKitVsMap` counts any candidate naming a different block as a
   correction, stamped `ships: true|false`.

## Remaining

- Re-run `kit:extract --offline` (no new live calls — raws are pinned), inspect, commit
  records + raws (step 5 commit).
- Step 6: durable-skin wiring (`kitRecord` + `subK` composition), full `npm test`, commit.
- review.md.
