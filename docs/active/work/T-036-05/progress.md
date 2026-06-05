# T-036-05 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes* the
T-035-01 pipeline and records evidence.

## Pre-flight (Step 0)

- `npm run test:unit` → **all green, 0 fail** (baseline, before any metered call).
- Env confirmed: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env`
  (`src/nano-banana.mjs`); claude `-p` shim at `~/.local/bin/claude` (→ 2.1.165); `render/` deps
  present.

## Step 1 — Live benchmark run

Command:
```
npm run bench:sculpture -- --subject "an anatomically correct human heart" --scale 32 --note "T-036-05 build"
```
Ran in background; exit code **0**. Stage log:
- **Stage 1 (design doc):** 2361 chars → `design-doc.md`. Style: "anatomical-realism". Read of subject:
  lopsided muscular cone (not the valentine), teardrop ventricular body, atrial bulges, **aortic arch
  as the #1 recognizing cue ("a true loop with a hole through it")**, coronary grooves. Palette planned:
  red_terracotta (muscle), red_concrete (arteries), light_blue_terracotta (veins), yellow_terracotta
  (coronary fat), polished_andesite (plinth).
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1181-tok prompt, **21.2 s** →
  `concept.png` — a **vivid, highly recognizable** voxel heart: lobed red body, yellow coronary grooves,
  blue veins, red arteries, aortic arch looping with a visible hole. The strongest concept in the run
  dir so far.
- **Stage 3 (3-D build):** **67 ops** (`fill` + `voxel`) → `artifact.json`, schema-valid (clean exit =
  AJV passed). Palette as emitted: red_terracotta 32 / yellow_terracotta 22 / red_concrete 7 /
  light_blue_terracotta 4 / polished_andesite 2.
- **Render:** 3/4 still **2648 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 2648 blocks, 21139 in / 16883 out tok, **$0.6406**, ~254 s wall.

Run dir `benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/` written with all
9 outputs + `turntable/` (24 frames); `benchmarks/sculpture/README.md` RUNS block auto-regenerated
(row/gallery `006`).

No retries — the run succeeded on the first attempt. No partial/stale dirs to clean.

## Step 2 — Render inspection

Viewed `concept.png`, `render-3q.png`, and turntable `frame.006` (side), `frame.012` (near-still),
`frame.018` (other 3/4). Cross-checked against `design-doc.md` and the artifact's palette.

**Key observations (findings, not defects to fix here):**
1. **Severe organic-curve loss.** The concept's lobed teardrop body built as a chunky right-angled
   rectangular `fill` mass; the **aortic arch never built as a loop** — it is a straight vertical red
   column with no hole. The design doc named the arch as *the* recognizing cue; the build dropped
   exactly that. This is the predicted "large gap" landing on the highest-value feature.
2. **Color-value/hue gap** (anticipated via memory *concept-image-not-color-value-preview*):
   `light_blue_terracotta` renders as a **muted grayish-lavender**, not the cool blue the concept
   showed — the warm/cool complement that made the concept legible is lost in-render.
3. **What survived:** the yellow coronary grooves read on the body front (22/67 ops) — the build's one
   genuine anatomical tell.
4. **No flattering angle** (unlike T-036-01's dancing man): every turntable frame shows the same blocky
   mass + stub vessels, because the arch/teardrop were never built. A *build* shortfall, not a framing
   one.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side (+ three turntable frames showing no rescuing
angle), faithfulness line, five shortfall points (including the AC-mandated organic-curve line and the
color-value gap), run facts, and a curation note. **Categorical judgment: `loose`** — coherent and
on-palette, parts mappable *with the concept beside it*, but standalone it does not read as a heart
(no teardrop body, no aortic loop, veins not blue). **Confirms the ticket's "large gap expected"
prediction** for the organic-curve form type — the archetype's worst case.

## Deviations from plan

- **Frame count:** used the runner **default (24)**, per Design Decision 3 — comparable to the
  dancing-man run.
- **Cited three turntable frames** in the fidelity read (vs the plan's "a couple") specifically to
  *document the absence* of a flattering angle — the opposite of T-036-01, where a frame rescued the
  read. The extra frames are existing outputs (no new artifact produced); they are cited as evidence.

## Step 4/5/6 — remaining

- Commit run dir + regenerated README + work-dir docs (Step 5).
- Re-confirm `npm test`/`test:unit` green; write `review.md` (Step 6).
