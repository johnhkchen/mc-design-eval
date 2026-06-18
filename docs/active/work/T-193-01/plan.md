# T-193-01 — PLAN: the ordered run + judge + record

No code to commit. The "steps" are the run, the judgement, and the honest record. Each is independently
verifiable. No git commits expected (artifacts only; the runner output and work-dir md are the deliverables —
committed at the end if the repo convention wants the trajectory tracked).

## Step 0 — pre-flight (DONE this session)
- `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` → "GL available", round-0 + beside
  written, "exiting clean", **zero spend**. ✔ Confirms assets present, GL up, render seam live before
  committing to a metered run.
- **Verify:** the line `[guard] GUARD_ONLY — … no spend; exiting clean.` printed. ✔

## Step 1 — run the completion climb (metered, unsteered, once)
```
CLIMB_OUT=docs/active/work/T-193-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs 2> docs/active/work/T-193-01/run.log
```
- Run in the **background**, monitor `run.log`. Up to `maxRounds=5` rounds × VOTES=3 strong diagnoses + an
  agent pick per round — bounded, but minutes-long and metered.
- **Do not steer.** Let `agentPick` choose every tool. The only permissible intervention is a single restart
  after a genuine infra error (shim crash, not a bad pick) — and it is **counted** in the autonomy report.
- **Verify:** `trajectory.json` written with a `trajectory[]`, an `inventory.verdict`, and a `stopReason`;
  `run.log` ends with the `PICTURE-DRIVEN CLIMB` banner + trend.

## Step 2 — read the trajectory (evidence, not verdict)
- Parse `trajectory.json`: the score trend, each round's `pick` + `gate.accept` + `gate.reason` + dept
  major/item before/after, `observedScoreSpread` (the vote-noise), `inventory.verdict`
  (climbed/stalled/oscillated/actionableFrac), `inventory.actedOn` vs `inventory.eyesOnly`, `stopReason`.
- From `run.log`: the per-hand notes — `frame_arch` perOpening (framed/arched + the widen→E-49 reason),
  `articulate_walls` recolor count, `band_eave` closure, any vote-dropped lines.
- **Verify:** I can state the trend and every KEPT/ROLLED-BACK decision with its reason.

## Step 3 — the glance verdict (the judge)
- Read (visually) the concept, then `round-0/beside-concept.png` (first), the highest-scoring round's
  beside (best), and the terminal kept build's beside (final).
- For each E-48 divergence — **roof colour, arched gate, quoin/field contrast, eave banding** — judge by eye:
  **gone / partial / residual**, against the concept, independent of the scalar.
- Copy the three chosen besides into the work dir as `first-beside.png` / `best-beside.png` /
  `final-beside.png` (stable AC artifacts; `builds/` is volatile scratch).
- **Verify:** a per-divergence glance table written, and the four-way outcome (reached / plateau / kept-bad /
  autonomy-cost) decided from the renders + trajectory **agreeing or disagreeing** — and if they disagree,
  the glance wins (milestones rule), stated explicitly.

## Step 4 — autonomy + residual accounting
- **Autonomy:** count human interventions (target 0). Restarts, manual picks, any nudge → reported as the
  M1→M4 autonomy-honesty number.
- **Residual ceiling → E-49:** name precisely what the loop could not reach. Predicted: the **wide arched
  gate** (frame_arch frames the 1-wide slot; the true arch needs a widen = a rebuild the facade charter
  forbids) and **scale/proportion** (build reads larger than the concept). Confirm/extend from the actual run.
- **Verify:** AC-3 (intervention count + residual) and AC-4 (honest outcome label) both answerable from the
  written record.

## Step 5 — `npm test` (the only hard gate)
- `npm test` — must be green; frozen instrument untouched. Trivially satisfied (no source changed), but run
  it to prove it.
- **Verify:** test count pass / 0 fail; `git status` shows no source/test/measurements changes.

## Step 6 — progress.md then review.md
- `progress.md`: what ran, the actual trajectory, any deviation (e.g. an unlucky vote draw flooring the
  scalar, a restart).
- `review.md`: the handoff — no source changes; the glance verdict; the autonomy cost; the residual→E-49;
  the test status; the honest verdict against the falsifiable claim.

## Testing strategy
- The **only** automated gate is `npm test` (green, no source touched). The climb is GL+LLM, non-deterministic
  by design — **not** in `npm test`; its evidence is the trajectory + renders.
- The **judgement** is the human glance (me, reading the besides) — the AC-mandated judge.
- **Anti-hedge:** one run, reported as-is. A plateau or a kept-bad-change is a valid, recorded outcome — the
  finding feeds E-49 / re-opens S-191. No re-rolling for a prettier number.

## Rollback / failure handling
- If the run errors before writing `trajectory.json`: capture the error in `run.log`, record it as an
  autonomy cost, one restart permitted (counted). If it errors repeatedly → that is the finding (the run
  could not complete autonomously), recorded honestly; the deterministic proofs (CG14–17, T-192 free glance)
  still stand and are cited.
