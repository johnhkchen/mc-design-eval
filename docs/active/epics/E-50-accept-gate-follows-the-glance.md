---
id: E-50
title: accept-gate-follows-the-glance
type: epic
status: open
priority: high
depends_on: [E-48]
spec: "§1, §7, §9"
stories: [S-191, S-192, S-193]
---

## Background (read this first — the bottleneck moved to the accept signal)

**Milestone rung: M1 finish line — "the gatehouse reaches its picture, under the loop's own steam."** E-48
proved the picture-driven climb *works*: the gatehouse went box → recognizable gabled gatehouse (+52),
fully autonomous, glance-agreed. Then it hit a sharp, surprising ceiling (T-190-01): the loop **saw** the
roof-colour gap, **had** the hand (`recolor_roof`, S-189), the agent **picked it unprompted** and it
**cleared the ROOF major** to a concept-true dark roof — and the **accept-gate rolled the correct fix back**
because the whole-build scalar regressed 60→48.

The mechanism is recorded and clean: clearing the ROOF major let the judge's attention shift to two
**pre-existing** divergences (the missing arched gate, the weak quoin contrast — neither touched by
`recolor_roof`), promoting them minor→major, plus vote noise (grey votes 52/40/48 vs brown 60/60/52,
overlapping bands, margin crossed by luck of the draw). The whole-build scalar fell **not because anything
got worse, but because fixing the worst thing reveals the next-worst thing.** By the governing rule — *"if a
build passes the gate but fails the glance, the glance wins"* — the build **failed the gate but passed the
glance, so the gate is wrong.**

So the bottleneck is no longer eyes, hand, or agent (all worked). It is the **accept signal**. This epic
fixes that ruler, then finishes the one-subject climb the fix unblocks.

**Crucial scope distinction:** this is the **creation-loop accept-gate** (the whole-build `styleFidelityScore`
that decides keep/rollback inside the workshop), **NOT** the E-46/E-47 promotion-gate term (the
frozen-instrument-bound statistical measure). Fixing this gate is squarely warranted — it's rolling back
glance-confirmed improvements — and is *not* the "don't over-polish the ruler" caution, which was about the
promotion term. Governed by `docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md`;
frozen instrument untouched throughout.

## The fix, and why it's genuinely uncertain (the anti-hedge core)

T-190-01 named the fix: a **department-dominant override** — keep a tool that **cleared a major in a
department it targets** AND **introduced no new major in any department it targets**, even on a whole-build
scalar regression (the regression is then provably attention-shift to *untargeted* departments — here ROOF
cleared 1→0, the new majors are WALL+OPENING, which `recolor_roof` does not touch). That single rule keeps
the grey roof.

But it **trades scalar-trust for department-trust, and that trade can fail** — this is the genuinely
uncertain fixture the epic must attack, not assume:

- **Major/minor is coarse.** A tool could clear one major in its target while introducing several new
  *minors* in that same target (not majors) that sum to real degradation — the "no new **major**" guard
  would wrongly **keep a bad change.** Does the guard need "no net minor increase in the targeted department"
  too?
- **The labels are noisy.** Major/minor itself flickers across votes (the very noise that rolled the roof
  back). An override that trusts a noisy label could keep or reject on a coin-flip.
- **Vote noise is a second, separate lever.** Part of the −12 was overlapping vote bands. More votes (or a
  noise-aware accept rule) would shrink that independently of the department override. Spike both; let the
  evidence say whether the override alone suffices or noise-reduction is also needed
  ([[diverge-before-converge-experiment-freedom]]).

## Human-glance audit of the E-48 best build (reviewer, 2026-06-17)

Looking at the gatehouse render beside the concept, the reviewer named **three divergences the picture-critique
did NOT surface** — a significant meta-finding: the critique reads material / presence well but is **blind to
orientation, opening-cleanliness, and scale/proportion relationships.** The climb cannot stall on what the
critique cannot see, so some of these need the *eyes* widened, not just a hand.

1. **The roof is rotated 90° vs the gate.** The concept's gable faces the gate (gate in the gable end); the
   build's ridge runs the other way (gate under an eave slope). Root cause: `apply_gable_roof` derives the
   ridge axis from the footprint, which is **ambiguous on the near-square gatehouse** (the standing
   `registerRect` ambiguity) and unrelated to the facade. Fix: orient the gable to the **recognition-declared
   front / gate face**, not the footprint guess. → S-192 (hand), but confirm the critique can *see* orientation.
2. **A void on both sides (two undressed through-passages).** A gatehouse with a through-passage (two gates)
   is sensible, but both apertures read as raw holes, not dressed gates. The arch hand must **dress BOTH
   passages**, not one. → S-192.
3. **Scale/proportion looks larger than the concept's gatehouse.** Partly a framing caveat (concept thumbnail
   vs zoomed build render — absolute pixels aren't comparable), but the *proportion/massing* may be off. This
   is the E-33/E-34 proportion-ruler thread, and the critique likely doesn't flag it. → flag as a
   critique-coverage gap; weigh widening the critique here vs deferring to the proportion thread.

**These three are the clearest evidence yet that the next frontier after the accept-gate is critique
COVERAGE** (orientation / scale / opening-cleanliness) — the human glance is still seeing more than the loop's
eyes. S-192 absorbs the two buildable items; the coverage gap is named for the reviewer's call (here vs a
successor).

## Stories

- **S-191 — make the accept-gate follow the glance (department-dominant override), falsified.** Implement
  the override; prove it **keeps** the glance-correct grey roof (re-run the gatehouse climb past round 3 —
  the dark roof now sticks) AND prove it **rejects a genuinely-bad change** on a deliberately-adversarial
  fixture (a tool that clears a targeted major but degrades its own target). If the "no new major" guard
  leaks, tighten it (net-minor guard) — on evidence.
- **S-192 — build the remaining gatehouse hands the resumed climb stalls on.** With the roof now sticking,
  the climb's next stalls are the T-190 eyes-no-hands list: the **arched gate** surround (OPENING), finer
  **wall-relief / quoin contrast** (WALL), the **eave/verge banding** course (trim). Build them in the order
  the climb actually stalls — not a speculative list.
- **S-193 — finish the gatehouse climb (the M1 proof).** Run the climb to completion; show the gatehouse
  **reaches its picture** — dark roof + arched gate + quoin contrast + banding all present, human-glance
  agreed against the concept — mostly autonomous; name any residual ceiling. This is the M1 capstone: one
  house that looks like its picture, built by the loop.

## How this epic can fail (state it up front — anti-hedge)

- **The override keeps a bad change.** The "no new major in a targeted department" guard is too coarse and a
  net-degrading fix survives — department-trust was misplaced. A real, valuable refutation: the accept signal
  needs finer than major/minor, or the climb needs a human spot-check on kept regressions.
- **The override doesn't fire / the roof still rolls back.** The condition mis-models the case (e.g. the hand
  *does* touch a department that gains a major) → re-localize.
- **The remaining hands re-trip the gate.** Building the arch clears OPENING but shifts attention again, and
  the override doesn't generalize past the roof case → the gate fix was roof-specific, not general.
- **It reaches the picture only with heavy human steering** — not an autonomous climb (the M1→M4 honesty;
  report how much human each round needed).

## Done when

The creation-loop accept-gate keeps a department-dominant, glance-correct fix (the grey roof sticks) and is
falsified against a deliberately-bad change (it rejects it, or the guard is tightened until it does); the
remaining gatehouse hands the resumed climb stalls on are built; and a completion run shows the gatehouse
reaching its picture — dark roof, arch, quoins, banding — human-glance agreed, mostly autonomous, with the
residual named. Or a failure above is reported at full strength (the override's department-trust refuted, the
finer signal named). Frozen instrument untouched.
</content>
