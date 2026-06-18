# T-208-01 Progress

## Step 0 — T-207 gate RESOLVED → CONFIRMED branch (real work, not a no-op)

T-207's metered climb completed while this ticket's Research/Design ran. Terminal verdict
(`docs/active/work/T-207-01/{climb.log,trajectory.json}`):

```
trend: 0 → 0 → 0 → 0 → 0 → 0  (Δ +0; stop: stalled, 2 rolled back)
shell closure: 0.608 → 1.000 (form-ready ≥ 0.9)   closureFirst 0.608 → closureLast 1.000
observedScoreSpread: 0 - 0   verdict: climbed=false stalled=true oscillated=false
r1 close_shell      KEPT    (closure +0.392 form-credit)   closure 0.607→1.000
r2 apply_gable_roof KEPT    (tie (0): coverage shrank)      closure 1.000
r3 rebuild_arch     ROLLED BACK (tie (0): no shrink)        closure 1.000   ← clean wide arch (gate ok=true) rejected
r4 recolor_roof     ROLLED BACK (tie (0): no shrink)        closure 1.000
```

This is **branch 2** (T-207 design §C): **stall at score 0 on a genuinely-closed form**. The form closed
(closure 1.000) and STAYED closed through every detail round, yet the picture scalar never left 0 and every
detail move tied at 0 and rolled back — including a structurally-clean wide arch. The S-208 detail-credit
cold-start gap is therefore a **real, independent finding**, NOT a form artifact (the T-205 failure WAS a form
artifact; this is not). → AC #1: build the escape. **Not** a no-op.

## Step 1 — pure decision in `climb-gate.mjs` (commit cd66459)

Added `BATCH_DEFAULTS` (frozen `{batchSize:4, scoreFloor:0, batchMargin:1}`), `coldStartFloor` (closed-form +
floor entry predicate), and `acceptsBatch` (compound keep/rollback, reusing `departmentDominant`). PURE
(no GL/LLM/I/O). Parse + export checks green.

## Step 2 — unit tests incl. the falsification (commit cd66459, same atomic unit)

CG-B1..B7 + CG-coldStart1..3. The binding AC falsification is **CG-B2** (a deliberately-bad compound that adds
a major → REJECT `added a major (3→5)`); CG-B3 rejects a regressed compound; **CG-B4 rejects a tie at the floor
(no rubber-stamp)**; CG-B5/B6 cover the department-dominant batch + its net guard. `climb-gate.test.mjs`:
47/47. Full `npm test`: **2426/2426 green** (was 2416; +10).

## Step 3 — runner batch sub-loop (commit 5a59708)

`picture-climb.mjs`: import `acceptsBatch/coldStartFloor/BATCH_DEFAULTS`; env knobs `CLIMB_BATCH_SIZE`
(default 0 = OFF) / `CLIMB_SCORE_FLOOR`. Batch branch inside the round loop after `formReadyGate` passes:
provisional pure-`occ` stacking of ≤ `BATCH_SIZE` picks (skip no-ops via `buildDigest`; rebuild aperture
columns staged in `batchApertureCols`, promoted to `openColumns` ONLY on accept), one compound `scoreBuild`,
`acceptsBatch` keep-all/roll-back-all, one tagged trajectory entry, round budget advanced by the batch size.
Opt-in + `coldStartFloor`-gated → inert on a healthy climb; the per-move path is byte-unchanged.

**Deviation from plan:** the `GUARD_ONLY` smoke (plan Step 3) was skipped — `GUARD_ONLY` returns *before* the
round loop so it cannot exercise the batch branch, and running it would have collided with T-207's in-flight
renders. The branch is covered by parse-check + the unit-tested decision + review; the live exercise is the
metered re-climb below.

## Step 4 — invariants

- `git status --short measurements/` → empty (frozen instrument untouched).
- `src/` diff = `climb-gate.mjs` only; `experiments/` diff = `picture-climb.mjs` only.
- Healthy/comparison path: `CLIMB_BATCH_SIZE` unset → the `BATCH_SIZE>0` guard is false → prior code path,
  so T-201/T-205/T-207 stay comparable.

## Step 5 — metered re-climb (RUNNING, batch escape ON)

Launched (background) after T-207 completed (subscription free, no spend contention):
```
CLIMB_MAX_ROUNDS=8 CLIMB_BATCH_SIZE=4 CLIMB_OUT=docs/active/work/T-208-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs 2> docs/active/work/T-208-01/climb.log
```
Pre-flight: GL available, assets present, `ANTHROPIC_API_KEY` unset (subscription shim). Watching for the
early-abort signals (vote timeouts / `[ABORT]` — the T-198 guard). The verdict (Step 6) + glance renders +
final review land on completion.

## Step 5b — re-climb 1 (CLIMB_BATCH_SIZE=4): the escape WORKS, but exposed a form-integrity defect

Evidence saved to `climb-reclimb1.log` / `trajectory-reclimb1.json`.

```
trend: 0 → 0 → 0 → 12 → 12   (Δ +12; stop: agent-done)   verdict: climbed=true
r2 BATCH apply_gable_roof+relief_walls+construct_walls: 0→12 (36/12/0) — KEPT (compound +12 (off the floor))
closure: 0.608 → 0.068   ← the shell REOPENED
```

- **Core claim VINDICATED:** the build **LEFT the score-0 floor** (0→12), `climbed=true`. The batch supplied
  the gradient the per-move gate lacked — `acceptsBatch` kept a real compound improvement. The cold-start trap
  is broken: this is the exact result T-207 (per-move) could not reach (`0→0→0→0→0→0`).
- **Defect exposed (the live attack paid off):** the batch admitted **`construct_walls`** — a wall-shell FORM
  move — which **reopened the shell** (closure 1.000→0.068). `acceptsBatch` judged only the picture compound
  (+12) and kept a build whose massing had collapsed; the climb then could not re-close
  (`close_shell no-op — registration below trust floor`) and gave up. The judge rewarded gable+relief dressing
  over a broken form. `closureLast=0.068`.

## Step 5c — form-integrity fix (commit: batch must not reopen a closed shell)

Evidence-demanded, small, two parts:
1. **`acceptsBatch` guard (0)** — reject a compound that dropped closure below form-ready when it was ready
   before (`closureBefore ≥ threshold && closureAfter < threshold`), regardless of the picture read. Unit test
   **CG-B8** (reopen → reject even at +12; inert when the form stayed closed / without closure evidence).
2. **Runner** — exclude wall-shell form moves (`closureDecidedMove`) from the detail batch (they route through
   the per-move form-credit path) + pass `closureBefore/closureAfter` to `acceptsBatch`.

`npm test` **2427/2427 green**. Re-climb 2 (with the fix) launched — Step 6 fills from it.

## Step 5d — re-climb 2 (with the form-integrity fix): the guard fires, on an UNRELIABLE closure input

```
trend: 0 → 0 → 0 → 0 → 0   (Δ +0; stop: stalled/oscillated)   closureLast 1.000 (after the rolled-back batch)
r2 BATCH apply_gable_roof+rebuild_arch+relief_walls: 0→20 (20/20/0) — ROLLED BACK (batch reopened the form 1.000→0.068)
```
The guard fired — but the batch had NO `construct_walls` (only detail/roof hands), yet closure still hit 0.068.
So re-climb 1's `construct_walls` blame was wrong: a **detail hand itself** collapses the closure.

## Step 5e — deterministic probe (`closure-probe.mjs`, no spend) — root cause isolated

```
seed (open colonnade)     cl(bounds.minY)=0.608  cl(seedFloor)=0.608
after close_shell         1.000                  1.000
after apply_gable_roof    1.000                  1.000
after relief_walls        0.068                  0.068   ← collapses; bounds.minY=0 throughout (NOT a floor artifact)
```
**`relief_walls` genuinely collapses `eaveRingClosure` to 0.068** — and identically under a fixed seed floor,
so it is NOT a bounds/floor-reference artifact. Cause: relief stands the whole wall **proud** (depth-1 outward)
of the program footprint, so the footprint-pinned metric (T-206) reads the dressed wall as *off-ring* → "no
wall." This is the documented **T-202/T-206 "proud relief is off-ring" residual** at full strength: the metric
that correctly reads an open colonnade as open also reads a proud-dressed *closed* wall as open.

## Step 6 — glance verdict (renders in the work dir)

- `beside-first.png` — the seed: a dark, **hollow open colonnade**, score 0.
- `beside-batch-rollback.png` — the +20 batch (re-climb 2 round-2, rolled back): stone-brick walls, **proud
  cobblestone corner quoins, boxy massing, a gable roof** — a clear, glance-credible improvement toward the
  picture (the +20 read is honest), but the walls read **hollow** (relief proud-off-footprint, the closure
  seam visible) and the roof is brown not dark slate (recolor never reached).

**Verdict against the falsifiable claim:**
- ✅ **Leaves 0 — PROVEN.** re-climb 1: `0→12` kept; re-climb 2 batch **read +20**. The per-move cold-start trap
  (T-207: `0→0→0→0→0→0`) is broken — detail compounds off the floor.
- ✅ **No rubber-stamp.** The guards reject the deliberately-bad compound (CG-B2 added-major, CG-B8 reopened
  form) — the AC falsification holds. The batch scalar (+20) was a *trustworthy, glance-agreed* signal, NOT the
  noisy-judge failure mode.
- ⚠️ **Does not reach / sustain the full picture — residual NAMED at full strength.** The blocker is the
  **closure-metric ↔ proud-relief incompatibility** (`eaveRingClosure` reads a proud-dressed closed wall as
  off-footprint → 0.068), so the form-integrity guard rejects the dressed +20 batch as a false "reopen." This
  is a pre-existing measurement seam (T-202/T-206 lineage), **not** the cold-start gate. Fix = a relief-tolerant
  closure metric (must not regress T-206's "colonnade reads open") — a separate ticket. See `review.md`.

## Step 7 — invariants & commit

`npm test` 2427/2427 green; `measurements/` clean before+after; subscription shim only; no hang (both re-climbs
exited 0 under the T-198 guard). Docs + probe + saved re-climb evidence + renders committed.
