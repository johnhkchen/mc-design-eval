# T-209-01 — Plan: ordered, verifiable steps

Each step is independently committable and verified by `npm test` (PURE — no GL/LLM/IO) plus the
deterministic probe. Real-build fixtures only (the Notes' caution).

## Step 1 — Rewrite `eaveRingClosure` (the metric)

`src/view/wall-generate.mjs`.

- Add `yHi = eaveY > f ? eaveY - 1 : eaveY` and gather two column sets in one pass: `cols` (`floor..yHi`,
  wall plane) and `fullCols` (`floor..eaveY`, for the unchanged fallback).
- Feed `registerRect` and the footprint census from `cols`.
- In the footprint census add the **±1 outward-proud** branch: compute the ring bbox centre once; a ring
  column counts if on-ring / declared-open, else if a cell sits one step outward in x, z, or the diagonal.
- Keep the fallback (`perimeterColumns(fullCols)` + the existing `openCols`-aware `closureOf` reproduction)
  byte-identical.
- Rewrite the doc comment: wall-plane-below-eave census (roof prism base course rationale), the
  ±1-outward-proud tolerance + gap guard, and the registration-rescaling limitation.

**Verify:** `node --test src/view/wall-generate.test.mjs`. Existing WG-CS1–14 should stay green; if a
real-fixture literal (WG-CS10/12, …) shifts beyond ±0.02, note it for Step 2.

**Commit:** `fix(T-209-01): eaveRingClosure censuses the wall plane below the eave + ±1 proud tolerance`.

## Step 2 — Reconcile any shifted existing assertions

Only if Step 1 turned an existing WG-CS assertion red.

- Re-derive the value from the real fixture, update the literal, add a one-line rationale comment ("real
  build under the wall-plane census; was X under the full-band census"). These are diagnostics, not frozen
  pins — updating them is in-scope. Do **not** touch any frozen-instrument or judge pin.
- If a value moved in a way that breaks an *invariant* (e.g. the colonnade crossing 0.9), STOP — that is a
  design failure, not a test update; revisit `design.md` (drop ±1-proud per the documented fallback).

**Verify:** `node --test src/view/wall-generate.test.mjs` green.

**Commit:** folded into Step 1 if same edit session, else `test(T-209-01): reconcile WG-CS literals under
the wall-plane census`.

## Step 3 — Add the four real-build fixtures + integration (WG-CS15–19)

`src/view/wall-generate.test.mjs`, new block.

- Add a PURE test-local `gableRoof(occ)` helper mirroring the runner's apply_gable_roof (lifted from
  `closure-probe.mjs`): keep `y ≤ eaveY`, fit a `gableRecord`, append `generateRoof`. Imports needed:
  `gableRecord`, `generateRoof` from `./roof-generate.mjs`, `roleBlock` from `../recognition/compile.mjs`,
  `occupancyFromCells` (already imported).
- **WG-CS15** colonnade seed `T206_SEED` → `< FORM_READY_CLOSURE`, ≈0.61.
- **WG-CS16** `relief( gable( closeShell(seed) ) )` → `≥ FORM_READY_CLOSURE`, ≈0.96.
- **WG-CS17** extent-preserving mid-face reopen (drop the inner run of one face, keep corners + ≥2 flanks)
  of the gabled closed shell → `< FORM_READY_CLOSURE` (≈0.79); relief over it stays `< FORM_READY_CLOSURE`.
- **WG-CS18** the staged sequence: assert closure is `≥0.9` after close_shell, after gable, AND after
  relief (the 1.000→0.068 collapse is gone), starting from a `<0.9` colonnade seed.
- **WG-CS19** integration: `formReadyGate({tool:"relief_walls", closure: reliefC}).allow === true`, and
  `acceptsBatch(before, after, { closureBefore: cGabled, closureAfter: cRelief }).reason` does **not**
  contain "reopened" (the form-integrity guard does not fire → the +20 batch is not rejected).

**Verify:** `node --test src/view/wall-generate.test.mjs` green; assert the numeric values match the
prototype (`/tmp/final.mjs`: 0.608 / 0.964 / 0.794 / 0.814).

**Commit:** `test(T-209-01): four real-build fixtures + batch-guard integration for relief-tolerant closure`.

## Step 4 — Probe + evidence

`docs/active/work/T-209-01/closure-probe.mjs`.

- Add a probe that prints closure at each stage under the new metric (seed → close → gable → relief),
  showing `0.61 → 1.00 → 1.00 → 0.96` — the collapse gone. Capture its output into `progress.md` / the
  review as the deterministic AC4 witness.

**Verify:** `node docs/active/work/T-209-01/closure-probe.mjs` prints the expected ladder.

**Commit:** `docs(T-209-01): closure probe + evidence — relief no longer collapses the form reading`.

## Step 5 — Full suite + review

- `npm test` (whole repo) green. Confirm frozen instrument / WG-CS invariants intact.
- Write `review.md`: files changed, the research finding (the bug was the coverage fallback + roof flood,
  not the ring census), test coverage, the registration full-face limitation, and the honest note that
  ±1-proud is a guarded margin (eave-exclusion is load-bearing).

## Testing strategy

- **Unit (the contract):** WG-CS15–18 are the four AC fixtures; WG-CS19 proves the two consumers
  (`formReadyGate`, `acceptsBatch`) behave. All on real builds.
- **Regression:** WG-CS1–14 + the full suite guard every prior closure invariant (colonnade open, no-program
  fallback, aperture forgiveness, closeShell agreement).
- **Deterministic integration:** the probe replays the live runner's close→gable→relief sequence offline —
  the AC4 witness without metered spend.
- **No metered climb needed:** the metric change is deterministic and the runner already routes through
  `eaveRingClosure`; the probe + units cover it.

## Rollback

Each step is one commit. The whole change is one function body; reverting Step 1 restores prior behaviour.
If ±1-proud erodes a margin, drop just that branch (documented fallback) — eave-exclusion alone passes.
