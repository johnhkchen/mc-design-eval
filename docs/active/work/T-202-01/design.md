# T-202-01 — Design

**Decision:** make `eaveRingClosure` measure closure on a **robust wall-plane footprint** — clamp the
band columns to a percentile-trimmed extent (`robustExtent`) before handing them to `closureOf`. One
metric, one closure authority, threshold unchanged. Verified numerically against the REAL relief
geometry before writing a line of production code.

## Options considered

### A. Robust-footprint clamp (CHOSEN)
Compute `robustExtent(bandCols, {pLo, pHi})` (the existing per-axis percentile bbox), drop the columns
outside it (the sparse proud fringe), then `closureOf(perimeterColumns(footprintCols))`. The robust
extent trims the depth-2 quoin TIPS (2 cols/side, a few % of the perimeter) but keeps the full plinth
side (a full side ~25% of the perimeter is never trimmed). Closure is then measured on the
plinth-level rectangle, which is a complete proud ring.

**Measured (15×15 ring, eave 18, real `buildWallRelief`, 224 quoins + 60 plinth):**

| build | naive `closureOf(perim(allCols))` | robust clamp (CHOSEN) |
|------|---:|---:|
| bare closed ring | 1.000 | **1.000** |
| **relief on closed** | 0.111 (the bug) | **0.9375** ✓ ≥ 0.9 |
| bare reopened (9-col straight-run gap) | 0.839 | **0.839** ✓ < 0.9 |
| **relief on reopened** | 0.111 | **0.797** ✓ < 0.9 |

Clean separation: closed ∈ [0.94, 1.0], open ≤ 0.839, threshold 0.9 sits in the gap. The proud detail
does NOT mask a real hole because the plinth is emitted only in front of existing exterior cells, so a
colonnade gap appears in the plinth ring too. Backward-compatible: small rings (WG-CS fixtures) have
their extreme faces as full lines, so `robustExtent` returns the raw bbox → byte-identical.

**Why it satisfies the AC:** reuses `closureOf` (the ONE authority) + `robustExtent`/`perimeterColumns`
(existing) — no third metric; threshold 0.9 holds (relief-closed 0.9375 ≥ 0.9, no re-pin); reads true
both ways.

### B. Height-filter to full-height columns — REJECTED
Keep only columns occupied floor→eave (drop the floor-only plinth). **Fails:** the quoins ARE
full-height (run = floor→eave), so they survive and still inflate the bbox. Measured:
`closureOf(perim(fullHeightCols))` = **0.125** — does NOT fix it. The discriminator is plan density,
not column height.

### C. Morphological erosion of the proud skin — REJECTED
Erode the band column set by 1 to peel the 1-cell-proud fringe. **Fails:** a closed shell's band
columns are a 1-wide hollow ring; eroding by 1 deletes the whole ring → 0. Erosion is wrong for hollow
shells.

### D. Aggressive percentile trim only (no clamp, just shrink bbox) — REJECTED as framed
`robustExtent` already gives the right bbox, but `closureOf` recomputes its own bbox from whatever ring
it is handed. Passing `perimeterColumns(allCols)` would re-derive the inflated bbox. The clamp (drop
columns outside the robust extent FIRST) is the necessary step; A is D done correctly.

### E. Tolerance-based presence (count a perimeter cell present within Manhattan tol=1) — REJECTED
Would lift relief-closed toward 1.0 (more margin) but introduces a SIZE knob and risks masking a
2-wide hole — the over-correction the ticket warns against. `closureOf` uses exact membership (tol 0);
staying faithful to the one authority keeps the metric honest. 0.9375 already clears 0.9.

## The trim parameter

`PROUD_TRIM = 0.05` (symmetric: `pLo = 0.05`, `pHi = 0.95`).

- The proud fringe (quoin tips) is ~1.6% of band columns; a full wall side is ~25%. Any trim in
  **(fringe%, 25%)** lands on the plinth line. `robustExtent`'s `at(arr, p)` = `arr[round(p·(n−1))]`;
  for the relief build (n=124) every `p ∈ [0.02, 0.12]` returns the plinth-level bbox [-1,15]. 0.05 is
  centered in that window — robust, not a knife-edge (the falsifiable "shifts calibration" guard).
- On small rings the percentile rounds to index 0 (raw extremes are multi-column full sides), so the
  trim is a **no-op** → existing fixtures unchanged. Confirmed: WG-CS1 clean 7×7 → 1, gappy → 0.7917,
  WG-CS3 clean 11×11 → 1 (all identical to today).

## Over-correction analysis (the falsifiable claim, answered)

The metric reads a reopening LOW in every realistic shape:
- **Colonnade gap** (straight run dropped): bbox unchanged (corners hold the extent) → the gap shows
  as missing perimeter cells → low. Measured 0.839 (bare), 0.797 (relief'd).
- **Whole face removed**: the two perpendicular walls keep their corners, so the bbox is unchanged;
  the removed face is an empty rectangle edge → low (≈ 3/4 sides present).
- The only way to read closed is to remove a face AND its corners AND shrink to a smaller COMPLETE
  rectangle — that is a smaller building, not a reopened shell. Out of scope, documented.

## Coupling watch (T-203, recorded not solved)

T-203 rebuilds the gate aperture WIDE; the declared gate is "open by design," so the plane metric must
not read the intentional aperture as a hole. This is a one-side door opening (a partial gap on one
face), which the metric reads as a mild closure dip — the same as today's colonnade reading. T-203
owns reconciling "open by design" vs "open by defect"; T-202 only makes the plane metric read true.
No code coupling: this ticket touches `eaveRingClosure` alone.

## Decision

Implement **A**: clamp band columns to `robustExtent(cols, {pLo: PROUD_TRIM, pHi: 1−PROUD_TRIM})`,
then `closureOf(perimeterColumns(footprint))`. Threshold stays 0.9. Tests both ways via the real
`buildWallRelief` geometry (224 quoins) + reopened variants. `closeShell`/`constructHistogram` and the
shared `closureOf` are untouched.
