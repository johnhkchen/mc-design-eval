# T-019-01 — Progress

## Status: COMPLETE — all plan steps done, `npm test` green (166/166).

## Steps

- [x] **Step 1 — deps + script + install.** Added `minecraft-assets ^1.17.0` and `pngjs ^7.0.0`
      to `devDependencies`, added `build:block-table` npm script. `npm install` added 3 packages.
      Verified both load at the repo root; `mcAssets('1.20.1').version` → `1.20.2`.
- [x] **Step 2 — `srgbToLab`.** Implemented in `src/color/block-table.mjs` per the research-doc
      math (inverse gamma → linear → XYZ D65 → Lab, δ=6/29). Lab rounded to 3 dp.
- [x] **Step 3 — pixel/face/classify helpers.** `meanOpaqueRgb` (first-frame slicing, alpha≥128
      with >0 fallback, null when fully transparent), `isFullCubeParent`, `EXCLUDE_BLOCKS`,
      `classifyBlock`, `pickFace`.
- [x] **Step 4 — asset I/O + builder + loader.** `resolveAssets` (lazy default-import of
      minecraft-assets, reads JSON by `.directory` path), `buildBlockTable` (lazy `pngjs`,
      deterministic sort, records every drop in `excluded[]`), `loadBlockTable`. Smoke run:
      305 blocks / 455 excluded; gold/coal/quartz/lapis/redstone all read as expected;
      leaves/stairs/grass absent.
- [x] **Step 5 — CLI + committed table.** `scripts/build-block-table.mjs`; `npm run
      build:block-table` wrote `src/color/block-lab-table.json` (≈113 KB, committed).
- [x] **Step 6 — tests.** `src/color/block-table.test.mjs`: Group A (conversion reference
      values), Group B (meanOpaqueRgb + classify/pickFace helpers on synthetic inputs), Group C
      (semantic sanity on the committed table). `npm test` green.
- [x] **Step 7 — docs.** Added a "Color layer (E-10)" section to `src/README.md` documenting
      regeneration, the build-time-vs-runtime dep boundary, the 1.20.1→1.20.2 resolution, and
      the S-023 dedupe note.

## Deviations from plan

- **Test mock fix.** The Group-B2 tint test initially mocked `grass_block` with its real
  `block/block` parent, which the cube filter (correctly) rejects *before* the tint branch, so
  the assertion `/tint/` failed. Changed the mock to a synthetic `cube_all` block carrying
  `tintindex` to isolate the tint rule. No production-code change. This is a tightening, not a
  scope change.

## Final counts

- **305** blocks in the table; **455** excluded (each with a reason).
- Known-block reads: gold `lab=[84.5,-0.9,72.6]`, coal `[4.7,0,0]`, blackstone `[15.0,4.0,-2.3]`,
  quartz `[91.6,0.8,4.1]`, lapis `[29.9,14.7,-44.3]`, redstone `[37.7,57.0,49.4]`.
