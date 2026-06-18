# T-202-01 — Review

**What this ticket did:** made the form-readiness metric `eaveRingClosure` **invariant to proud relief
detail**, so the climb's form-before-detail gate stops turning on a physically-closed build. The E-49
fifth gap (closure 1.000 → 0.068 after `relief_walls`) is closed. Commit `47b7688`.

## Changes

| File | Change |
|------|--------|
| `src/view/wall-generate.mjs` | +`PROUD_TRIM = 0.05`; `eaveRingClosure` now clamps band columns to `robustExtent(cols, {pLo, pHi})` before `closureOf(perimeterColumns(...))`; doc comment states the invariance contract. (+30/−4) |
| `src/view/wall-generate.test.mjs` | WG-CS6/7/8 + imports of `buildWallRelief`, `FORM_READY_CLOSURE`, `PROUD_TRIM`, gatehouse program/pack fixtures. (+72/−1) |
| `docs/active/work/T-202-01/*` | RDSPI artifacts. |

**Mechanism:** the proud quoin tips (depth 2) and plinth (depth 1) stand outside the wall plane; folded
into one bbox they made an oversized, near-empty rectangle. `robustExtent` (already in the module, built
for "outlier posts that overshoot the wall line") trims that thin fringe; clamping to it measures the
dense ring. Reuses the ONE closure authority (`closureOf`) — no third metric.

## Acceptance criteria — all met

- ✅ **Closure measured on the wall plane/footprint, one authority reused.** `eaveRingClosure` clamps to
  the robust footprint then calls the existing `closureOf`. `closeShell` (line 360) inherits the fix;
  the shared `closureOf`, `constructWalls`, and `recessClosureGuard` are untouched.
- ✅ **Unit-tested both ways with T-201 counts.** WG-CS6: real `buildWallRelief` on a closed gatehouse
  ring emits **224 proud quoin cells** (the T-201 count, asserted), the naive band closure craters
  (< 0.2), the wall-plane metric reads **0.9375 ≥ FORM_READY_CLOSURE**. WG-CS7: a dropped straight run
  reads open bare (0.839) and after relief (0.797), strictly below the closed reading.
- ✅ **`formReadyGate` + 0.9 still gate correctly; threshold un-moved.** End-to-end probe: relief build
  closure 0.9375 → `formReadyGate` returns `allow:true` for `band_eave`/`relief_walls`/`carve_arch`
  (T-201 had `allow:false`); a reopened shell (< 0.9) still blocks detail. The 0.9 threshold did **not**
  move — no re-pin, asserted against the same `FORM_READY_CLOSURE` the gate uses.
- ✅ **Recorded honestly.** Yes — relief now preserves a closed reading on the real build (0.9375). No
  threshold re-pin (the closed/open gap is 0.9375 vs ≤0.839).
- ✅ **`npm test` green (2400/2400); frozen instrument untouched.** Only the two source files + work dir
  staged.

## Falsifiable claim — outcome

> A wall-plane closure metric stays high on the real relief build AND reads low on a reopened shell.

Held. Closed ∈ [0.94, 1.0], open ≤ 0.839, threshold 0.9 in the gap. The named failure modes were
checked, not assumed:
- **Over-correction (blind to a real hole):** refuted — WG-CS7 reads the colonnade gap open even after
  relief, because the proud plinth is emitted only in front of existing exterior cells (it mirrors the
  wall's holes). A removed face also reads open (corners hold the bbox → the missing face is an empty
  rectangle edge). Documented in design.md.
- **Wall plane not separable from proud detail:** it is — the fringe is sparse (quoin tips ~1.6% of
  columns) and percentile-trimmable; the plinth/wall faces are full lines never trimmed.
- **Threshold calibration shift:** none — 0.9 held, asserted with a test.

## Test coverage & gaps

- **Covered:** the both-ways claim on the REAL relief geometry (not a mock); the naive-vs-robust split
  (proves the bug *and* the fix in one test); the no-op-on-proud-free-rings guard (WG-CS8 pins the
  existing readings so the trim can't silently bite a wall face).
- **Gap — thin margin (honest):** relief-on-closed reads **0.9375**, only 0.0375 above 0.9. The four
  missing perimeter cells are the plinth ring's corner junctions (a relief artifact, not a hole). For a
  *smaller* footprint this ratio drops; a future subject could read relief-closed below 0.9. Per the AC
  that is a re-pin decision with a failing test, **not** something to absorb by lowering the threshold
  (which would weaken the open-shell reject — the open side is already at 0.839). Flagged for S-205's
  re-climb to watch.
- **Gap — single footprint shape:** tested on the near-square gatehouse (the T-201 subject). An L-plan
  or long-thin mass isn't exercised here; `robustExtent` is per-axis so it should generalize, but
  unverified. Out of this ticket's scope (gatehouse capstone).

## Open concerns / handoff

- **T-203 coupling (recorded, not solved):** T-203 rebuilds the gate aperture WIDE — "open by design."
  The plane metric reads a one-side aperture as a mild closure dip (same as a colonnade). T-203 owns
  reconciling "open by design" vs "open by defect"; this ticket only makes the plane metric read true.
  No code coupling (touched `eaveRingClosure` alone).
- **Parallel sibling:** `src/view/roof-generate.*` + several `docs/active/*` edits in the working tree
  are T-204-01's concurrent roof work — intentionally left unstaged. No shared file with this ticket.
- **No critical issues for human attention.** The fix is localized, reversible, and the binding
  constraint now moves to the geometry hands (T-203 wide arch, T-204 roof) as E-52 intends.
