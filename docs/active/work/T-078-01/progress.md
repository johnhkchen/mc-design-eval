# Progress — T-078-01 view-layer-and-structural-read

Tracking against plan.md.

## Status
- [x] Step 1 — occupancy adapter (`src/view/occupancy.mjs` + test, 6 tests)
- [x] Step 2 — surface grid (Path P) + round-trip (`src/view/surface-grid.mjs` + test, 8 tests)
- [x] Step 3 — structural read (`src/view/structural-read.mjs` + test, 7 tests)
- [x] Step 4 — multi-angle reader (Path R) (`src/view/multi-angle.mjs` + test, 4 tests)
- [x] Step 5 — reference quantize (`src/view/reference-quantize.mjs` + test, 4 tests)
- [x] Step 6 — live GL proof on the cottage (`benchmarks/sculpture/view-layer-proof.mjs`, `npm run view:proof`)
- [x] Step 7 — full suite green (`npm test` → 845 pass, was 816; +29 new)

## Live proof results (cottage after-artifact.json, 6429 placements)
- Occupancy: 6429 voxels (all-voxel artifact), dims 26×27×32.
- Structural read: footprint 26×32 (660 columns); **floorLines [0, 7, 14]** (storey axis recovered — the very axis the
  3-D cottage edit lacked); roof coverage **0.793** (gaps = the S-084 watertight target); wall holes
  **4 on +x, 4 on -x** (skin gaps S-084 must seal); openings detected as windows on the ±x elevations.
- **Path-P -z face: 26×27 grid, 571 filled; back-projection round-trip identity = TRUE on real data.**
- 4 multi-angle renders saved (front, threeQuarter, top, +x+z) through the E-22 fixed lens.
- Same-angle reference quantize: 26×26 grid, validate mode, **outOfPalette = 0** (snapped within the
  6-block design-doc manifest), mean ΔE 28.75.
- Artifacts under `docs/active/work/T-078-01/`: `view-front.png`, `view-threeQuarter.png`,
  `view-top.png`, `view-+x+z.png`, `view-layer-report.json`.

## Deviations from plan
- **Reference quantize purity:** plan said test via a synthetic RGBA buffer; refactored the module to
  export a PURE `quantizeOpts({n,manifest})` (resolution + bare-manifest whitelist) so the test drives
  image-grid's pure `gridFromPixels` with the real opts — proving validate-mode (outOfPalette 0) without
  decode/GL. `referenceTarget`/`quantizeToFace` now compose that builder. Strictly stronger; no scope
  change.
- **Same-angle reference source (proof):** there is no direct *textured-GLB* GL render path in the repo;
  the proof renders the build itself at the front ortho angle and quantizes that as the demonstrative
  reference target. The mechanism (same-angle render → `gridFromImage` at n=face-width, manifest
  whitelist) is identical for a GLB render; only the image source differs. Noted for S-079.
- **Roof coverage < 1 and wall holes > 0 on the cottage** are not bugs in the read — they are the real
  surface-coherence defects S-084 exists to fix; the read surfacing them is the intended outcome.
