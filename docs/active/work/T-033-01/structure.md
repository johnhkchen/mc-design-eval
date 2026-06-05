# T-033-01 — Structure: pr-assets-desk

The blueprint. No source code — this ticket produces docs + committed image assets.

## Files created

```
pr/assets/sequence.md            # the canonical ordered F01–F15 frame list (the deliverable)
pr/assets/frames/README.md       # provenance + normalization recipe + honesty note
pr/assets/frames/*.png           # 11 curated, normalized 1080×1080 frames (below)
docs/active/work/T-033-01/        # RDSPI artifacts (this set)
```

## Files modified / deleted

None. Purely additive. No code, no `.gitignore`, no ticket frontmatter edits.

## The curated frame set (`pr/assets/frames/`, all 1080×1080 PNG)

| File | Source | Filter | Serves frames |
|---|---|---|---|
| `spine-r2-designdoc-003.png` | `runs/003-v2-designdoc/render.png` | point | `F02` |
| `spine-r3-reference-008.png` | `runs/008-vRef-designdoc/render.png` | point | `F03` |
| `spine-r3-reference-alt-010.png` | `runs/010-vRefRevise-designdoc/render.png` | point | `F03` (alt) |
| `spine-r4-hero-oneplane-014.png` | `runs/014-vRefRevise-designdoc/render.png` | point | `F01` morph-target, `F04`, `F05`/`F11` re-flash |
| `spine-r4-hero-alt-detailstrong-015.png` | `runs/015-vRefRevise-designdoc/render.png` | point | `F04` (alt, detail=strong) |
| `concept-taj-C-flash.png` | `concepts/taj-C-flash.png` | Lanczos | `F08` pivot target, `F09` wall |
| `concept-horyuji-C-flash.png` | `concepts/horyuji-C-flash.png` | Lanczos | `F09` wall, `F12` breadth |
| `concept-chapelle-C-flash.png` | `concepts/chapelle-C-flash.png` | Lanczos | `F09`, `F12` |
| `concept-arc-C-flash.png` | `concepts/arc-C-flash.png` | Lanczos | `F09`, `F12` |
| `concept-mausoleum-C-flash.png` | `concepts/mausoleum-C-flash.png` | crop→Lanczos | `F09`, `F12` |
| `rotation-placeholder-002.png` | `runs/002-v1-multimodal/render.png` | point | `F10` (v1 placeholder) |

11 files. `taj` and `014` are intentionally single files reused across multiple frames (mapping in
`sequence.md`, per design Decision 4).

## `pr/assets/sequence.md` — internal structure

The deliverable. Sections in order:

1. **Header** — total runtime (40.0s, from storyboard), master aspect (1:1 1080², production may
   re-crop), and the sourcing rule (`runs/`+`concepts/` gitignored ⇒ curated copies live in
   `frames/`).

2. **Frame table (F01–F15)** — one row per frame, columns:
   `# | beat | source path | copied frame (or status) | caption (≤8w, from script.md) | real score
   (summary.json score + rubric) | on-screen overlay (from script.md) | dur(s) | marks`.
   The `marks` column flags **▣ hero-spine**, **◇ breadth**, **⟳ rotation** as the AC requires.

3. **Hero spine (the ape→man read)** — the ordered `F01→F02→F03→F04` rung list with the real score
   step (n/a → 3.0 numeric → 4.0 numeric → categorical STRONG 3/3) and the technique each rung
   unlocked. Notes the single hero subject (Taj) constraint.

4. **Breadth beat** — `F12` four subjects + the `F09` wall; each `[concept]`, each with its
   `summary.json` strong-3/3 receipt where a real build exists (019/021/022) vs concept-only.

5. **Rotation placement** — `F10`: the only real-build claim; v1 = `rotation-placeholder-002.png`
   (head-on), upgrade path = S-032 `renderOrbit` clip from `render/out/orbit/<id>/`.

6. **Velocity receipts (real)** — the AC #3 block: 26 runs · 2 days (2026-06-04→06-05) ·
   $0.76–$2.13/run · journal 1308 lines/27 lessons · block counts 1372/20,311/10,013 · model
   `claude-opus-4-8` seed 11 both ends. Each line carries its `[receipt: …]`.

7. **Asset status table** — every frame classified **copied** / **reference-only** / **to-generate
   (S-034 / production)**, so pending work is explicit (`F01` gray box, `F06` montage, `F10` spin,
   `F13` Golden-Gate, `F14`/`F15` cards).

8. **Honesty ledger** — the four checkboxes (concept≠real, v1-sequencing, no invented metrics, same
   model), each marked against this sequence.

9. **Duration sum-check** — re-print the storyboard 40.0s sum so the cut stays in [30,60].

## `pr/assets/frames/README.md` — internal structure

- One-paragraph provenance: where each frame came from, that `concepts/` are **Gemini-Flash
  reference art (not Minecraft)** and gitignored-hence-copied-here.
- The exact normalization commands (the three `magick` recipes) so the bundle is reproducible.
- Reuse note (014 / taj serve multiple frames).
- Placeholder note (rotation-placeholder is not the spin).

## Ordering of changes (matters for verification)

1. Normalize spine renders → `frames/` (point filter).
2. Normalize concepts → `frames/` (Lanczos; mausoleum crop-first).
3. Copy rotation placeholder.
4. Verify all 11 are exactly 1080×1080 (`sips -g pixelWidth -g pixelHeight`).
5. Write `frames/README.md`, then `sequence.md` (needs the files to exist for path checks).
6. Re-read the cited `summary.json` numbers and confirm sequence.md matches before commit.

## Boundaries

- **No code.** `render/` and `src/` untouched; the orbit upgrade is referenced, not invoked.
- **No frontmatter edits** (Lisa owns phase/status).
- **Self-contained bundle.** After this ticket, `pr/assets/` cuts without reaching into gitignored
  `benchmarks/` — that is the success shape.
