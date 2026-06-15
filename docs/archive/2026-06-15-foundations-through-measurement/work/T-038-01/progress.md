# T-038-01 — Progress

Implement log. Steps trace `plan.md`. Deviations noted inline.

## Step 1 — 12 rock clips · DONE

ffmpeg-encoded each run's 24 `turntable/frame.NNN.png` → `pr/assets/rotations/rock-<subject>-<seq>.mp4`
(12 fps, `yuv420p`, even-scale — matches `orbit-clip.mjs`). `ffprobe` confirms 24 frames @ 12/1 fps
per clip; sizes 28–76 KB (~0.6 MB total). No re-render needed — the on-disk frames are already
rock-mode (`summary.json.turntable.mode="rock"`, center 45°, amp 40°). All 12 ok.

## Step 2 — 8 pair frames + 2 triptychs · DONE

`magick … +append` at common height 512. Pairs = concept | render-3q (e.g. `pair-koi-009.png`
1451×512). Triptychs = three render-3q at 16|32|48 ascending (`triptych-moai-16-32-48.png`,
`triptych-pineapple-16-32-48.png`, each 1536×512). All 10 PNGs verified by `magick identify`.

## Step 3 — pineapple@48 (run 013) firsthand read · DONE

Inspected `runs/013-…/render-3q.png` (12176 blocks) + the pineapple triptych directly. **Honest
read:**

> **Best-resolved of the three pineapples.** Run 013 @48 is the *only* scale that delivers **both**
> the rounded ovoid body **and** a legible cross-hatch skin — brown diamond lattice on the amber
> field, the value contrast scale-32 lacked. The crown is a spiky dark-green star, though its thin
> radiating fronds fragment into detached floating tips (the persistent 1-wide-element fragility).
> Reads unmistakably as a pineapple. **Categorical: recognizable, strongest of the triptych**
> (pattern Strong, form Competent–Strong, crown Weak).

**Key cross-build finding (deviation-worthy, feeds the journal):** the two triptychs make **opposite**
scale cases. Confirmed by viewing both:
- **Moai (angular, single dominant mass):** **regresses** at 48. @16 carved face reads; @32 best
  (face + topknot + plinth); @48 a **near-featureless dark monolith** — the large budget is squandered
  on coarse fills. Non-monotonic, peak at 32.
- **Pineapple (organic, textured):** **rewards** the large budget. @16 blocky/recognizable; @32
  rounded but faint pattern; @48 best (round **and** patterned). Roughly monotonic up.

So "fidelity is non-monotonic in scale" sharpens to: **the sign of the scale effect is
form-type-dependent** (angular single-mass can waste blocks; organic-textured converts them). This
extends memory *sculpture-fidelity-non-monotonic-in-scale* and *low-scale-can-improve-pattern-read*.

## Step 4 — `pr/assets/sculptures.md` · DONE

Manifest written: header, 8-subject table grouped angular→thin/linear→organic (pair frame + rock
clip + one-line caption + categorical judgment), 2-triptych table with the scale reads, Regenerate
block, and `## E-12 handoff`. Every asset path resolves to a Step 1–2 file.

## Step 5 — journal + rotations README · DONE

(a) Appended `## Fidelity-vs-concept frontier (E-13 sculpture set, S-038)` to
`docs/knowledge/design-learnings.md` — frontier by form type, by scale (the opposite-triptych
finding), and the image→3D framing; cites the per-build reads + committed frames.
(b) Appended the "Sculpture set (E-13 / S-038)" subsection to `pr/assets/rotations/README.md`.

## Step 6 — test + commit · DONE

`npm test` green (see review.md for output). Committed assets + docs in one feature commit. No
source/schema/test files touched — confirmed by `git status` before commit.

## Deviations from plan

- **None structural.** The only substantive addition beyond the plan: Step 3's read surfaced the
  **opposite-triptych** finding, which became the spine of the journal's scale subsection (the plan
  anticipated "report what the render shows" — it showed more than predicted, in a useful direction).
