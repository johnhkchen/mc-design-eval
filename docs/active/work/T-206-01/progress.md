# T-206-01 Progress

## Status: implementation complete, all gates green

## What landed (per the plan)

**Step 1–3 — `src/view/wall-generate.mjs` (COMMIT 1):**
- `eaveRingClosure` now takes optional `program` + `coverageFloor = 0.5`. When the program is supplied
  and registration is trusted (`coverage ≥ coverageFloor`), it measures closure on the **registered
  program footprint** (`registerRect.ring`): `present / ring.size`, where a ring column is present iff a
  wall band cell backs it OR it is a declared-open `openCols` column. Proud-of-footprint cells are off
  the ring → ignored. `ambiguous` is ignored (square ring is axis-swap-invariant).
- The T-202 `robustExtent`/`PROUD_TRIM` clamp is **removed** from `eaveRingClosure`. The no-program /
  below-trust path falls back to the raw band-perimeter `closureOf` (+ the unchanged closure-except-
  aperture branch) — byte-identical to today on proud-free rings (the clamp was a documented no-op).
- `export const PROUD_TRIM` deleted (no other importer).
- `closeShell` now reports `closureBefore`/`closureAfter` **through** `eaveRingClosure` with its program
  → the gate and the hand read the same number. Its decision path (`coverage ≥ coverageFloor`) is
  untouched.

**Step 4–5 — `src/view/wall-generate.test.mjs` (COMMIT 1):**
- Dropped `PROUD_TRIM` from the import; added `formReadyGate` + `artifactOccupancy`.
- WG-CS6/CS7 now pass `program: T202_PROGRAM` (exercise the real footprint metric); the naive-craters
  assertion is kept (it is *why* the footprint path exists).
- WG-CS8 retitled; the `PROUD_TRIM`-range assertion removed; proud-free no-op readings preserved.
- Added WG-CS10 (seed 0.608 <0.9), WG-CS11 (closed+relief 0.9375 ≥0.9), WG-CS12 (reopened 0.839 <0.9),
  WG-CS13 (agreement: seed reading === `closeShell.closureBefore`), WG-CS14 (gate fires correctly).
- `npm test` → **2416/2416 green** (was 2411; +5).

**Step 6 — `experiments/eval-alignment/picture-climb.mjs` (COMMIT 2):**
- `closureNow` and the candidate `closureAfter` now pass `program: PROGRAM` → the live gate reads the
  footprint metric. Comment updated (footprint, supersedes T-202). REBUILD_ARCH_PROBE evidence calls
  also thread `program` for runner-true diagnostics. `node --check` clean (runner is not in the test
  glob; a full metered climb is S-208, not this ticket).

**Step 7 — `docs/active/work/T-206-01/footprint-evidence.mjs` (COMMIT 2):**
- Zero-spend, real-subject probe. Asserts all five conjuncts of the falsifiable claim and exits 0.

## Validated readings (the falsifiable claim, run not asserted)

```
(1) colonnade seed   OLD clamp 0.9796 (the bug)  →  NEW footprint 0.6078  OPEN  ✓
(2) closed + relief  (224 quoins + 60 plinth)        footprint 0.9375  FORM-READY  ✓
(3) reopened (9-col)                                 footprint 0.8393  OPEN  ✓
(4) agreement        eaveRingClosure(seed)=0.6078 === closeShell.closureBefore=0.6078  ✓
(5) gate             relief BLOCK@0.608, close_shell ALLOW@0.608, relief ALLOW@0.938  ✓
```

## Deviations from the plan

- None material. The closed+relief reading is **0.9375**, not 1.000 — a *mild* proud-coupling residual
  (the proud fringe nudges `registerRect`'s robust extent ~1 cell at corners). It clears 0.9 with
  margin; named in design.md and review.md, **not** force-corrected (would re-introduce a clamp).
- The old T-197 evidence probe (`closeshell-evidence.mjs`) calls `eaveRingClosure` without a program;
  its `before` now reads the raw fallback (0.6154) rather than the footprint (0.6078). Both read OPEN —
  the probe's gate logic still passes. Left as-is (a historical artifact); the T-206 probe is the
  current evidence. Flagged in review.

## Acceptance criteria — all met

- [x] closure on the absolute program footprint; clamp removed; one `closureOf` authority, no third metric
- [x] unit-tested on three real fixtures (0.608 / 0.9375 / 0.839)
- [x] agreement asserted (seed reading === `closeShell.closureBefore`)
- [x] `formReadyGate` + 0.9 gate correctly on the new metric
- [x] recorded honestly; `npm test` green; closeShell/constructWalls/recessClosureGuard preserved;
      frozen instrument untouched (`git status` shows nothing under `measurements/`)
