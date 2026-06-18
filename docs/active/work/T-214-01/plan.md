# T-214-01 — Plan: the ordered run + verdict steps

**Epic E-55 / Story S-214.** Each step is independently verifiable. No source change — the verification is the
run's own recorded evidence (the same out-of-suite convention the picture-climb family follows) + `npm test`
+ a `git status` boundary check.

## Step 0 — pre-flight (zero spend)

- `npm test` BEFORE the run → baseline green (expect 2446/2446, the T-213 count).
- `git status --porcelain` → only the known doc edits + this work dir.
- **Verify:** test count recorded; no `src/measurements/benchmarks` dirty.

## Step 1 — GUARD_ONLY wiring + GL + render seam (zero spend)

```
GUARD_ONLY=1 CLIMB_AGGREGATOR=trimmedMean CLIMB_BATCH_MODE=improving \
  CLIMB_BATCH_SIZE=4 CLIMB_MAX_ROUNDS=8 \
  node experiments/eval-alignment/picture-climb.mjs
```
- **Verify:** exits clean; prints `[guard] assets present; GL available …`; round-0 + beside sheet written;
  the two new knobs are read without error. No LLM spend (GUARD_ONLY returns before `diagnose`).

## Step 2 — the metered re-climb (the spend; background + monitored)

```
CLIMB_AGGREGATOR=trimmedMean CLIMB_BATCH_MODE=improving \
  CLIMB_BATCH_SIZE=4 CLIMB_MAX_ROUNDS=8 \
  CLIMB_OUT=docs/active/work/T-214-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs \
  2> docs/active/work/T-214-01/climb.log
```
- Run in the background; **Monitor** `climb.log` for `\[round|KEPT|ROLLED BACK|BATCH|ABORT|FATAL|=====`
  so a hang / all-timeout / crash surfaces immediately (silence ≠ success).
- **Verify (the run completed cleanly):** `trajectory.json` written; `stopReason` set; NOT an abort record
  (`aborted:true` would mean the metered diagnose was unreachable — reported, not a build signal).
- **Mitigations:** T-198 guard bounds each subprocess (180s) and drops timed-out votes; an all-failed round
  writes the abort block + exit 2 (handled, not a crash). GL confirmed available in pre-flight.

## Step 3 — read the trajectory (the structural half of the verdict)

From `trajectory.json` (no spend):
- The trend (`score` per round) and `inventory.verdict` (climbed / delta / actionableFrac).
- **Did the dressing COMPOUND?** Find the rounds applying gable + rebuild_arch + relief; check `accepted:true`
  and that they were kept TOGETHER (a batch compound, or sequential keeps that were not later rolled back).
- **The two T-211-discarded moves:** locate the `rebuild_arch` round — did `(…,…,48)`-style votes now KEEP via
  trimmedMean (gate reason `improved +N`)? The gable likewise.
- **Is KEPT = high-water?** Confirm the final `prev` build is the highest-scored ACCEPTED build, not a
  rolled-back better candidate (read each round's `scoreAfter.score` vs `accepted`).
- **Verify:** these reads are recorded with round numbers + the exact gate reasons (quoted from the log).

## Step 4 — the glance verdict (read the renders)

- Read `builds/gatehouse/picture-climb/round-0/beside-concept.png` (first), the high-water round's
  `beside-concept.png` (best), and the final round's (final).
- Score the kept build vs the **concept** on the four M1 criteria (closed dressed walls / centered arched gate /
  dark gabled roof / right proportion / stranger-recognizes). Calibrated honesty — vs the concept, not T-211.
- **Verify:** `verdict.md` headline is one of {M1 landed → generalization opens; architecture ceiling named} —
  with the renders cited and the four criteria each marked.

## Step 5 — reproducibility / variance read (failure-mode 3)

- Tier 1 (free): from the recorded per-move `scores`, compute the KEEP slack on the load-bearing moves (arch,
  gable, relief). Wide slack → robust; knife-edge → flag.
- Tier 2 (conditional): if tier 1 is knife-edge, run the climb a SECOND time (same knobs,
  `CLIMB_OUT=…/trajectory-2.json`) and compare the kept-build shape. Skip if tier 1 is decisive.
- **Verify:** the reproducibility paragraph states whether variance dominates the aggregator (the SCORER-is-
  the-ceiling failure) — yes/no, with the slack numbers.

## Step 6 — the two adversarial checks + boundary + close-out

- **Regression check:** the winning rule is default-OFF, so frozen comparison runs are byte-unchanged by
  construction; confirm via `git status` (no source dirty) + `npm test` green (the gate's decision functions
  are byte-unchanged — asserted by the T-213 default-identity tests CG-AGG1/CG-BWI1, re-run here).
- **Boundary:** `git status --porcelain -- src measurements benchmarks experiments` empty; only
  `docs/active/work/T-214-01/**` + ephemeral `builds/**`.
- **Record cost + autonomy:** rounds, scored builds, votes (= scored × 3), `votesTimedOut`,
  `inventory.verdict.actionableFrac` (agent autonomy).
- Write `progress.md` (run log + any deviation) and `review.md` (handoff: what the run showed, test coverage,
  the E-55-closing verdict, open concerns). **Stop** — Lisa handles phase transitions.

## Definition of done (the ticket's AC, mapped)

- [ ] metered re-climb + `climb.log` + `trajectory.json` + beside renders (Steps 2–4); T-198 guard used.
- [ ] trajectory read: dressing compounded? kept = high-water? (Step 3).
- [ ] human-glance verdict: M1 landed (generalization opens) OR architecture ceiling named at full strength,
      with the reviewer decision + autonomy + metered cost (Steps 4, 6).
- [ ] `npm test` green; frozen instrument untouched; subscription shim only (Steps 0, 6).
