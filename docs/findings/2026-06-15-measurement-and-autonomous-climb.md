# Findings — the measurement-first stage (2026-06-15)

*Plain-language report of one working stage. Full technical record, ledgers, and before/after renders:
`experiments/eval-alignment/FINDINGS.md`.*

## What this stage was

We reset the project's purpose: the real achievement is a **measurement** — an eval that captures what
makes a build good — not prettier builds. Minecraft is the substrate. The transferable skill is defining
quality where it's subjective, breaking the metric hard enough to find where it fails, fixing it, and
showing an agent improve against the corrected version.

## What we proved

- **Built a build-quality eval and caught it being wrong five+ times, fixing each.** It over-read a
  trivial wall-colour difference (a human blind-ranking *refuted* the score); it was noisy across repeat
  calls (fixed by voting); its single "worst defect" pick is unstable only when two defects are genuinely
  co-dominant. We measured the eval's own reliability and found it more trustworthy than we'd claimed.
- **Showed an agent climb the corrected eval.** Given the eval's verdict, the agent picks a tool, applies
  it, and re-measures. It autonomously improved **2 of 3 building types substantially** — a barn from a
  roofless holey shell to a solid barn with walls, windows, and a gable; a gatehouse similarly. Verified
  by looking at the renders, not just trusting the score.

## The honest state

- **2/3 buildings climb; the cottage does not yet.** Its walls have *missing pieces* that patch-tools
  can't add; it needs walls **rebuilt** from a recognised footprint, not patched.
- **The climbs come from one strong move:** *replacing* the messy auto-generated roof with a cleanly
  *constructed* gable. Patching the walls plateaued.
- **The eval is reliable** (small run-to-run noise on a fixed image). Earlier "noise" worries were mostly
  different builds being compared — plus one claim I overstated and then corrected.

## What we learned (stated without the Minecraft words)

- **Replace beats patch.** The big gains came from replacing a noisy auto-generated component with a
  clean constructed one — not from patching the noise.
- **Simpler system won.** Adding more tools to chase a number made results *worse*; the minimal toolset
  scored best. Don't elaborate to hit a metric.
- **Measure your own metric.** Rigorously checking the eval's reliability corrected a claim we'd inflated.
- **Don't hedge under fatigue.** Late in a long session I called "diminishing returns" to justify
  stopping — but the builds were improving and the critic still listed real faults. That's *headroom*,
  not a ceiling. Running long is a reason to compact and continue, not to quit.

## What's next (drive the loop with these)

1. **Build walls and massing from recognition — don't patch the mesh.** Apply the proven
   replace-not-patch move to walls, using the recognised footprint/storeys already on disk
   (`benchmarks/sculpture/recognition/*.program.json`). Most likely to unstick the cottage and climb all
   three. This is also just the pipeline philosophy: build from recognition, don't fit the mesh.
2. **Human-preference validation of the eval.** Now that builds span quality, assemble a small set the
   reviewer ranks blind, and check the eval agrees on the *hard* (close) pairs. This is the
   differentiator's main open gap — the eval is validated on coarse structure, not the contested middle.
3. **The price of admission — volume and longevity.** Run the agent across many subjects, unattended,
   over time. This is deployment/elapsed-time work — the part no single session demonstrates.

## Reusable assets from this stage

- `experiments/eval-alignment/defect-eval.mjs` — the defect-dominated quality eval (worst defect caps).
- `experiments/eval-alignment/autonomy-loop.mjs` — the agentic climb: eval → agent picks tool → apply →
  re-measure, with action-memory and a batch volume runner.
- `experiments/eval-alignment/roof-climb.mjs` — the replace-the-roof brush that drives the climbs.
- Witness renders: `experiments/eval-alignment/*-beside.png`, `autonomous-volume-climb.png`,
  `climb-three-builds.png`.
