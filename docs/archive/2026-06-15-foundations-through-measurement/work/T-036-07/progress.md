# T-036-07 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes* the
T-035-01 pipeline and records evidence.

## Pre-flight (Step 0)

- `npm run test:unit` → **312 pass / 0 fail** (baseline, before any metered call).
- Env confirmed: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env`
  (`src/nano-banana.mjs`); claude `-p` shim at `~/.local/bin/claude` (→ 2.1.165); `render/` GL present.
- Next seq confirmed **008**, slug `a-mushroom` (runs 001–007 on disk).

## Step 1 — Live benchmark run

Command:
```
npm run bench:sculpture -- --subject "a mushroom" --scale 32 --note "T-036-07 build"
```
Exit code **0** (run in background, ~375 s wall). Stage log:
- **Stage 1 (design doc):** 2225 chars → `design-doc.md`. Style "amanita-toadstool naturalism";
  explicitly planned the **cap overhang** ("a dome must overhang or it reads as a pyramid"), tapered
  bone stem with volva bulge, mossy mound base, complementary red↔green palette.
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1147-tok / 4587-char prompt, **20.3 s** →
  `concept.png` (one 3/4 Amanita on solid black — red domed cap, white spots, pale stem, green base).
- **Stage 3 (3-D build):** **50 ops** → `artifact.json`, schema-valid (clean exit = AJV passed).
  Palette: `red_concrete` (cap) · `bone_block` (stem) · `moss_block` (base) · `white_concrete`
  (spots + gill ring). Notably did **not** use literal `*_mushroom_block`/`mushroom_stem`.
- **Render:** 3/4 still **4411 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 4411 blocks, bounds `[-11,0,-11]..[11,30,11]` (radially symmetric 23×23 footprint ×31
  tall — top-heavy), 20587 in / 17201 out tok, **$0.6459**, ~375 s wall.

Run dir `benchmarks/sculpture/runs/008-vConcept-a-mushroom/` written with all 9 outputs +
`turntable/` (24 frames); `benchmarks/sculpture/README.md` RUNS block auto-regenerated (row/gallery
`008`).

No retries — the run succeeded on the first attempt. No partial/stale dirs to clean.

## Step 2 — Render inspection

Viewed `concept.png`, `render-3q.png`, `turntable/frame.006.png` (near-side), `turntable/frame.012.png`
(look-down, ≈ the still). Cross-checked against `design-doc.md` and the artifact's `style.rationale`.

**Key observations (findings, not defects to fix here):**
- **Cap overhang achieved** — the make-or-break mushroom cue. The cap rim flares well wider than the
  bone stem and overhangs it with a shadow gap; this is what makes the build read as a mushroom rather
  than a tree/cone. The design doc planned it deliberately (cited the dome-overhang rule).
- **Cap terraced into a stepped cone, not a smooth dome** — the one organic-curve loss. Most visible in
  the canonical 3/4 still, which looks *down* (el 30°) onto the cap and hides the stem, under-selling
  the gestalt. `frame.006` (near-side) shows the overhang + stem + mound clearly and rescues the read.
- **Color-value gap (mild):** concept scarlet → `red_concrete` renders a deeper brick/crimson. Hue
  right, value muted; doesn't cost recognizability.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side (with the rescuing near-side turntable frame),
faithfulness line, five shortfall/observation points (incl. the cap-overhang read and block-vocabulary
note), run facts, and a curation note. **Categorical judgment: `recognizable` (strong)** — meets and
slightly exceeds the ticket's "reasonably faithful" prediction; confirms the mushroom is the
**organic-fidelity high-water mark** of the breadth set (key cue survived voxelization).

## Deviations from plan

- **Added a "best turntable frame" reference** (`frame.006`) to the fidelity read beyond the bare
  concept↔still comparison, because the canonical still (el 30° look-down) under-shows the stem and
  over-emphasizes the stepped cap. The extra frame is an existing output (no new artifact produced).
- Otherwise the run followed the plan exactly — single attempt, default 24 frames, scale 32, verbatim
  subject string.

## Step 4/5/6 — remaining

- Commit run dir + regenerated README + work-dir docs (Step 5).
- Re-confirm `npm test`/`test:unit` green; write `review.md` (Step 6).
