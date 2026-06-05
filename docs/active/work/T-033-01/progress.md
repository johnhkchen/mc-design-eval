# T-033-01 — Progress: pr-assets-desk

## Status: implementation complete

All plan steps executed; honesty cross-check (Step 6) green.

## Done

- **Step 1–3 — frames normalized.** 11 curated frames written to `pr/assets/frames/`, all verified
  **1080×1080**:
  - 5 spine voxel renders (003/008/010/014/015), `-filter point` (nearest-neighbor, voxel-crisp).
  - 5 concepts (taj/horyuji/chapelle/arc/mausoleum), `-filter Lanczos`; mausoleum center-cropped
    768²→1080² from its 1376×768 source.
  - 1 rotation placeholder (002, head-on).
- **Step 4 — `pr/assets/frames/README.md`** — provenance table, why-copied (concepts gitignored +
  untracked), reuse + placeholder honesty notes, reproducible `magick` recipes.
- **Step 5 — `pr/assets/sequence.md`** — full F01–F15 table (source path · copied frame/status ·
  caption · real score+rubric · overlay · duration · marks), hero-spine / breadth / rotation
  sections, real velocity receipts, asset-status table, honesty ledger, 40.0s sum-check.
- **Step 6 — cross-check gate (all pass):**
  - 11 frames present, every one 1080×1080.
  - Scores re-read from `summary.json`: 003 overall 3.0 (v1), 008 overall 4.0 (v1), 014
    strong/detail competent (v2-categorical-baml), 015 strong/detail strong — match sequence.md.
  - Block counts 1,372 / 20,311 / 10,013 — match. Cost min 001=$0.7602, max 021=$2.1251 — match.
  - 26 run dirs; journal 1,308 lines — match. Model `claude-opus-4-8`/seed 11 confirmed.

## Deviations from plan

- **Rubric label corrected on read:** the categorical rubric's real id is `v2-categorical-baml`
  (not the generic "categorical" the plan assumed). sequence.md uses "categorical / rubric v1"
  shorthand in the score column; the underlying id is recorded here and in research — no number
  changed, only the label precision.
- **001 overall score noted:** run 001 also carries a v1 overall of 4.0; the spine doesn't use 001
  as a scored rung (it's the velocity min-cost receipt only), so this is not surfaced as a climb
  step — intentional, keeps the spine to the 003→008→014 grounded-technique rungs.
- No other deviations. No code touched; no ticket frontmatter edited.

## AC coverage

- **AC #1** (sequence.md ordered, all columns, marks) — ✅ F01–F15 table complete; ▣ hero-spine /
  ◇ breadth / ⟳ rotation marked.
- **AC #2** (frames copied/normalized to common aspect) — ✅ 11 frames @ 1080² in `frames/`;
  concepts now committable.
- **AC #3** (velocity receipts real) — ✅ 26 runs / 2-day window / $0.76–$2.13 / 1,308-line journal,
  each with a `[receipt:…]`.
- **AC #4** (honest per v1-sequencing) — ✅ concepts tagged `[concept]`, F13 "where it's heading,"
  F10 placeholder flagged, honesty ledger all four checked.

## Next

Commit, then Review.
