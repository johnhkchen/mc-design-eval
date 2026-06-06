---
id: E-21
title: concept-grounded-materials
type: epic
status: open
priority: high
depends_on: [E-14, E-15, E-18, E-19]
spec: "§5, §6, §9"
stories: [S-071, S-072, S-073, S-074]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. Form now comes from voxelizing a TRELLIS image→3D mesh; color/material is assigned by
matching each voxel's sampled surface color to the nearest real block in **CIE-Lab** (E-14 value-true,
E-18/E-19 segmentation + a tight design-doc palette).

**The failure mode this epic fixes (observed on the building).** Color matching uses each block's **mean**
color, so it **collapses materials that differ in texture/pattern but not in average color** — most
sharply **stone brick vs cobblestone**, which the concept art used as a *deliberate* distinction (brick
walls, cobble corners/buttresses) but which mean-ΔE merges into one grey block. The distinction is lost
*precisely when the artist is working well*: near-tone material contrast (brick/cobble, smooth/rough) is
how real builders add richness — exactly the case colorimetry cannot see. E-19's flat-palette cleanup, if
unguarded, makes this worse (it would exclude textured architectural blocks and merge near-tones).

**The insight.** Material identity is **semantic**, not colorimetric. An LLM *looking at the concept* can
name materials by intent and say where they go ("walls = stone bricks, corners = cobblestone, roof = dark
oak, base = stone") — distinctions a mean-color matcher will never recover. So **let the LLM define the
material style from the concept, and refine the build's materials against it.** This is the level above
E-14 (one block by color) — *intended material zoning*, kept even when two materials share a color.

## Goal

Replace "nearest mean color" as the *sole* material authority with a **concept-grounded, LLM-defined
material map** assigned by **geometric feature** (so near-tone-distinct materials land where the artist put
them), plus a **concept-refined material pass** (the LLM corrects material regions against the original
concept). Restore the stone-brick-vs-cobble distinction on the building, and read cleaner *and* truer than
the colorimetric build — without SAM (deferred; SAM-3D is for pixel-accurate region textures later).

```
concept image + design doc
  ─▶ LLM MATERIAL MAP   {role → block, placement rule}   (walls=stone_bricks, corners=cobblestone,
       (the LLM sees the concept; names materials by INTENT, incl. near-tone-distinct pairs)   roof=dark_oak, …)
  ─▶ FEATURE-AWARE ASSIGN   classify voxels by geometric feature (flat-face / edge-corner / top-roof /
       base / opening) → place each role's block by feature, NOT by mean color
  ─▶ CONCEPT-REFINE   render → LLM compares to the concept → corrects mis-materialed regions (accept if
       closer to the artist's intent)  ─▶ judge / showcase
```

## Why now / why this shape

- **It's the failure the building surfaced**, and the building (stone-brick walls + cobble buttresses —
  `glb/stone-gatehouse.glb`, `glb/cottage.glb`) is the prime test: full structures live or die on material
  zoning.
- **Colorimetry is provably insufficient here** (brick ≈ cobble in mean Lab); only semantics (an LLM
  reading the concept) or pixel-accurate region segmentation (SAM, deferred) can recover it. The LLM path
  is the no-SAM solution and reuses the multimodal seam we already have.
- **It composes with, not replaces, the stack.** E-18/E-19 give clean coherent *regions* (no speckle);
  E-21 assigns the *right material* per region/feature from intent. Color (E-14) handles the within-material
  value; E-21 handles between-material identity.

## Scope

**In:** (a) an **LLM material map** from the concept (multimodal: the model sees the concept image + design
doc → a structured `{role, block, placement-rule}` list that *includes near-tone-distinct materials*); (b)
a **feature-aware assignment** that classifies voxels by geometric feature (flat face / edge-corner /
top-roof / base / opening-recess) and places each role's block by feature; (c) a **concept-refined material
pass** (LLM sees render vs concept → corrects material regions, accept-if-closer); (d) a **consolidation**
on the buildings + a couple sculptures (does brick-vs-cobble return? cleaner AND truer?), journaled, E-12.

**Out:** SAM / pixel-accurate instance masks (deferred — SAM-3D for region textures later); changing form
(geometry stays from E-16/E-20); the rubric/brief (immutable); the colorimetric path is kept for
within-material value and as the fallback when the LLM map is silent.

## Candidate stories & DAG (overnight chain — gated after E-19, on main, journaled)

```
S-071 LLM material map ─▶ S-072 feature-aware assignment ─▶ S-073 concept-refine pass ─▶ S-074 consolidation
   (concept → roles+blocks    (geometric features → place      (LLM corrects material        (building + sculptures;
    incl. near-tone pairs)      each role; brick≠cobble)         regions vs concept)            brick-vs-cobble restored?)
```

- **S-071 — llm-material-map.** A multimodal BAML function: the model **sees the concept image + design
  doc** and returns a structured **material map** — the distinct materials the concept uses, each a
  `{ role, block (a real survival block, incl. near-tone-distinct pairs like stone_bricks + cobblestone),
  placement-rule (which feature/region) }`. The "LLM defines style." Validated against the artifact schema's
  block vocabulary.
- **S-072 — feature-aware-assignment.** A **geometric feature classifier** over the voxel occupancy
  (flat-face / edge-corner / top-roof / base-course / opening-recess — no SAM, pure geometry) + a placer
  that assigns each cell the map's block for its feature. Near-tone-distinct materials are preserved because
  assignment is by **feature**, not mean color (cobble → corners, brick → walls).
- **S-073 — concept-refine-pass.** The "refine according to the concept" loop: render the build, show the
  LLM the **render vs the concept**, let it flag + correct material regions that don't match the artist's
  intent; apply bounded, accept-if-closer (the material analogue of E-15's form loop). P14-safe.
- **S-074 — consolidation.** Apply to the **gatehouse + cottage** (the stone-brick-vs-cobble headline) and
  2 sculptures; before/after vs the colorimetric (E-19) build — does the **distinction return**, does it
  read **cleaner AND truer** (material count *up where intended*, not collapsed)? Judge + journal + E-12.
  Honest where the LLM over-reaches or invents materials.

## Definition of done

- The building's **stone-brick-vs-cobble distinction is restored** (and other intended near-tone material
  zonings), assigned by feature from the LLM map — visible before/after vs the colorimetric build.
- Material assignment is **concept-grounded** (the LLM map drives it) and **feature-aware** (no SAM); the
  colorimetric matcher is retained for within-material value + as the silent-map fallback.
- A **concept-refine pass** measurably moves material regions toward the concept (accept-if-closer, P14-safe).
- Reads **clean** (E-19 region coherence held) **and true** (intended materials present, not merged);
  `npm test` green; consolidation + journal + E-12 handoff.

## Orchestration notes (for the autonomous overnight run)

- **Runs after E-19** (clean coherent regions first, then assign the right material per region/feature).
  Gated chain, on main, journaled. The **building (E-20)** is the prime consumer — sequence E-21 before
  E-20's coloring step (T-068) so the building gets concept-grounded materials.
- **GL-free where it counts.** The feature classifier + the assignment are **pure/deterministic** (built +
  unit-tested on synthetic occupancy); the LLM map + refine are metered `claude -p` multimodal calls
  (the model genuinely needs to SEE the concept) behind the existing seam; only renders need GL.
- **Honesty.** The LLM may over-segment or invent a material the concept didn't use — constrain it to the
  real block vocabulary + the design-doc palette as the prior, and let the concept-refine pass / judge
  catch over-reach. A material it gets *wrong* is a result, not hidden.
