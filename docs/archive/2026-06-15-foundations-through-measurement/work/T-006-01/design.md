# Design — T-006-01: one detail lever

Decide ONE detail lever, where to apply it, and why — grounded in Research. The lever must be
*more powerful* than the falsified soft "must carry layered relief" clause (P15), must not
repeat the v5 color crash (P9), and must be attributable to a single prompt diff.

## Options considered

### Option A — Material-grain / noisier-block-texture lever (build or revision)
Require flat fields to use 2–3 related blocks of the dominant family (smooth/cut/chiseled) for
surface grain, à la run 015's window lattice.
- **Pro:** run 015 showed busier texture reads as more detail — a validated small lever.
- **Con (decisive):** this is *exactly* what v5 did and it **crashed color 4 → 2.67** (P9):
  "related blocks" collapse the dominant field into a near-monochrome smear with no
  hierarchy. The promotion rule forbids any color regression. High risk of falsifying itself
  on the wrong dimension. Rejected as the primary lever.

### Option B — Dedicated detail-only 4th pass (new stage)
Add a stage 4 that re-emits the artifact editing only flat fields.
- **Pro:** matches P15's "fenced ornament pass" ideal.
- **Con:** the harness re-emits the *whole* artifact each pass — a true diff-only pass needs
  new harness machinery (incremental I/O), which is **more than one change** and adds a 4th
  metered call. It also can't reuse round-0 as a control. Out of scope for a "change ONE
  thing, attributable" ticket. Rejected (noted as the future structured-I/O direction).

### Option C — Repurpose the revision into a detail-only pass
Strip proportion/crown duties from `composeRefRevisionPrompt`, make it detail-only.
- **Con:** the 2nd pass *earned its keep in 014* by developing the crown (squat → onion dome)
  and proportion (competent → strong). Removing that loses the very gains that make 014 the
  champion. Rejected.

### Option D — Concrete mandatory recessed-panel + string-course grammar (revision seam) ✅
Replace the soft menu bullet ("any plane > ~6 must carry layered relief — recessed panels,
pilaster strips, string-courses, banding, or inset ornament") with a **hard, countable,
relief-based recipe** the model must execute on every flat field:
- Every wall field wider than ~6 becomes a **sunken panel framed by a raised border** (recess
  the field 1–2 blocks by exclusion; frame it with pilaster strips at the edges and a string
  course top and bottom).
- A **continuous horizontal string course** every ~6–8 blocks of height runs across the whole
  body, banding the tall flat fields.
- **Relief only, same palette:** articulation comes from depth/shadow and stair/slab trim, NOT
  from new materials or related-block grain. Colors and the dominant/supporting/accent
  hierarchy are explicitly held — directly fencing off the v5 failure mode.

## Decision: Option D, applied to the REVISION seam (`composeRefRevisionPrompt`)

### Why a grammar, not the existing menu (the hypothesis)
P1: "the model matches the bar you set." The current clause is a *menu of suggestions*
("panels, OR strips, OR courses, OR ...") plus a vague threshold — the model reads it as
"add some relief somewhere" and concentrates articulation on the central pishtaq it was
already detailing, leaving the flanks/plinth flat (exactly what 014/015 show). The hypothesis:
**a soft menu gets soft compliance; a deterministic per-field recipe with countable minimums
gets executed.** Converting the bar from "carry layered relief" to "EACH flat field MUST
become a framed sunken panel; a string course every ~6–8 rows" is a strictly stronger, more
specific bar — a real, testable change in kind, not a restatement.

### Why relief-based, not material grain
The promotion rule requires `detail` strong with **no color regression**. v5 proved material
micro-texture collapses color. Sourcing detail from *relief* (recess + frame + course, same
palette blocks at varied Z, stair/slab trim) raises articulation through shadow without
touching the palette — it cannot crash color the way related-block grain did. This is the
single most important design constraint and it eliminates Option A.

### Why the revision seam, not the build (the attribution argument)
Research Finding 3: placing the lever in the revision **leaves round-0 (the build) unchanged**.
Round-0 then is a within-run *control* and `render.png` the *treatment* — the AC already
mandates judging both, so the A/B becomes causal: any `detail` lift from round-0 → render is
attributable to this one clause, and round-0 stays comparable to the 015 baseline. Editing the
build would move round-0 too and forfeit that control. The revision seam is also the most
isolated (only `vRefRevise-designdoc` calls it) and needs no `baml:gen`. The ticket itself
names `composeRefRevisionPrompt` as the revision seam and frames the experiment around the
fenced 2nd pass (P9/P14) — Option D is the faithful realization.

### Risk: the monolithic-revision trade-off (P9)
The revision re-emits the whole artifact, so a strong new detail mandate could steal budget
from the proportion/crown work that 014's revision did well. Mitigations in the prompt:
- Keep the existing proportion/crown/one-plane bullets **intact and first** — the panel
  grammar augments, does not replace, the relief/proportion duties.
- Make the grammar *cheap to express*: panels and courses are `fill`/`box`/`line` runs (the
  prompt already steers toward these for efficiency at scale), not per-voxel ornament, so the
  op budget cost is modest.
- The A/B + robustness gate is the backstop: if proportion/color/fidelity regress, the rule
  says revert and record the negative result. A falsified lever is still a finding.

## What "one thing" means here
Exactly one bullet in `composeRefRevisionPrompt` changes: the `Detail — NO LARGE FLAT FIELDS`
bullet is rewritten from a menu into the mandatory panel+course grammar (relief-only, palette
held). No other prompt, no build change, no schema/rubric/brief change, no harness change.

## Verification of the hypothesis (decision rule, from AC)
Promote to champion **iff**: `detail` rises a full category to *strong*, AND no regression on
proportion/color/fidelity, AND overall stays ≥ *strong*, AND robustness holds — `detail`
*strong* across **2 generations** of the variant OR a clear describable articulation increase
vs the 015 baseline render. Otherwise revert the diff and record the negative result. A
within-band wobble (single noisy `detail=strong`) does **not** promote.
</content>
