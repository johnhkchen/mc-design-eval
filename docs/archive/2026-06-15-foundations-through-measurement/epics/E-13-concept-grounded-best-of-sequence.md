---
id: E-13
title: concept-grounded-best-of-sequence
type: epic
status: open
priority: high
depends_on: [E-03, E-04]
spec: "§7, §8, §9"
stories: [S-035, S-036, S-037, S-038]
---

## Goal

Demonstrate the **flexibility** of the system — *idea → fruition, insanely easily* — by branching from
architecture to **sculptural objects** via the `vConcept` archetype (needs only a **term**, no reference
photo):

```
term ─▶ design doc ─▶ concept art (Nano Banana) ─▶ multimodal build (our placement) ─▶ render · turntable · judge
"moai"   LLM, imagined   doc-only concept = the      the existing claude -p multimodal
                          self-made "reference"        build, grounded on the concept
```

Run it on **8 new sculptural subjects** (one build each — best-of = the *curated sequence*, not best-of-N),
and play with **scale** to **see where build fidelity lands relative to the concept art**. The output is a
breadth showcase (rock turntables) for E-12 — *and* an honest measurement of the concept→build gap.

## Why it matters

1. **Flexibility, shown.** Every build so far is an architectural facade. Pointing the same pipeline at a
   **dancing man, a moai, a pineapple, a bow & arrow, an anatomically-correct heart** proves it's a general
   *idea→build* engine, not a temple tool — from a single word, with no reference photo.
2. **It maps the frontier honestly.** Sculptural/organic forms are exactly where naive **text-JSON
   geometry struggles** (the medium caps curves, P6) and where **image→3D shines** (organic forms voxelize
   well — the plant case). So the **concept→build fidelity gap** we measure here is the precise,
   visual case *for* the sculptor (E-11) and TRELLIS (E-09): the gorgeous concept vs. what text-JSON
   reaches today. We show it, we don't hide it.
3. **Reuse.** Pure recombination of proven pieces (design-doc-first + the locked stage-1 concept + the
   `vRef` grounded-build seam + the orbit/turntable rig). Net-new code is the *generalization* below.

## The archetype (`vConcept`) — generalized to subject TYPE + scale

The facade pipeline assumes "front elevation, relief into −Z, model only the front." Sculptures are
**freestanding 3-D objects built in the round**. So `vConcept` becomes subject-type-aware:

| stage | facade (existing) | **sculpture (new mode)** |
|-------|-------------------|--------------------------|
| design doc | temple-facade doc | imagined doc for the *object* (form, proportion, palette, motifs) |
| concept (Nano Banana) | head-on facade, black bg | the **object** as Minecraft blocks, 3/4, isolated on black |
| build | facade + relief | a **full 3-D voxel object** grounded on the concept (not a flat facade) |
| render | head-on | **3/4 + turntable** (the orbit rig — built for exactly this) |

Plus a **scale** parameter (e.g. small ~16 vs large ~48 blocks) so we can watch fidelity-vs-concept change
with resolution. One build per subject per the chosen scale (best-of = B).

## The 8 subjects (sculptural — proposed, tunable)

A deliberate spread of *form types*, all plausible Minecraft creative builds:

1. **Dancing man** (articulated figure) · 2. **Moai statue** (angular sculpture) · 3. **Pineapple**
(patterned organic) · 4. **Bow & arrow** (thin/linear — the hardest, like the Golden-Gate cables) ·
5. **Anatomically-correct heart** (organic anatomy) · 6. **Sword** (iconic thin object) · 7. **Mushroom**
(organic blob, Minecraft-native) · 8. **Koi fish** (smooth organic curve).

The spread is the point: angular sculptures should fare better in text-JSON than smooth/thin ones — the
showcase makes the fidelity frontier legible across form types.

## "Best-of" = the curated sequence (B)

One `vConcept` run per subject; the "best-of" is the **curated 8-subject showcase**, not per-subject
best-of-N. Cheaper, faster, breadth-first — the message is *ease and range*, not polish.

## Scope

**In:**
- `vConcept` generalized: a **sculpture build mode** (full 3-D voxel object grounded on a concept, rendered
  3/4 + turntable) + a **scale** parameter, alongside the existing facade mode.
- **8 sculptural subject builds** (one each), rendered as front-arc rock turntables (reuse the orbit rig).
- A **fidelity-vs-concept** read per build: how faithfully the text-JSON build realized the concept, by
  form type and scale — eyeball + the concept/render side-by-side (a fidelity judge is optional).
- A **curated best-of sequence** handed to E-12 (8 new sculptural builds + rocks + captions).

**Out:**
- Best-of-N per subject (it's B).
- TRELLIS / voxelize / the sculptor (E-09/E-11) — but the gap we measure is the case *for* them.
- New reference photos; whole-structure facades.

## Candidate stories (lisa chain)

```
S-035 archetype ─> S-036 the 8 sculptural builds (T-036-01..08, fan-out @ ~32) ─┐
                └─> S-037 scale study (moai & pineapple @ 16 + 48, T-037-01..04) ┴─> S-038 curate → E-12
```

- **S-035** — generalize `vConcept` to the **single-view sculpture build mode** (term→doc→3/4 concept→3-D
  build, rendered 3/4 + turntable) + a `--scale` parameter; wire as an approach. *The crux.* (1 ticket)
- **S-036** — the **8 sculptural builds** at standard scale ~32 (one ticket per subject: dancing man, moai,
  pineapple, bow & arrow, anatomical heart, sword, mushroom, koi fish), each recording fidelity-vs-concept.
- **S-037** — the **scale study (b):** two hero subjects (**moai**, **pineapple** — angular vs organic)
  each at **small ~16** and **large ~48**, so fidelity-vs-scale is visible against their ~32 builds.
  (4 tickets)
- **S-038** — curate the best-of sequence (the 8 + rock turntables + concept/render pairs + captions);
  journal the fidelity-vs-concept frontier by form type & scale; hand to E-12. (1 ticket)

## Definition of done

- `vConcept` builds a **freestanding sculptural object** from a single term — concept → 3-D build →
  3/4/turntable render — no reference photo.
- **8 sculptural builds** exist across the form-type spread, each with its concept and a turntable.
- A **curated best-of sequence** is handed to E-12, and the journal records the **fidelity-vs-concept**
  finding (which form types / scales text-JSON realizes well vs. where it falls short — the sculptor's
  mandate).

## Notes

- **The gap is a feature.** Honest concept/render side-by-sides are the strongest case for E-09/E-11; the
  showcase frames it as "from a word to this in minutes — and here's how much better it gets next."
- **Render shifts to 3/4 + turntable** for sculptures (the orbit rig already does this) — head-on is a
  facade convention that doesn't fit an object in the round.
- **Session budget:** one build per ticket (doc + concept + one 3-D build) fits the lisa session timeout.
