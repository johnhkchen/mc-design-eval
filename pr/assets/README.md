# Assets desk

Primary assets — the curated, ordered **evolution frame sequence** the video is built from.

**Job:** pick the frames that tell the climb, order them, caption each with the technique it unlocked, and
attach the rubric score — the canonical sequence the Production desk assembles.

Output: `sequence.md` (ordered frame list: source path → caption → score → duration hint) + any derived/
normalized frames (cropped/letterboxed to a common aspect) under `assets/frames/`.

Sourcing (existing artifacts; `runs/` and `concepts/` are gitignored, so reference by path + copy chosen
frames in):
- **Hero spine (one subject = Taj):** early text-JSON → colorful → integrated/strong → the Nano Banana
  concept. Candidate frames live in `benchmarks/temple-facade/runs/010,013,014,015/render.png` and
  `benchmarks/temple-facade/concepts/taj-C-flash.png`.
- **Breadth beat:** `concepts/{taj,horyuji,chapelle,arc,mausoleum}-C-flash.png`.
- **Scores:** from `docs/knowledge/design-learnings.md` / `summary.json` per run.

Keep ONE hero subject in the spine for a clean ape→man read; use the breadth beat for generalization.
