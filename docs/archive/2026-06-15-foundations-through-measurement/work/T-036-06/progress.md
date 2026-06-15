# T-036-06 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes* the
T-035-01 pipeline and records evidence.

## Pre-flight (Step 0)

- `npm run test:unit` → **all green, 0 fail** (baseline, before any metered call).
- Env confirmed: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env` (2 hits,
  `src/nano-banana.mjs`); claude `-p` shim at `~/.local/bin/claude`; `render/` deps present.

## Step 1 — Live benchmark run

Command:
```
npm run bench:sculpture -- --subject "a sword" --scale 32 --note "T-036-06 build"
```
Exit code **0**. Stage log:
- **Stage 1 (design doc):** 2198 chars → `design-doc.md`. Read: cruciform silhouette, point-up
  vertical; four stacked Y volumes (blade ≈21, guard 2, grip 4, pommel 2) + stone plinth; palette
  iron blade / andesite fuller / dark-oak grip+guard / gold caps+pommel / stone base.
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1140-tok prompt, **18.7 s** →
  `concept.png` (one 3/4 point-up sword on solid black).
- **Stage 3 (3-D build):** **10 ops** → `artifact.json`, schema-valid (clean exit = AJV passed).
- **Render:** 3/4 still **166 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 166 blocks, 22298 in / 9677 out tok, **$0.4663**, ~165 s wall.

Run dir `benchmarks/sculpture/runs/007-vConcept-a-sword/` written with all 9 outputs + `turntable/`
(24 frames); `benchmarks/sculpture/README.md` RUNS block auto-regenerated (row/gallery `007`).

**Seq anomaly (expected, documented in Structure):** `nextSeq()` returned **007**, not the 006
predicted at planning time — a concurrent sibling T-036-* claimed 006 first on the shared branch. This
is harmless: the run id embeds the subject slug (`a-sword`), which is the join key, not the seq. Same
class of anomaly the moai-statue sibling (003) recorded.

No retries — the run succeeded on the first attempt. No partial/stale dirs to clean.

## Step 2 — Render inspection

Viewed `concept.png`, `render-3q.png`, and `turntable/frame.000.png` + `frame.012.png`. Cross-checked
against `design-doc.md` and the artifact's palette.

**Key observations (findings, not defects to fix here):**
- The build is a **strong, near-faithful** realization — cruciform silhouette, all five masses, exact
  palette carried verbatim concept → doc → build.
- The blade **steps** rather than tapers: a 3-wide fullered base abruptly narrows to a 1-wide column
  and ends flat/notched — no true point. The predicted "thinning loss" lands at the *tip*, not along
  the shaft (the flat/planar blade holds its width well, vindicating the form note vs the round arrow).
- The front-face `polished_andesite` fuller presents **edge-on** at the fixed 45° azimuth (gray flank
  stripe) — the same azimuth-dependence the dancing-man build flagged; the near-frontal turntable arc
  recovers it.
- 166 blocks is the **lowest of the series** (vs moai 3414, dancing-man 1073) and correctly so — a
  thin planar object is mostly air.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side (+ two turntable frames), faithfulness line,
four shortfall points, run facts, and a curation note. **Categorical judgment: `recognizable`
(strong, near-faithful)** — meets the ticket's "recognizable with some thinning loss" prediction and
confirms a planar thin object voxelizes more gracefully than a round one.

## Deviations from plan

- **Seq 007 not 006** — concurrent-sibling race (anticipated in Structure's concurrency note); no
  action needed.
- **Frame count:** used the runner **default (24)** per Design Decision 3 — a smooth rock for the
  record.

## Step 4/5/6 — remaining

- Commit run dir + regenerated README + work-dir docs (Step 5).
- Re-confirm `npm test` green; write `review.md` (Step 6).
