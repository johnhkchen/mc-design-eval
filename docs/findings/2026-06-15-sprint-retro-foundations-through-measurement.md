# Sprint retro — Foundations through Measurement (E-01 … E-38)

*Written 2026-06-15, at the tidying point: 38 epics / 161 stories / 189 tickets archived to
`docs/archive/2026-06-15-foundations-through-measurement/`. This is the full-extent report and the
honest list of what is left wanting and needed, before the next epic line is drafted.*

*Framing (governing): the project's value is transferable AI-engineering capability — defining quality
where it's subjective, breaking the metric to find where it fails, fixing it, and showing an agent climb
the corrected version. Minecraft is the substrate. Read below for what we can now say without the word.*

---

## 1. The full extent — the arc in five movements

**Foundations (E-01 … E-08).** The instrument's plumbing: a validated JSON artifact contract, a headless
voxel→PNG render harness, an experiment harness driving the model through the `claude -p` subscription
shim, and the first scoring/feedback and autonomous-loop scaffolds. *Capability: a reproducible
build-and-render-and-judge pipeline.*

**Form / sculpture era (E-09 … E-19).** Image→3-D (TRELLIS GLB), a CIELAB block-palette engine, a staged
sculptor, and a surgical revision loop, exercised on hard non-building subjects (moai, koi, pineapple,
heart). *What we learned: fidelity is non-monotonic in scale; per-region single-view edits can't
hill-climb a whole-object silhouette; form revision needs a 3-D target; thin subjects defeat image→3-D.*

**Building era (E-20 … E-30).** The pivot from sculpture to styled buildings: full buildings beyond a
facade, concept-grounded materials (recognise nameable blocks, don't colour-match), a faithful-render +
resemblance gate, the spatial-interaction layer, the concept-faithful pipeline, the concept-style kit,
parametric reconstruction, component-fit closure, generate-first provisioning, first-run generalisation.
*What we learned: recognise the building program, build from it, don't fit the mesh.*

**Grammar / discipline era (E-31 … E-37).** The pattern-book builder, the brush factory (the
idiom-registry — an addressable catalogue of construction passes/constructs), the proportion loop, the
straight ruler, facade grammar & relief, then two correction epics: de-freeze the creation loop
(measurement discipline had frozen the build) and the canonical build flow (one chain, one home,
location-encodes-status). *What we learned: relief must be CONSTRUCTION, not recolour; creation must stay
free while measurement stays frozen.*

**Measurement era (E-38) — this sprint's spine.** We reset the purpose to the measurement itself, built a
defect-dominated build-quality eval, caught it wrong repeatedly and fixed it, and showed an autonomous
agent climb the corrected eval across multiple building types. Then we used the eval to interrogate the
generator and the eval *itself*. Details below.

---

## 2. What this sprint proved (E-38 + the eval-alignment experiments)

- **A build-quality eval, caught wrong 5+ times and fixed.** It over-read a sub-threshold wall tint (a
  human blind-rank refuted it); it was noisy (fixed by voting); its single-worst-defect pick is unstable
  only when two defects are genuinely co-dominant. We measured its own reliability: std ≤ 2 on a fixed
  render — more trustworthy than first claimed.
- **An autonomous agent climbing the corrected eval.** Eval verdict → agent picks a construction tool →
  apply → re-measure, with action-memory and a batch runner. It climbed barn and gatehouse substantially,
  verified by render — and, crucially, its *tool discrimination was correct* (picked the roof tool when
  the roof capped, switched to walls the instant the cap moved).
- **Replace-beats-patch, with the mechanism named.** Gains came from *replacing* a noisy auto-generated
  component with a cleanly constructed one. Patches that *cover up* a defect (fill the hole, paint one
  block) both drown the good initial signal and raise the score by concealment — the opposite of climbing.
- **The wall track (S-160: T-160-01/02/04) closed the wall problem honestly.** Geometry now closes for
  dense shells (occupancy close+perimeter) AND sparse ragged shells (registering the program's absolute
  clean rectangle to the build frame — barn perimeter closure 0.701 → 1.000); the skin reads as
  construction (stone base + plaster upper + quoins, eye-confirmed), not recolour. Each ticket refuted or
  corrected its own headline claim in writing.
- **The metric lesson that generalises:** `closureOf` (fraction of a ring's bbox-perimeter actually
  present) beats `coverage` for deciding "is this watertight" — a colonnade traces every post, so coverage
  ≈1 even when it's full of holes. Measure the property you mean, not a proxy for it.

---

## 3. What broke, and what we caught (the honest ledger)

This is the part that makes the work an artifact rather than a demo — each was *run and reported*, not
hidden:

- **The over-read.** A holistic ranker manufactured a confident wrong ordering from a sub-threshold tint;
  a human blind-rank refuted it. Fix: defect-dominated scoring (worst defect caps; sub-threshold can't
  move the score).
- **The context-pressure hedge.** Late in a long session, "diminishing returns / converged" was used to
  justify stopping while the builds were still visibly improving and the critic still listed faults. Caught
  and named: visible improvement + a critic still naming plenty wrong = HEADROOM, not a ceiling.
- **The cover-up climb.** A watertight-but-monotone wall scored *worse* than a holey one, exposing that
  filling holes ≠ constructing. Reframed the whole wall track around construct-from-spec.
- **The wrong-style probe (this session's sharpest finding).** Holding a build fixed and varying only the
  concept it's scored against: the eval craters a house-vs-koi-fish to q=3 (it is NOT blind to gross
  identity) — but *within the building family it is effectively style-blind*: gatehouse=30, barn=32,
  cottage=27, church=22, a spread inside the eval's own noise. **In the only regime we operate in, the
  measure gives the agent no gradient toward matching the concept's specific identity/style.** That is why
  every build converges to the one rustic grammar: nothing penalises using the wrong style.

**Stated without the substrate word:** *we built a measure, broke it four distinct ways, and each break
taught a rule — sub-threshold noise must not move a defect-capped score; concealment is not improvement;
measure the property you mean; and a metric that only catches category errors gives no gradient inside the
category that actually matters.*

---

## 4. What is left wanting and needed

**The binding constraint has moved off the walls — to the roof and to the measure.**

1. **The eval is within-family style/identity-blind (the top gap).** Needs structured, construction-
   addressed feedback that encodes *expected-for-this-style*. Designed this session as a two-layer BAML
   architecture: Layer A = a per-style diagnostic judge emitting `{department, expected, present, missing,
   severity}`; Layer B = a unified router mapping each item to a construction department (the idiom-
   registry, the single source of truth for the `Department` enum). Splitting diagnosis from dispatch
   (the current `WorkshopReply` fuses them) is the falsifiable bet. *This is the next epic line.*
2. **The roof is the dominant remaining cap.** A 72%-solid plank roof-prism drowns every build; the cottage
   is two perpendicular gables the single-ridge constructor can't represent. Needed: roof-as-construction
   (S-150) + multi-ridge-per-mass (the deferred T-160-03).
3. **Only one architectural language exists.** Two packs, both rustic-family; the recognition program
   schema can only express gabled-rustic grammar. Real style differentiation needs (a) recognition that
   *declares the style*, (b) a schema that expresses non-rustic grammars, (c) ≥2 genuinely different styles
   to even test against. Style-identification is a prerequisite for per-style judging (#1).
4. **The price of admission is still unmet.** "Many builds, real volume, real long" was never
   demonstrated — roster is 4 subjects, no sustained unattended operation. (S-162.) Honest gap, not a
   hedge: we located the lever (delete the per-subject `SUBJECTS` map, drive purely from recognised
   programs) but did not run it at scale.
5. **Eval human-validation on the contested middle (S-161, now sharpened).** The wrong-style probe gives it
   a concrete, currently-missing test asset: a *clean* build scored against a *same-family wrong-style*
   concept, expected to crater. We have neither a clean-enough build nor a non-rustic concept yet.
6. **Owed measurement:** a combined re-run with both the wall skin (T-160-02) and registration (T-160-04)
   to confirm the sparse-shell barn recovers from its −37 and to get honest fresh deltas.

**Reusable assets that survive the archive:** `experiments/eval-alignment/{defect-eval, autonomy-loop,
roof-climb, wrong-style-probe}.mjs`; the idiom-registry (construction departments); the BAML judge/critique
scaffolding; `src/view/{wall-generate,wall-skin}.mjs`; the witness renders. Pack-design notes remain under
`docs/active/backlog/`.

---

## 5. The one-line carry-forward

*The generator only knows one style because the metric never punished using the wrong one. The next move
is not more generator tricks — it is teaching the measure to care about fidelity to the spec (structured,
per-style, construction-addressed feedback), then letting the agent climb that. Walls are done; the roof
and the ruler are next.*
