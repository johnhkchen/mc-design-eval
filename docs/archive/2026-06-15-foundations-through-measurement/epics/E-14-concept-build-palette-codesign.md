---
id: E-14
title: concept-build-palette-codesign
type: epic
status: open
priority: high
depends_on: [E-10, E-13]
spec: "§5, §6, §9"
stories: [S-039, S-040, S-041, S-042]
---

## Goal

Apply what the E-13 frontier measured — **text→JSON holds palette + parts but drifts in *value*** — to
**close the concept→render gap from both ends at once**. The lever is a single shared contract: the
**block-Lab palette**. Today the two stages each guess blocks independently and the gap opens between
them; this epic makes them agree on the *same value-true block palette*, so the concept previews real
block appearance and the build places value-matched blocks.

```
term ─▶ design doc ─▶ [PALETTE SNAP] ─▶ concept art ──▶ build (value-matched) ─▶ render ─▶ [Δvalue gate]
         names blocks    snap to the      generated      CIE-Lab nearest-block      compare realized
         by intuition    block-Lab table  AGAINST the    on the concept image       palette vs target
                         (true value)     real swatches  (not name-by-hue)          (feedback)
                              │                                                          │
                              └──────────────── the SAME value-true palette ────────────┘
```

The headline failure E-13 named — *"every signature cue transfers; `gray_concrete` reads darker than
the pale tuff"* (moai, the series' **best** case, still only **Competent** because of value) — is the
exact target. Win condition: the moai (and its siblings) come back **value-true**, the concept↔render
ΔE measurably shrinks, and the judge verdicts climb without touching the rubric or the brief.

## Why it matters

1. **It activates E-10 in the live path.** The CIE-Lab engine + the 305-block Lab table
   (`src/color/`: `cielab.mjs` `nearestLab`, `palette-extract.mjs`, `block-table.mjs`
   `loadBlockTable`, `image-grid.mjs` `comparePalettes`) is **built and tested but never wired into a
   real concept or build**. Both stages still choose blocks by *name/hue intuition*. This epic is the
   wiring — the smallest change that converts a dormant, proven engine into measured render quality.
2. **It attacks the *measured* gap, not a guessed one.** E-13 isolated *value drift* as the dominant
   error on text→JSON's **best** forms (angular: moai, sword), distinct from *line*-loss (organic) and
   *point*-loss (thin). Value is the one failure both ends share and both can fix — see
   `[[concept-image-not-color-value-preview]]` (Nano-Banana blocks hue, not value; a named block can
   render far darker than the concept showed) and the moai/Taj `gray_concrete`/`dark_prismarine`
   evidence in `design-learnings.md`.
3. **The co-design loop is the point.** Fixing only the build leaves the concept over-promising; fixing
   only the concept leaves the build free to drift. Binding **both** to the same value-true palette
   closes the gap from both sides and gives a single number (concept↔render ΔE) for "did we hit it."
4. **It is reuse, not new geometry.** No new placement primitives, no new render rig. Net-new code is
   the *palette contract* and two thin wirings (concept-side swatch grounding, build-side nearest-block
   snap) plus a feedback gate. **Form** moves (curves/rounding for organic line-loss, thin-feature
   preservation) are explicitly **out of scope here** — they belong to the staged sculptor (E-11). This
   epic owns *color/value* only, so the two epics compose cleanly without overlap.

## What's in / out

**In:** the value-true palette snap (the shared contract); palette-aware concept generation (concept
grounded on real block swatches/values); value-matched build placement (CIE-Lab nearest-block over the
concept image); the concept↔render Δvalue feedback gate; an A/B vs the E-13 baseline renders + journal.

**Out:** geometry/form fidelity (line-loss, point-loss, curves, thin features) → **E-11**; image→3D /
TRELLIS → **E-09**; the rubric and the brief (immutable during measurement); area-weighted palette
coverage refinement (the E-10 follow-up, only if a story needs it). No new subjects — **reuse the E-13
sculptural set** so the A/B is apples-to-apples against a known baseline.

## Candidate stories & DAG

```
S-039 value-true palette snap (the shared contract)  ─┬─▶ S-040 palette-aware concept ─┐
   the foundation both stages consume                 └─▶ S-041 value-matched build ────┴─▶ S-042
                                                                                   co-design A/B + Δvalue
                                                                                   gate + consolidation
                                                                                   (terminal)
```

- **S-039 — value-true-palette-snap.** The keystone seam (gates the rest). Take the design doc's
  proposed palette and **snap every named block to the block-Lab table**, surfacing each block's *true*
  rendered Lab/value (and the nearest real block when the doc names a non-cube/biome-tinted/imaginary
  one). Output: a single `resolveValueTruePalette(designDoc|names) → [{name, lab, hex, value, swatch}]`
  the contract both downstream stages import. Pure, GL-free, unit-tested; reuses E-10
  (`loadBlockTable`, `nearestLab`, `resolvePalette`).
- **S-040 — palette-aware-concept.** Feed the value-true palette into a `SculptureConceptPrompt` variant
  (`.v2`, kept separate so `.v1` E-13 runs stay reproducible) and **attach a rendered swatch grid of the
  real blocks** as a multimodal input, so Nano-Banana matches *actual block appearance/value*, not
  imagined hue. A/B the new concept vs the E-13 `.v1` concept on the sculptural subjects.
- **S-041 — value-matched-build.** Wire E-10 into the **live build**: after the model proposes form +
  region intent, **extract the concept's realized palette** (`gridFromImage`/`extractPaletteFromImage`)
  and **snap placements to value-true blocks** via `nearestLab` against the contract — instead of
  name-by-hue. The model owns *form + where*; the engine owns *which block hits the value*. A/B the moai
  (the documented value-drift case) + the sword/pineapple.
- **S-042 — codesign-ab-and-consolidate.** Terminal, gated on S-040 + S-041. Run the **whole co-design
  loop** on the E-13 subjects; add the **Δvalue feedback gate** (`comparePalettes`: realized-block
  palette vs target value-true palette → a ΔE number; flag/optional one corrective re-place pass).
  Measure value-gap closure (concept↔render ΔE before/after) + judge categorical vs the E-13 baseline,
  journal the **value-true** result, and hand the improved renders to E-12. Honest: where value-true
  *didn't* help (or hurt), shown not hidden.

## Acceptance (epic-level)

- The block-Lab palette is the **shared contract**: one resolver, imported by both the concept and the
  build stage; neither picks blocks by bare name/hue anymore.
- A measured **concept↔render ΔE** exists for the E-13 subjects, **before (E-13 `.v1`) vs after**, with
  the moai value-drift case explicitly closed or explained.
- `.v1` E-13 runs stay reproducible (the new concept/build paths are additive variants, not edits to the
  frozen prompts); `npm test` green.
- An E-12 handoff: the value-true renders + the before/after value beat ("we measured the drift, then
  killed it").
