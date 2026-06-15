# T-108-01 gable-and-verge-fit — Progress

- [x] Step 1 — `src/form/roof-end-fit.mjs` + tests (commit `ca9e42b`)
- [x] Step 2 — ends-aware generator + tests (`d77b5f4`)
- [x] Step 3 — swap: carve set, ladder, record data + tests (`b27ba7e`)
- [x] Step 4 — runner wiring (in `613a119`/`2e69c21`)
- [x] Step 5 — live evidence cottage + gatehouse (`2e69c21`)
- [x] Step 6 — full verification (`npm test` 1389/0 green; repro/offline re-assert both subjects)

## Deviations from plan (all documented in commit messages)

1. **Anchor is the occupancy, not `wallSlabs`** (structure.md said wall-slab anchor): the record's
   slab is the per-mass DOMINANT plane — wrong for the cottage cross gable's +x end (slab 3, local
   wall ≈ 12). Replaced by the median outermost as-built column in the storey below the band
   (robust, local, no record dependency). `fitGableEnds(gables, occ, mesh, alignment)` —
   occupancy in place of the record param.
2. **Anchor selection window** (added live): GLB cone selections restrict to
   [wall anchor − 1.5, footprint end + 0.5] along the ridge axis — the sanity gate's own bounds
   applied as the selection. Without it, the decimated organic mesh chained every end-facing scrap
   into one mega-cluster (cottage face fitted at 3.9 vs the real 12.5; all 4 ends refused).
   An empty window names a buried interior end (`end-unfitted`).
3. **Verge tip = min(face + GLB differential, GLB surface cell)** (added live): at the building's
   axis extremes the aabb maps the mesh extreme onto the blob's outer face exactly; the
   differential's half-cell rounding overshot the blob bound by one and refused the cottage −z end.
4. **Sheet census declaration** (added live): open-underside sheet courses expose ≥4 faces BY
   DESIGN; `roofBandCensus` gains an `exclude` set (the generator's sheet keys), excluded counts
   reported, never hidden. Without it, after ≈ before (15 vs 16) purely from declared construction.
5. **Sibling integration**: T-110-01 landed a per-component swap loop in `roof-program.mjs`
   (`8c6af38`) mid-ticket — end fit computed once on the whole record, split per component group;
   `composeComponentSwaps` aggregates `fittedEnds`/`endCoords` over accepted components only.

## Live results

- **Cottage** ACCEPTED `end-fitted-voxel-pitch`: 3/4 ends fitted (main lo face −14 tip −16, main
  hi face 13 tip 15, cross hi face 11 tip 12; cross lo refused — buried interior). Protrusions
  16 → 0; IoU improved/held at all 4 azimuths (45°: .9273 → .9307); unmapped 0/10133;
  sha `149de232c80c`, --repro MATCHES, --offline OK.
- **Gatehouse** ACCEPTED `end-fitted-voxel-pitch-gable-ends`: +x end fits with zero delta
  (face=tip=13, rmse 0.001 — already correct as-built; artifact byte-identical `5ffc907ebb7a`);
  −x end refused (roof end inside gable face), hip ends named. Remaining gatehouse gaps are
  S-109 scope (ridge/upper edges).
- 45°/315° before/after renders + `pr/assets/frames/roof-{cottage,gatehouse}-end{45,315}-*.png`
  committed; the 45° after shows constructed gable triangles with clean verges and an
  open-underside overhang in place of the solid blob cliffs.
