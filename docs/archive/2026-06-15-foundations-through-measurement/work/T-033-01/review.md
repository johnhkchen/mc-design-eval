# T-033-01 — Review: pr-assets-desk

Handoff for a human reviewer. The work assembles the evolution-showcase video's primary assets:
the canonical ordered frame sequence + a committed, normalized frame bundle.

## What changed (commit `f2c52dd`)

**Created**
- `pr/assets/sequence.md` — the deliverable. F01–F15 table (source path · copied-frame/status ·
  caption · **real** `summary.json` score + rubric · on-screen overlay · duration · marks) plus
  hero-spine, breadth, rotation-placement, velocity-receipts, asset-status, honesty-ledger, and a
  40.0s sum-check.
- `pr/assets/frames/` — 11 curated PNGs normalized to a **1:1 1080×1080** master:
  - spine: `spine-r2-designdoc-003`, `spine-r3-reference-008`, `spine-r3-reference-alt-010`,
    `spine-r4-hero-oneplane-014`, `spine-r4-hero-alt-detailstrong-015`.
  - concepts: `concept-{taj,horyuji,chapelle,arc,mausoleum}-C-flash`.
  - `rotation-placeholder-002`.
- `pr/assets/frames/README.md` — provenance, why-copied, reproducible `magick` recipes, honesty notes.
- `docs/active/work/T-033-01/{research,design,structure,plan,progress,review}.md`.

**Modified / deleted:** none. Purely additive; no source code, no `.gitignore`, no ticket frontmatter.

## Acceptance criteria

- **AC #1 — ordered F01–F15 with source/caption/score/duration + spine/breadth/rotation marks:**
  ✅ Full table; `marks` column flags ▣ hero-spine / ◇ breadth / ⟳ rotation. Captions lifted from
  `script.md`, durations from `storyboard.md`.
- **AC #2 — frames copied/normalized to a common aspect:** ✅ 11 frames, each verified 1080×1080
  via `sips`. Concepts (gitignored **and** untracked) are now committed, so the bundle is
  self-contained.
- **AC #3 — velocity receipts real:** ✅ 26 runs · 2026-06-04→06-05 · $0.76–$2.13/run (real min 001,
  real max 021) · 1,308-line journal · block counts 1,372/20,311/10,013 — all re-read live from
  `summary.json`/`ls`/`wc -l` in the Step-6 gate, each carrying a `[receipt:…]`.
- **AC #4 — honest per v1-sequencing:** ✅ concept frames tagged `[concept]`; F13 "where it's
  heading"; F10 a flagged placeholder; ledger's four boxes checked.

## Test coverage & verification

No repo unit suite applies (docs/assets ticket). Verification was the Step-6 cross-check, all green:
- 11 frames present, every one 1080×1080.
- Every cited score/block/cost re-read equal from `summary.json` (003 overall 3.0 v1; 008 4.0 v1;
  014 strong/detail-competent v2-categorical-baml; 015 strong/detail-strong; 001 $0.7602; 021
  $2.1251).
- 26 run dirs; journal 1,308 lines; model `claude-opus-4-8`/seed 11 confirmed both ends.
- `git status` confirmed the concept copies become newly-tracked files.

**Gap:** verification is by-eye + scripted number-match, not an automated test. A reviewer wanting
belt-and-suspenders can re-run the Step-6 block in `plan.md`. There is no guard that *future* edits
to `sequence.md` stay consistent with `summary.json` — if scores are re-judged, this file must be
hand-updated (noted below).

## Key decisions (rationale in `design.md`)

1. **1:1 1080² master, voxel-aware filtering.** Storyboard is aspect-agnostic; square is the
   least-destructive common denominator (only mausoleum needed a crop). Voxel renders upscaled
   nearest-neighbor to keep block edges crisp; concepts Lanczos. Production letterboxes → 4:5 if it
   wants vertical — no re-source needed.
2. **Score column = real `summary.json` score + rubric, beside the on-screen chip.** The chips map
   old v1-numeric runs onto the categorical ladder for muted autoplay; recording the true rubric
   keeps the climb auditable (no hidden inflation).
3. **Copy the committable curated subset; flag the rest.** Concepts *must* be copied (gitignored +
   untracked); spine renders copied for a self-contained bundle; non-copyable frames
   (F01/F06/F13/F14/F15) appear in an explicit asset-status table rather than as silent holes.

## Open concerns / TODO for downstream (S-034 / production)

1. **F10 is a placeholder, not the spin.** `rotation-placeholder-002.png` is a head-on render. The
   real turntable asset is S-032's `renderOrbit` (`render/src/orbit.mjs` → `render/out/orbit/<id>/`,
   gitignored). **Action:** produce the 360° clip and swap it in; it is the cut's *only* real-build
   claim, so the upgrade matters most here.
2. **F01 gray box, F13 Golden-Gate, F14/F15 cards are to-generate.** Flagged `[asset:…]` /
   to-generate in the status table. S-034 / production owns these. The 333-block gray box has no
   render on disk (journal-P1 attempt) — describe or regenerate.
3. **F06 montage is a derived grid**, not a single frame; production assembles it from
   `runs/001…026` thumbs. Not copied (it's a quantity texture, individual frames need not be legible).
4. **Sequence ↔ score drift.** If any run is re-judged (the journal flags `detail` as boundary-
   noisy and an active climb target), the affected score cells in `sequence.md` need a hand-update.
   No automation enforces this.
5. **Rubric-era seam is real but narrated.** F02/F03 are scored under the retired v1-numeric rubric;
   F04+ are categorical. The sequence names this; a reviewer should confirm the on-screen chips
   (`competent →` / `→ ↑` / `STRONG`) read as a *story* of the climb, not as same-rubric scores —
   this was a deliberate, disclosed simplification, not an error.

## Nothing critical blocks merge

The bundle is self-contained, the numbers are real and re-checked, and the honesty contract is
encoded in the artifact itself. The placeholders are explicitly labeled, so shipping v1 now and
upgrading F10/F13 later is the intended path.
