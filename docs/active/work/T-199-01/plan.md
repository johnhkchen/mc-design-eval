# T-199-01 — Plan

Three atomic commits. The mechanism + its falsification land together logically but are sequenced so
`npm test` is green at every commit boundary. The runner wiring (out of `npm test`) is proven by the
`GUARD_ONLY` smoke.

## Step 1 — Mechanism: `formCredit` + `acceptsRound` clause (`src/workshop/climb-gate.mjs`)

1. Add `export const CLOSURE_GAIN_MARGIN = 0.1;` after `FORM_READY_CLOSURE` with the calibration
   comment (measured gap 0.615→1.000 = +0.385).
2. Add the private `formCredit(...)` helper after `departmentDominant` — guards (1) closure finite,
   (b′) major data present, (2) form gap (`closureBefore < threshold`), (3) gain ≥ margin, (b′) no
   whole-build new major, (c′) targeted net-total guard.
3. Extend `acceptsRound` opts with `closureBefore, closureAfter, closureMargin, formReadyThreshold`
   (all inert defaults).
4. Insert the form clause between the `dom` accept and the regression reject.
5. Update the `acceptsRound` JSDoc.

**Verify:** `npm test` still green (the clause is inert without the new opts; CG1–CG17 unchanged).

## Step 2 — Falsification: `CG-FC1…6` (`src/workshop/climb-gate.test.mjs`)

1. Add `CLOSURE_GAIN_MARGIN` to the import; assert `=== 0.1`.
2. Write the six cases from structure.md:
   - **CG-FC1** KEEP — real T-198 round-1 counts (tie + 0.615→1.0) → accept, `/form-credit/`.
   - **CG-FC2** REJECT — closure↑ but a new major appears → `/regressed/`.
   - **CG-FC3** REJECT — closure↑, no new major, targeted net total grows → reject (net guard).
   - **CG-FC4** REJECT — no real form gain (gain < margin) → falls through to `/no shrink/`.
   - **CG-FC5** inert / backward-compat — no closure opts ⇒ legacy verdict; form-ready ⇒ inert.
   - **CG-FC6** regression-tolerant KEEP — closure↑ + guards hold + score regressed past margin →
     accept.

**Verify:** `node --test src/workshop/climb-gate.test.mjs` — all green; then full `npm test` green.
The KEEP (CG-FC1) and the three REJECTs (CG-FC2/3/4) are the **falsified-both-ways** AC.

## Step 3 — Wiring + smoke (`experiments/eval-alignment/picture-climb.mjs`)

1. Compute `const closureAfter = closureNow(cand);` before the gate call (after the no-op guard).
2. Thread `closureBefore: closure, closureAfter` into the `acceptsRound(...)` opts.
3. Fix the recorded `closureAfter` (was `closureNow(gate.accept ? cand : occ)`) to record the
   candidate's true closure the gate evaluated.
4. Run the wiring smoke:
   `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` — must resolve clean (round-0
   renders + beside sheet, zero spend). This proves imports + the accept-path edit parse and run.

**Verify:** smoke exits 0; `git diff` shows no `measurements/**` change.

## Testing strategy

- **Unit (in `npm test`):** the full keep/reject falsification lives in `climb-gate.test.mjs` — the
  module is pure, so its decisions are tested in isolation (CG-FC1…6). This is the AC's "falsified both
  ways (unit)."
- **Smoke (not in `npm test`):** `GUARD_ONLY` proves the runner wiring (the metered climb itself is
  T-201-01, gated on this + T-200-01 — out of scope here).
- **Regression:** CG1–CG17 must stay green unchanged (the clause is additive + inert by default;
  backward-compat asserted explicitly in CG-FC5).
- **No GL/LLM** on any tested path; the closure scalar is a literal in the fixtures.

## Verification criteria (maps to AC)

| AC | Verified by |
|----|-------------|
| Form-credit clause added (closureOf↑ + no-new-major + net guard; pure, scalar-in, reuses `eaveRingClosure`) | Step 1; structure.md; clause reuses runner-supplied `closureNow`=`eaveRingClosure` |
| Falsified both ways (unit): real T-198 KEEP + bad-move REJECT | CG-FC1 (keep) + CG-FC2/3/4 (reject) |
| Wired into `picture-climb.mjs` accept path; `GUARD_ONLY` smoke resolves | Step 3 |
| Recorded honestly: behaviour change + any leak found/tightened documented | review.md; trajectory `closureAfter` fix documented |
| `npm test` green; `measurements/` untouched; subscription shim only | Steps 1–3 verify; `git diff measurements/` empty |

## Risks / mitigations

- **Guard leak (rubber-stamp).** Mitigated by (b′) whole-build major check + (c′) net guard + the
  explicit REJECT fixtures CG-FC2/3. If a leak is found, tighten and document (E-50 CG15 precedent).
- **Too narrow (still rolls back the real close).** Mitigated by CG-FC1 reproducing the *exact*
  recorded counts; if it fails, the margin/threshold is recalibrated (0.385 headroom gives slack).
- **Recorded `closureAfter` change masking the bug.** Documented in review; the fix makes the
  trajectory honest (records the candidate closure the gate saw), it does not change the kept build.
