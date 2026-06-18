# T-214-01 — Research: the re-climb with the winning rule, and the can-it-finish verdict

**Epic E-55 / Story S-214 — the converge + the answer.** Descriptive map of what exists. T-212 built the
rankable bar + replay harness; T-213 contested ≥2 accept-rules against it and named the winner
(**trimmedMean** aggregator + **batch-while-improving**). This ticket RUNS the metered climb with that winner
and judges the kept build on the glance. **No new hand, no source change** — it is a run-and-judge stage.

## What this ticket is (and is not)

- **Is:** one metered re-climb of the gatehouse with `CLIMB_AGGREGATOR=trimmedMean CLIMB_BATCH_MODE=improving`,
  capturing `climb.log` + `trajectory.json` + beside-concept renders (first/best/final); a trajectory read
  (did the dressing compound, is kept = high-water?); a human-glance verdict vs the concept (M1 landed, or the
  architecture ceiling named at full strength); `npm test` green; frozen instrument untouched; subscription shim only.
- **Is not:** a code change. The winning rule is ALREADY wired (T-213, three commits landed 10:08am). The two
  knobs are opt-in env vars in the runner. No gatehouse-specific fix (the E-54 stop-line stands).

## The runner — `experiments/eval-alignment/picture-climb.mjs` (953 lines)

The picture-driven climb (E-48 origin). render → critique (VOTES=3 strong-tier DiagnoseBuild) → agent picks a
tool → apply → re-critique → accept-gate keep/rollback. Out of `npm test`. Metered (subscription `claude -p`
shim via `src/sdk-binding.mjs` → `runTieredOp`).

Key wiring already in place (read in full):
- **L96–97:** `AGGREGATOR = process.env.CLIMB_AGGREGATOR || "median"`; `BATCH_MODE = process.env.CLIMB_BATCH_MODE || "floor"`.
  Both default to the current behavior, so prior climbs re-run byte-identically.
- **L569 (`scoreBuild`):** `score = AGGREGATOR === "median" ? med.score : aggregateVotes(scores, AGGREGATOR)`.
  The per-vote `scores` array is preserved in the trajectory; items/ev still come from the median-representative
  sample (dept counts are an orthogonal signal). This is the **per-move** path.
- **L789 (batch entry):** `if (BATCH_SIZE > 0 && batchEligible({ score, closure, mode: BATCH_MODE, ... }))`.
  `mode:"improving"` → eligible on ANY closed form (closure ≥ 0.9), not just at the score floor.
- **L827–829 (off-floor margin):** `atFloor = coldStartFloor(...)`; `batchMargin = atFloor ? 1 : margin(4)`.
  Off the floor the compound must clear the FULL margin (4), so a +1 nudge does not rubber-stamp through.
- **Env knobs (run parameters, not hands):** `CLIMB_MAX_ROUNDS` (default 5), `CLIMB_BATCH_SIZE` (default 0=OFF),
  `CLIMB_SCORE_FLOOR` (default 0), `CLIMB_OUT` (trajectory path), `GUARD_ONLY=1` (renders + beside, zero spend).

## The accept-rule — `src/workshop/climb-gate.mjs` (pure, in `npm test`)

- `aggregateVotes(scores, "trimmedMean")` (L161–164): drop the single lowest vote, mean the rest. n=3 → mean
  of top 2. Rescues a lone-judge read without `max`'s lone-spike rubber-stamp.
- `batchEligible({mode:"improving"})` (L198–202): closed-form entry regardless of score (NaN closure → not
  eligible, fail-safe).
- `acceptsRound` / `acceptsBatch` decision functions are **byte-unchanged** — the spike changes only which
  scalar the caller passes (`aggregateVotes`) and WHEN it batches (`batchEligible`). No-rubber-stamp guards
  (form-integrity, regression, added-major, net-minor, tie) are reused, not forked.

## The baseline this re-climb is measured against — T-211 (the capstone, 7:35am today)

`docs/active/work/T-211-01/{climb.log,trajectory.json}` + `builds/gatehouse/picture-climb/round-*`. Ran with
`CLIMB_MAX_ROUNDS=8 CLIMB_BATCH_SIZE=4` (median/floor — the OLD rule). Trend `0 → 0 → 0 → 0 → 8 → 8 → 8`
(Δ+8; stop: stalled). The two moves the median discarded, verbatim from the log:
- **Round 2 batch `apply_gable_roof` `(0/12/0)`:** ROLLED BACK "compound tie at floor — no read". The +12 gable.
- **Round 4 `rebuild_arch` `(8/0/48)`:** ROLLED BACK "tie (0): no shrink". **The +48 centered arch — the
  headline.** `gate ok=true … centeredByConstruction=true faceW=30` — the arch was clean and centered; the
  median (8) discarded the lone 48.
- Kept build = closed dark box + stepped/gabled cap + walls (+8), **no centered gate** (rolled back), boxy.
  T-211 fired the pre-committed STOP-LINE: M1 near-miss, binding = the MEASURE (per-move median + floor-only
  batch), not the build. **That is exactly the seam T-213's winner removes.**

## The hypothesis, mechanically (from T-211's recorded votes)

With `trimmedMean` + `improving`, the two discarded moves should now KEEP:
- The `(8/0/48)` arch: `trimmedMean([8,0,48]) = mean(8,48) = 28`; delta `28−8 = 20 ≥ margin 4` → **KEEP**.
- The `(0/12/0)` gable: as a compound, `trimmedMean([0,12,0]) = mean(0,12) = 6`; off-floor batchMargin 4 →
  delta 6 ≥ 4 → **KEEP** (at floor, batchMargin 1 → also keep). (Votes are re-drawn live; these are the
  recorded T-211 draws, used only to predict direction — the run is non-deterministic.)
- `improving` mode also batches detail off the floor once the shell is closed, so the dressing compound
  (gable + arch + relief) can be judged together rather than each per-move-rolled.

## Constraints / boundaries

- **Non-deterministic + metered.** Each scored build = VOTES=3 strong-tier `claude -p` diagnoses; the picture
  score has a documented 0–76 same-seed swing. Failure-mode 3 (variance dominates the aggregator → the SCORER
  is the ceiling) is checked from the recorded vote spread + a reproducibility read.
- **T-198 timeout guard (180s/subprocess, `CLAUDE_SUBPROCESS_TIMEOUT_MS`).** A timed-out vote is DROPPED; an
  all-votes-failed round writes an abort record + exits non-zero (never a fabricated 0). GL is **AVAILABLE**
  (probed). Subscription shim only — never `ANTHROPIC_API_KEY` / the metered API.
- **Frozen instrument untouched:** `measurements/**`, `benchmarks/**`, the DiagnoseBuild scorer. The spike
  changes vote aggregation + batch entry, never how a build is scored.
- **Form moves (close_shell/construct_walls) break a detail batch** (closureDecidedMove) — they can reopen the
  shell (re-climb 1: 1.000→0.068). The batch stacks only detail/roof picks; `acceptsBatch`'s form-integrity
  guard rejects a reopening compound.
- **Renders:** `builds/gatehouse/picture-climb/round-N/{view-*.png, beside-concept.png}` per round; the verdict
  reads first / best / final beside the concept (`benchmarks/.../015-…/concept.png`).
