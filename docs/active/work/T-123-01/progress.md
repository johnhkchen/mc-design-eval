# T-123-01 glb-conditioning — Progress

## Done (all plan steps)

- **Steps 1–5: conditioning core** — `src/form/form-sketch.mjs` + `form-sketch.test.mjs`.
  Grammar (14 orientations), `snapNormal`, `triangleGeometry`, `coarseFaces` (weld → region-grow →
  cap: decimate+snap as one mechanism), `sampleOccupancy` (scanline-parity substrate,
  cross-validated cell-for-cell against `voxelizeGlb`), `detectSymmetry` (axis-aligned sweep,
  reflection IoU, better-half by snap residual), `fitFootprint` (boundary trace → collinear merge
  → jog snap), `roofProfile`/`pitchBucket`, `proportionsOf` (`segmentMasses` reuse),
  `conditionGlb`/`buildSketch`. Commit 0604a8b.
- **Step 6: plotter** — `src/form/sketch-plot.mjs` + tests (pure RGBA sheet: plan + two
  elevations, raw-mesh orthographic outline in the shared cell frame). Commit (with `conditionGlb`
  split) in the same series.
- **Step 7: runner + records** — `benchmarks/sculpture/form-sketch.mjs`, npm `sketch:*` scripts,
  committed `benchmarks/sculpture/form-sketch/{key}.{json,md}` + `{key}-sheet.png` for all four
  registered subjects. Commits 9576f5f, c8bec91.
- **Step 8: proofs** — `--repro` byte-identical ×4 (re-proved after the sibling T-126-01
  pin-guard commit); `npm test` 1708/1708; no-coupling + generalization greps clean (recorded in
  review.md).

## Deviations from plan/structure (all documented at decision time)

1. **Substrate sampler** (declared in plan.md): internal scanline-parity sampler instead of
   per-cell `voxelizeGlb` — the registered GLBs are ~137–146k triangles; per-cell parity costs
   minutes per subject on every `--repro`. Conventions identical, cross-validated in tests.
2. **Visualization overlay**: orthographic mesh masks drawn by `sketch-plot.mjs` instead of
   `rasterizeSilhouette` (perspective camera cannot align with orthographic panels).
3. **Pitch is profile-read, not normal-read** (the big first-contact finding): the registered
   meshes are stair-stepped at the facet level — flat+vertical micro-steps — so an area vote over
   raw normals reads EVERY pitched roof as "flat" (98–99% of upward area is exactly horizontal).
   `pitchClass` (facet vote) was replaced by `roofProfile`: median-smoothed column tops, eave =
   lower median of boundary-column tops, ridge = max smoothed top, run = ridge band's distance to
   the plan's outer edge (row extents — contiguity walks die on hollow-shell parity holes), tilt =
   atan(rise/run). This is the T-118/T-122 lesson (sampled profile, never vertex apex) applied at
   first contact.
4. **Eave from boundary tops, not layer counts**: some meshes (barn) voxelize as hollow shells
   (double-skin geometry defeats parity), so layer-area heuristics are unreliable; column tops are
   robust to both shell and solid. `eaveAreaFrac` was removed from `SKETCH_PARAMS` (dead constant).
5. **Per-mass pitch**: headline pitch = the PRIMARY mass's profile; each body mass carries its own
   (the church tower's spire must not become "the roof"). Tower and nave read separately.
6. **Substrate pruning**: `pruneStrays` on the sampled occupancy before any measurement (parity
   speckles produced phantom 2-cell "masses" on the barn).
7. **Footprint chaining**: leftmost-turn selection at pinch corners + out-and-back spike removal
   (the gatehouse's 1-cell crenellation columns produced zero-width polygon spikes and, downstream,
   a diagonal edge on the barn); rectilinearity is now asserted — a diagonal can never be recorded.
8. **No preflightPins in the runner**: preflight exists to refuse before metered spend; this chain
   spends nothing, and preflight would block legitimate byte-identical regeneration. Per-file
   `guardedWriteRecord` still rules every record write (fail closed).
9. **One owned pin rotation**: the first-run records were committed, then deviations 3–7 changed
   the derivation; the rewrite was done under `--rotate-pins` inside this owning ticket (c8bec91),
   exactly per the T-119 policy.

## Final per-subject reads (committed records)

| subject | pitch (primary) | symmetry | footprint | body masses |
| --- | --- | --- | --- | --- |
| cottage | pitched45 35.5° | 0.5396 → not applied (genuinely L-shaped) | 8 vertices | 1 (+2 chimney protrusions) |
| gatehouse | pitched45 37.9° | 0.8677 → APPLIED, x axis | 12 vertices (front piers) | 1 (+merlon protrusions) |
| church | pitched45 36.0° (nave) | 0.4161 → not applied (tower offset) | 6 vertices (L) | 3 — nave + tower distinct (+porch) |
| barn | pitched45 45.0° | 0.5518 → not applied | **4 vertices — clean rectangle** | 1 |
