# T-199-01 — Review

## What changed

The accept-gate now credits a **form-readiness win** the noisy picture critique under-rates — the
form-analog of the E-50 department-dominant override, the spine of E-49.

### `src/workshop/climb-gate.mjs`
- **`CLOSURE_GAIN_MARGIN = 0.1`** (new export) — the minimum closure rise that counts as a form win.
  Calibrated against the measured gatehouse gap (seed 0.615 → closed 1.000 = +0.385), so 0.1 is robust,
  not a knife-edge.
- **`formCredit(...)`** (new, module-private, pure) — returns `{gain, closureAfter}` (→ accept) iff:
  (1) closure evidence finite; (b′) major maps present (fail-safe); (2) a form gap remains
  (`closureBefore < 0.9`); (3) `closureAfter − closureBefore ≥ closureMargin`; (b′) **no new department
  major anywhere (whole-build)**; (c′) **no targeted dept's total burden rose** (E-50 net guard). Inert
  (`null`) without closure or major data.
- **`acceptsRound`** — four new inert-by-default opts (`closureBefore/After`, `closureMargin`,
  `formReadyThreshold`); the form clause is consulted **after** the department override and **before**
  the regression reject, so it keeps a form hand on a tie *or* a regression. JSDoc updated.

### `src/workshop/climb-gate.test.mjs`
- Six `CG-FC` cases (import + assert `CLOSURE_GAIN_MARGIN`). Falsified both ways.

### `experiments/eval-alignment/picture-climb.mjs` (not in `npm test`)
- Computes the candidate's closure **before** the gate and threads `closureBefore/After` into
  `acceptsRound`.
- **Bug fix:** the recorded `closureAfter` was `closureNow(gate.accept ? cand : occ)` — on a rollback it
  recorded the *reverted* build (0.615), so the trajectory falsely showed close_shell as a no-op on
  closure. It now records the candidate closure the gate actually evaluated (the honest 0.615→1.000).

## Test coverage

`node --test src/workshop/climb-gate.test.mjs` → **30/30**. Full `npm test` → **2383/2383** (was 2377).

| Case | Asserts | Maps to AC |
|------|---------|-----------|
| CG-FC1 | KEEP the real T-198 round-1 counts (tie 16→16, closure 0.615→1.000, no new major, net flat) | "KEEP test reproducing the real T-198 close_shell counts" |
| CG-FC2 | REJECT a closing move that adds a major (flood/roof regress) → `regressed` | "REJECT a flood/regress/new-major move" |
| CG-FC3 | REJECT on the net guard (targeted WALL total 1→3) → `no shrink` | net-minor guard (E-50 CG15 analog) |
| CG-FC4 | REJECT a trivial closure wobble (gain 0.005 < margin) → `no shrink` | "not too broad / not closure-maximizing" |
| CG-FC5 | inert without closure data; inert once form already ready (≥0.9) | backward compat |
| CG-FC6 | KEEP a real close even on a past-margin score regression | "even at a tie or regression" |

The three guards are each exercised by a dedicated reject (CG-FC2 b′, CG-FC3 c′, CG-FC4 gain), and the
keep is the *exact* recorded fixture — this is the AC's "falsified both ways (unit)."

## Falsification result (anti-hedge)

The clause **keeps** the real T-198 tie (CG-FC1) and **rejects** all three bad-move shapes
(CG-FC2/3/4). It is **not** a no-op (CG-FC1 inverts the old `tie (0): no shrink` rollback) and **not** a
rubber-stamp (the whole-build no-new-major guard is stricter than the department override's
targeted-only check precisely so a form move cannot break the roof/interior). No guard leak was found;
if S-200's signal work ever exposes one, the precedent (E-50 CG15) is to tighten the net/major guard and
document it.

## Open concerns / limitations

1. **End-to-end proof is deferred — by design.** This ticket is the *mechanism + unit falsification*,
   one stage. Whether the live metered climb actually leaves the colonnade with this clause is
   **T-201-01** (depends on this + T-200-01). The unit fixture reproduces the recorded counts, but the
   live judge is noisy; T-201 is where the keep/reject is observed in the wild (AC4's "does the clause
   change the live keep/reject as intended?" is answered there, not here).
2. **Glance-defensibility is asserted structurally, not visually.** The clause is form-AND-glance-
   defensible by construction (closure↑ is the form win; "no new major anywhere" is the glance guard —
   the judge did not call the closed build worse on any department). It does not *render* and look; the
   beside-render confirmation rides T-201's metered run. The ticket's "closure↑ the glance calls worse"
   failure mode is guarded by (b′), not by a pixel check here.
3. **`CLOSURE_GAIN_MARGIN = 0.1` is single-point-calibrated** (one subject's measured gap). It has wide
   headroom (0.385) for the gatehouse; a different subject with a smaller real close could need
   re-calibration. The runner is positioned to report the observed gain beside the constant (as it does
   for `margin`), so drift would be visible.

## Handoff

Self-contained and green. The frozen instrument (`measurements/`) is untouched; only the subscription
shim path is used (runner not in `npm test`). Next in the E-49 chain: **T-200-01** (signal work) →
**T-201-01** (the metered re-climb that proves this end-to-end).
