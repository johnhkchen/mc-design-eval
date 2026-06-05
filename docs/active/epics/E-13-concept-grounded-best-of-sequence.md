---
id: E-13
title: concept-grounded-best-of-sequence
type: epic
status: open
priority: high
depends_on: [E-03, E-04]
spec: "§7, §8, §9"
stories: []
---

## Goal

A new prompting archetype — **`vConcept`** — that needs only a **single term/motif**, no reference photo:

```
term/motif ─▶ design doc ─▶ concept art (Nano Banana) ─▶ multimodal build (our placement) ─▶ render · judge
 "lighthouse"   LLM, from      doc-only concept = the      the existing claude -p multimodal
                imagination    self-made "reference"        build, grounded on the concept
```

The **Nano Banana concept replaces the real reference photo** as the grounding image; our existing build
process does the placement. Apply it to **8 new locations/builds** and curate a **best-of sequence**
(showcase-ready, with turntables) that feeds E-12.

## Why it matters

Every strong build so far depended on having a **real reference photo** (Taj, Hōryū-ji, …). That caps us
to subjects we have photos of. `vConcept` removes the dependency: a single word → a self-generated concept
→ a grounded build. It's the pure recombination of pieces we've already proven —
- **design-doc-first** (the quality jump, journal P4-era + craft/color split),
- **stage-1 Nano Banana concept** (locked: colorful, inspiration-not-blueprint, block-appropriate),
- **multimodal grounded build** (the `vRef` seam: an image grounds the claude -p build) —
into one self-contained pipeline. It also answers a real research question: **does a self-generated
concept ground a build as well as a real photo does?** And it generates **8 new high-quality builds** —
exactly the "explosion of builds" breadth E-12's showcase wants, across fresh subjects.

## The archetype (`vConcept`) — reuse, don't reinvent

1. **Term → design doc.** A subject-parameterized design-doc prompt (generalize
   `composeReferenceDesignDocPrompt` to ground in an *imagined* subject term instead of a photo — keep the
   palette-discipline / craft-color rules).
2. **Doc → concept.** `baml-concept` in **doc-only** mode (the `base` variant — no reference image, since
   there is none) → a Minecraft-block concept = the self-made reference. (Locked stage-1 prompt.)
3. **Concept → build.** The existing **multimodal grounded build** (`requestDesignArtifactWithImage`,
   the `vRef` seam) grounded on the *concept image* → a `DesignArtifact` (placement). One build (no second
   revise pass — keeps a run inside the lisa session budget).
4. **Render + judge** (existing categorical rubric).

New glue is only: subject parameterization + wiring the generated concept in as the grounding image.

## The 8 subjects (proposed — tunable)

Diverse across era / material / style, each a single term Nano Banana can concept and a build can realize
as a facade:

1. **Lighthouse** (coastal beacon) · 2. **Art-Deco cinema** · 3. **Egyptian temple** (Abu-Simbel-ish) ·
4. **Mesoamerican step-pyramid** · 5. **Greek temple** (Parthenon) · 6. **Moorish palace** (Alhambra) ·
7. **Brutalist monument** · 8. **Futurist / space-age tower**.

(Swap any term per-ticket; they are not real-photo-dependent.)

## "Best-of" — the quality mechanism

Each subject gets one `vConcept` build; **if the judge scores it below `strong`, the build ticket
best-of-N's** (re-run with a fresh concept/build, judge, keep the best) so the *sequence* is genuinely
best-of. The curation story assembles the 8 winners into the showcase sequence.

## Scope

**In:**
- The `vConcept` archetype wired into the harness as a named approach (subject-parameterized).
- **8 subject builds** (one run-the-test each), judged; best-of-N on any sub-`strong` build.
- A **best-of sequence**: the 8 winners curated + front-arc **rock** turntables (reuse the orbit rig) +
  captions/scores — handed to E-12 as the "8 new builds / rotating-builds" content.
- The research note: self-generated-concept grounding vs real-photo grounding (does it hold?).

**Out:**
- TRELLIS / voxelize / the sculptor (E-09 stages 2–4, E-11) — `vConcept` grounds a **text-JSON** build,
  not a 3-D voxelize.
- New reference photos (the point is *no* photo).
- Whole-structure (facades, as everywhere).

## Candidate stories (lisa chain)

```
S-035 vConcept archetype
   ├─> S-036 lighthouse ─┐
   ├─> S-037 art-deco    │
   ├─> … (8 builds, fan-out) ├─> S-044 best-of sequence + turntables → E-12
   └─> S-043 futurist ───┘
```

- **S-035** — wire the `vConcept` archetype (term→doc→concept→multimodal build), subject-parameterized.
- **S-036…S-043** — the 8 subject builds (one run-the-test each; best-of-N if sub-`strong`).
- **S-044** — curate the best-of sequence: the 8 winners + front-arc rock turntables + captions/scores;
  hand to E-12.

## Definition of done

- `vConcept` runs end-to-end from a single term — no reference photo — producing a judged `DesignArtifact`.
- **8 new builds** exist, each `strong` (or the best of N), across the 8 subjects.
- A **best-of sequence** is assembled (winners + rock turntables + captions/scores) and handed to E-12.
- A journal note records whether **self-generated-concept grounding** matches real-photo grounding.

## Notes

- **Reuses the locked stage-1 concept prompt** and the orbit/turntable rig — net-new code is small.
- **Session budget:** one build per ticket (doc + concept + one grounded build ≈ 15–20 min) fits the lisa
  session timeout; that's why `vConcept` is a single grounded build, not a doc→concept→build→revise loop.
- Feeds **E-12** directly (8 new builds + turntables = the breadth/explosion beat on fresh subjects).
