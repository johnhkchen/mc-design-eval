# T-208-01 Plan — ordered steps, with the T-207 gate up front

The first step is **not code** — it is reading T-207's finding, because AC #1 makes the whole ticket
contingent. The pure mechanism + its falsification (steps 2–4) are deterministic and required in the
"confirmed" branch; the live re-climb (step 6) is metered and gated on T-207.

## Step 0 — Resolve the T-207 gate (zero spend)

- Read `docs/active/work/T-207-01/{climb.log,trajectory.json,review.md}` (and re-check the process).
- **Decide the branch:**
  - **Reached the picture** (a kept round with `score` well above 0, glance agrees) → **NO-OP branch**:
    record it in `progress.md`/`review.md` with T-207's evidence, land **nothing in source**, stop. AC #1
    satisfied (the form fix sufficed; anti-hedge — do not build a mechanism the evidence didn't demand).
  - **Stalled at 0 on a genuinely-closed form** (`closureLast ≥ 0.9`, score never left 0, every detail round
    `tie (0): no shrink`) → **CONFIRMED branch**: proceed to Step 1. *This is the gap.*
  - **Still in-flight** → build & unit-test steps 1–4 (deterministic, required regardless, inert when healthy),
    and gate step 6's live verdict on T-207's terminal trajectory (do not fabricate it).

## Step 1 — `climb-gate.mjs`: add the pure decision (no behavior change yet)

- Add `BATCH_DEFAULTS`, `coldStartFloor`, `acceptsBatch` (structure §1a–1c); export all three.
- `departmentDominant` stays private (reused by `acceptsBatch`).
- **Verify:** `node --check src/workshop/climb-gate.mjs`; `node -e "import('./src/workshop/climb-gate.mjs').then(m=>console.log(typeof m.acceptsBatch, typeof m.coldStartFloor, m.BATCH_DEFAULTS))"`.
- **Commit:** `feat(T-208-01): pure acceptsBatch + coldStartFloor — the score-0 cold-start escape decision`.

## Step 2 — `climb-gate.test.mjs`: the CG-B suite incl. the falsification

- Add CG-B1..CG-B6 + CG-coldStart1/2 (structure §File 2). **CG-B2 is the AC falsification** (a deliberately-bad
  compound that adds a major must be rejected); CG-B4 proves no rubber-stamp at a tie.
- **Verify:** `npm test -- test/workshop/climb-gate.test.mjs` green, then **full `npm test` 2416+ green**.
- **Commit:** `test(T-208-01): batch escape unit-tested — rejects the deliberately-bad compound`.

## Step 3 — `picture-climb.mjs`: wire the batch sub-loop (opt-in, gated)

- Imports (§3a), env knobs `CLIMB_BATCH_SIZE` (default 0 = OFF) / `CLIMB_SCORE_FLOOR` (§3b).
- Batch branch inside the loop after `formReadyGate` passes (§3c): provisional pure-`occ` stacking of ≤
  `BATCH_SIZE` detail picks (skip no-ops via `buildDigest`, honor self-reverting hands, stop at a form
  move/done), one compound `scoreBuild`, `acceptsBatch` keep-all/roll-back-all, one tagged trajectory entry.
- Round/stall accounting and `stoppingDecision` updated for the consumed picks (§3c).
- **Verify (zero spend):** `node --check`; `GUARD_ONLY=1 CLIMB_BATCH_SIZE=4 node experiments/eval-alignment/picture-climb.mjs`
  → asserts assets+GL, renders round-0 + beside, **no spend**, exits clean (proves the wiring parses & the
  batch branch is reachable without metered cost). If GL absent → STOP, surface it (do not fabricate).
- **Commit:** `feat(T-208-01): cold-start batch sub-loop in the climb runner (opt-in CLIMB_BATCH_SIZE)`.

## Step 4 — Invariants (zero spend)

- `git status --short measurements/` → **empty** (frozen instrument untouched).
- `git status --short src/` → only `climb-gate.mjs`; `experiments/` → only `picture-climb.mjs`.
- Confirm the healthy path is byte-unchanged: with `CLIMB_BATCH_SIZE` unset the loop is the prior code
  (the branch is `BATCH_SIZE > 0`-guarded) → T-201/T-205/T-207 remain comparable.

## Step 5 — (CONFIRMED branch only) the metered re-climb

- Pre-flight: `ANTHROPIC_API_KEY` unset (subscription shim); `git status measurements/` clean.
- Launch background, on the **same closed gatehouse**, escape ON:
  ```
  CLIMB_MAX_ROUNDS=8 CLIMB_BATCH_SIZE=4 \
  CLIMB_OUT=docs/active/work/T-208-01/trajectory.json \
    node experiments/eval-alignment/picture-climb.mjs 2> docs/active/work/T-208-01/climb.log
  ```
- Poll `climb.log`. Watch the early-abort signals ([[spend-limit-reply-failure-mode]] / `[ABORT]` /
  `vote … dropped (timeout)` — the T-198 guard). If the run aborts: verdict is "metered diagnose unreachable
  here", reported not fabricated.
- Copy `beside-{first,best,final}.png` from `builds/gatehouse/picture-climb/round-*/` into the work dir.

## Step 6 — (CONFIRMED branch only) read the trajectory + glance verdict

Cite every claim to a field/render:
- **Left 0?** any kept batch round with `scoreAfter.score ≥ batchMargin` (the build escaped the floor) —
  vs the per-move control (T-207: never left 0).
- **Rejected the bad compound?** the unit test CG-B2 (deterministic) + any live batch `accepted=false` with
  reason `added a major` / `regressed`. (If a deliberately-bad batch is desired live, an adversarial probe can
  inject wrong-colour picks — optional; the unit test is the binding falsification.)
- **Glance:** open `beside-final.png`; judge **reached-its-picture** (M1, E-53 closes) or the **precise
  residual**. If even the compound can't move the judge off 0 (`compound tie at floor`), name the residual:
  **de-noise the judge** (the ticket's failure-mode-3, candidate C) — do **not** claim a win.
- Scale/pitch judged on **proportion**, not render pixels (the AC).

## Step 7 — Close-out invariants & artifacts

- `npm test` → green. `git status --short measurements/` → empty (after).
- `progress.md` — the run log (what fired, deviations, batch trajectory summary, the branch taken).
- `review.md` — handoff: files changed, test coverage (CG-B incl. the falsification), the live verdict (or the
  no-op / in-flight-deferred branch), open concerns (judge-floor residual → C), and every claim cited.
- **Commit:** `docs(T-208-01): batch-escape re-climb evidence + review` (or the no-op record).

## Testing strategy

- **Unit (in `npm test`, deterministic):** `acceptsBatch` + `coldStartFloor` — the keep/rollback logic **and
  the deliberately-bad-compound rejection** (CG-B2/B3) live here. This is the binding AC falsification: it does
  not need the metered judge.
- **Live (evidence, not a unit test):** the metered re-climb proves the build *leaves 0* on the real
  gatehouse — same rationale as T-205/T-207 (a measurement run, gated on T-207, never fabricated).
- **Invariants are a gate:** instrument clean before+after, full `npm test` green, subscription shim only,
  healthy per-move path byte-unchanged (escape opt-in), no hang (T-198 guard).
- **Anti-hedge falsification recap:** the mechanism *must be allowed to be unnecessary* (T-207 no-op branch);
  if landed it *must reject a worse batch* (CG-B2); if even the compound can't beat 0 it *must name the residual*
  (judge de-noising), not rubber-stamp.
