# T-036-06 — Review

vConcept sculpture build of **"a sword"** at scale 32 (E-13 / S-036). Handoff for a human reviewer.
This is a **build/measurement** ticket — it ran the existing T-035-01 pipeline and recorded evidence;
it changed **no source code**.

## What changed

### Generated artifacts (committed) — `benchmarks/sculpture/runs/007-vConcept-a-sword/`
- `design-doc.md` + `design-doc.prompt.txt` — imagined object design doc (2198 ch): cruciform
  silhouette, point-up vertical; blade ≈⅔ height, perpendicular guard, grip, pommel, stone plinth.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 18.7 s).
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, 10 ops → **166 blocks, 0
  unmapped**, bounds `[-4,0,-1]..[4,31,1]` (9w × 32h × 3d), palette iron_block / polished_andesite /
  dark_oak_log / gold_block / stone.
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored, like every run). `summary.json`; `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery regenerated to include row/gallery `007` (committed
  by a concurrent sibling's regeneration; the file is shared and rebuilt from all `summary.json`).

### Authored evidence (committed) — `docs/active/work/T-036-06/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts.
- `progress.md` — live run log (numbers, the seq anomaly, findings, deviations).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side, faithfulness line,
  shortfalls, run facts, and the categorical judgment.
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, schema, or config files were
  created, modified, or deleted. The pipeline is T-035-01's, invoked verbatim.

### Commit
- `41cc8a0` — `feat(E-13 T-036-06): vConcept build "a sword" @scale 32 + fidelity read`.

## Acceptance criteria — status

- **AC1 — end-to-end run, artifacts saved.** ✅ `--subject "a sword" --scale 32` ran clean (exit 0):
  doc → 3/4 concept → schema-valid 3-D `DesignArtifact` → 3/4 render + 24-frame rock turntable. All
  outputs under the run dir.
- **AC2 — fidelity-vs-concept read recorded.** ✅ `fidelity-read.md`: concept vs render side-by-side
  (plus turntable frames) + a one-line faithfulness statement + an explicit shortfall section.
- **AC3 — judged (categorical); renders/clips saved.** ✅ Categorical judgment **`recognizable`
  (strong, near-faithful)**; `render-3q.png` + 24 turntable frames saved.

## Result in one line

A near-faithful cruciform sword — palette and silhouette carried verbatim concept → doc → build — with
the predicted "thinning loss" isolated to a *stepped (non-pointed) tip* rather than the whole shaft,
vindicating the ticket's form note that a **flat/planar** blade voxelizes more gracefully than a round
shaft (the arrow, T-036-05).

## Test coverage & gaps

- `npm run test:unit` = **312 pass / 0 fail**, before and after the live run (unchanged — the
  metered/GL path is intentionally outside `npm test`; the pure surface `src/sculpture.mjs` is covered
  by its existing unit tests).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live run
  itself (clean exit + schema-valid + 0 unmapped + a render depicting the subject), all ✅.
- **Gap (inherent, not a regression):** build *quality*/fidelity is human-judged from the render, not
  asserted — by design (some thinning loss is an acceptable, predicted outcome). Recorded categorically.

## Open concerns / notes for the reviewer

1. **Seq landed at 007, not 006.** A concurrent sibling T-036-* claimed seq 006 on the shared branch
   before this run's `nextSeq()`. Harmless — the run id slug (`a-sword`) is the join key, not the seq.
   Same anomaly the moai-statue sibling (003) documented; anticipated in `structure.md`'s concurrency
   note. The shared README was likewise regenerated/committed by a sibling and correctly includes 007.
2. **Findings for E-13 curation (T-038-01), not changed here:** (a) the fixed 45° hero still turns the
   blade's *front-face* fuller edge-on — the same azimuth-dependence the dancing-man build flagged; (b)
   the model **steps** the blade rather than tapering it to a point at scale 32. Both are cross-subject
   signals the breadth showcase exists to surface; editing `SCULPTURE_VIEW_3Q`/the prompt would fork
   the archetype and break breadth comparability across the eight T-036-* builds.
3. **Single-view limitation held as expected.** A sword is near-symmetric front/back, so the
   single-view reconstruction risk was low; the rock turntable never paraded an imagined back.
4. **Lowest block count of the series** (166 vs moai 3414, dancing-man 1073) — expected and correct: a
   thin planar object is mostly air around a 3-thick blade.
5. **Cost/time** $0.4663 / ~165 s — well within the ~$0.7 / ~8 min budget the moai smoke set.
6. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid. A clean,
   near-faithful data point for the iconic-thin-object form type.

## Verdict

All three ACs met. The pipeline produced a schema-valid, near-faithful sword on the first attempt; the
fidelity read is honest about both the win (palette + cruciform present, planar blade holds up) and the
limit (stepped tip, edge-on fuller at the fixed angle). Additive and reproducible — no shared code
touched, breadth comparability preserved. Ready for the remaining T-036-* siblings and T-038-01
curation.
