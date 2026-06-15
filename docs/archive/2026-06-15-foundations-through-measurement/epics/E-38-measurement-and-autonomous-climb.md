---
id: E-38
title: measurement-and-autonomous-climb
type: epic
status: open
priority: high
spec: "§4, §5, §6"
stories: [S-160, S-161, S-162]
---

## Background (read this first — self-contained)

This epic continues the **measurement-first** line proven in the 2026-06-15 stage
(`docs/findings/2026-06-15-measurement-and-autonomous-climb.md`; full record
`experiments/eval-alignment/FINDINGS.md`). Governed by `docs/knowledge/project-direction.md` (the
differentiator is the **measurement**, not prettier builds) and `docs/knowledge/anti-hedge-directive.md`
(every ticket states how it can fail; report failures).

**What is already proven (reusable):**
- A defect-dominated build-quality eval (`experiments/eval-alignment/defect-eval.mjs`) — caught wrong and
  fixed 5+ times, validated against human ground truth on coarse structure, and shown **reliable** on a
  fixed render (std ≤ 2).
- An **autonomous agentic climb** (`experiments/eval-alignment/autonomy-loop.mjs`): eval verdict → agent
  picks a tool → apply → re-measure, with action-memory and a batch volume runner. It climbed **2/3**
  building types substantially (barn 12→55, gatehouse 12→38, verified by render).

**The key lesson driving this epic: REPLACE beats PATCH.** The climbs came from *replacing* the noisy
GLB-voxelized roof with a clean parametric gable (`roof-climb.mjs`). Every tool that *patched* the
voxelized walls plateaued, and the cottage stayed gated. The next gains come from constructing components
from the recognized program, not patching the mesh — which is also the pipeline philosophy.

**Sharpened diagnosis (2026-06-15, `experiments/eval-alignment/DIAGNOSIS-multimass-and-volume.md`): the
cottage gate and the volume gate are the SAME problem.** A structure read of the recognition programs
shows (a) the cottage is **two perpendicular masses** while the loop's constructor is **single-box** —
it cannot represent two gables (that, not "missing columns," is the real gate); (b) the recognition
program already carries every parameter the loop hardcodes in its `SUBJECTS` map (footprint, eave,
ridge, wall roles), so that map is a lossy hand-authored shadow; (c) the gatehouse has **no** recognition
program — it climbs on pure constants, so 1 of 3 "climbing" subjects isn't recognition-driven at all.
**The single fix — construct each mass from `masses[]` and delete the `SUBJECTS` map — both unsticks the
cottage and is the mechanism for running across many subjects unattended.** That reframes the stories:
S-160 is recognition-driven *multi-mass* construction; S-162's volume falls out of the same change.

## Stories

- **S-160 — construct walls/massing from recognition (replace-not-patch).** The high-leverage move:
  build clean parametric walls (with openings) from the recognized footprint/storeys, discard the voxel
  walls. Most likely to unstick the cottage and climb all three. *(this epic's first story)*
- **S-161 (planned) — human-preference validation of the eval.** Builds now span quality → assemble a
  reviewer-ranked set and check the eval agrees on the *hard* (close) pairs. The differentiator's main
  open gap (validated only on coarse structure so far).
- **S-162 (planned) — volume & longevity.** Run the agent across many subjects, unattended, over time —
  the price-of-admission leg (deployment/elapsed-time).

## Done when

The agent climbs **3/3** current building types autonomously (cottage unstuck), the eval is validated on
a contested human-ranked set, and the volume runner is shown to operate unattended over a real queue —
each with witnessed renders and honestly-reported failures.
