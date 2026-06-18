# T-196-01 — PROGRESS

## Done

### Step 1 — `src/view/framing.mjs` + `framing.test.mjs` (commit `feat: deterministic framing axis`)
The pure wider-eyes core. `frontAxisOf`, `buildRidgeAxis`, `orientationFraming`, `proportionRatios`,
`targetRatiosOf`, `scaleFraming`, `framingReport`. A SEPARATE axis (the S-163 sanctioned schema-v2 path) — no
department, no DiagnoseBuild prompt edit, no FX-DB1 re-bake, frozen scalar untouched. FR1–FR7 cover
flags-when-wrong / quiet-when-right on correct / rotated / proportion-distorted / **uniform-upscale (FR6, the
no-pixel-false-positive crux)** fixtures. 8/8 + full suite green.

### Step 2 — ridge-line guard + `framing-evidence.mjs` (commit `feat: ridge-line guard + real-subject evidence`)
**Deviation from plan (evidence-driven):** running the eye on the REAL seed showed `buildRidgeAxis` with an
absolute `RIDGE_TIE=2` gap **fabricated a ridge axis on a transformed GLB blob** (a false positive). Fix: a
genuine gable ridge is a LINE (short perp extent ≪ long ridge extent), so the axis is read only when the shorter
top-extent ≤ `RIDGE_LINE_FRAC=0.5` of the longer; a near-square voxelized blob top fails this and **SKIPS**.

**Real-subject numbers** (`node docs/active/work/T-196-01/framing-evidence.mjs`, zero-spend, production roof
generator). `front = {axis:x, side:-x}`, `target = {aspect:1, ridgeToEave:1.35, roofShare:0.2593}`:
| build | ridge | aspect | orientation | scale | residual |
|---|---|---|---|---|---|
| a/ raw seed (round-0 blob) | `null` | 1 | **SKIP** (no clean ridge) | quiet (aspect only) | none |
| b/ clean gable ridge-x (correct) | x | 1 | **QUIET** (faces -x gate) | quiet (ΔridgeToEave 0.185 < 0.2) | none |
| c/ clean gable ridge-z (rotated) | z | 1 | **FLAG** (90° from gate) | quiet | orientation |
| d/ clean gable 30×15 (oversized) | x | 2 | quiet | **FLAG** (aspect 2 vs 1) | scale |
| e/ clean gable ridge-x, uniform ×2 | x | 1 | QUIET | **QUIET** (proportion, not pixels) | none |

**Calibration finding:** the generated gable's `roofShare` (0.375) diverges from the declared intent (0.259) by
construction (a generate-vs-declare gap, NOT a scale defect). Flagging on `roofShare` would FALSE-POSITIVE the
correct build → vindicates flagging only on `aspect` + `ridgeToEave` and merely *reporting* `roofShare`.

### Step 3 — wire the eyes into `picture-climb.mjs` (commit `feat: wire the framing eyes`)
`scoreBuild` attaches `framingReport(PROGRAM, occ)` to each scored build (GL-free, rides the render seam incl.
GUARD_ONLY); `agentPick` shows orientation/scale flags with the honest "no tool fixes these → `done`" note; the
trajectory carries per-round `framing` + a top-level `framingResidual` (→ E-49), printed in the summary. PROGRAM
loads early so the eyes ride the zero-spend seam. `GUARD_ONLY=1` smoke clean (seed correctly logs no flag — a
blob has no readable ridge). GL probed AVAILABLE; `claude -p` auth probed OK.

## Done (cont.)

### Step 4a — the metered re-climb HUNG (environment, not code)
`CLIMB_OUT=… node experiments/eval-alignment/picture-climb.mjs` ran round-0 renders then **hung ~20 min on a
non-returning strong-tier `claude -p --model claude-opus-4-8` diagnose subprocess** (node 0:25 CPU over 21 min
elapsed = idle wait; spawn count frozen at 8; the child blocked at 0:11 CPU). Killed. This is the recorded
hung-subprocess / spend failure mode (memory: spend-limit-reply-failure-mode), an infra hang, not a defect.
The metered verdict (did the critique's WALL major clear? did the agent pick carve live?) is **DEFERRED** and
named honestly. The round-0 seed beside-concept render WAS produced (`builds/gatehouse/picture-climb/round-0/`).

### Step 4b — zero-spend E-51 integration glance (`render-e51-glance.mjs`)
Faithful verbatim copies of the E-51 hands composed on the seed → `builds/gatehouse/picture-climb/e51-glance/`.
The hands COMPOSE: apply_gable_roof (clean gable ridge-x, ridgeY 31) → **relief_walls** (recolor 4075→stone_bricks,
215 proud quoins + 106 plinth, closure held) → **carve_arch** (-x gate carved to width 8, framed+arched,
**aperture-coherence gate ok=true** — scope/coherent/closure all true on the relief'd substrate). This realizes
the T-194-01 handoff: the carve passes its gate once the relief shell lands.

**The wider eyes fire LIVE on the composed build** (the ticket's goal, demonstrated):
- **orientation QUIET/CORRECT** — the recognition-declared ridge-x gable faces the -x gate (no false positive;
  the reviewer's earlier 90° was a runner/recognition bug already fixed by `CFG.ridgeAxis ← program`; the eye
  now CONFIRMS it deterministically).
- **scale FLAGS** — `ridgeToEave` 1.6 vs the 1.35 intent: +18.5% on the clean gable (just under the 0.20 tol),
  tipped to **+24.8% (flagged)** once relief's proud plinth perturbs eave detection. A real, borderline
  steep-gable proportion gap; no hand fixes roof pitch → named for E-49.

Glance verdict (`final-gable+relief+carve-beside.png`): reads as a **dressed grey-stone gatehouse with a peaked
gable + proud corner quoins + a dark arched carved gate** — much closer to its picture than the seed blob.
Residual ceiling: roof MATERIAL brown-spruce vs the concept's grey (recolor_roof's job, E-48 — out of E-51
scope) + the steep-gable scale flag (E-49).

## Deviations from plan
1. `RIDGE_TIE` (absolute) → `RIDGE_LINE_FRAC` (ratio) — see Step 2, evidence-driven (false-positive on blobs).
2. Evidence script reads framing on a CLEAN GABLE (the climb's round-1+ state), not the raw round-0 blob — the
   honest real-subject finding is that orientation goes LIVE only once a roof hand builds a clean ridge.

## Frozen instrument
Untouched: no `measurements/`, `department.baml`, `diagnose.mjs`, `bakeoff-score.mjs`, schema, or department-set
change. `framing.mjs` is a new pure module; the only runner edit attaches a reported (never scored) axis.
