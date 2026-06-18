# T-199-01 — Progress

## Status: COMPLETE — all steps done, one atomic commit (`0037151`)

### Step 1 — Mechanism (`src/workshop/climb-gate.mjs`) — DONE
- Added `export const CLOSURE_GAIN_MARGIN = 0.1` (calibrated vs the measured 0.615→1.000 gap).
- Added private `formCredit(...)` helper — form-analog of `departmentDominant`. Guards: (1) closure
  finite, (b′) major data present, (2) form gap (`closureBefore < 0.9`), (3) gain ≥ margin, (b′) no
  new whole-build major, (c′) targeted net-total guard.
- Extended `acceptsRound` opts (`closureBefore/After`, `closureMargin`, `formReadyThreshold`) — all
  inert by default — and inserted the form clause between the department override and the regression
  reject. JSDoc updated.

### Step 2 — Falsification (`src/workshop/climb-gate.test.mjs`) — DONE
- Imported + asserted `CLOSURE_GAIN_MARGIN === 0.1`.
- Six `CG-FC` cases: CG-FC1 KEEP (real T-198 counts), CG-FC2 REJECT (adds a major), CG-FC3 REJECT
  (net guard), CG-FC4 REJECT (no real gain), CG-FC5 inert/backward-compat, CG-FC6 regression-tolerant
  KEEP. `node --test src/workshop/climb-gate.test.mjs` → 30/30 green.

### Step 3 — Wiring + smoke (`experiments/eval-alignment/picture-climb.mjs`) — DONE
- Compute `closureAfter = closureNow(cand)` before the gate; thread `closureBefore: closure,
  closureAfter` into `acceptsRound`.
- Fixed the recorded `closureAfter` (was `closureNow(gate.accept ? cand : occ)` → recorded the
  rolled-back `occ`; now records the candidate closure the gate actually evaluated).
- `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` → exit 0, clean.

## Verification
- `npm test` → **2383/2383 green** (was 2377; +6 form-credit cases).
- `git status --porcelain measurements/` → empty (frozen instrument untouched).
- Changes confined to two `src/workshop` files + the runner; subscription shim only.

## Deviations from plan
- None substantive. The plan allowed up to three commits sequenced for green-at-each-boundary; since
  the clause is inert by default, mechanism + tests + wiring were committed together as one atomic
  commit with `npm test` green — no intermediate red state to guard against.

## Note on the live keep/reject (honest recording — AC4)
The unit falsification reproduces the real T-198 counts and proves the gate now KEEPS them; the
end-to-end metered proof (does the live climb actually leave the colonnade?) is **T-201-01**, which
depends on this + T-200-01 and is explicitly out of scope here. No guard leak was found during
implementation; the (b′) whole-build major check + (c′) net guard are the documented tightening over
the department override's targeted-only checks (E-50 CG15 precedent).
