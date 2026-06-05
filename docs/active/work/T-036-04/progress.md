# T-036-04 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes* the
T-035-01 pipeline and records evidence. (The live run completed earlier; this log reconstructs it from
`summary.json`, the artifact, and direct inspection of the renders.)

## Pre-flight (Step 0)

- `npm run test:unit` → green baseline (the metered/GL path is outside `npm test`).
- Env: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env` (`src/nano-banana.mjs`); claude
  `-p` shim at `~/.local/bin/claude`; `render/` deps present.

## Step 1 — Live benchmark run

Command:
```
npm run bench:sculpture -- --subject "a bow and arrow" --scale 32 --note "T-036-04 build"
```
Exit code **0**. From `summary.json` + `artifact.json`:
- **Stage 1 (design doc):** 2124 ch → `design-doc.md`. Read: a *tensioned arc* — recurve "D" bow,
  bone string, straight diagonal arrow crossing the grip, low oval plinth; palette spruce limb /
  stripped-oak arrow+base / dark-oak grip wrap / bone string / iron arrowhead / red_concrete fletching.
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1114-tok prompt (4456 ch), **20.8 s** →
  `concept.png` (one 3/4 bow-and-arrow on solid black — beautifully legible).
- **Stage 3 (3-D build):** **169 ops** → `artifact.json`, schema-valid (clean exit = AJV passed).
  Palette used exactly as the doc specified (6 blocks: spruce_planks, stripped_oak_log,
  dark_oak_planks, bone_block, red_concrete, iron_block).
- **Render:** 3/4 still **411 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 411 blocks, 21453 in / **34999 out** tok, **$1.0938**, ~453 s wall.

Run dir `benchmarks/sculpture/runs/005-vConcept-a-bow-and-arrow/` written with all 9 outputs +
`turntable/` (24 frames); README RUNS block regenerated (row/gallery `005`).

**This is the priciest, longest, most output-heavy run of the series** (vs sword $0.47/166 blk,
dancing-man $0.49/1073 blk, moai $0.66/3414 blk). The thin/linear subject drove 35k output tokens and
169 ops — the model worked hard to lay down the many short runs (stepped bow curve, 1-wide string,
diagonal arrow). No retries — succeeded first attempt.

## Step 2 — Render inspection

Viewed `concept.png`, `render-3q.png`, and turntable frames **000/012** (both at the 45° rock center)
and the extremes **006 (≈85°, side-on)** and **018 (≈5°, near-frontal)**. Cross-checked against
`design-doc.md` and the artifact palette.

**Key observations (findings, not defects to fix here):**
- **The thin elements SURVIVED — they did not vanish.** Contrary to the ticket's worst-case fear
  ("possibly failed if string+arrow both vanish"), every named mass is present in the build:
  - **Bow stave** — strong, solid stepped recurve "D", reads from every angle.
  - **String** — the *thinnest* element survived as a continuous **1-wide `bone_block` line** spanning
    the limb tips. Not dropped, not dotted — intact.
  - **Arrow shaft** — survived as a continuous ~1–2-thick `stripped_oak_log` horizontal run.
  - **Arrowhead** — survived, *oversized/chunky* iron_block cluster.
  - **Fletching** — survived but *reduced* to a small `red_concrete` cluster (lost the stepped vanes).
  - **Base plinth** — survived.
- **The dominant gap is ANGLE, not thinness.** At the fixed `SCULPTURE_VIEW_3Q` 45° azimuth (and the
  rock-center frames 000/012), the arrow points into depth and foreshortens to its white head blob +
  a red speck, so `render-3q.png` reads far weaker than the build actually is. Frame **006** (side-on)
  is worse still (the arrow aims at the camera). Frame **018** (near-frontal, ≈5°) is the **money
  shot** — bow arc + bone string + full horizontal arrow with iron head and red fletching all resolve,
  nearly matching the concept. This is the **same azimuth-dependence the dancing-man build (002)
  flagged**, here even more pronounced because the arrow's signature is a single horizontal axis.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side + the rescuing near-frontal frame.018 + the
side-on frame.006, a faithfulness line, shortfalls, an explicit **thin-element survival subsection**
(AC#2's required question), run facts, and a curation note. **Categorical judgment: `recognizable`** —
the build is stronger than its hero still suggests; thin elements survived (chunky) rather than failing.

## Deviations from plan

- None material. Frame count = runner default (24) per Design Decision 3. No retries (a low-fidelity
  *angle* is a datum, not a pipeline failure — Design Decision 6).
- The run was executed/committed earlier in the session; this Implement log + the fidelity read + the
  review were authored now from the persisted artifacts (the renders were inspected directly).

## Step 4/5/6 — remaining

- Commit the work-dir docs (progress, fidelity-read, review) — the run dir + README were committed with
  the earlier build commit.
- Re-confirm `npm run test:unit` green; `review.md` written (Step 6).
