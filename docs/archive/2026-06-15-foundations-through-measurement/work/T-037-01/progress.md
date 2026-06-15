# T-037-01 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes* the
T-035-01 pipeline at **scale 16** and records cross-scale evidence.

## Pre-flight (Step 0)

- `npm run test:unit` → **312 pass / 0 fail** (baseline, before any metered call).
- Env confirmed: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env` (`src/nano-banana.mjs`);
  claude `-p` shim at `~/.local/bin/claude`; `render/` deps present.
- Args sanity: subject `"a moai statue"` (identical to anchor run 003), scale `16` (≥ SCALE_MIN 8).

## Step 1 — Live benchmark run (scale 16)

Command:
```
npm run bench:sculpture -- --subject "a moai statue" --scale 16 --note "T-037-01 scale-16 study"
```
Exit code **0**. Stage log:
- **Stage 1 (design doc):** 2108 chars → `design-doc.md`. Read: head-and-torso monolith, head ~⅔
  height; identity = long nose ridge + heavy brow + jutting jaw; monochrome gray tuff; budget plan
  baked to a ~7×8×16 footprint (the **scale-16 budget** threaded into the prompt).
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1118-tok prompt, **17.3 s** →
  `concept.png` (one 3/4 moai head on solid black — bare flat crown, *no* topknot).
- **Stage 3 (3-D build):** **37 ops** → `artifact.json`, schema-valid (clean exit = AJV passed).
  Palette: gray_concrete (body), deepslate (eye/brow shadow), andesite + cobblestone (weathering).
- **Render:** 3/4 still **732 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 732 blocks, 19982 in / 16752 out tok, **$0.6314**, ~(durationMs in summary) wall.

Run dir `benchmarks/sculpture/runs/010-vConcept-a-moai-statue/` (**seq 010, scale 16**) written with
all 9 outputs + `turntable/` (24 frames); README RUNS block regenerated (a second `a moai statue` row
now appears, distinguished by the scale column = 16 vs run 003's 32).

**Seq landed at 010 as expected — no race** this time (009 was the prior max). No retries — succeeded
first attempt.

## Step 2 — Render inspection (both scales)

Viewed scale-16 `concept.png`, `render-3q.png`, `turntable/frame.018.png` (near-frontal), and the
**scale-32 anchor** `runs/003-…/render-3q.png` for the comparison. Cross-checked against both
`summary.json` files and the design doc.

**Key observations (findings, not defects to fix here):**
- **Graceful degradation confirmed (the S-037 angular hypothesis).** At ~⅛ the volume budget the
  identity-bearing features all **survive**: heavy stepped brow, two deepslate eye sockets, central
  nose ridge, set mouth, flat crown, weathering streaks. Near-frontal `frame.018` shows the face
  clearly.
- **Value drift amplified at low res.** `gray_concrete` renders dark (as at scale 32); with fewer
  blocks to relieve it, the scale-16 build reads near-black/murky at the 45° still. The frontal frame
  is the truer read — milder version of the 002 / T-036-04 azimuth lesson.
- **Cross-scale deltas vs run 003 (scale 32, 2402 blocks):** 732 blocks (~30%); bounds 7×16×9 vs
  11×32×11 (height halved exactly); **dropped** at 16 = carved torso arms/hands + crisp plinth; the
  **topknot** absence is a *concept-stage* difference (the @16 concept drew no pukao), not pure scale.
- **Cost did not fall with scale** — $0.6314 @16 vs $0.5684 @32 (slightly higher), 16752 vs 14273 out
  tokens. Lower resolution did **not** mean a cheaper run.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side + near-frontal frame.018 + the scale-32 anchor,
faithfulness line, four shortfalls, the explicit **scale-16-vs-32 comparison table** (the AC's
cross-scale note), run facts, and a curation note. **Categorical judgment: `recognizable` (strong) /
Category-enum `Competent` (form Strong, detail Weak–Competent)** — on par with the scale-32 anchor's
form, a notch below on detail/value: the angular hero holds form and loses finish at half resolution.

## Deviations from plan

- None material. Frame count = runner default (24) per Design Decision 3. No retries (a coarse-but-valid
  moai is the commissioned datum, not a pipeline failure — Design Decision 6). Seq 010 as predicted.

## Step 4/5/6 — remaining

- Commit run dir + regenerated README + work-dir docs (Step 5).
- Re-confirm `npm run test:unit` green; write `review.md` (Step 6).
