# T-207-01 Plan — ordered run + judge

No source change. Steps are run-and-verify; the "tests" are the invariant checks (instrument untouched, suite
green) and the trajectory-field reads that answer the acceptance criteria.

## Step 1 — Pre-flight invariants (zero spend)

- `git status --short measurements/` → **empty** (frozen instrument clean before the run).
- `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` → asserts assets + GL, renders round-0 +
  beside sheet, exits clean. **Verify:** log says `assets present; GL available` and `GUARD_ONLY … no spend`.
  - **Gate:** if GL is absent (`assertGlAvailable` throws), STOP — surface "metered run unreachable in this
    environment, GL absent" and do not fabricate a climb. (The GL probe lives in `render/`,
    [[gl-probe-nested-render-project]] — trust `assertGlAvailable`, not a root-level probe.)

## Step 2 — Launch the metered climb (background)

```
CLIMB_MAX_ROUNDS=8 \
CLIMB_OUT=docs/active/work/T-207-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs 2> docs/active/work/T-207-01/climb.log
```

- Run in the **background** (it can take ~20–40 min). Poll `climb.log` for round progress.
- Subscription shim only — confirm `ANTHROPIC_API_KEY` is unset in the run env.
- **Watch for** (early-abort signals): repeated `vote … dropped (timeout)` → spend/auth wall
  ([[spend-limit-reply-failure-mode]]); a `[ABORT]` line → `RoundAbortedError` (recorded, exit 2). If the
  whole run aborts, the verdict is "environment cannot reach the metered diagnose" — report it, do not fake a
  build verdict.
- **Verify on completion:** `trajectory.json` exists; `climb.log` ends with the `PICTURE-DRIVEN CLIMB` summary
  block (or a recorded `[ABORT]`).

## Step 3 — Copy the glance renders into the work dir

- `beside-first.png` ← `builds/gatehouse/picture-climb/round-0/beside-concept.png`.
- `beside-best.png` ← the round-N with the max **kept** score (read `scoreAfter.score` over accepted rounds in
  `trajectory.json`; if none kept above the seed, best = first).
- `beside-final.png` ← the last kept round's `beside-concept.png` (or round-0 if everything rolled back).
- **Verify:** three PNGs present in the work dir.

## Step 4 — Read the trajectory (cite every field) — the four AC questions

From `trajectory.json` + `climb.log`:

- **B1 form closed & stayed:** `closureFirst` (≈0.608 OPEN), round-1 `pick.tool == "close_shell"` with
  `accepted=true` and `closureAfter ≥ 0.9`; every later round's `closure`/`closureAfter` ≥ 0.9; `closureLast ≥ 0.9`.
- **B2 detail compounded:** which of `relief_walls`/`rebuild_arch`/`apply_gable_roof`/`recolor_roof`/`band_eave`
  were KEPT after closure; `inventory.actedOn`.
- **B3 a major cleared:** per kept round, did any `deptMajorsAfter[d] < deptMajorsBefore[d]`? (the form-alone
  vs detail-credit crux — T-205 starved this).
- **Autonomy & cost:** count `close_shell`-first as autonomous (agent-chosen); tally strong `DiagnoseBuild`
  calls (scored rounds × VOTES) + sonnet picks; `votesTimedOut`; `stopReason`. Record `tier=strong, VOTES=3`.

## Step 5 — Human glance verdict (gate vs glance)

- Open `beside-final.png` (and `beside-best.png`, candidate glances). Judge **reached-its-picture** (M1
  landed) **or** the precise residual. Scale/pitch on **proportion**, not render pixels.
- **Branch the verdict** (design §C):
  1. M1 landed → E-53 can close here.
  2. Stall at 0 **on a genuinely closed form** (closure ≥ 0.9 throughout, per Step 4 B1) → confirm the **S-208
     detail-credit gap** as a real independent finding (the *good* failure — not a form artifact like T-205).
  3. Seventh gap / variance (a hand that doesn't read, missing kit material, 32-vs-0 swing) → name it.

## Step 6 — Closing invariants

- `git status --short measurements/` → **empty** (instrument untouched, after).
- `npm test` → **2416/2416 green** (no source changed; proves the env is sane and nothing leaked).
- `git status --short` → only `docs/active/work/T-207-01/**` (+ pre-existing untracked docs) new; no `src/`
  diff.

## Step 7 — Artifacts

- `progress.md` — the run log (what fired, deviations, the raw trajectory summary).
- `review.md` — the handoff verdict: what changed (nothing in source; the run + its evidence), test coverage
  (the run is the evidence; T-206 carries the unit tests), open concerns, and the branch-1/2/3 verdict with
  every claim cited to a field or a render.

## Testing strategy

- **No new unit test** — the form metric is already covered by `wall-generate.test.mjs` WG-CS10–14 (T-206);
  this ticket is the *live exercise* of that fix, judged by evidence. (Same rationale as the T-205 review:
  a measurement run, not a localized code change with a clean failing fixture.)
- **Invariants are the gate:** instrument clean (before+after), `npm test` green, subscription shim only,
  no hang (T-198 guard), verdict reproducibly cited to trajectory fields.
- **Commit:** the artifacts + trajectory + renders in one docs commit at the end (no source commit).
