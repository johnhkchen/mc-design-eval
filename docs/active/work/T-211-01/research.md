# T-211-01 — Research: re-climb (batch on) + M1 glance verdict + the stop-line

**Epic E-54 / Story S-211.** The capstone and the stop-line. This is a **run-and-judge** ticket: it adds no
new hand. With the relief-tolerant closure (T-209) and the centered gate (T-210) now on the live source path,
re-run the metered gatehouse climb with the cold-start batch escape on, then judge the **kept** build on the
glance and invoke the pre-committed E-54 stop-line. Descriptive map below — what exists, where, how it connects.

## The runner — `experiments/eval-alignment/picture-climb.mjs`

The single climb runner (~920 lines). Not in `npm test` (metered, by repo convention — like T-201/T-205/T-207).

- **Subject is hardcoded to the gatehouse** (`SUBJECT = "gatehouse"`, lines 58–65): seed artifact
  `benchmarks/sculpture/generated/gatehouse/artifact.json`, recognition program
  `benchmarks/sculpture/recognition/gatehouse.program.json`, concept
  `…/runs/015-…stone-gatehouse…/concept.png`, material-map `…/material-map/gatehouse.json`.
- **Env knobs** (lines 84–94): `CLIMB_MAX_ROUNDS` (default `CLIMB_DEFAULTS.maxRounds`=5), `CLIMB_BATCH_SIZE`
  (default 0 = OFF), `CLIMB_SCORE_FLOOR` (default `BATCH_DEFAULTS.scoreFloor`), `CLIMB_OUT` (trajectory path),
  plus zero-spend probe gates (`GUARD_ONLY`, `ROOF_MATERIAL_PROBE`, `REBUILD_ARCH_PROBE`, `ROOF_MATERIAL_DIAGNOSE`).
- **Judge:** `TIER="strong"`, `VOTES=3` (median out the matched-build score swing). Each round renders four
  azimuths + a beside-concept sheet (`scoreBuild`, line 527) into `builds/gatehouse/picture-climb/round-N/`.
- **Trajectory + log:** writes `CLIMB_OUT` JSON; `console.error` stream is the human log (`2> climb.log`).
- **Final record** (lines ~905–918): `schema:"picture-climb/v1"`, `climbed`, `stopReason`, per-round trend,
  `votesTimedOut`, `subprocessTimeoutMs`.

## How T-209 and T-210 reach the run (no runner edit needed for the fixes)

Both dependency fixes are in **source modules the runner already imports** — they take effect automatically:

- **T-209 closure (relief-tolerant `eaveRingClosure`)** lives in `src/view/wall-generate.mjs`. The runner calls
  it via `closureNow` (line 733) and the batch's `batchClosure` (lines 779–780), passing
  `{floor, eaveY:CFG.eaveY, openCols, program:PROGRAM}`. The T-209 rewrite censuses `[floor..eaveY-1]` (below the
  roof base course) → a proud-dressed closed wall reads **0.964 ≥ 0.9** instead of collapsing to 0.068. The
  `acceptsBatch` form-integrity guard (T-208) consumes `closureBefore/closureAfter` (line 812) — so the +20
  dressed batch is no longer rejected as a false reopen.
- **T-210 centered gate** lives in `src/view/aperture-carve.mjs` (`centerOnFace`, `inheritedSlotResidual`,
  `carveTargetCells({faceSpan})`) and is wired into the runner's `rebuild_arch` (live) + `carve_arch` hands
  (picture-climb.mjs ~lines 297–388): they build `faceSpan` from the wall-band u-span on the recognition
  `door.wall`, center by construction, and fill any off-span inherited slot. `target.{uLo,uHi}` flow unchanged.

So the capstone run is: **set the env knobs, run the existing runner.** No source change is expected. The only
code that could change is if the run surfaces a defect (an invariant leak) — and per the stop-line that is a
finding, not necessarily a fix-here.

## The T-198 timeout guard (must be active — AC requirement)

`CLAUDE_SUBPROCESS_TIMEOUT_MS` (from `src/config.mjs`, line 44) bounds each strong-tier `claude -p` diagnose
child. A timed-out vote is DROPPED (typed `ClaudeTimeoutError`); a round whose **every** vote failed is an
`RoundAbortedError` → `writeAbortRecord` persists the partial trajectory and the process **exits non-zero
cleanly** (never a fabricated 0, never a hang). The final record reports `votesTimedOut`. This is the guard the
AC requires; it is already in the runner and needs no flag.

## Prior runs — the baseline this re-climb must beat

- **T-207 (per-move, batch OFF):** `0→0→0→0→0→0` on a genuinely-closed form — detail moves scored 0 and rolled
  back. The median-gradient problem.
- **T-208 re-climb 1 (`CLIMB_BATCH_SIZE=4`):** `0→0→0→12→12`, `climbed=true` — but the batch admitted
  `construct_walls` which reopened the shell (closure→0.068); form-integrity fix added.
- **T-208 re-climb 2 (with fix):** batch read **+20** (`apply_gable_roof+rebuild_arch+relief_walls`) but was
  **ROLLED BACK** — `relief_walls` stood the wall proud → `eaveRingClosure` collapsed 1.000→0.068 → the guard
  read a false reopen. This is the exact bug T-209 fixed. The +20 build is `beside-batch-rollback.png`: dressed
  stone-brick walls, proud cobble quoins, gable, boxy massing — "the best build of the whole arc," rejected by a
  metric bug. Brown (not slate) roof; centered gate not yet present (pre-T-210).

The capstone hypothesis: with T-209 (no false reopen) + T-210 (centered gate) on, that same +20-class dressed
batch is now **KEPT** on a stayed-closed form, ideally with the centered arch and slate roof compounded in.

## What "judge the kept build" means here

The trajectory + final record give the **kept** build's score, round-by-round picks, whether it left 0, the
plateau, and `closureLast`. The **glance** is the human read of the kept build's beside-concept render against
`concept.png`: closed dressed walls + centered arched gate + dark gabled roof + right proportion = M1. The
runner emits per-round `beside-concept.png`; first / best / final are copied into the work dir as evidence.

## Constraints (hard, from the ticket + CLAUDE.md + governing memory)

- **Frozen instrument untouched** — `measurements/` byte-clean before+after; the frozen `DiagnoseBuild` /
  `styleFidelityScore` judge unchanged. Only `builds/` (drafts) and the work dir are written.
- **Subscription shim only** — `ANTHROPIC_API_KEY` must stay unset (verified unset now); never the metered API.
- **`npm test` green** at close (the run changes no source; the suite is 2438/2438 after T-209).
- **The stop-line is pre-committed and reviewer-ratified** — win or lose, this is the last gatehouse fix-and-
  climb. A near-miss is a complete, publishable result; it does NOT license a seventh gatehouse epic. If the
  kept build is not M1 on the glance, the review must state explicitly that the next epic is the **step-back**
  (can the picture-climb finish any subject to M1, and if not what changes), not another gatehouse patch.

## Open questions for Design

1. **Run parameters:** `CLIMB_BATCH_SIZE` and `CLIMB_MAX_ROUNDS` values to match/extend T-208 (=4, =8).
2. **Reproducibility of the verdict:** score variance is itself a falsification mode — does one run certify M1,
   or is a second confirming run needed to rule out the "unreproducible verdict → stop-line" branch?
3. **Evidence capture:** which renders are first / best / final, and where they live after the run.
