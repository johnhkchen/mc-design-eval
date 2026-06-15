# T-036-01 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes*
the T-035-01 pipeline and records evidence.

## Pre-flight (Step 0)

- `npm run test:unit` → **all green, 0 fail** (baseline, before any metered call).
- Env confirmed: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env`
  (`src/nano-banana.mjs`); claude `-p` shim at `~/.local/bin/claude`; `render/` deps present.

## Step 1 — Live benchmark run

Command:
```
npm run bench:sculpture -- --subject "a dancing man" --scale 32 --note "T-036-01 build"
```
Exit code **0**. Stage log:
- **Stage 1 (design doc):** 2093 chars → `design-doc.md`. Style: "heroic-cartoon figurative",
  analogous warm-earth + gold palette; plan = planted leg + cantilevered high-kick, asymmetric arms,
  6×6 plinth.
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1114-tok prompt, **18.1 s** →
  `concept.png` (one 3/4 dancing-man on solid black).
- **Stage 3 (3-D build):** **21 ops** → `artifact.json`, schema-valid (clean exit = AJV passed).
- **Render:** 3/4 still **1073 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 1073 blocks, 20399 in / 11363 out tok, **$0.4945**, ~181 s wall.

Run dir `benchmarks/sculpture/runs/002-vConcept-a-dancing-man/` written with all 9 outputs +
`turntable/` (24 frames); `benchmarks/sculpture/README.md` RUNS block auto-regenerated (row/gallery
`002`).

No retries — the run succeeded on the first attempt. No partial/stale dirs to clean.

## Step 2 — Render inspection

Viewed `concept.png`, `render-3q.png`, `turntable/frame.006.png` (side), `turntable/frame.018.png`
(near-frontal). Cross-checked against `design-doc.md` and the artifact's `style.rationale`.

**Key observation (a finding, not a defect to fix here):** the canonical 3/4 still azimuth (45°) is an
*unflattering* angle for this figure — the high-kicked leg cantilevers to −x, away from the camera, so
the legs merge into a column and the still looks stiffer than the build is. `frame.018` (near-frontal)
clearly shows the dance: raised gold-cuffed arms, bent kicked leg with gold shoe, planted leg, plinth.
The wide x-bounds (−12..7) are exactly that cantilevered kick.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side (with the rescuing turntable frame),
faithfulness line, four shortfall points, run facts, and a curation note. **Categorical judgment:
`recognizable` (strong)** — meets and slightly exceeds the ticket's "stiff but recognizable"
prediction; confirms the figure form type is *angle-fragile* but survives voxelization.

## Deviations from plan

- **Frame count:** used the runner **default (24)**, not 8 (moai's fast-smoke value), per Design
  Decision 3 — a smooth rock for the record. (Plan anticipated this; noting for clarity.)
- **Added a "best turntable frame" reference** to the fidelity read beyond the bare concept↔still
  comparison, because the canonical still alone would misrepresent the build. The extra frame is an
  existing output (no new artifact produced), it just gets cited.

## Step 4/5/6 — remaining

- Commit run dir + regenerated README + work-dir docs (Step 5).
- Re-confirm `npm test` green; write `review.md` (Step 6).
