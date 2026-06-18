# T-202-01 — Plan

Ordered, independently-verifiable steps. One atomic commit at the end (production + proof are one
unit). Verification numbers are the measured values from the research reconstruction.

## Step 1 — Production: robust-footprint `eaveRingClosure`

- Add `export const PROUD_TRIM = 0.05;` beside the other pures in `src/view/wall-generate.mjs`.
- Rewrite `eaveRingClosure`'s body to clamp band columns to
  `robustExtent(cols, {pLo: PROUD_TRIM, pHi: 1 - PROUD_TRIM})` before `closureOf(perimeterColumns(...))`
  (see structure.md for the exact body).
- Update the function's doc comment to state the proud-detail invariance contract.
- **Verify:** module still parses; no new imports (`robustExtent`/`closureOf`/`perimeterColumns` are
  above it). `node -e` probe on the reconstructed fixtures:
  - bare closed 15×15 ring → `1.0`
  - real `buildWallRelief` on that ring → `≥ 0.9` (expect 0.9375)
  - bare colonnade (9-col gap) → `< 0.9` (expect 0.839)
  - relief on the colonnade → `< 0.9` (expect 0.797)

## Step 2 — Tests: both-ways + no-regression

Add WG-CS6/7/8 to `src/view/wall-generate.test.mjs` (imports: `buildWallRelief` from
`./wall-relief.mjs`, `FORM_READY_CLOSURE` from `../workshop/climb-gate.mjs`, `PROUD_TRIM`, and the
pack/program JSON fixtures read with `readFileSync`).

- **WG-CS6 (high leg):** closed 15×15 ring, eave 18 → `buildWallRelief(occ, {program, pack, floor:0,
  eaveY:18})`.
  - assert proud quoins emitted: `report.byLayer.corners.placed === 224` (the T-201 count; provenance
    pinned).
  - assert the NAIVE measure craters: `closureOf(perimeterColumns(bandCols(out))) < 0.2`.
  - assert the FIX holds: `eaveRingClosure(out, {floor:0, eaveY:18}) >= FORM_READY_CLOSURE`.
- **WG-CS7 (low leg / over-correction guard):** same ring with a dropped straight run on one face.
  - bare: `eaveRingClosure(openOcc, …) < FORM_READY_CLOSURE`.
  - after `buildWallRelief`: `eaveRingClosure(reliefOpen, …) < FORM_READY_CLOSURE` AND
    `< eaveRingClosure(closedRelief, …)` (proud detail did not mask the hole).
- **WG-CS8 (no-regression):** the existing small fixtures read byte-identical:
  `eaveRingClosure(clean7) === 1`, `eaveRingClosure(gappy7) ≈ 0.7917`,
  `eaveRingClosure(clean11) === 1` (the trim is a no-op without a proud fringe).
- **Verify:** `node --test src/view/wall-generate.test.mjs` green.

## Step 3 — Full suite + frozen-instrument check

- `npm test` — whole suite green (the existing WG-CS1/2/3, WG9/11/11b/12/13 must stay green,
  confirming `closeShell`'s internal `eaveRingClosure` still reports 1 on a clean closed ring and the
  shared `closureOf` is untouched).
- Confirm no frozen-instrument or pinned-record file changed (`git status` shows only
  `src/view/wall-generate.mjs` + `src/view/wall-generate.test.mjs`).

## Step 4 — End-to-end probe (no production change)

- Run a closure probe through the REAL runner path to confirm the gate now reads the relief build as
  form-ready: build the gatehouse seed → close_shell → relief_walls, print `eaveRingClosure` +
  `formReadyGate({tool:"band_eave", closure})`. Expect `allow:true` where T-201 had `allow:false`.
- This is the live proof the climb's gate no longer sabotages a detail pass. Record the before/after
  numbers in progress.md / review.md. No code edit — `picture-climb.mjs` consumes `eaveRingClosure`
  unchanged.

## Step 5 — Commit

One commit: `fix(T-202-01): form-readiness closure measured on the wall plane (invariant to proud
relief)`. Body notes the 1.000→0.068 crater, the robust-footprint clamp, the both-ways tests, and that
the 0.9 threshold held (no re-pin).

## Testing strategy

- **Unit (deterministic, on-disk fixtures):** WG-CS6/7/8 — the both-ways falsifiable claim + the
  no-regression guard. Real relief geometry (224 quoins), no GL.
- **Regression:** the untouched WG-CS/WG suites prove `closureOf` and the small-ring behavior are
  byte-stable.
- **Integration probe:** Step 4 confirms the scalar the gate consumes flips from blocked→eligible on
  the real build.

## Risks & mitigations

- **Trim bites a real wall on an odd footprint** → mitigated by the (fringe% < 0.05 < side%) window
  (design.md); WG-CS8 pins the no-op on proud-free rings.
- **Threshold margin thin (0.9375 vs 0.9)** → real, recorded as a residual; the closed/open gap
  (0.9375 vs ≤0.839) is wide, so 0.9 is not a knife-edge. Do NOT lower the threshold (would weaken the
  open-shell reject). If a future footprint reads relief-closed < 0.9, that is a re-pin decision with a
  failing test, per the AC — not silently absorbed.
- **Test coupling to pack/program JSON** → acceptable (committed fixtures; other tests read disk).
