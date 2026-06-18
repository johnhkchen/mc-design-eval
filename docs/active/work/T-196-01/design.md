# T-196-01 — DESIGN: a deterministic FRAMING axis (wider eyes), then the metered re-climb

The decision in one line: **add a pure, deterministic `framing` axis** (roof-orientation-vs-front +
proportion-not-pixels) computed from the recognized program + the build occupancy, surfaced into the climb's
eyes (agent prompt + trajectory + named residual) — **not** a new department, **not** a change to the byte-pinned
DiagnoseBuild VLM prompt. Then run the metered gatehouse re-climb with all E-51 hands and record the glance.

## The question

The ticket says "teach picture-anchored DiagnoseBuild to judge orientation + scale." Taken literally, that means
editing the VLM prompt and routing orientation/scale through CritiqueItem departments. Research shows three hard
reasons that literal path is wrong, and one reason a deterministic axis is right.

## Options

### Option A — Teach the VLM prompt (the literal reading). REJECTED.
Add orientation + scale clauses to `department.baml`'s DiagnoseBuild prompt and route them as ROOF/new
CritiqueItems.
- **Breaks the partition / pins.** Orientation could ride ROOF, but scale has no department (S-163: no idiom
  resizes a mass; a SCALE department names zero idioms → DPT conformance fails). Re-bakes FX-DB1 golden fixtures.
- **The exact false-positive trap.** A VLM judging "build larger than concept" from a single thumbnail conflates
  framing/zoom with proportion — the ticket's named failure mode ("mis-fires → noise"). The prompt *already*
  forbids size for this reason (line 101). Re-permitting it re-opens a closed, recorded decision.
- **Non-determinism where we want a clean flags-when-wrong/quiet-when-right gate.** Can't unit-test "no false
  positive on the correct build" against a VLM.

### Option B — A deterministic framing axis, separate from the department contract. CHOSEN.
A new pure module `src/view/framing.mjs` computes two checks from data we already have:
1. **Orientation** — `frontAxisOf(program)` (the declared gate/entry wall's axis) vs `buildRidgeAxis(occ)` (the
   build's actual roof ridge axis, read from occupancy). `gableFacesFront = (frontAxis === ridgeAxis)`. Flags
   the 90° error the reviewer caught; quiet when the gable faces the gate.
2. **Scale/proportion** — `proportionRatios(occ)` (build's `{aspect, ridgeToEave, roofShare}` from the occupancy
   bounding box + roof band) vs `targetRatiosOf(program)` (the recognized intent's ratios from `masses[].rect` +
   `storeys×storeyHeight` + pitch). Flags a proportion DISTORTION beyond tolerance; **quiet on a uniform
   up-scale** (ratios identical) — encoding "judged on proportion, not render pixels."

Surfaced as a `framingReport(program, occ)` bundle attached to each scored build → injected into `agentPick`'s
prompt (the eyes widen), recorded per-round in the trajectory, and rolled up as a top-level `framingResidual`
(the named fourth gap → E-49). **Not** folded into `styleFidelityScore` (no unfixable-penalty noise; the scalar
stays byte-stable; the frozen instrument is untouched).
- **Respects every constraint.** No department, no DPT/DPT3 break, no FX-DB1 re-bake, no `measurements/` touch.
- **Deterministic → unit-testable** flags-when-wrong / quiet-when-right against the gatehouse + a rotated fixture
  + a proportion-distorted fixture + a uniform-upscale fixture (the no-false-positive proof).
- **Honest about the medium.** It is the recorded "schema-v2 axis" the S-163 comments sanction, realized as code
  rather than a VLM clause — the picture-anchored-but-deterministic interpretation of the ticket's intent.

### Option C — Wire the existing fused `silhouetteRatios` / `proportion-vs-concept` check into the climb. REJECTED (partly reused).
`silhouetteRatios` takes a **compiled workshop program** (`elements[]/spec`), but the picture-climb loads the
**recognition program** (`masses[]`) and a live occupancy — the signatures don't match, and the fused check
compares against a *sketch*, not the build occupancy. Reusing it directly would force a compile step into the
runner. **But** we keep its ratio DEFINITIONS (`ridgeToEave, roofShare, aspect`) so the framing axis speaks the
same E-33/E-34 proportion language the rest of the codebase already uses (the ticket's "scale ties to the
E-33/E-34 thread"). `framing.mjs`'s `proportionRatios` is `silhouetteRatios` re-expressed over occupancy.

## Why orientation is build-vs-declared-front, and scale is build-vs-recognized-intent

The reviewer's glance compared the RENDER to the CONCEPT. We cannot robustly re-measure the concept image's
ratios (CV/VLM, fragile). The **recognition program IS the concept, as read** — so:
- **Orientation** anchors on the build's actual ridge (from voxels, *not* `program.ridgeAxis` — a generated roof
  can drift from its declared axis, which is exactly the 90° defect) vs the declared front. Catches real build
  divergence.
- **Scale** anchors on the build's actual proportions (from voxels) vs the recognized intent's declared
  proportions. Catches "the build came out larger / wrong-proportioned than its recognized concept" — which is
  what "build larger than concept" means once absolute thumbnail size is (correctly) discarded.

This is documented as a deliberate anchoring choice, not an oversight.

## The metered re-climb (AC 2-4)

Re-run `node experiments/eval-alignment/picture-climb.mjs` with the nine hands (incl. carve + relief) and the
framing eyes wired into `agentPick`. Because no hand rotates a roof or resizes a mass, when only framing
residuals remain the agent will (correctly) pick `done` — the designed plateau, named for E-49. Deliverables:
trajectory + first/best/final beside-concept renders, the human-glance verdict, and the honest intervention
count.

- **Environment honesty.** The metered climb needs GL + `claude -p` auth (spends). Implement checks
  `GL_AVAILABLE` first. If GL/auth are live, run the full climb. If not, the falsifiable core is still delivered:
  the **deterministic framing evidence** (flags-when-wrong/quiet-when-right on the gatehouse + the three
  fixtures, zero-spend) + the `GUARD_ONLY` render seam, with the metered LLM run named as the live-env step. The
  framing axis is the new, testable contribution; the climb is the integration proof.

## What is rejected and stays rejected

- No new department; no DiagnoseBuild prompt edit; no FX-DB1 re-pin; no scorer/scalar change; no `measurements/`
  edit; no orientation/scale FIX hand (out of scope — that is E-49's generalize, if ever).
- Framing does **not** vote in the accept-gate or the scalar — it is an eye, not a lever. Mis-fire risk is
  contained by determinism + tolerance + the uniform-upscale quiet test.

## Falsification (anti-hedge)

The axis **mis-fires** if it flags the correct gatehouse build (rotated/distorted tests would still pass but the
real build trips a false positive) → re-localize the tolerance. The climb **still plateaus** with a fourth gap →
that gap is named for E-49 (a complete result). The agent **can't sequence** carve+relief+orient → recorded as
an orchestration gap. An embarrassing result (relief-blind critique, or framing that can't separate distortion
from zoom) is still a worthy, precisely-named outcome.
