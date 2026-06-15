# T-036-01 — Review

vConcept sculpture build of **"a dancing man"** at scale 32 (E-13 / S-036). Handoff for a human
reviewer. This is a **build/measurement** ticket — it ran the existing T-035-01 pipeline and recorded
evidence; it changed **no source code**.

## What changed

### Generated artifacts (committed) — `benchmarks/sculpture/runs/002-vConcept-a-dancing-man/`
- `design-doc.md` + `design-doc.prompt.txt` — imagined object design doc (2093 ch): "heroic-cartoon
  figurative", planted leg + cantilevered high-kick, asymmetric arms, 6×6 plinth.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 18.1 s).
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, 21 ops → **1073 blocks, 0
  unmapped**, bounds `[-12,0,-4]..[7,32,2]`, palette terracotta/red_/brown_/orange_terracotta +
  gold_block.
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored, like the moai run). `summary.json`, `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery auto-regenerated (row/gallery `002`).

### Authored evidence (committed) — `docs/active/work/T-036-01/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts.
- `progress.md` — live run log (numbers, the one finding, deviations).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side, faithfulness line,
  shortfalls, run facts, and the categorical judgment.
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, schema, or config files were
  created, modified, or deleted. The pipeline is T-035-01's, invoked verbatim.

### Commit
- `60dbb99` — `feat(E-13 T-036-01): vConcept build "a dancing man" @scale 32 + fidelity read`.

## Acceptance criteria — status

- **AC1 — end-to-end run, artifacts saved.** ✅ `--subject "a dancing man" --scale 32` ran clean
  (exit 0): doc → 3/4 concept → schema-valid 3-D `DesignArtifact` → 3/4 render + 24-frame rock
  turntable. All outputs under the run dir.
- **AC2 — fidelity-vs-concept read recorded.** ✅ `fidelity-read.md`: concept vs render side-by-side
  (plus the rescuing turntable frame) + a one-line faithfulness statement + an explicit shortfall
  section.
- **AC3 — judged (categorical); renders/clips saved.** ✅ Categorical judgment **`recognizable`
  (strong)**; `render-3q.png` + 24 turntable frames saved.

## Result in one line

A faithful palette and a genuine, recognizable asymmetric dance pose; the figure form type survives
voxelization better than the ticket feared **when seen from a flattering angle**, but the dance is
**angle-fragile** — the fixed 3/4 still azimuth (45°) under-shows the −x cantilevered kick, and the
turntable's `frame.018` is what actually proves the dance.

## Test coverage & gaps

- `npm test` = **312 pass / 0 fail**, before and after the live run (unchanged — the metered/GL path
  is intentionally outside `npm test`; the pure surface `src/sculpture.mjs` is covered by its 10
  existing unit tests).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live
  run itself (clean exit + schema-valid + 0 unmapped + a render depicting the subject), all ✅.
- **Gap (inherent, not a regression):** build *quality*/fidelity is human-judged from the render, not
  asserted — by design (a stiff figure is an acceptable, predicted outcome). Recorded categorically.

## Open concerns / notes for the reviewer

1. **Finding for E-13 curation (T-038-01): the hero-still azimuth is subject-dependent.** A figure
   whose signature is a cantilevered limb presents its *weakest* silhouette at the fixed 45° still.
   Options for curation/the archetype owner: pick the best turntable frame as the gallery hero for
   figures, or tune the still azimuth per subject. **Deliberately not changed here** — editing the
   shared `SCULPTURE_VIEW_3Q`/runner would fork the archetype and break breadth comparability across
   the eight T-036-* builds. This is the kind of cross-subject signal the breadth showcase exists to
   surface.
2. **Single-view limitation held as expected.** The build reinterpreted the concept's pose in the
   round (both arms up vs the concept's one-up/one-out) rather than tracing the single view — coherent
   and symmetric, consistent with the documented mode property; the imagined back was never paraded
   (rock turntable, front hemisphere only).
3. **Block count low vs moai** (1073 vs 3414) — expected: a thin-limbed figure is mostly air around a
   slender body, where moai is a solid monolith. Limbs are chunky (2×2 caps read as mittens/boots);
   recognizability survives, finesse does not.
4. **Cost/time** $0.49 / ~181 s — well within the ~$0.7 / ~8 min budget the moai smoke set.
5. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid. The build
   is a clean data point for the figure form type; the azimuth finding is advisory for downstream,
   not blocking.

## Verdict

All three ACs met. The pipeline produced a schema-valid, recognizable dancing-man sculpture on the
first attempt; the fidelity read is honest about both the win (palette + dance present) and the
limit (angle-fragility, chunky limbs). Additive and reproducible — no shared code touched, breadth
comparability preserved. Ready for the remaining T-036-* siblings and T-038-01 curation.
