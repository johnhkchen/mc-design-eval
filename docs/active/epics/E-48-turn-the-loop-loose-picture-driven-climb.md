---
id: E-48
title: turn-the-loop-loose-picture-driven-climb
type: epic
status: open
priority: high
depends_on: [E-47]
spec: "§1, §7, §9"
stories: [S-188, S-189, S-190]
---

## Background (read this first — this is where build quality finally moves)

**Milestone rung: M1 capstone — "one house that looks like its picture, reached by the LOOP, not by hand."**
After E-38→E-47 the *ruler* reads the picture (E-47); this epic is the first time we **climb with it**.

The honest framing: for ~9 epics we rebuilt the measurement instrument, because we kept proving the gradient
was lying (style-blind → 2-vote artifact → pack-driven). We **have not improved a build in that stretch** —
the gatehouse is the same `faithful-covered` artifact since E-44. We also already *built* the machinery a
climb needs — structured per-department critique (E-39: department / expected / present / missing / kind) and
a critique→amplify loop (E-43/T-176) — but **never ran it as a sustained autonomous climb on a real build
with a trustworthy, picture-reading gradient.** That is the un-pulled lever, and this epic pulls it.

Governed by `docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md` + the
pipeline-philosophy workshop/ruler split: **the workshop iterates freely and may never call the frozen
judge; the frozen gate convenes once.** The climb's gradient is the *creation-loop* picture-reading critique
(E-47's `DiagnoseBuild`), not the frozen instrument.

### The failure mode this epic must confront head-on: eyes, but no hands

The project's most persistent defect (E-33, the surgical loop, E-15) is **the loop correctly names a defect
it cannot fix.** The E-33 cottage ledger is the canonical case: the model critiqued the proportion defect in
**4 of 6 rounds and never fixed it** — `adjust-params` couldn't reach geometry, `re-recognize` didn't exist.
A picture-reading critique will now say, of today's gatehouse, true things like *"the roof is brown, the
concept's is grey"* and *"the proportions are squat."* The climb is only as good as the **hands** behind the
eyes: for each thing the critique can now name, is there a construction lever the loop can pull?

So this epic does **not** assume the levers exist. It **runs the climb first to discover where it stalls**,
then builds the missing hands, then re-runs — rather than pre-specifying a fix list.

### The entry condition (the strategic call)

E-48 starts the moment the E-47 critique **reads the picture well enough to be a useful gradient** — *not*
when it clears a perfect statistical bar. A good-enough gradient (picture-driven or clearly directional with
high agreement, per S-187) is the entry condition; over-polishing the ruler past that is diminishing returns.
If S-187 lands directional-but-not-strict, that is still the green light here.

## Stories

- **S-188 — wire the picture-critique as the climb gradient + run it (discover where it stalls).** Make the
  workshop loop run render → picture-reading critique → revise → re-render on the gatehouse, with an honest
  **accept-gate** (glance-proxy) and a **restraint/stopping rule** (E-43/T-176's amplitude loop *overshot* —
  hd3 glance-overruled to hd2; the climb must not oscillate). Report, per round, what the critique names and
  whether the loop has a lever to act on it — the **eyes-vs-hands inventory, discovered not assumed.**
- **S-189 — close the highest-leverage hands-gaps the climb exposed.** For the critiques S-188 found had no
  lever, build the hand. The known prime candidate is **roof color** (dark_oak vs the concept's grey — a
  recognition/material-map fidelity gap, the one genuine divergence on the gatehouse); proportions and detail
  are the likely others. Build what the climb actually stalled on, not a speculative list.
- **S-190 — the climb proof + ceiling.** Re-run the sustained climb on the gatehouse; show a **measurable
  round-over-round lift a human agrees with on the glance** (beside-concept renders, the picture-critique
  trend, and a final human glance on a sample). Report the **ceiling** honestly — where it plateaus and what
  it still can't fix (the input to E-49 / future hands).

## How this epic can fail (state it up front — anti-hedge)

- **Eyes but no hands (the real risk).** The critique names defects the loop can't reach, so the build
  doesn't move — the E-33 result repeating at a higher level. A valuable, publishable finding: *the binding
  constraint is construction levers, not the gradient* — and it names exactly which levers are missing.
- **The climb oscillates or overshoots.** Round N fixes the roof, round N+1 over-amplifies quoins and the
  glance regresses (the T-176 overshoot). Then the accept-gate / restraint rule is the sub-problem.
- **The gradient is good enough to rank but too coarse to steer.** A picture-critique that says "roof wrong"
  but not *how* gives the loop nothing actionable — it ranks but doesn't guide. Then the critique needs to
  emit a *direction*, not just a verdict.
- **It only works because a human is in the loop each round.** If the lift needs human nudging every round,
  it isn't an autonomous climb — report how much human is actually required (the M1→M4 honesty: the
  Commissioned Village runs *unattended*).

## Done when

The workshop runs a picture-driven climb on the gatehouse under its own steam; the eyes-vs-hands inventory is
honest (what the critique names vs what the loop can fix); the highest-leverage missing hand(s) are built; and
a sustained run shows a measurable, human-glance-agreed round-over-round lift toward the concept — with the
ceiling named (the plateau and the still-missing hands feeding E-49). Or the eyes-but-no-hands result is
reported at full strength, with the missing levers enumerated. Frozen instrument untouched.
</content>
