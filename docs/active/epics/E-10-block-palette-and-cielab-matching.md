---
id: E-10
title: block-palette-and-cielab-matching
type: epic
status: open
priority: high
depends_on: [E-01]
spec: "§5, §6, §9"
stories: [S-019, S-020, S-021, S-022, S-023]
---

## Goal

Build the **real-block color layer** that grounds a concept in actual, obtainable, palette-disciplined,
resolution-capped Minecraft blocks — *before* any image-to-model work. Two headline capabilities:

1. **Describe which blocks are in a facade picture → the canonical block palette.** Given a concept
   image, extract the set of real survival blocks it actually uses (with coverage), via Lab color
   clustering + CIE-Lab nearest-block matching. This *is* the design's palette manifest (§5/§6),
   derived from the picture rather than asserted.
2. **Map any color to a real block** — a portable CIE-Lab nearest-block engine — so an image (now) or a
   voxel grid (later, E-09 stage 4) becomes real blocks. See `docs/knowledge/cielab-block-matching.md`.

This closes the two observed concept-stage gaps at once: **imaginary blocks → real** (the output is
always a whitelisted block) and **over-resolution → capped** (detail is bounded by the grid we sample).

## Why it matters

The Nano Banana concept stage is strong (E-09 stage 1) but invents non-existent blocks/textures and
overshoots block resolution. The fix is not more prompting — it's a grounding pass that quantizes every
color to a real palette. Doing this on the **concept image** gives us a real-block, resolution-true
facade and a canonical palette *without* committing to TRELLIS — exactly the "address it before
image-to-model" sequencing. And the same engine is the **portable color core** E-09's voxelizer needs,
so this segment is reused, not throwaway.

## How it works (see the research doc for the math)

- **Block → Lab table** from `minecraft-assets` (1.20.1, full-cube survival blocks): representative color
  per block → Lab, cached. Handle the gotchas — biome tint (exclude/pin), alpha (opaque pixels only),
  directional faces (use the side), animated (first frame), non-full-cube (exclude).
- **Color engine** (portable, zero Minecraft deps): sRGB → linear → XYZ(D65) → Lab; ΔE (CIE76 default,
  pluggable); `nearest(color, palette[{key,lab}]) → key`.
- **Palette extraction:** downsample/quantize the image (median-cut or k-means in Lab) → cluster
  centroids → nearest real block per centroid → merge duplicates → **canonical palette** = ordered list
  of `{block, repColor, coveragePct}`, plus a human-readable description ("terracotta 38%, gold_block
  14%, lapis 9%…").
- **Image → real-block grid:** sample the concept to an N-wide grid, match each cell against the palette
  → a real-block facade representation; render it (E-02) and check palette adherence (§9).

## Scope

**In:**
- `minecraft-assets` dependency + a **block→Lab table builder** (full-cube survival 1.20.1).
- The **portable CIE-Lab color engine** (conversion + ΔE + nearest-match) with real unit tests.
- **Canonical palette extraction** from a facade image (the headline) — blocks + coverage + description.
- **Image → real-block grid** at a fixed resolution + palette-adherence check; optional compare of the
  *extracted* palette vs the design doc's *declared* palette (do they agree?).
- Reuse hook: the engine is structured as E-09's portable voxelizer color core.

**Out:**
- TRELLIS / 3D reconstruction and the voxel→block *apply* (E-09 stages 2–4; this delivers the engine they
  reuse).
- Dithering (available, default OFF for clean architectural color fields).
- Block-state / orientation and non-full-cube blocks (a later detail refinement).
- Changing the concept prompt (E-09 stage 1 is locked).

## Candidate stories (lisa chain)

```
S-019 block→Lab table ┐
                      ├─> S-021 palette extraction ─> S-022 image→real-block grid ─> S-023 consolidate
S-020 color engine ───┘
```

- **S-019** — `minecraft-assets` + block→Lab table builder (full-cube survival; tint/alpha/directional/
  animated gotchas; the known CJS-require gotcha).
- **S-020** — portable color engine: sRGB→Lab, ΔE (CIE76), nearest-block; unit-tested against known
  values. No Minecraft deps.
- **S-021** — **canonical palette extraction** from a facade image (cluster → match → palette + coverage
  + description). The headline capability.
- **S-022** — image → real-block grid at fixed resolution + palette-adherence check; extracted-vs-declared
  palette comparison.
- **S-023** — consolidate: wire the engine as E-09's portable voxelizer color core; journal writeup.

(S-019 and S-020 are independent → one parallel wave; the rest gate serially.)

## Definition of done

- Given a concept image, the system **emits the canonical block palette** it uses (real survival blocks +
  coverage + a human-readable description), reproducibly.
- The **color engine is portable** (no mc-design-eval/Minecraft import), unit-tested, and consumed via a
  Minecraft adapter (the block→Lab table) — ready to be E-09's voxelizer core.
- A concept image renders to a **real-block grid at the fixed resolution** that passes palette adherence
  (§9) — demonstrating imaginary-blocks and over-resolution are both eliminated.

## Notes

- **`minecraft-assets` is not installed and had a CJS-`require` issue here** (memory) — import as ESM or
  read `data/<version>/` directly. Building the table is genuine setup, hence its own story.
- **ΔE pluggable:** CIE76 to start; swap CIEDE2000 if saturated matches read wrong.
- **Palette source:** extraction can run against the full survival full-cube set (discover the palette) OR
  be constrained to the design doc's declared manifest (validate it). Support both; the former *describes*
  the picture, the latter *checks* it.
