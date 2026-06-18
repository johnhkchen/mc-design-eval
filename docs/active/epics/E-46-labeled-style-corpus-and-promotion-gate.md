---
id: E-46
title: labeled-style-corpus-and-promotion-gate
type: epic
status: open
priority: high
depends_on: [E-45]
spec: "§9.1"
stories: [S-183, S-184, S-185]
---

## Background (read this first — this is the gate the whole arc deferred to)

**Milestone rung: M1, instrument-validation — "prove the ruler reads the picture, then freeze it."** The
capstone of the E-38→E-45 measurement arc and the deciding gate for promoting the recalibrated style-distance
term into the frozen instrument.

E-45 fixed the *mechanism*: the recalibrated term DISCRIMINATES (`replaceContrast −0.20 → +0.245`, matched
13→41, wrong twins stay low). But T-182-01 blocked a clean promote for two pre-registered reasons, and **only
a population corpus can settle them**:

1. **Marginal magnitude** — A−B=22 cleared the ±12 noise but missed the strict 2·NOISE=24 bar by 2 points on
   **one subject**. One subject + 2 wrong-style concepts is a sharp diagnostic, not a population test.
2. **The pack confound (the load-bearing reason)** — the separation rode on the **pack** (the recognized
   style spec) **not the concept image**: pack effect C−B=+29 vs concept-image effect A−C=−7. A rustic build
   scored ~high against *any* concept as long as the pack was rustic. The term has **not been shown to read
   the picture** — only to reward pack-material agreement. In production pack and concept co-vary (the pack is
   *derived from* the concept by recognition), so it's partly benign — but a frozen measurement instrument
   must discriminate on the **picture across a population**, or it is measuring the wrong thing.

This epic builds the **labeled multi-state corpus** (E-40's standing debt, owed since the bake-off was
under-powered at 2 states), validates the recalibrated term against **human pairwise labels** with the
concept-image carrying the signal, and **then — and only then — executes the guarded freeze** that every prior
epic recommended-but-deferred.

Governed by `docs/knowledge/project-direction.md` (the differentiator IS the measurement — so a *validated*
measure is the project's deliverable) + `docs/knowledge/anti-hedge-directive.md` (the corpus must contain a
genuinely-uncertain hard middle; the pack-confound attack must be **run on the population and reported**; a
term that tracks the pack at scale is a publishable negative + a precise next fix).

### The crux design problem — decouple pack from concept-image (don't bake the confound in)

T-182-01 already saw the confound *because* its C-control deliberately decoupled pack from concept. The
corpus must do this **systematically**. Three axes that normally co-vary:

- **BUILD** — the rendered artifact (its actual materials/form/proportions).
- **PACK** — the style spec handed to the scorer (rustic, guildhall, …).
- **CONCEPT IMAGE** — the picture the build is scored against.

The corpus must include the **crux cells** that separate "reads the picture" from "rewards the pack":

| cell | BUILD | PACK | CONCEPT | the term should… |
|---|---|---|---|---|
| **match** | B | its true pack | the concept B was built for | score HIGH (faithful) |
| **same-pack, wrong-picture** | B | its true pack | a concept B does **not** match | score **LOW** — *the crux* |
| **wrong-pack, right-picture** | B | a foreign pack | the concept B matches | pack-sensitivity probe |
| **cross** | a different-style build | … | … | populate the off-diagonal |

**The decisive test:** within fixed-pack rows, does the term rank *build-matches-picture* above
*build-doesn't-match-picture*, **in agreement with humans**? If the term scores the same-pack/wrong-picture
cell as high as the match cell, it is reading the pack, not the picture — the confound persists.

### The hard middle (anti-hedge — the fixture must be able to embarrass us)

Obvious pairs (church vs koi) are useless. The corpus must center the **genuinely-contestable** within-family
states: a *partially*-faithful build (one wrong material, slightly-off proportions, missing dressing) vs a
clean match vs a same-family wrong-style concept — pairs where a human could reasonably rank either way. If
humans can't agree on the hard middle, there is no ground truth and the gate is ill-posed — itself a finding
about the task, reported, not averaged away.

### Human labels are the gold standard (the one non-autonomous dependency)

The promotion gate is *agreement with human judgment*, so the labels are **human** (the project's reviewer
is the labeler; a one-person panel for now — the M5 "strangers vote" is the long horizon). The autonomous
loop builds everything **up to and around** the labels — the corpus, the labeling instrument, the agreement
+ pack-decomposition harness — but the **labeling itself is a human gate**, and so is **executing the
freeze**. Keep the label set small enough for a focused session: the hard-middle contestable pairs, not the
full all-pairs matrix. (Fallback if human labeling is deferred: an LLM-proxy panel labels, explicitly flagged
as *not human ground truth* — a weaker gate that can refute but not license promotion.)

## Stories

- **S-183 — build the decoupling corpus.** ≥8–10 states across multiple subjects (gatehouse, cottage, barn,
  …) and styles, with a deliberate factorial that includes the **crux cells** (same-pack/wrong-picture,
  wrong-pack/right-picture) and the **hard middle** (partially-faithful states). Renders + a manifest
  recording, per state, its (build, pack, concept) and its *intended* faithfulness. Built by replay so it is
  reproducible.
- **S-184 — collect labels + the agreement/decomposition harness.** Build the pairwise labeling instrument
  (clean beside-concept presentation of the hard-middle pairs), collect the **human** labels (the human gate;
  LLM-proxy fallback flagged), and a harness that computes (a) term-vs-human agreement (pairwise accuracy /
  rank correlation) and (b) the **pack-effect vs concept-image-effect decomposition** generalized from
  T-182's C-control. Output: does the term agree with humans, and does the **concept-image** carry the signal?
- **S-185 — promote or localize.** If the term agrees with humans AND reads the picture (concept-image signal
  dominates, magnitude clears the bar across the population): **execute the guarded freeze** — the add to
  `measurements/` + the PinGuard pin spelled out in T-182-01 — **behind human sign-off** (the loop prepares
  the exact pin and the gate evidence; the reviewer confirms the one act that touches the frozen instrument).
  If it tracks the pack at scale: localize the **concept-image-conditioning** fix precisely (the term must
  condition on the rendered build-vs-image match, not pack/material agreement) — DO-NOT-PROMOTE, a sharp,
  publishable negative.

## How this epic can fail (state it up front — anti-hedge)

- **The term tracks the pack at population scale.** The T-182 confound generalizes — the term rewards
  pack-material agreement, not picture-fidelity, across subjects. The embarrassing branch: the eval we built
  measures the spec it was handed, not the build's resemblance to its picture. A real result; the fix is
  concept-image conditioning, named precisely.
- **The pack can't be decoupled from the concept.** If every same-pack/wrong-picture cell is unconstructible
  (recognition always re-derives a matching pack), pack and concept are inseparable by construction — then the
  *confound is structural* and the term can never be shown to read the picture without changing the pipeline.
  A deeper finding than a calibration miss.
- **Humans can't agree on the hard middle.** Low inter-label agreement on the contestable pairs → no ground
  truth → the gate is ill-posed. Report the agreement rate; a term can't be validated against noise.
- **The corpus is still too narrow.** Multi-subject but few styles, or a hard middle that isn't actually hard.
  Name the breadth honestly; "necessary not sufficient" still applies one rung up.
- **Promotion temptation / the wall.** Executing the freeze is the one act that touches `measurements/`. It
  happens **only** behind the corpus gate AND human sign-off; the loop never freezes autonomously. Over-eager
  promotion on a marginal population result is the failure to guard against — the bar is the human-agreement +
  concept-image-signal result, not a single aggregate number.

## Done when

A reproducible decoupling corpus exists (crux cells + hard middle, ≥8–10 states, multi-subject); human labels
are collected on the contestable pairs (or the LLM-proxy fallback is run and flagged as non-licensing); the
harness reports term-vs-human agreement AND the pack-vs-concept-image decomposition; and the verdict is
either **PROMOTE** (agreement holds, concept-image carries the signal → guarded freeze executed behind human
sign-off, instrument now byte-reproducible + PinGuarded) or **DO-NOT-PROMOTE** with the residual localized
(pack-tracking → concept-image conditioning; structural confound → pipeline; label noise → ill-posed gate).
Either way the result is reported at full strength.
</content>
