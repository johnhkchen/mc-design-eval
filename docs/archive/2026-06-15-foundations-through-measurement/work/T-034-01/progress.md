# T-034-01 · Progress — pr-production-desk

Tracks execution of `plan.md`. Updated after each step.

| Step | What | Status |
|---|---|---|
| 1 | `goldengate-designdoc.md` | done |
| 2 | `endframe.mjs` + generate F13 image | done |
| 3 | `assemble.mjs` + `rough-cut.mp4` | done |
| 4 | `spec.md` | done |
| 5 | `assembly.md` | done |
| 6 | `post.md` | done |
| 7 | wire bundle (frames README + sequence.md) | done |
| 8 | `review.md` | done |

## Log

- **Step 1** — Golden-Gate design doc authored, matching the run-014 design-doc format (lore /
  aesthetic logic / palette / motifs / proportion). Explicitly names "Golden Gate Bridge, not a
  temple" and locks International-Orange as the silhouette palette so it segments on black.
- **Step 2** — `endframe.mjs` shells `baml-concept.mts` (base variant, no reference image) →
  Nano Banana flash → `concepts/goldengate-base-flash.png`, normalized to
  `pr/assets/frames/concept-goldengate-vision.png` (1080×1080). See generation result below.
- **Step 3** — `assemble.mjs` resolves F01–F15 → 1080×1080 images (committed frames + synthesized
  cards + GG end-frame), burns caption/overlay/`[concept]`, concats → `rough-cut.mp4`.
- **Steps 4–6** — `spec.md`, `assembly.md`, `post.md` written; voice inherited from the locked
  `script.md`; CTA verbatim, no product promise.
- **Step 7** — provenance wired into `pr/assets/frames/README.md` + `pr/assets/sequence.md`.

## Receipts (live)

- **GG generation** (`node pr/production/endframe.mjs`): `ok 9562ms (0 img, 6812 chars) →
  benchmarks/temple-facade/concepts/goldengate-base-flash.png`; normalized →
  `pr/assets/frames/concept-goldengate-vision.png (1080×1080)`. Visually verified: twin
  International-Orange Art-Deco towers + block-catenary cables + central portal on solid black —
  unmistakably the Golden Gate Bridge, not a temple.
- **Rough cut** (`node pr/production/assemble.mjs`): all 15 frames resolved; `→
  pr/production/rough-cut.mp4 (planned 40.0s, actual 40.00s, 1080x1080@30)`, 1.5 MB H.264.
  Extracted-frame spot-checks confirmed caption band, overlay chip, and amber `[concept]` tag burn
  legibly (F01 hook, F04 hero, F08 concept, F13 GG end-frame).

## Deviations from plan

- **Step 2 driver naming:** plan called the driver `endframe.mjs` (structure.md also said
  `endframe.mjs`); shipped as `pr/production/endframe.mjs`. No change in behavior.
- **F01/F06 rough-cut substitutions:** the storyboard's F01 gray-box→014 *morph* and F06 *thumbnail
  grid* can't be expressed in a still-image rough cut, so F01 uses the run-014 hero with the
  `333 blocks → STRONG 3/3` chip carrying the "before," and F06 uses a receipts card (same quantity
  message). Both documented in `assembly.md` §"Known rough-cut simplifications" as human-editor
  restorations. Honest: nothing is claimed that isn't real.
- **magick montage font:** montage needed an explicit `-font` even with `-label ""` (macOS magick
  has no default font configured); fixed by passing the Arial Bold path.
