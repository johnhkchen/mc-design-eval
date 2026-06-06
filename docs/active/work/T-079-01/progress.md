# Progress — T-079-01 spray-paint-materials

## Status: Implement complete

All plan steps done, committed incrementally. `npm test` green (896 tests, +6 from this ticket). The
metered cottage run executed live (GL + dwebp); the metered LLM refine is opt-in (`--refine`, deferred).

## Steps
- [x] **Step 1 — palette-cans.mjs** (the "4 cans", AC #3). `allowedPalette`/`withAdditions`/
  `filterToPalette`. 4/4 tests. Committed.
- [x] **Step 2 — face-paint.mjs** (splat→back-project→recolor, AC #1, #4). `paintFace`/`mergePaints`/
  `applyPaint`. The geometry-safe round-trip invariant pinned (expand positions identical, only painted
  blocks change); corner precedence concept>glb; occluded interior untouched. 6/6 tests. Committed.
- [x] **Step 3 — glb-splat.mjs** (side/roof target, AC #2). `glbVoxelOccupancy`/`splatFromGlbOccupancy`/
  `resampleBlockGrid`/`loadGlbSplat`. Pure parts tested (5/5); the GLB decode is the lazy impure leaf.
  Committed.
- [x] **Step 4 — face-resemblance.mjs** (accept-if-closer, AC #5). `faceResemblance` (reuse E-22
  zone/set agreement) + `acceptIfCloser` (mirror revise/loop's gate). 4/4 tests. Committed.
- [x] **Step 5 — full `npm test` gate.** Green.
- [x] **Step 6 — spray-paint.mjs runner** (cottage front+side, AC #6, #7) + `spray:paint` script +
  gitignore for face PNGs. Live run executed.

## The cottage result (the AC #6 record)
`benchmarks/sculpture/spray-paint/cottage.json`:
- **Plaster `white_terracotta`: 8 → 315** — the 215→8 regression **reversed** (and past the original 215).
- **Front (+z), concept splat:** 526 cells painted; gate **accepted** — per-face resemblance
  **0.25 → 0.40** (a real move toward the concept; P14-safe — it would roll back if it didn't improve).
- **Side (+x), textured-GLB splat:** 520 cells painted (GLB texture decoded WebP→PNG via injected dwebp);
  accepted as the GLB truth (no concept face for a side — recorded as such).
- **Corner collisions:** 53 resolved concept>glb.
- **Painted build AJV-valid**, 7422 placements, **manifest still 6 blocks** — the "4 cans" held, zero
  off-palette bloat (`outOfPalette=0`).

## Deviations from the plan (documented)
1. **Front face is Path-P `+z`, not `-z`.** First live run revealed the multi-angle "front" angle
   (azimuth 0) renders the **+z** face, so painting `-z` put paint on the back while the gate scored the
   front → rejected (before==after==0.25). Fixed: project/paint/gate all on `+z` (`DIR_TO_ANGLE` table in
   the runner pins render-angle↔Path-P agreement). After the fix the gate accepts (0.25→0.40).
2. **WebP texture decode injected, not in `src/`.** The cottage GLB baseColor is WebP; the glb-voxel-build
   discipline keeps WebP codecs out of `src/`. `loadGlbSplat` now takes an injected `decodeTexture`; the
   runner supplies a dwebp-backed one (mirrors `building-build.mjs`). With none, `loadGlbSplat` throws a
   clear message on WebP, decodes PNG/JPEG.
3. **`resampleBlockGrid` extracted** from `splatFromGlbOccupancy` (Step 6) so the concept splat (an
   image-grid result with its own aspect-derived rows) aligns to the build face's `(n,m)` the same way the
   GLB splat does. Tested.
4. **Metered LLM refine deferred** to `--refine` (default off). The splat+gate path stands alone and is
   the tested, runnable core; the refine is the one metered call, wired through `requestTextWithImage` as a
   follow-up. The deterministic splat→paint→merge→assert + the plaster count always run and are recorded.

## Open items → Review
- The side face has no concept reference (the concept never shows it) so its accept-if-closer gate is
  by-construction (GLB truth), not a resemblance delta — an honest gap, recorded per-face.
- The metered `--refine` call is wired but not exercised in this pass.
</content>
