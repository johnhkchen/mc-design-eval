# T-036-03 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes*
the T-035-01 pipeline and records evidence.

## Pre-flight (Step 0)

- `npm run test:unit` → **312 pass / 0 fail** (baseline, before any metered call).
- Env confirmed: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env`
  (`src/nano-banana.mjs`); claude `-p` shim at `~/.local/bin/claude`; `render/` GL **available**.
- Next seq = `004` (001 moai, 002 dancing-man, 003 moai-statue already present).

## Step 1 — Live benchmark run

Command:
```
npm run bench:sculpture -- --subject "a pineapple" --scale 32 --note "T-036-03 build"
```
Exit code **0**. Stage log:
- **Stage 1 (design doc):** 2079 chars → `design-doc.md`. Style "Warm Analogous Pineapple — Ripe Fruit
  in the Round": ovoid-of-revolution yellow_terracotta body (per-row disc fills), orange_terracotta
  diamond "eyes" in a staggered radial grid, radiating green_concrete fin crown with lime_terracotta
  tips; body split ~5:18:9 over 32 on a flattened non-tippy disc base.
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1110-tok prompt, **17.9 s** →
  `concept.png` (one bold 3/4 pineapple on solid black, dense orange diamond lattice + green fronds).
- **Stage 3 (3-D build):** **213 ops** → `artifact.json`, schema-valid (clean exit = AJV passed;
  re-checked with `validate-artifact.mjs` → `VALID`).
- **Render:** 3/4 still **3314 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 3314 blocks, 20931 in / 31040 out tok, **$0.9905**, ~382 s wall.

Run dir `benchmarks/sculpture/runs/004-vConcept-a-pineapple/` written with all outputs + `turntable/`
(24 frames); `benchmarks/sculpture/README.md` RUNS block auto-regenerated (row/gallery `004`).

No retries — the run succeeded on the first attempt. No partial/stale dirs to clean.

## Step 2 — Render inspection

Viewed `concept.png`, `render-3q.png`, `turntable/frame.000.png` (center az 45°), and
`turntable/frame.018.png` (cardinal face, az ≈ 5°). Cross-checked against `design-doc.md` and the
artifact's `style.rationale`.

**Key observations:**
- **Body + crown succeed.** The body is a genuinely *rounded* ovoid (disc fills; symmetric x/z bounds
  −8..8), and the green fin crown reads as a *jagged splaying frond star* — the rounded-form and
  spiky-crown tests both pass.
- **Cross-hatch under-reads (the finding).** The orange diamond lattice *was placed* (cardinal-face
  crosses are visible in `frame.018`) but it is **sparse and low-contrast** (orange_terracotta on
  yellow_terracotta ≈ same hue and value), so at the fixed 45° hero still — which shows a *corner* —
  the skin reads as a plain golden ovoid with faint flecks + horizontal segmentation banding, not the
  concept's bold all-over diamonds. This is the predicted texture-flatten outcome plus the hue/value
  ceiling (memory: *concept-image ≠ color value preview*).
- **Hero-still angle finding (echoes T-036-01):** a pineapple's pattern lives on the *cardinals*, but
  the fixed 45° still shows a *corner* — the least flattering angle for the cross-hatch. `frame.018`
  (near-cardinal) is the better read.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side (+ the cardinal-face turntable frame),
faithfulness line, shortfall section organized around cross-hatch / crown / rounded body, run facts,
and a note seeding the scale study. **Categorical judgment: `recognizable`** — matches the ticket's
"moderate fidelity expected" exactly; the patterned-organic form lands mid-frontier.

## Deviations from plan

- **None material.** Used the runner default 24 frames (per Design Decision 3). Inspected one extra
  turntable frame (`frame.018`, an existing output) to fairly judge the cross-hatch from a cardinal
  angle — no new artifact produced, it is just cited. Cost ($0.99) ran a bit higher than the siblings
  (~$0.5–0.66) because the cross-hatch grid + disc fills are op-/token-expensive (213 ops, 31040 out
  tok) — within an acceptable single-build budget, noted for the record.

## Step 4/5/6 — remaining

- Commit run dir + regenerated README + work-dir docs (Step 5).
- Re-confirm `npm test` green; write `review.md` (Step 6).
