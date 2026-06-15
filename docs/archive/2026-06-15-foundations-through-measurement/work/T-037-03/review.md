# T-037-03 — Review

vConcept sculpture build of **"a pineapple" at scale 16** (E-13 / S-037, the *scale study*) — the
**organic-small** leg of the 16/32/48 pineapple triptych, and the organic counterpart to T-037-01's
angular-small moai. Handoff for a human reviewer. This is a **build/measurement** ticket: it ran the
existing T-035-01 pipeline at a new scale and recorded cross-scale evidence; it changed **no source
code**.

## What changed

### Generated artifacts (to commit) — `benchmarks/sculpture/runs/012-vConcept-a-pineapple/` (scale 16)
- `design-doc.md` + `design-doc.prompt.txt` — imagined doc (2224 ch): two masses (ovoid body ~9 +
  radiating crown ~7); cues = diamond crosshatch + green frond fan; ~7×7 footprint @16 budget.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 20.4 s): rounded
  ovoid, bold raised orange/yellow diamond lattice, splaying green crown.
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, 111 ops → **332 blocks, 0
  unmapped**, bounds `[-4,0,-4]..[4,16,4]` (9×17×9), palette orange_terracotta / yellow_terracotta /
  green_concrete / brown_terracotta.
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored). `summary.json` (incl. `scale: 16`); `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery regenerated; a second `a pineapple` row appears,
  distinguished by the scale column (16 vs run 004's 32).

### Authored evidence (to commit) — `docs/active/work/T-037-03/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts.
- `progress.md` — live run log (numbers, cross-scale observations, the no-race note).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side + near-frontal frame +
  the scale-32 anchor, faithfulness line, three shortfall axes, the explicit **scale-16-vs-32
  comparison table**, run facts, and the categorical judgment (both vocabularies).
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, schema, or config files were
  created, modified, or deleted. The pipeline is T-035-01's, invoked with `--scale 16`.

## Acceptance criteria — status

- **AC1 — end-to-end run at scale 16, artifacts saved.** ✅ `--subject "a pineapple" --scale 16` ran
  clean (exit 0): doc → 3/4 concept → schema-valid 3-D `DesignArtifact` → 3/4 render + 24-frame rock
  turntable. `summary.json.scale == 16`, 0 unmapped. All outputs under the run dir.
- **AC2 — fidelity note at this scale, for the 16/32/48 comparison.** ✅ `fidelity-read.md` includes a
  dedicated **scale-16-vs-32 (run 004)** table — block delta (332 vs 3314), feature-by-feature
  survived/lost (cross-hatch / body / crown), bounds delta, cost delta — exactly the cross-scale note
  the AC asks for.
- **AC3 — judged (categorical); renders/clips saved.** ✅ **`recognizable`** / Category-enum
  **`Competent`** (pattern Strong, form Weak–Competent); `render-3q.png` + 24 turntable frames saved.

## Result in one line

The organic hero **holds recognizability at half resolution but trades *which* attribute it keeps**: the
signature cross-hatch skin actually reads **better** at scale 16 (coarsening forced a higher-contrast
orange/yellow palette), while the **rounded ovoid body** — the feature scale-32 nailed — goes **cubic**,
and the thin crown **fragments** into floating frond tips; net fidelity is flat (`recognizable`) across
16↔32.

## Test coverage & gaps

- `npm run test:unit` = **312 pass / 0 fail**, before and after the live run (unchanged — the
  metered/GL path is intentionally outside `npm test`; the pure surface `src/sculpture.mjs`, including
  the `sculptureScaleCaps`/scale-threading this study exercises, keeps its existing unit coverage).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live run
  (clean exit + schema-valid + 0 unmapped + `scale==16` + a render depicting a pineapple), all ✅.
- **Gap (inherent, not a regression):** build quality/fidelity and the cross-scale delta are
  human-judged from the renders, not asserted — by design (coarsening at 16 is the commissioned
  outcome). Recorded categorically in both vocabularies for comparability with the anchor.

## Open concerns / notes for the reviewer

1. **Triptych join key (for T-038-01).** The run id slug (`a-pineapple`) **collides** with the
   scale-32 run 004 and does not encode scale — join the 16/32/48 set on **seq + `summary.json.scale`**,
   not the slug. This is run **012, scale 16**. Cited explicitly throughout the evidence docs.
2. **Two run-004 predictions for scale 16 were both falsified, in opposite directions** — the
   cross-hatch *survived better* (palette contrast widened at low budget), and the crown *fragmented*
   rather than collapsing to a cap; meanwhile the body (a @32 success) went cubic. Worth flagging
   because it refines the S-037 thesis: organic degradation at low res is a **trade of attributes**, not
   a uniform "more degradation." The angular form kept *form over finish*; the organic form kept
   *pattern over form*.
3. **45° hero still under-shows it.** The fixed corner angle hides the cardinal-face checker and
   over-exposes the fragmenting crown (`render-3q.png` reads almost cactus-like); near-frontal
   `frame.018` is the truer read. Recommend the cardinal turntable frame as the @16 gallery hero. Same
   azimuth lesson as T-036-01/03 / T-037-01. **Not changed here** — editing `SCULPTURE_VIEW_3Q` would
   fork the archetype and break scale comparability.
4. **Contrast/value behavior is palette-dependent, not purely scale-dependent** (memory
   *concept-image-not-color-value-preview*): the @16 win came from the model's field/stud choice, not
   from scale itself. T-037-04 (@48) may revert to the washed-out @32 pairing or keep the bold one —
   record which, as it sets the contrast ceiling for the high end.
5. **Cost fell with scale here** ($0.6062 @16 vs $0.9905 @32) — opposite of the moai (@16 cost *more*
   than @32). The pineapple's op-heavy cross-hatch drove the @32 price; fewer ops @16 → cheaper. A
   useful, subject-specific budgeting datum for S-037.
6. **Pair pending.** The organic 16-end is recorded; the triptych closes when T-037-04 (pineapple@48)
   lands, and the cross-form (moai vs pineapple) comparison is fully assemblable at T-038-01.
7. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid, first attempt.

## Verdict

All three ACs met. The pipeline produced a schema-valid, recognizable scale-16 pineapple on the first
attempt; the fidelity read is honest about both the surprise win (the cross-hatch skin reads *better*
than at scale 32) and the limits (cubic body, fragmenting crown, weak 45° hero angle). The result
cleanly extends the S-037 thesis — for an *organic* form, low resolution is a **trade of attributes
(pattern kept, form lost)**, not the uniform collapse run 004 predicted — and pairs with the angular
moai's *form-over-finish* result to give the study its cross-form contrast. Ready to set against the
scale-48 pineapple (T-037-04) and assemble into the 16/32/48 triptych at T-038-01. Additive and
reproducible — no shared code touched, scale/breadth comparability preserved.
