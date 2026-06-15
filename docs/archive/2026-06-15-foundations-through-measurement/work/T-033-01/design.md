# T-033-01 — Design: pr-assets-desk

Decisions for assembling the curated evolution sequence. Grounded in `research.md`.

## What's actually being decided

The 15-frame story is fixed upstream (beats/storyboard/script). The open questions are narrow:
1. Which frames get **physically copied** into `frames/` vs referenced by path only.
2. The **common aspect** + normalization recipe.
3. What the **score column** cites (real vs on-screen chip).
4. File naming so the bundle reads in cut order and joins to `F##`.

---

## Decision 1 — Copy the committable curated subset; reference the rest

**Chosen:** copy the frames that (a) have a real source on disk and (b) carry the climb or the
breadth, and explicitly mark every other frame's asset status.

| Frame role | Source | Action |
|---|---|---|
| Spine rungs `F02/F03/F04` | `runs/003,008,014/render.png` | **copy + normalize** |
| Spine alts (`F03`,`F04`) | `runs/010`, `runs/015` | **copy** (alt: 010 reference-era, 015 detail-strong) |
| Pivot/explosion/breadth `F08/F09/F12` | `concepts/{taj,horyuji,chapelle,arc,mausoleum}-C-flash.png` | **copy + normalize** (gitignored ⇒ must be committed) |
| Rotation `F10` | head-on `runs/002/render.png` | **copy** as labeled **v1 placeholder** |
| `F01` gray box, `F06` montage, `F13` Golden-Gate, `F14`/`F15` cards | none / derived / S-034 | **reference-only**, status flagged |

**Why:** The concept frames are the load-bearing copies — they're gitignored *and untracked*
(research §Concepts), so without copying them the cut has no committed breadth/pivot art. The
spine renders are technically already tracked, but copying the chosen subset makes
`pr/assets/frames/` a self-contained bundle the production desk can consume without reaching into
gitignored `benchmarks/` paths — which is exactly the README's intent. The non-copyable frames
(`F01/F06/F13/F14/F15`) are real gaps, not omissions; the honest move is a **status table** so a
reviewer sees what's pending (S-034 / production) rather than discovering silent holes.

**Rejected — copy every run (001–026):** the velocity montage is a *texture of quantity*; the
spine needs **one** hero subject for a clean ape→man read (README mandate). Dumping 26 renders
into `frames/` buries the 3-rung climb in noise. The montage is a production-assembled grid;
sequence.md references the run range instead.

**Rejected — regenerate the F01 gray box now:** S-033 is *assembly*, not generation. The 333-block
capped attempt has no render; recreating it is S-034/production scope. Flag it `[asset:
describe/regenerate]` and carry the morph *target* (014), which we have.

---

## Decision 2 — Normalize to **1080×1080 (1:1)**, voxel-aware filtering

**Chosen:** a single master aspect of **1:1 at 1080²**. The storyboard is aspect-agnostic and lets
production pick the final 1:1 or 4:5; a square master is the least-destructive intermediate (every
spine render and 4 of 5 concepts are already square — only `mausoleum` (1376×768) needs a crop).

Recipe (ImageMagick, available per research):
- **Voxel renders** (512²): upscale with `-filter point` (nearest-neighbor) → keeps blocky edges
  crisp; smoothing a voxel build would *misrepresent* it. `magick SRC -filter point -resize 1080x1080 DST`.
- **Square concepts** (1024²): `-filter Lanczos -resize 1080x1080` (photographic art, smooth is correct).
- **Mausoleum** (1376×768): center-crop to square first, then scale —
  `magick SRC -gravity center -crop 768x768+0+0 +repage -resize 1080x1080 DST`.

**Why 1:1 over 4:5 vertical:** picking 4:5 now would bake a vertical crop into the master and lock
production out of a square LinkedIn cut. 1:1 keeps both downstream options open and matches the
native shape of nearly every source — minimal information loss. Production letterboxes 1:1→4:5 if
it chooses vertical.

**Why nearest-neighbor for renders:** the whole thesis is "it's a *real voxel build*." Anti-aliased
upscaling would soften the very blockiness that proves it. Concepts get Lanczos because they're
continuous-tone reference art, not voxels.

**Rejected — keep native dimensions (no normalize):** the AC explicitly says "at a common aspect";
512² renders beside 1024² concepts beside a 16:9 mausoleum can't cut together cleanly. Normalizing
once here is cheaper than the production desk redoing it per-frame.

**Rejected — vertical-4:5 master:** premature; destroys the square option and crops content the
square keeps.

---

## Decision 3 — Score column cites the **real** `summary.json` score + rubric tag

**Chosen:** `sequence.md`'s score column records the authoritative `score` from each run's
`summary.json`, **with its rubric**, e.g. `overall STRONG · detail competent (categorical, run
014)` and `overall 3.0 (rubric v1-numeric, run 003)`. It *also* shows the storyboard's on-screen
chip in a separate column, so the simplification is visible side-by-side with the truth.

**Why:** AC #3/#4 demand honest, real numbers. The on-screen chips (`competent →`, `→ ↑`) are a
narrative mapping of the old numeric runs onto the categorical ladder — legitimate as muted-autoplay
copy, but the *sequence* is the audit trail. Recording both means a reviewer can see that `F02`'s
"competent →" chip sits on a run that was actually scored `3.0` under the retired v1 rubric — no
hidden inflation. This directly serves the ledger item "no invented metrics."

**Rejected — only the on-screen chip:** loses the rubric provenance; a reviewer couldn't tell a
categorical `strong` from a numeric `3.0` dressed up as a band.

---

## Decision 4 — Filenames encode role + run/subject; table holds the `F##` join

**Chosen:** content-descriptive names that sort meaningfully:
`spine-r2-designdoc-003.png`, `spine-r3-reference-008.png`, `spine-r4-hero-oneplane-014.png`,
`concept-taj-C-flash.png`, … `rotation-placeholder-002.png`. The `F##` mapping (and reuse — `014`
serves `F01` morph-target, `F04`, and the `F05`/`F11` re-flashes) lives in the sequence table, not
the filename.

**Why:** several frames **reuse** one asset (`014` appears 4×; `taj` concept serves `F08`+`F09`).
Naming by `F##` would force duplicate files or an arbitrary "primary" slot. Naming by content keeps
one file per real asset; the table expresses the many-to-one frame→file mapping. Role prefixes
(`spine-`/`concept-`/`rotation-`) keep the directory self-documenting.

**Rejected — `F01.png … F15.png`:** breaks on reuse (which frame "owns" 014?) and on
reference-only frames (no file to name).

---

## Honesty guardrails baked into the output

- Every concept file is tagged `[concept]` in the sequence table; `frames/README.md` states they
  are Gemini-Flash reference art, not Minecraft.
- `rotation-placeholder-002.png` is named and captioned **placeholder** — it does not claim to be
  the spin; sequence.md notes the S-032 upgrade path.
- `F13` carries "where it's heading," not "shipped."
- Velocity receipts are quoted with their `[receipt: …]` (run id / field), never rounded into a
  bigger story than the data supports.

## Verification approach

No repo test suite touches this (docs/assets). Verify by: every `source path` in sequence.md
resolves; every "copied frame" exists in `frames/` at 1080²; `git status` shows the concept copies
newly tracked; the three spine block counts and the cost min/max re-read from `summary.json` match
what sequence.md prints.
