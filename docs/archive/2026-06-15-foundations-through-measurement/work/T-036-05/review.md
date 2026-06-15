# T-036-05 — Review

vConcept sculpture build of **"an anatomically correct human heart"** at scale 32 (E-13 / S-036).
Handoff for a human reviewer. This is a **build/measurement** ticket — it ran the existing T-035-01
pipeline and recorded evidence; it changed **no source code**.

## What changed

### Generated artifacts (committed) — `benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/`
- `design-doc.md` + `design-doc.prompt.txt` — imagined object design doc (2361 ch): "anatomical-realism",
  lopsided muscular cone, teardrop ventricular body, atrial bulges, aortic arch named as the #1
  recognizing cue, coronary grooves; near-complementary warm-dominant palette.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 21.2 s). A **vivid,
  highly recognizable** voxel heart — the strongest concept in the run dir so far.
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, 67 ops (`fill` + `voxel`) →
  **2648 blocks, 0 unmapped**, bounds `[-8,0,-6]..[8,31,6]`, palette red_terracotta (32 ops) /
  yellow_terracotta (22) / red_concrete (7) / light_blue_terracotta (4) / polished_andesite (2).
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored, like the siblings). `summary.json` (tracked), `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery auto-regenerated (row/gallery `006`).

### Authored evidence (committed) — `docs/active/work/T-036-05/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts.
- `progress.md` — live run log (numbers, the findings, deviations).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side, faithfulness line,
  shortfalls **including the organic-curve loss line and the color-value gap**, run facts, categorical
  judgment.
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, schema, or config files were
  created, modified, or deleted. The pipeline is T-035-01's, invoked verbatim.

### Commit
- `61fe3c1` — `feat(E-13 T-036-05): vConcept build "an anatomically correct human heart" @scale 32 + fidelity read`.

## Acceptance criteria — status

- **AC1 — end-to-end run, artifacts saved.** ✅ `--subject "an anatomically correct human heart"
  --scale 32` ran clean (exit 0): doc → 3/4 concept → schema-valid 3-D `DesignArtifact` → 3/4 render +
  24-frame rock turntable. All outputs under the run dir.
- **AC2 — fidelity-vs-concept read recorded (incl. one line on the organic-curve loss).** ✅
  `fidelity-read.md`: concept vs render side-by-side (+ three turntable frames documenting the
  *absence* of a flattering angle) + a one-line faithfulness statement + an explicit shortfall section
  whose first point is the organic-curve loss.
- **AC3 — judged (categorical); renders/clips saved.** ✅ Categorical judgment **`loose`**;
  `render-3q.png` + 24 turntable frames saved.

## Result in one line

A beautiful, unmistakable concept paired with the weakest build of the breadth set: the text-JSON
stage discretized the lobed teardrop body into a rectangular block and never closed the aortic arch
into a loop, so the heart reads as an abstract red sculpture — **`loose`**, exactly the "large gap"
the ticket predicted for the organic-curve form type.

## Test coverage & gaps

- `npm run test:unit` = **312 pass / 0 fail**, before and after the live run (unchanged — the
  metered/GL path is intentionally outside `npm test`; the pure surface `src/sculpture.mjs` is covered
  by its existing unit tests).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live run
  itself (clean exit + schema-valid + 0 unmapped + a render depicting the subject), all ✅ on the
  *mechanical* criteria; the *fidelity* criterion is human-judged (`loose`) and recorded, not asserted.
- **Gap (inherent, not a regression):** build *quality*/fidelity is human-judged from the render — by
  design (a large organic-curve gap is an acceptable, predicted outcome). Recorded categorically.

## Open concerns / notes for the reviewer

1. **Primary finding — the concept↔build gap scales with organic curvature.** This run is the breadth
   set's organic-curve *floor*: moai (angular) = small gap, dancing man (figure) = moderate gap, heart
   (smooth/lobed/curved) = large gap — the predicted fidelity frontier, now with a data point at the
   hard end. The build stage cannot trace a smooth lobed mass or close a curved tube into an arch; it
   discretizes both into right-angle blocks, and it dropped the single highest-value cue (the aortic
   loop). This is the cross-subject signal the breadth showcase exists to surface — **for the archetype
   owner / T-038-01 curation, not a fix here.**
2. **`light_blue_terracotta` is a poor render-value "blue"** (memory *concept-image-not-color-value-preview*
   confirmed again): it resolves to muted grayish-lavender, killing the warm/cool complement the
   concept relied on for legibility. If a future build needs a readable cool accent, pick a different
   block. Recorded as a finding; **not changed here** (would fork the archetype, break breadth
   comparability).
3. **Concurrency note.** Sibling threads (runs 003/005/007 — moai-statue, bow-and-arrow, sword) were
   uncommitted on the shared branch during this work. I committed **only** my own paths (run 006 dir +
   work dir) plus the runner-regenerated `README.md`. The README may transiently reference sibling run
   rows whose dirs land in their own commits — inherent to the "multiple threads, same branch" model
   (workflow §Concurrency) and self-healing as siblings commit. No action needed.
4. **Single-view limitation on an asymmetric subject.** The back hemisphere is pure model invention;
   the rock turntable hides it by design. Not a defect — a documented mode property.
5. **Cost/time** $0.6406 / ~254 s — within the moai's ~$0.66 / ~500 s envelope, slightly above the
   dancing man ($0.49). The larger op/block count (67 ops, 2648 blocks) reflects a solid mass vs the
   figure's thin limbs.
6. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid. The `loose`
   judgment is the *expected, valuable* data point for the organic-curve form type — not a build error
   to retry.

## Verdict

All three ACs met. The pipeline produced a schema-valid, on-palette heart sculpture on the first
attempt; the fidelity read is honest about the large gap (organic curves and the aortic loop lost,
veins not blue) while crediting what survived (dominant red mass, coronary grooves). Additive and
reproducible — no shared code touched, breadth comparability preserved. The `loose` result is the
hard-end anchor of the E-13 breadth study; ready for the remaining T-036-* siblings and T-038-01
curation.
