# T-196-01 — REVIEW: the eyes widened, and what they saw on the real gatehouse

Story **S-196** / Epic **E-51**. M1 capstone. Two jobs: **widen the picture-critique** to see roof-orientation
and scale/proportion, and **re-run the gatehouse climb** with the E-51 hands + wider eyes.

## Verdict against the falsifiable claim

The wider eyes were **built, unit-proven, and fired correctly on the real composed gatehouse**: orientation
reads **quiet/correct** (the gable faces the gate — no false positive) and scale **flags a real, borderline
steep-gable proportion gap**. The two E-51 hands (relief + carve) **compose** — the carve's aperture-coherence
gate passes once the relief shell lands. The anti-hedge failure mode the AC names — *"the new coverage
mis-fires → false-positives a correct build"* — **did not occur**: orientation is quiet on the correct build,
and the no-pixel-false-positive crux (a uniform up-scale stays quiet) is proven (FR6). The **metered LLM climb
hung** on a non-returning strong-tier `claude -p` subprocess (an environment hang, not a code defect), so the
*metered* verdict — does the critique's WALL major clear, does the agent pick carve live — is **deferred and
named**, carried by the deterministic eyes + the zero-spend integration glance.

## What changed

| File | Change |
|------|--------|
| `src/view/framing.mjs` | **NEW (pure, in `npm test`).** The framing axis: `frontAxisOf`, `buildRidgeAxis`, `orientationFraming`, `proportionRatios`, `targetRatiosOf`, `scaleFraming`, `framingReport`. A SEPARATE axis (the S-163-sanctioned schema-v2 path), not a department. |
| `src/view/framing.test.mjs` | **NEW.** FR0–FR7: flags-when-wrong / quiet-when-right on correct / rotated / distorted / **uniform-upscale (FR6 crux)** fixtures. |
| `experiments/eval-alignment/picture-climb.mjs` | `framingReport` wired into `scoreBuild` (attached to every scored build, GL-free), `agentPick` (shows orientation/scale flags + the "no tool fixes these → `done`" note), and the trajectory (`framing` per round + top-level `framingResidual` → E-49). PROGRAM loads early so the eyes ride the GUARD_ONLY seam. |
| `docs/active/work/T-196-01/framing-evidence.mjs` | Zero-spend real-subject proof (production roof generator). |
| `docs/active/work/T-196-01/render-e51-glance.mjs` | Zero-spend E-51 integration glance (the metered run hung). |

**Frozen instrument untouched:** no `measurements/`, `department.baml`, `diagnose.mjs`, `bakeoff-score.mjs`,
schema, or department-set change. The framing axis is **reported, never scored** — the scalar stays byte-stable.

## The central design decision (and why it diverges from the literal ticket)

The ticket says "teach DiagnoseBuild to judge orientation + scale." Research found that path is blocked three
ways: (1) the S-163 decision (recorded in 5 places) holds proportion/massing is a SEPARATE AXIS, not a
department — a SCALE department names zero idioms and breaks the DPT/DPT3 partition; (2) DiagnoseBuild's prompt
is byte-pinned (FX-DB1) and explicitly excludes size; (3) a VLM judging absolute scale from a thumbnail is the
exact false-positive the AC forbids ("scale judged on proportion, not render pixels"). So the chosen design is a
**deterministic framing axis** — the sanctioned schema-v2 path realized as code. It is unit-testable
(flags/quiet without an LLM) and never a thumbnail-vs-zoom false positive. Documented in `design.md`.

## The ACs, answered

- **Orientation + scale coverage added; flags-when-wrong / quiet-when-right; no false positives.** ✔
  Unit (FR0–FR7) + real-subject evidence: orientation quiet on the correct gable, flags the rotated one; scale
  quiet when proportions match, flags a stretched footprint / steep roof, and **quiet on a uniform up-scale**
  (FR6, the crux). On the real composed gatehouse: orientation **quiet/correct**, scale **flagged** (steep
  gable, `ridgeToEave` 1.6 vs 1.35 = +18.5% on the clean gable, +24.8% after relief).
- **Re-run the climb with all E-51 hands; trajectory + beside-concept renders.** ◑ The **metered** run hung
  (below); the **zero-spend integration glance** (`render-e51-glance.mjs`) delivers first (seed) + final
  (gable+relief+carve) beside-concept renders and the hands' live composition. Trajectory from the metered run:
  **deferred** (hang).
- **Human-glance check: reached-its-picture OR the named residual ceiling.** ✔ The final glance reads as a
  **dressed grey-stone gatehouse with a peaked gable + proud corner quoins + a dark arched carved gate** — much
  closer to its picture than the seed blob. **Named residual ceiling → E-49:** (1) roof MATERIAL is brown-spruce
  vs the concept's grey (recolor_roof's job — E-48, out of E-51 scope), (2) the gable is too STEEP vs the
  compact concept (the scale flag — no hand fixes roof pitch). **Intervention:** the glance is fully scripted
  (zero human picks); the metered autonomous-pick verdict is the deferred piece.
- **Recorded honestly at full strength; scale judged on proportion, not render pixels.** ✔ Scale flags only on
  the dimensionless ratios `aspect` + `ridgeToEave`; `roofShare` is reported-not-flagged (it diverges from the
  declared intent by construction — flagging it would false-positive the correct build). The metered hang is
  named, not hidden.
- **`npm test` green; frozen instrument untouched.** ✔ 2358/2358; `git status` shows no `measurements/`/BAML/
  schema/scorer change.

## Two evidence-driven deviations from the plan

1. **`RIDGE_TIE` (absolute) → `RIDGE_LINE_FRAC` (ratio).** Running the eye on the real seed showed an absolute
   extent-gap fabricated a ridge axis on a transformed GLB blob (a false positive). A true gable ridge is a
   LINE (short perp extent ≪ long ridge extent); the axis is now read only when the shorter top-extent ≤ 0.5 of
   the longer. A near-square voxelized blob top fails this and **SKIPS** — the structural guard against false
   positives. (Found and fixed in Step 2.)
2. **The orientation eye goes LIVE only on a clean ridge.** The raw seed (the climb's round 0) is a voxelized
   blob with no readable ridge → orientation SKIPS (conservative). It becomes live once a roof hand builds a
   clean gable (round 1+). This is the honest real-subject finding; the evidence reads framing on a clean gable
   accordingly.

## The metered-climb hang (the one thing a human should know)

`CLIMB_OUT=… node experiments/eval-alignment/picture-climb.mjs` rendered round-0 then **hung ~20 min on a
non-returning `claude -p --model claude-opus-4-8` strong-tier diagnose** (node idle: 0:25 CPU / 21 min elapsed;
the child process blocked at 0:11 CPU; spawn count frozen at 8). Killed. This is the recorded hung-subprocess
failure mode, **infra not code** — the runner wiring is GUARD_ONLY-clean and the hands compose (glance). A
re-run (possibly with a per-call timeout guard on the tiered op, or VOTES=1) would likely complete; the metered
autonomous verdict is the single deferred deliverable.

## Test coverage & gaps

- **Covered (in `npm test`):** the entire `framing.mjs` core — front-axis read, ridge-line detection (incl. the
  blob-SKIP guard), orientation flag/quiet/skip, proportion ratios, target ratios, scale flag/quiet, the
  uniform-upscale no-false-positive crux, report shape + purity + fail-loud. 8 tests; full suite 2358/2358.
- **Not in `npm test` (by design — metered/GL):** the runner wiring (GUARD_ONLY-smoked), the evidence + glance
  reproducers (run, numbers recorded), the metered climb (hung).
- **Gap (named):** no metered DiagnoseBuild assertion that the WALL major clears or that the agent picks carve
  live — deferred by the hang, the single open integration question.

## Open concerns / handoff (→ E-49)

1. **The steep-gable scale flag has no lever.** `apply_gable_roof`'s generated pitch makes the build ~18–25%
   taller in ridge:eave than the recognized intent. The eye now NAMES it; no hand adjusts roof pitch/mass scale
   (the S-163 geometry-lever path is off the picture-climb). This is the named fourth gap for E-49.
2. **Scale is tolerance-edge on this build** (`ridgeToEave` delta 0.185 clean → 0.248 after relief). The relief's
   proud plinth perturbs eave detection enough to tip the flag — a real sensitivity. Orientation is unaffected
   (cleanly quiet). If a future build sits exactly on the edge, this could flap; `SCALE_TOL`/`EAVE_FULL` are the
   knobs, tuned on real numbers, reported here.
3. **Roof material (brown vs grey)** is the recolor_roof (E-48) hand, not E-51 — the glance isolates the E-51
   WALL+OPENING hands, so the brown roof is expected, not a regression.
4. **The metered climb should be re-run** once the hung-subprocess condition clears (a tiered-op timeout guard
   would make the runner robust to it) to close the deferred WALL-major-clears / live-carve-pick question.
