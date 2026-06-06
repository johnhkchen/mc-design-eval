# E-23 hollow cottage — the 2.5-D interaction sector, proven on one build (the milestone handoff, T-083-01)

The **terminal E-23 handoff** for the showcase. **The beat:** the build pipeline could make a face *look*
right, but every prior build was a **solid mass** — no inside, and the LLM either drowned in 57k voxels or
edited blind. E-23 introduced the **2.5-D interaction sector**: hand the model a *task-shaped view*, let it
act through two paths, and switch the gate at the craft→design line. This milestone runs **all of it on one
cottage** — exterior-accurate **and** hollow **and** divided into rooms — in a single chained pass
(`npm run milestone:cottage`).

## Why it lands — both paths, both gates, one build

A reviewer opens **one artifact** (`docs/active/work/T-083-01/milestone-cottage-artifact.json`, AJV-valid)
and sees a cottage that is, simultaneously:

- **Accurate outside** (the *judgement* path): the E-22 grey-stone drift is spray-painted back to
  **half-timber** — plaster `white_terracotta` **8 → 315**, front-face resemblance **0.25 → 0.40** vs the
  concept. The before/after is the headline image.
- **Hollow inside** (the *program* path): **978** enclosed voxels carved (cavity **6438 → 5460**), structure
  retained, and the exterior is **provably unchanged** (the 10-camera surface digest is held — the carve is
  invisible from outside).
- **Divided into rooms** (the *program path crossing into design*): a **2×2 grid floorplan** across both
  storeys (footprint 26×32, floor lines [0, 14]), **395** floor+wall placements, the **plausibility gate
  PASS** on all six constraints — again exterior-held.

The **gate-switch** is the thesis: the exterior is judged by **resemblance** (there is a concept to match);
the interior is judged by **plausibility** (rooms are *invention* — there is nothing to resemble). Two
genuinely different gates, on one build, because the build crosses the craft→design line.

The **ops are model-scoped**: the hollowable-mass detector ran on **Haiku** (light, scoped to one 3/4 view);
the floorplan author ran on **Opus** (strong — the design reasoning). Right-sized models, one run.

## The cutaway is the proof you can see

A solid render hides the whole point. `cottage-cutaway.png` is a **render-only section** (the real build is
untouched — Rule 3): the **left** is a plan section (roof removed → the room grid from above); the **right**
is a cross-section (front half removed → the stacked floors and the hollow interior). You cannot get that
image from a solid mass, and the multi-angle strip shows the exterior is still a faithful cottage.

## Assets shipped (all committed, in `pr/assets/`)

| asset | path | use |
| ----- | ---- | --- |
| **face before/after** | `cottage-face-before.png` ∥ `cottage-face-after.png` | the headline: grey-stone drift → spray-painted half-timber (same build, exterior) |
| **multi-angle** | `cottage-multi-angle.png` (front · 45° diagonal · 3/4) | the accurate exterior, three angles |
| **cutaway** | `cottage-cutaway.png` (plan section ∥ cross-section) | the hollow interior + the N×M floorplan made visible |

Receipts (the real numbers): `docs/active/work/T-083-01/milestone-report.json` (both gates, both
exteriorHeld proofs, the two metered calls + cost, the cavity + floorplan counts);
`milestone-cottage-artifact.json` (the one finished build); the E-23 capstone in
`docs/knowledge/design-learnings.md`; regenerate end-to-end with `npm run milestone:cottage` (metered: one
Haiku + one Opus call).

## Honest residuals (Rule 7)

- **The +x side has no concept reference** — its GLB splat is accepted *by construction*, not by a per-face
  resemblance delta (the exterior residual; the face itself is no longer the gap).
- **Interior-door↔exterior-door alignment is steered, not verified** — the front-most ortho march can't read
  the recessed door as a hole, so `openings-align` is the in-gate named residual.
- **No stair** — reachability is per-storey; vertical circulation is a plausible next step.
- The benchmark renders see a glimpse of interior **through the real front door** (correct, not a defect):
  the exterior *shell* is byte-stable; only the open doorway shows the room behind it.
