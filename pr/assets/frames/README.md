# frames/ — curated, normalized evolution frames

These are the committed source frames for the evolution-showcase cut, selected and ordered by
`pr/assets/sequence.md`. All frames are normalized to a **common 1:1 master at 1080×1080 PNG**
(the storyboard is aspect-agnostic; production may letterbox 1:1 → 4:5 for a vertical cut).

## Why these are copied here

`benchmarks/temple-facade/runs/` and `benchmarks/temple-facade/concepts/` are **gitignored**
(`.gitignore:17,20`). The **concept** frames are also untracked — so they would not survive in the
repo at all unless copied. Copying the curated subset here makes `pr/assets/` a **self-contained
bundle**: the production desk cuts the video without reaching into gitignored `benchmarks/` paths.

## Provenance

| File | Source | Note |
|---|---|---|
| `spine-r2-designdoc-003.png` | `runs/003-v2-designdoc/render.png` | climb rung 2 — design-doc grounding |
| `spine-r3-reference-008.png` | `runs/008-vRef-designdoc/render.png` | climb rung 3 — reference grounding |
| `spine-r3-reference-alt-010.png` | `runs/010-vRefRevise-designdoc/render.png` | rung-3 alternate |
| `spine-r4-hero-oneplane-014.png` | `runs/014-vRefRevise-designdoc/render.png` | **hero** — first `strong` (3/3); also the F01 morph target |
| `spine-r4-hero-alt-detailstrong-015.png` | `runs/015-vRefRevise-designdoc/render.png` | hero alt — `detail=strong` variant (noisier grain) |
| `concept-taj-C-flash.png` | `concepts/taj-C-flash.png` | **`[concept]`** — Gemini-Flash art, NOT Minecraft |
| `concept-horyuji-C-flash.png` | `concepts/horyuji-C-flash.png` | **`[concept]`** |
| `concept-chapelle-C-flash.png` | `concepts/chapelle-C-flash.png` | **`[concept]`** |
| `concept-arc-C-flash.png` | `concepts/arc-C-flash.png` | **`[concept]`** |
| `concept-mausoleum-C-flash.png` | `concepts/mausoleum-C-flash.png` | **`[concept]`** — center-cropped from 1376×768 |
| `rotation-placeholder-002.png` | `runs/002-v1-multimodal/render.png` | **placeholder** for F10 — head-on, NOT the spin (see below) |
| `concept-goldengate-vision.png` | `concepts/goldengate-base-flash.png` (gitignored) | **`[concept]`** — F13 vision end-frame; Nano-Banana flash via `pr/production/endframe.mjs` (T-034-01), NOT Minecraft |

**Reuse:** `spine-r4-hero-oneplane-014.png` serves F01 (morph target), F04, and the F05/F11
re-flashes. `concept-taj-C-flash.png` serves F08 (pivot target) and the F09 wall. One file per real
asset; the frame→file mapping lives in `sequence.md`.

## Honesty notes

- **Concepts are not builds.** Every `concept-*.png` is Gemini-Flash *reference art*, captioned
  `[concept]` in the cut. The only real-build claim in the video is the rotation (F10).
- **The rotation is a placeholder.** `rotation-placeholder-002.png` is a *head-on* render, not a
  turntable spin. It stands in for F10 until S-032's `renderOrbit` clip is produced
  (`render/src/orbit.mjs` → `render/out/orbit/<id>/`, gitignored). Per v1-sequencing it is honest
  as a real-but-blocky build; swap in the real spin when it lands.

## Normalization recipe (reproducible)

```sh
# voxel renders — nearest-neighbor keeps block edges crisp
magick <render.png> -filter point -resize 1080x1080 <out.png>

# square concept art — Lanczos (continuous-tone)
magick <concept.png> -filter Lanczos -resize 1080x1080 <out.png>

# the one non-square concept (mausoleum, 1376×768) — center-crop, then scale
magick concepts/mausoleum-C-flash.png -gravity center -crop 768x768+0+0 +repage \
       -filter Lanczos -resize 1080x1080 concept-mausoleum-C-flash.png

# Golden-Gate vision end-frame (F13) — generated + normalized in one step by the driver:
node pr/production/endframe.mjs   # baml-concept.mts → Nano Banana → Lanczos 1080×1080 (center-crop if non-square)
```
