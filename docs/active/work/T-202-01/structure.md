# T-202-01 — Structure

The blueprint. One production file modified, one test file extended. No new modules, no deletions, no
schema or frozen-instrument changes.

## Files

### MODIFIED — `src/view/wall-generate.mjs`

**1. Add a named trim constant** (near the top, beside the other pures):

```js
/** Percentile to trim a thin PROUD detail fringe (relief quoins/plinth stand 1–2 cells outside the
 *  wall plane) before measuring closure. Lands inside (fringe% ≈ 2, full-side% ≈ 25) on every realistic
 *  footprint, so it peels the sparse fringe but never a wall face. T-202-01 (S-202, E-52). */
export const PROUD_TRIM = 0.05;
```

**2. Rewrite the body of `eaveRingClosure`** (line ~275) — same signature, same band collection, one
new step: clamp `cols` to the robust footprint before `closureOf`.

```js
export function eaveRingClosure(occ, { floor, eaveY } = {}) {
  if (!occ?.bounds) return 0;
  if (eaveY === undefined) throw new Error("eaveRingClosure: eaveY required");
  const f = floor ?? occ.bounds.min[1];
  const cols = new Set();
  for (const k of occ.cells.keys()) {
    const [x, y, z] = k.split(",").map(Number);
    if (y < f || y > eaveY) continue;
    cols.add(`${x},${z}`);
  }
  if (cols.size === 0) return 0;
  // T-202-01: measure closure on the WALL PLANE, not the proud-inflated bbox. relief's sparse quoin
  // tips (depth 2) + plinth (depth 1) stand OUTSIDE the wall plane and, left in, make bboxOf the band
  // columns an oversized near-empty rectangle (closure 1.000 → 0.068 on the T-201 gatehouse). robustExtent
  // trims that thin outlier fringe; clamping the band columns to it before closureOf (the ONE closure
  // authority) measures the dense ring. A real reopening (colonnade gap / removed face) still reads low —
  // the proud plinth mirrors the wall's holes, and corners hold the bbox so a missing face stays visible.
  const ext = robustExtent(cols, { pLo: PROUD_TRIM, pHi: 1 - PROUD_TRIM });
  const footprint = new Set();
  for (const c of cols) {
    const [x, z] = c.split(",").map(Number);
    if (x >= ext.x0 && x <= ext.x1 && z >= ext.z0 && z <= ext.z1) footprint.add(c);
  }
  return closureOf(perimeterColumns(footprint));
}
```

- `robustExtent`, `closureOf`, `perimeterColumns` are all already defined ABOVE this function in the
  same module — no new imports, no ordering change.
- The doc comment above `eaveRingClosure` (lines 266–274) is updated: keep the "ONE closure
  definition the close-the-shell hand reports AND the gate consumes" line; add the proud-detail
  invariance sentence so the contract is explicit.
- `robustExtent` on a degenerate (single column / tiny) set returns the raw extremes → footprint =
  cols → identical to today. The empty-band guard (`return 0`) is unchanged.

**No other change to this file.** `closeShell` (line 360) calls `eaveRingClosure` and inherits the fix
for free; its line-324 `closureBefore` reads the pre-relief colonnade input (no proud detail) so it is
unaffected. The shared `closureOf` and `constructWalls` are untouched.

### MODIFIED — `src/view/wall-generate.test.mjs`

Add a new section after the T-197 `WG-CS*` block (after line 342). Import `buildWallRelief` (the real
`relief_walls` hand) + `roleBlock`/pack/program fixtures so the test exercises the **real T-201 relief
geometry**, plus `PROUD_TRIM`. New tests:

- **WG-CS6 — relief on a closed shell stays form-ready (the bug, fixed).** Closed 15×15 ring (eave 18)
  → `buildWallRelief` (asserts ~224 proud quoin cells emitted, the T-201 count) → assert the NAIVE
  measure `closureOf(perimeterColumns(allBandCols))` < 0.2 (proves proud detail craters a flat
  measure) AND `eaveRingClosure(...) ≥ FORM_READY_CLOSURE` (0.9). This is the both-ways "high" leg.
- **WG-CS7 — a genuinely reopened shell still reads open.** Same footprint with a straight-run gap
  (colonnade), bare AND after `buildWallRelief`: both `eaveRingClosure < FORM_READY_CLOSURE` and
  strictly below the WG-CS6 closed reading. The both-ways "low" leg — the over-correction guard.
- **WG-CS8 — robust trim is a no-op on proud-free rings (no regression).** Assert `eaveRingClosure`
  on the existing clean/gappy small rings is byte-identical to the documented values (clean 7×7 = 1,
  gappy = 0.7917, clean 11×11 = 1) so the percentile never bites a real wall face.

`FORM_READY_CLOSURE` is imported from `../workshop/climb-gate.mjs` to assert against the SAME 0.9 the
gate uses (no magic number in the test) — proving the threshold need not move.

## Ordering

1. Add `PROUD_TRIM` + rewrite `eaveRingClosure` (production).
2. Add WG-CS6/7/8 (tests).
3. `npm test` green; then `node` the picture-climb GUARD_ONLY smoke / a closure probe to confirm the
   real relief build now reports form-ready.

All in one atomic commit (production + tests move together; the metric and its proof are one unit).

## Out of scope (named)

- `closureOf` and `constructWalls` (shared; unchanged).
- climb-gate thresholds (`FORM_READY_CLOSURE`, `CLOSURE_GAIN_MARGIN`) — consumed as scalars, not
  moved (relief-closed 0.9375 ≥ 0.9).
- The runner `picture-climb.mjs` — it already computes closure via `eaveRingClosure`; the fix flows
  through with no edit. (A probe confirms, no production change.)
- T-203 aperture "open by design" reconciliation (separate ticket; coupling recorded in design.md).
