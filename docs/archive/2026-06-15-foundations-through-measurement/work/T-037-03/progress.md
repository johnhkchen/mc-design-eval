# T-037-03 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes* the
T-035-01 pipeline at **scale 16** and records cross-scale evidence.

## Pre-flight (Step 0)

- `npm run test:unit` → **312 pass / 0 fail** (baseline, before any metered call).
- Env confirmed: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env` (`src/nano-banana.mjs`);
  claude `-p` shim at `~/.local/bin/claude`; `render/` deps present.
- Args sanity: subject `"a pineapple"` (identical to anchor run 004), scale `16` (≥ SCALE_MIN 8).

## Step 1 — Live benchmark run (scale 16)

Command:
```
npm run bench:sculpture -- --subject "a pineapple" --scale 16 --note "T-037-03 scale-16 study"
```
Exit code **0**. Stage log (from console + `summary.json`):
- **Stage 1 (design doc):** 2224 chars → `design-doc.md`. Read: two masses (fat ovoid body ~9 +
  radiating crown ~7); identity cues = diamond crosshatch lattice + fan of stiff green fronds; palette
  `orange_terracotta` body / `yellow_terracotta` lattice studs / `green_concrete` crown /
  `brown_terracotta` accents; budget plan baked to a ~7×7 footprint, 16 tall (the **scale-16 budget**
  threaded into the prompt).
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1147-tok prompt, **20.4 s** →
  `concept.png` (one 3/4 pineapple on solid black: rounded ovoid with a bold raised orange/yellow
  diamond lattice + a splaying green frond crown).
- **Stage 3 (3-D build):** **111 ops** → `artifact.json`, schema-valid (clean exit = AJV passed). Style
  label "warm-analogous-fruit-with-complementary-crown"; orange body, yellow staggered diamond studs on
  all four faces, 7-tall green frond flame, brown collar (y8) + basal (y0) rings.
- **Render:** 3/4 still **332 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 332 blocks, 19950 in / 15697 out tok, **$0.6062**, ~215 s wall.

Run dir `benchmarks/sculpture/runs/012-vConcept-a-pineapple/` (**seq 012, scale 16**) written with all
8 outputs + `turntable/` (24 frames); README RUNS block regenerated (a second `a pineapple` row now
appears, distinguished by the scale column = 16 vs run 004's 32).

**Seq landed at 012 as expected — no race** this time (011 was the prior max). No retries — succeeded
first attempt.

## Step 2 — Render inspection (both scales)

Viewed scale-16 `concept.png`, `render-3q.png` (45° corner), and `turntable/frame.018.png` (near-frontal
az ≈ 5°), cross-checked against `summary.json` + `artifact.json` style/palette and the **scale-32
anchor** run 004 facts (3314 blocks, 17×32×17, `recognizable`).

**Key observations (findings, not defects to fix here):**
- **Two predictions from run 004 both came out wrong, in opposite directions.** (1) The cross-hatch did
  **not** disappear at 16 — it survived *more clearly* than at 32, because the model picked a
  higher-contrast `orange_terracotta` field + `yellow_terracotta` studs (run 004 used the near-same-value
  yellow field + orange studs that washed out). Coarsening forced a bolder palette → a legible
  orange/yellow checker. (2) The crown did **not** collapse to a green cap — it fragmented into thin
  radiating arms with **detached floating cube tips** (thin-element breakup, worse at low res).
- **The casualty scale actually took was the rounded body** — the one feature run 004 nailed at 17×17.
  At 9×9 the body has too few blocks to round and reads as a **chunky two-tier cube**, not an ovoid.
- **Hero-angle lesson repeats:** the fixed 45° still (`render-3q.png`) shows a corner and under-sells
  the checker + fragmenting crown (reads almost cactus-like); near-frontal `frame.018` is the truer read.
- **Cross-scale deltas vs run 004 (scale 32):** 332 blocks (~⅒ of 3314); bounds 9×17×9 vs 17×32×17;
  **cost fell** with scale ($0.6062 @16 vs $0.9905 @32; out-tokens 15697 vs 31040) — the opposite of the
  moai, whose @16 run cost *more* than @32. The pineapple's op-heavy cross-hatch is what made @32 pricey;
  fewer ops at @16 → cheaper.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side + near-frontal frame.018, faithfulness line, the
three shortfall axes (cross-hatch / body / crown), the explicit **scale-16-vs-32 comparison table** (the
AC's cross-scale note) with the "both predictions wrong, in opposite directions" headline, run facts, and
a curation note. **Categorical judgment: `recognizable` / Category-enum `Competent` (pattern Strong, form
Weak–Competent)** — on par with the scale-32 anchor's `recognizable`: the organic form held
recognizability at 16, trading *which* attribute it keeps (pattern over form) rather than degrading more.

## Deviations from plan

- None material. Frame count = runner default (24) per Design Decision 3. No retries (a coarse-but-valid
  pineapple is the commissioned datum, not a pipeline failure — Design Decision 6). Seq 012 as predicted,
  no race.

## Step 4/5/6 — remaining

- Commit run dir + regenerated README + work-dir docs (Step 5) — commit is Lisa/human's call; the RDSPI
  pass itself stops after `review.md`.
- Re-confirm `npm run test:unit` green; write `review.md` (Step 6).
