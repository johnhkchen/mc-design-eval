# T-034-01 · Research — pr-production-desk

Descriptive map of what exists for the production desk (E-12 / S-034), the terminal link of the
evolution-showcase chain. Gated on the asset desk (T-033-01, `done`). No solutions here.

## 1. What this ticket must produce

Per `pr/production/README.md` + the ACs:

- `pr/production/spec.md` — format/aspect/length, caption style, pacing, music notes.
- `pr/production/assembly.md` — how the cut is built; a **rough cut** (`rough-cut.mp4`) if `ffmpeg`
  is present, else a precise shot-list.
- `pr/production/post.md` — the LinkedIn post copy (hook, body, CTA, hashtags).
- A **Golden-Gate "vision" end-frame** — a Nano Banana concept of a Golden Gate Bridge facade
  generated via the existing concept tooling, placed as the closing shot (F13).

## 2. Upstream artifacts (the inputs — all present & complete)

The script desk (T-031-01) and asset desk (T-033-01) hand us a fully specified cut:

- `pr/script/beats.md` — the 8-beat arc expanded to 15 frames `F01–F15`; every claim carries a
  `[receipt:…]`. Thesis line: *"Same model, same game — what changed was the method."*
- `pr/script/storyboard.md` — **40.0s** total, frame timings, pacing philosophy (hold the hook +
  the two payoffs; trust beats are 1.5s flashes; climb rungs 2.5–3s).
- `pr/script/script.md` — per-frame `caption:` (≤~8 words, muted-autoplay), optional `VO:`,
  `overlay:` (score chip / `[concept]` tag). **Voice locked:** declarative, receipts-forward, no
  hype adjectives. Includes the CTA block (follow-for-method + comment bait; **no "try it"** — no
  packaged product exists).
- `pr/assets/sequence.md` — the canonical F01–F15 table: source path → copied frame → caption →
  real `summary.json` score → on-screen overlay → duration → marks (▣ hero-spine / ◇ breadth /
  ⟳ rotation). Duration sum-check = **40.0s** ∈ [30,60]. Carries the **honesty ledger** and the
  **velocity receipts**.
- `pr/assets/frames/` — the committed, normalized frame bundle (all **1080×1080 PNG**, verified via
  `sips`). `runs/` and `concepts/` are gitignored, so these copies are the self-contained source.

### Frames already on disk (1080×1080), from `pr/assets/frames/README.md`

| Frame file | Serves | Kind |
|---|---|---|
| `spine-r2-designdoc-003.png` | F02 | real render (rung 2) |
| `spine-r3-reference-008.png` (+ `…-alt-010.png`) | F03 | real render (rung 3) |
| `spine-r4-hero-oneplane-014.png` (+ `…-alt-detailstrong-015.png`) | F01 morph target, F04, F05/F11 reuse | real render (hero) |
| `concept-taj-C-flash.png` | F08 pivot target, F09 wall | **`[concept]`** |
| `concept-{horyuji,chapelle,arc,mausoleum}-C-flash.png` | F09 wall, F12 breadth | **`[concept]`** |
| `rotation-placeholder-002.png` | F10 (placeholder for the spin) | real head-on render |

### Frames still **to-generate** at production time (from `sequence.md` asset-status table)

- **F01** gray box `[describe/regen]` (333-block capped attempt; no render on disk).
- **F06** velocity montage (a quantity-texture grid of `runs/001…026` thumbs — gitignored sources).
- **F10** real 360° spin (S-032's `renderOrbit` output, gitignored `render/out/orbit/<id>/`).
- **F13** Golden-Gate vision end-frame (**this ticket generates it**).
- **F14** thesis card, **F15** CTA card (clean text cards).

## 3. The concept-art tooling (for the Golden-Gate end-frame)

Two files in `benchmarks/temple-facade/`:

- `baml-concept.mts` — the **single-cell** entry. Reads a JSON job on stdin
  `{designDocPath, images[], targetBlocks, model:"flash"|"pro", outPath, attached}`. It renders the
  BAML `FacadeConceptPrompt` to **text** (via `b.request`, `b.parse` never called), attaches the
  reference image(s) as multimodal input, and calls Nano Banana (`generateImage`). Writes the PNG
  to `outPath`, emits a small result record on stdout (`ms`, `model`, `promptChars`, `imageCount`).
- `conceptart.mjs` — the **series orchestrator**: hardcodes **5 temple refs** (taj, horyuji,
  chapelle, arc, mausoleum) × variants A/B/C/base, shelling `baml-concept.mts` per cell via
  `runCell()`. **C (render-only)** is the locked default (T-016-01). There is **no Golden-Gate ref**
  here — GG is not a temple.

- `src/nano-banana.mjs` — the transport. `generateImage({prompt, images, model})` →
  `gemini-3.1-flash-image-preview` (FLASH) / `gemini-3-pro-image-preview` (PRO),
  `generationConfig.responseModalities:["IMAGE"]`, retries on 5xx/429. Reads `GEMINI_API_KEY` from
  `process.env` **or** `.env`. **Confirmed: `GEMINI_API_KEY` is present in `.env`** → a live
  generation is possible this session.
- `baml_src/conceptart.baml` — `FacadeConceptPrompt(design_doc, target_blocks, attached)`. The
  prompt is hardcoded to a **"Minecraft TEMPLE FACADE"**, head-on front elevation, single isolated
  structure on solid `#000000`, **bold-block-only** hard limits (no figures/text/filigree; bright
  outer silhouette so it segments). Subject/massing/palette come from the `{{design_doc}}`;
  reference framing comes from `{{attached}}`. **Constraint:** the word "temple" is baked into the
  template — feeding a Golden-Gate design doc reuses the exact transport but inherits temple
  phrasing. (Design phase decides how to reconcile.)

## 4. Tooling reality

- **`ffmpeg` is installed** — `ffmpeg version 8.1.1` at `/opt/homebrew/bin/ffmpeg`. The README's
  "if ffmpeg available → rough-cut.mp4" branch is **live**; a real MP4 is the target deliverable
  (not just a shot-list). `drawtext`/`zoompan`/`concat`/`xfade` filters are available for burning
  captions and assembling holds.
- **`magick` (ImageMagick)** — used by the asset desk's normalization recipe
  (`pr/assets/frames/README.md`); available for building cards/montages (F01/F06/F09/F14/F15).
- **`sips`** — confirmed all curated frames are 1080×1080.
- Stack is Node 20+ / ESM `.mjs` (CLAUDE.md). No Python on the hot path.

## 5. Real receipts available on disk (for honesty / overlays)

Cross-checked live this session — note some grew since `sequence.md` was written:

- **26 runs** — `ls -d benchmarks/temple-facade/runs/0*` = **26** dirs (`011` has no render).
- **Journal: `docs/knowledge/design-learnings.md` = 1,389 lines / ~116 KB** (grew from the asset
  desk's cited 1,308 / 109 KB — both honest at their time; production should cite *current*).
- Spine scores/costs/blocks: all sourced in `sequence.md` §"Hero spine" + §"Velocity receipts"
  with `[receipt: summary.json …]` — F02 003 (overall 3.0, 1,372 blk, $1.08), F03 008 (4.0,
  20,311 blk, $1.64), F04 014 (strong 3/3, 10,013 blk, $1.64, seed 11, `claude-opus-4-8`).
- Same model both ends: `claude-opus-4-8`, seed 11 — load-bearing for the hook's "same model".

## 6. Conventions & boundaries

- **Honesty contract (load-bearing across the chain):** concept ≠ real build (F08/F09/F12/F13 are
  `[concept]`); only F10 claims a real build (today a flagged placeholder); v1-sequencing (F13 =
  "where it's heading," not "shipped"); no invented metrics (every number → a `[receipt:…]`).
- **Memory `[[reference-grounds-craft-not-color]]`** — craft from reference, color from brief, split
  at every stage; relevant when prompting the Golden-Gate concept (don't let a reference palette
  bleed in; the GG identity color is International Orange, which is the *subject's* own palette).
- **Out of scope (CLAUDE.md):** no Minecraft server, no Mineflayer, no schematic export, no
  scoring layer. Final high-production edit (motion graphics, licensed music) is a human step — this
  desk delivers **up to and including a rough cut**.
- All deliverables live under `pr/production/`; work artifacts under `docs/active/work/T-034-01/`.

## 7. Open questions for Design

1. **GG end-frame path:** invoke `baml-concept.mts` directly with a hand-authored Golden-Gate
   design doc (reuse exact transport, inherit "temple" phrasing), extend `conceptart.mjs` with a GG
   ref, or call `generateImage` with a bespoke GG prompt? Trade reuse-fidelity vs subject-fidelity.
2. **Rough-cut scope:** burn all 15 frames (generating the to-generate cards on the fly) into one
   `rough-cut.mp4`, vs a cut of only the on-disk frames + a shot-list for the rest.
3. **Aspect:** master 1:1 (matches frames) vs deliver 4:5 vertical (LinkedIn-favoured) — or both.
4. **Caption burn:** real `drawtext` overlays vs clean frames + captions documented in the shot-list.
