# T-036-03 — Review

vConcept sculpture build of **"a pineapple"** at scale 32 (E-13 / S-036). Handoff for a human
reviewer. This is a **build/measurement** ticket — it ran the existing T-035-01 pipeline and recorded
evidence; it changed **no source code**.

## What changed

### Generated artifacts (committed) — `benchmarks/sculpture/runs/004-vConcept-a-pineapple/`
- `design-doc.md` + `design-doc.prompt.txt` — imagined object design doc (2079 ch): "Warm Analogous
  Pineapple — Ripe Fruit in the Round"; ovoid-of-revolution yellow body (per-row disc fills), orange
  diamond "eyes" in a staggered radial grid, radiating green fin crown with lime tips, non-tippy disc
  base.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 17.9 s).
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, **213 ops → 3314 blocks, 0
  unmapped**, bounds `[-8,0,-8]..[8,31,8]`, palette yellow_terracotta / orange_terracotta /
  green_concrete / lime_terracotta.
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored). `summary.json`, `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery auto-regenerated (row/gallery `004`).

### Authored evidence (committed) — `docs/active/work/T-036-03/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts.
- `progress.md` — live run log (numbers, observations, deviations).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side (+ cardinal-face
  turntable frame), faithfulness line, shortfalls (cross-hatch / crown / rounded body), run facts, the
  categorical judgment, and a scale-study/curation note.
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`/`*.mts`, `render/`, `baml_src/`, schema, or config files
  were created, modified, or deleted. The pipeline is T-035-01's, invoked verbatim.

### Commit
- `cd06e82` — `feat(E-13 T-036-03): vConcept build "a pineapple" @scale 32 + fidelity read`.

## Acceptance criteria — status

- **AC1 — end-to-end run, artifacts saved.** ✅ `--subject "a pineapple" --scale 32` ran clean
  (exit 0): doc → 3/4 concept → schema-valid 3-D `DesignArtifact` (re-validated `VALID`) → 3/4 render
  + 24-frame rock turntable. All outputs under the run dir.
- **AC2 — fidelity-vs-concept read recorded.** ✅ `fidelity-read.md`: concept vs render side-by-side
  (plus the cardinal-face frame that reads the pattern best) + a one-line faithfulness statement + an
  explicit shortfall section on the two named stressors (cross-hatch skin, spiky crown) and the
  rounded body.
- **AC3 — judged (categorical); renders/clips saved.** ✅ Categorical judgment **`recognizable`**;
  `render-3q.png` + 24 turntable frames saved.

## Result in one line

Unmistakably a pineapple with a faithful warm palette, a genuinely **rounded body** and a **spiky
frond crown** (both form tests pass); the signature **diamond cross-hatch skin only partially
survives** — it is placed but `orange_terracotta`-on-`yellow_terracotta` is too low-contrast, so it
reads as subtle banding + flecks rather than the concept's bold lattice, landing exactly on the
ticket's predicted **moderate fidelity**.

## Test coverage & gaps

- `npm run test:unit` = **312 pass / 0 fail**, before and after the live run (unchanged — the
  metered/GL path is intentionally outside `npm test`; the pure surface `src/sculpture.mjs` is covered
  by its 10 existing unit tests).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live run
  itself (clean exit + schema-valid + 0 unmapped + a render depicting the subject), all ✅.
- **Gap (inherent, not a regression):** build *quality*/fidelity is human-judged from the render, not
  asserted — by design (moderate fidelity is an acceptable, predicted outcome). Recorded categorically.

## Open concerns / notes for the reviewer

1. **Finding — block-scale pattern is contrast-limited, and scale-sensitive (for S-037).** The
   cross-hatch flattened mainly because the two body hues are too close in value, not because the
   model skipped it (213 ops — the most in the set — went largely into the diamond grid + disc fills).
   The scale-study hero role makes this the right place to flag it: **at 48** the lattice may register
   as a grid (more rows); **at 16** it almost certainly vanishes and the thin crown is at risk. The
   bracketing builds (T-037-*) should test both. (Connects to memory
   *concept-image ≠ color value preview* — the concept oversold the orange contrast.)
2. **Finding — the fixed 45° hero still is a corner, the worst angle for a cardinal-face pattern**
   (echoes T-036-01's azimuth finding from the opposite direction: a figure's signature was off the
   cardinals, a pineapple's is on them). `frame.018` (az ≈ 5°) is the better read. Curation (T-038-01)
   may prefer a cardinal turntable frame as the gallery hero for patterned subjects. **Deliberately not
   changed here** — editing shared `SCULPTURE_VIEW_3Q`/the runner would fork the archetype and break
   breadth comparability across the eight T-036-* builds.
3. **Single-view limitation held as expected.** The rationale states the hidden back half mirrors the
   visible features; the rock turntable never paraded the imagined back (front hemisphere only).
4. **Cost/time** $0.99 / ~382 s — higher than the siblings ($0.49–0.66) because the pattern is
   op-/token-expensive (213 ops, 31040 out tok). Still within a reasonable single-build budget; noted.
5. **Concurrency note:** the regenerated README also carries row `3` (T-036-02's run, a concurrent
   thread); its run dir commits under that ticket. The gallery is generated and reconciles on the
   shared branch — expected, not a defect.
6. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid. A clean
   mid-frontier data point; the two findings are advisory for downstream (S-037 / T-038-01), not
   blocking.

## Verdict

All three ACs met. The pipeline produced a schema-valid, immediately-recognizable pineapple on the
first attempt; the fidelity read is honest about both the wins (rounded body + spiky crown + faithful
palette) and the limit (low-contrast cross-hatch under-reading at the corner hero angle). Additive and
reproducible — no shared code touched, breadth comparability preserved. The contrast/scale findings
seed S-037 directly. Ready for the remaining T-036-* siblings and T-038-01 curation.
