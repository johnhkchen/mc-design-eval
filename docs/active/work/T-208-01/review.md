# T-208-01 Review — the score-0 cold-start escape: mechanism proven, residual named

**One line:** the cold-start batch escape **works** — detail hands compound off the score-0 floor and the build
**leaves 0** (re-climb 1 `0→12`; re-climb 2 batch read **+20**) without rubber-stamping a bad compound — but the
build cannot **sustain/reach the full picture** because a pre-existing **closure-metric ↔ proud-relief
incompatibility** makes the form-integrity guard reject the dressed batch. The blocker is the measurement
(`eaveRingClosure`), not the gate. Residual named at full strength with deterministic evidence.

## Contingency resolved (AC #1)

T-207's metered re-climb (on the T-206-corrected form) stalled **`0→0→0→0→0→0`** on a **genuinely-closed** form
(closure 0.608→1.000, stayed 1.000), rolling back a clean wide arch and a roof recolor as `tie (0): no shrink`.
That is branch 2 — a stall at 0 on a closed form — so the S-208 detail-credit gap is a **real, independent
finding**, not a form artifact. → **Real work, not a no-op.** (Evidence: `../T-207-01/{climb.log,trajectory.json}`.)

## What changed

| File | Change |
|---|---|
| `src/workshop/climb-gate.mjs` | **+`BATCH_DEFAULTS`, `coldStartFloor`, `acceptsBatch`** (pure). `acceptsBatch` keeps a COMPOUND of N stacked detail moves vs the pre-batch build; guards: (0) form-integrity (reject if it reopened a closed shell), (3) regressed, (2) added-major (rubber-stamp guard), (1a) off-the-floor gain, (1b) department-dominant, else reject-the-tie. |
| `src/workshop/climb-gate.test.mjs` | **+CG-B1..B8, CG-coldStart1..3** (11 cases). CG-B2 (added-major) + CG-B8 (reopened-form) are the AC falsification; CG-B4 proves no rubber-stamp at a tie. |
| `experiments/eval-alignment/picture-climb.mjs` | **+batch sub-loop** (opt-in `CLIMB_BATCH_SIZE`, default 0 = OFF), gated to `coldStartFloor`. Stacks ≤ `BATCH_SIZE` detail picks as a pure occ-chain, scores the compound once, keep-all/roll-back-all via `acceptsBatch`. Excludes wall-shell form moves from the batch; promotes rebuild aperture cols only on accept; passes `closureBefore/closureAfter` to the guard. |
| `docs/active/work/T-208-01/` | research/design/structure/plan/progress/review + `closure-probe.mjs` (deterministic root-cause probe) + saved re-climb evidence (`*-reclimb1.*`, `trajectory.json`, `climb.log`) + `beside-{first,batch-rollback}.png`. |

Commits: `cd66459` (decision+tests), `5a59708` (runner wiring), + the form-integrity fix commit, + this docs commit.

## Test coverage

- **Unit (in `npm test`, deterministic — the binding evidence):** `climb-gate.test.mjs` 48/48; full suite
  **2427/2427 green**. The AC falsification is unit-tested, not left to the metered run: **CG-B2** rejects an
  added-major compound, **CG-B8** rejects a reopened-form compound, **CG-B4** rejects a tie (no rubber-stamp).
- **Live (evidence, not a unit test):** two metered re-climbs (subscription shim, both exited 0 under the T-198
  guard) + one zero-spend deterministic probe. The runner stays out of `npm test` (metered), as for T-205/T-207.
- **Gap:** the runner batch sub-loop itself is not unit-tested (it is I/O + metered, by repo convention). Its
  *decision* is fully unit-tested; its *stacking/rollback* is exercised by the two live re-climbs. The batch
  trajectory entry attributes departments to the representative (last) pick; the full set is in `batch.picks`
  (a known, documented inventory approximation for batch rounds).

## The verdict against the falsifiable claim (anti-hedge — led with how it could fail)

- ✅ **"leaves 0 … detail compounds off a score-0 cold start":** PROVEN. re-climb 1 `0→12` kept; re-climb 2 the
  compound **read +20**. T-207's per-move control could not move off 0 at all. The batch supplies the gradient
  several reads make together that no single move could.
- ✅ **"must reject a deliberately-bad compound (no rubber-stamp)":** holds. CG-B2/CG-B8 + the live re-climb-2
  rejection. The escape never keeps a worse batch.
- ⚠️ **"a re-climb reaches the picture / a higher glance-agreed plateau":** PARTIAL — a higher plateau in score
  (20) and on the glance (`beside-batch-rollback.png`: dressed quoins + gable + boxy massing vs the bare
  colonnade `beside-first.png`), but **not the full picture**, and the plateau cannot be *sustained*. Cause
  below.
- ✅ **Not the "score so unreliable" failure mode.** The +20 batch was a trustworthy, glance-agreed signal. The
  blocker is the **deterministic closure metric**, not the noisy judge — so the answer is NOT "de-noise the
  judge" (candidate C); it is the closure-metric seam.

## The residual, named at full strength (the central finding)

**`relief_walls` collapses `eaveRingClosure` from 1.000 to 0.068 on a still-closed wall.** Proof —
`closure-probe.mjs` (no spend, reproducible):

```
after close_shell        cl = 1.000
after apply_gable_roof   cl = 1.000
after relief_walls       cl = 0.068   (identical under a fixed seed floor → NOT a bounds/floor artifact)
```

`relief_walls` stands the whole wall **proud** (depth-1 outward) of the program footprint. `eaveRingClosure`
(T-206) measures occupancy **on the absolute footprint ring**, so a proud-dressed wall reads as *off-ring* —
"no wall" — exactly as an open colonnade does. This is the documented **T-202/T-206 "proud relief is off-ring"
residual** at full strength: the metric that must read an *open* colonnade as open also reads a *proud-dressed
closed* wall as open. It is **structurally visible** in `beside-batch-rollback.png` (the dressed walls read
hollow at oblique angles).

Consequence: the form-integrity guard — correct in principle (don't keep a batch that reopened the form) — is
fed an **unreliable closure** for dressed walls, so it rejects the glance-good +20 relief-batch as a false
"reopen." The escape's full expression is therefore blocked by the **measurement**, not the gate.

**Why this is the honest scope line (not papered over):** fixing it means making `eaveRingClosure` tolerant of
±1 proud displacement (census the wall plane, not only the exact footprint ring) **without** regressing T-206's
core property — *an open colonnade must still read open*. A proud-dressed closed wall and a proud open colonnade
differ by interior fill, not by the ring, so the fix is a real, careful change to the T-206 metric with its own
WG-CS test surface. That is a **separate ticket** in the T-202/T-206 lineage, not a change to the cold-start
gate this ticket owns.

## Open concerns / handoff

1. **Licensed follow-up (high value):** a **relief-tolerant closure metric** (or feeding the guard a
   relief-aware closure). With it, re-climb 2's +20 batch would be KEPT on a stayed-closed form and the escape
   reaches its plateau. This is the single change that turns "leaves 0" into "reaches the picture." Belongs in
   the closure-metric (T-206) lineage; must hold the WG-CS "colonnade reads open" invariant.
2. **Batch composition:** the runner currently batches whatever the agent picks (minus wall-shell form moves).
   A form-credit-aware ordering (dress AFTER the closure-tolerant metric lands) may compound more cleanly.
3. **`CLIMB_BATCH_SIZE` is opt-in (default OFF)** — the escape does not perturb the frozen comparison runs
   (T-201/T-205/T-207 re-run byte-identically); enabling it is a deliberate run parameter.
4. **No instrument touched** — `measurements/` byte-clean before+after; subscription shim only; the frozen
   judge (`DiagnoseBuild`/`styleFidelityScore`) unchanged. The only behavior change is gated to the cold-start
   floor and is a no-op on a healthy climb.

## Bottom line

The ticket's mechanism is **delivered and validated**: detail hands now compound off a score-0 cold start, the
climb leaves 0, and the escape provably rejects a bad batch. The path to the full picture is blocked by a
**named, evidenced, out-of-scope measurement seam** (`eaveRingClosure` vs proud relief), with a clean licensed
follow-up. This is the anti-hedge close: the positive claim proven, the rubber-stamp failure guarded and
unit-tested, the residual named at full strength rather than hidden.
