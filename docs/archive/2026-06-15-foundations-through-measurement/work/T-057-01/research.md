# T-057-01 Research — consolidation-scorecard-and-march

Epic **E-17**, terminal ticket. The job: turn the data spine that T-056-01 already collected into
*one* legible scorecard + *one* per-subject visual + the durable journal entry, honestly. No new
trials, no new metrics — this is a presentation/attribution layer over an existing JSON.

## The data spine already exists (T-056-01)

`benchmarks/sculpture/sweep-ablation.json` (schema `sweep-ablation/v1`) holds the whole payload:

- `rungs[]`: `R0 text→JSON · R1 glb-voxel · R2 +material-clean · R3 +surgical` (id + label).
- `subjects[]`: one entry per subject (7 present: dancing-man, moai, pineapple, bow-and-arrow,
  heart, mushroom, koi), each with `rungs.{R0..R3}` cells:
  `{ formIoU, valueDeltaE, verdict, dFormIoU, dValueDeltaE, note? }`.
- `metric` / `note`: the honesty caveats (R0 IoU is a normalized cross-target floor; R3 expected to
  "held"; valueΔE=0 at R2/R3 because material-clean snaps to the GLB's own canonical palette — the
  drop-to-zero IS the win, but it is partly tautological per the `value-true-palette-codesign` memory).

The `.md` sibling (`sweep-ablation.md`) already renders two tables: the **Levels** table (subject ×
rung, three metric rows: form IoU / value ΔE / verdict) and the **Marginal Δ** table (ΔformIoU /
ΔvalueΔE for R1−R0, R2−R1, R3−R2). **What it lacks** for AC #1: an **AVG / Δ summary row** that
says, in one place, what each *technique* (voxel / material-clean / surgical) bought on average.

## The pure assembler that built it (`src/form/ablation.mjs`)

`assembleAblation(rows, {scale})` → `{md, json}` is the existing pure, GL-free, unit-tested core
(under the `src/**/*.test.mjs` glob, `src/form/ablation.test.mjs`, 8 tests). It groups flat rows by
subject, walks `RUNGS`, computes `rungVerdict` + the marginal Δ vs the previous *present* rung, and
renders markdown. It is tolerant of null cells (never drops a subject/rung). **This is the pattern to
mirror** for the new scorecard assembler: a pure function `spine → {md, json}`, tested offline.

Key reusable exports: `RUNGS`, `rungVerdict`, `VERDICT_GLOSS`, `assembleAblation`.

## The rung renders on disk (inputs for the march image)

Every rung's 3/4 render exists as a **512×512 PNG**, one per subject, confirmed present for all 7:

| rung | path | source ticket |
|---|---|---|
| R0 | `benchmarks/sculpture/sweep-ablation/<subj>/r0-render-3q.png` | T-056-01 collector |
| R1 | `benchmarks/sculpture/glb-voxel/<subj>/render-3q.png` | T-054-01 |
| R2 | `benchmarks/sculpture/glb-voxel-clean/<subj>/render-3q.png` | T-055-01 |
| R3 | `benchmarks/sculpture/glb-voxel-surgical-sweep/<subj>/after.png` | T-056-01 R3 |

**All four are gitignored** (root `.gitignore`: the `**/render-3q.png`, surgical-sweep `**/*.png`,
and `sweep-ablation/**/*.png` rules). They are regenerable but local-only. This is exactly why
`pr/assets/frames/*.png` is a **tracked, self-contained bundle** (see `pr/assets/frames/README.md`:
"Copying the curated subset here makes `pr/assets/` a self-contained bundle"). So the march composites
MUST be written into `pr/assets/frames/` (tracked) — the source renders won't survive a clean clone.

## Image compositing capability

- Dependency available: **`pngjs`** (`package.json` devDeps; `PNG.sync.read/write`). `decodeImage`
  in `src/color/palette-extract.mjs` already lazy-imports it to get `{width,height,data}` RGBA8.
- No `sharp`/`jimp`. ImageMagick (`magick`/`montage`/`convert`) and `ffmpeg` ARE on PATH but pull a
  host-tool dependency; the in-repo idiom is pure pngjs (used across `src/form/`, `src/color/`).
- All rung renders share one canvas size (512×512) and `RENDER_BG` background — so a horizontal
  concat is a pure RGBA buffer paste, no resampling needed. This is a small **pure** pixel routine
  (testable under the src glob) plus a thin PNG read/write I/O edge in the runner.

The existing `triptych-*.png` / `pair-*.png` frames are plain side-by-side renders with labels living
in the docs (not burned into pixels) — the same convention the march image should follow.

## The durable journal + E-12 handoff surfaces

- `docs/knowledge/design-learnings.md` — the project journal. Its tail already carries the **E-16**
  GLB-grounded consolidation (the three-answer headline + honesty notes). The E-17 section appends in
  the same voice: per-technique attribution with numbers, where a rung didn't help, the residual.
- `pr/assets/` — the E-12 showcase bundle: `README.md`, `sculptures.md`, `sequence.md`, `frames/`,
  `rotations/`. The "bringing it all together" beat (7 subjects climbing the ladder) slots in here as
  a new doc (`sweep.md`) + the 7 `march-*.png` frames + a provenance line in `frames/README.md`.

## Constraints / assumptions

- **No new model calls, no new metrics.** Consolidation must not manufacture evidence (the E-16
  discipline). The scorecard is a *pure transform* of the committed spine; numbers must match it
  exactly or the table drifts from the record.
- **Honesty is an AC, not a nicety.** R2/R3 form Δ ≈ 0 and bow-and-arrow R3 regressed (−0.004) must
  appear *as such* in both the AVG row and the journal — that is the whole point of the ticket.
- **`npm test`** = artifact self-test + `src/**/*.test.mjs`. New pure logic (scorecard assembler +
  pixel montage) must land tests there; live render-stitch is I/O-only and stays out of the glob.
- valueΔE at R2/R3 is structurally 0 (snap to the GLB's own palette). The scorecard must frame the
  material-clean "win" as the R1→R2 *drop to the canonical residual*, and flag the tautology — not
  claim a fictitious 0-from-nowhere.
