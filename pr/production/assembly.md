# assembly.md — how the cut is built

Two ways to land the video: **(A)** one command produces the rough cut now; **(B)** the precise
shot-list a human re-cuts in a real editor (Premiere / Resolve / CapCut). Both realize
`pr/script/storyboard.md` + `pr/assets/sequence.md`.

## Prerequisites

- `ffmpeg` + `ffprobe` (verified: ffmpeg 8.1.1) and `magick` (ImageMagick) on PATH.
- The committed frame bundle `pr/assets/frames/*.png` (1080×1080). Nothing reaches into the
  gitignored `benchmarks/runs|concepts/` paths.
- For the Golden-Gate end-frame regeneration: a `GEMINI_API_KEY` in `.env` (already present).

## (A) One-command rough cut

```sh
node pr/production/assemble.mjs        # → pr/production/rough-cut.mp4 (40.00s, 1:1 1080×1080, H.264)
```

What it does (see `assemble.mjs` for the `FRAMES` plan): for each F01–F15 it resolves a 1080×1080
base image, burns the caption band + overlay chip + `[concept]` tag, renders a held silent clip at
its storyboard duration, and concats them. It's deterministic and idempotent — re-running
reproduces the same 40.00s cut. The rough cut uses **hard cuts**; crossfades/motion-graphics are the
human polish step (§C).

### Frame-resolution table (F01–F15 → source)

| # | Dur | Base image source | Kind | Caption | Overlay chip | `[concept]` |
|---|----|---|---|---|---|:--:|
| F01 | 3.0 | `frames/spine-r4-hero-oneplane-014.png` | file | Same model. Same game. The method changed. | `333 blocks → STRONG 3/3` | |
| F02 | 2.5 | `frames/spine-r2-designdoc-003.png` | file | + a design doc to build from | `competent → · $1.08 · 1,372 blk` | |
| F03 | 2.5 | `frames/spine-r3-reference-008.png` | file | + a reference photo | `→ ↑ · 20,311 blk` | |
| F04 | 3.0 | `frames/spine-r4-hero-oneplane-014.png` | file | + craft and color, split. One connected plane. | `prop·color·fidelity STRONG · detail competent · 3/3` | |
| F05 | 1.5 | reuse 014 | file | We didn't trust our first metric. So we replaced it. | `mean≈4 noise≈0.4 ✕ → categorical judge` | |
| F06 | 3.0 | **card** `26 RUNS / 2 DAYS` | card | 26 builds in two days. The craft compounds. | `26 runs · 2 days · ~$0.76–$2.13 each` | |
| F07 | 1.5 | **card** `BEST-OF-N / = one $0.76 shot` | card | Best-of-N cost 7× and gained nothing. | `$5.34 · ~29min → 3.67 · detail-stack 4.0→3.33` | |
| F08 | 3.0 | `frames/concept-taj-C-flash.png` | file | Text hit a ceiling. So we changed tools. | `text-JSON → image→3D` | ● |
| F09 | 3.0 | **5-up montage** of `concept-{taj,horyuji,chapelle,arc,mausoleum}-C-flash.png` | montage | Then the floodgates opened. | `concept art, not the build` | ● |
| F10 | 4.0 | `frames/rotation-placeholder-002.png` | file | And it's real. Rotating in our own rig. | `REAL · prismarine-viewer + minecraft-assets · 360°` | |
| F11 | 1.5 | reuse 014 | file | One dimension still won't climb: detail. | `detail: competent (held)` | |
| F12 | 3.0 | **4-up montage** of `concept-{horyuji,chapelle,arc,mausoleum}-C-flash.png` | montage | Same method, four more landmarks. Still strong. | `4 landmarks · 3/3` | ● |
| F13 | 3.0 | `frames/concept-goldengate-vision.png` | file | Where it's heading: the staged sculptor. | `where it's heading, not shipped` | ● |
| F14 | 2.5 | **card** `THE SCULPTOR` | card | We're the sculptor — not the 2-D-to-3-D tool. | (clean) | |
| F15 | 3.0 | **card** `FOLLOW FOR / THE METHOD` | card | Following the method? The whole journal is open. | `follow + comment` | |

**Cards** (F06/F07/F14/F15) are synthesized at build time (solid canvas + auto-fit text) so the cut
is complete without the gitignored thumbnail sources. **Montages** are built from the committed
concept frames. The `●` column is the mandatory amber `[concept]` honesty tag.

### Known rough-cut simplifications (the human editor restores)

- **F01 morph.** The storyboard opens on the **333-block gray box** snapping to run 014. A still cut
  can't morph, so the rough cut uses the run-014 hero as F01's base with the `333 blocks → STRONG
  3/3` chip carrying the "before." In the editor: animate the gray box → 014 dissolve.
- **F06 velocity grid.** The storyboard wants a fast thumbnail grid of `runs/001…026` — those
  sources are gitignored. The rough cut substitutes a **receipts card** (`26 RUNS / 2 DAYS`), which
  is the same *quantity* message honestly. In the editor, drop in the real run-thumb grid if desired.
- **F10 rotation.** Today a **head-on placeholder** (`rotation-placeholder-002.png`), not the spin.
  Swap in S-032's `renderOrbit` clip (`render/src/orbit.mjs` → `render/out/orbit/<id>/`) when ready.
- **Overlay glyphs.** The burn uses ASCII (`->`, `up`, `x`, `.`); restore `→ ↑ ✕ ·` in the final.

## (B) Precise shot-list (human editor, no script needed)

Drop each base image on the timeline at the cumulative in-point, hold for `dur`, hard cut (or 6–10f
crossfade). Burn caption (bottom band) + overlay (top-left) + `[concept]` (top-right, amber) per the
table above. Timeline (mm:ss.s, 40.0s total):

```
F01 00:00.0–00:03.0   F02 00:03.0–00:05.5   F03 00:05.5–00:08.0   F04 00:08.0–00:11.0
F05 00:11.0–00:12.5   F06 00:12.5–00:15.5   F07 00:15.5–00:17.0   F08 00:17.0–00:20.0
F09 00:20.0–00:23.0   F10 00:23.0–00:27.0   F11 00:27.0–00:28.5   F12 00:28.5–00:31.5
F13 00:31.5–00:34.5   F14 00:34.5–00:37.0   F15 00:37.0–00:40.0
```

## Regenerate the Golden-Gate end-frame (F13)

```sh
node pr/production/endframe.mjs        # baml-concept.mts → Nano Banana flash → normalize → frames/
```

Drives the existing concept tooling with `pr/production/goldengate-designdoc.md`; writes
`benchmarks/temple-facade/concepts/goldengate-base-flash.png` (gitignored) and the committed
`pr/assets/frames/concept-goldengate-vision.png` (1080×1080). Re-running produces a fresh concept
(generation is non-deterministic) — the committed PNG is the chosen take.

## (C) Vertical export & final polish (human step)

- 4:5 vertical export recipe: see `spec.md` §Vertical.
- Final polish (out of this desk's scope): crossfades, the F01 morph and F06 grid, motion-graphic
  score chips, a licensed music bed per `spec.md` §Music, optional recorded VO from `script.md`.
