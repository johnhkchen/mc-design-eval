# T-202-01 — Progress

## Status: implementation complete, all tests green, committed.

## Done (in plan order)

- **Step 1 — production.** `src/view/wall-generate.mjs`: added `export const PROUD_TRIM = 0.05`;
  rewrote `eaveRingClosure` to clamp band columns to `robustExtent(cols, {pLo: PROUD_TRIM, pHi: 1 −
  PROUD_TRIM})` before `closureOf(perimeterColumns(footprint))`. Updated the doc comment with the
  proud-detail invariance contract. No new imports (the three pures are above it); `closeShell` and the
  shared `closureOf` untouched.
- **Step 2 — tests.** `src/view/wall-generate.test.mjs`: imports `buildWallRelief`,
  `FORM_READY_CLOSURE`, `PROUD_TRIM` + the gatehouse program/pack fixtures. Added:
  - **WG-CS6** (high leg) — real `buildWallRelief` on a closed 15×15 ring: asserts the T-201 quoin
    count (224), that the NAIVE band closure craters (< 0.2), and that `eaveRingClosure ≥
    FORM_READY_CLOSURE`.
  - **WG-CS7** (low leg / over-correction guard) — a dropped straight run reads open bare AND after
    relief, and strictly below the closed reading.
  - **WG-CS8** (no-regression) — the trim is a no-op on proud-free rings (clean 7×7 = 1, gappy ≈
    0.7917, clean 11×11 = 1).
- **Step 3 — suite.** `npm test` → **2400/2400 green** (was 2397 before; +3 new). The untouched
  WG-CS1/2/3 + WG9/11/11b/12/13 stayed green → `closeShell`'s internal closure still reads 1 on a
  clean shell and the shared `closureOf` is byte-stable.
- **Step 4 — end-to-end probe.** Built the gatehouse-sized closed ring → real `buildWallRelief` →
  `eaveRingClosure` = **0.9375**; `formReadyGate` now returns `allow:true` for `band_eave`,
  `relief_walls`, `carve_arch` (T-201 had `allow:false`). The climb's gate no longer turns on the
  build. No production change to `picture-climb.mjs` — it consumes `eaveRingClosure` unchanged.
- **Step 5 — commit.** One atomic commit: `src/view/wall-generate.mjs` +
  `src/view/wall-generate.test.mjs` + this work dir.

## Measured results (vs the falsifiable claim)

| build | naive closure (pre-fix) | wall-plane closure (fix) | gate |
|------|---:|---:|:--|
| bare closed 15×15 | 1.000 | 1.000 | ready |
| **relief on closed** | 0.111 | **0.9375** | **ready** ✓ |
| bare reopened (9-col gap) | 0.839 | 0.839 | open ✓ |
| relief on reopened | 0.111 | 0.797 | open ✓ |

Closed ∈ [0.94, 1.0], open ≤ 0.839 — the 0.9 threshold sits in the gap, **un-moved** (no re-pin).

## Deviations from plan

None. The design held exactly as the pre-implementation reconstruction predicted.

## Provenance note

T-201's real `relief_walls` cratered closure to 0.068; the synthetic gatehouse ring here craters to
0.111 (same mechanism, slightly larger footprint/plinth). The proud quoin count (224) matches T-201
exactly — same `quoin` brush (headerDepth 2, run = eave−floor+1, 4 corners).

## Scope NOT touched (parallel siblings)

`src/view/roof-generate.*` and several `docs/active/*` files are T-204-01's concurrent roof work
(depends only on T-201). Left unstaged — committed only my two source files + work dir.
