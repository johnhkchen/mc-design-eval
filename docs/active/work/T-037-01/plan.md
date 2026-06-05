# T-037-01 — Plan

Ordered, independently verifiable steps to execute the scale-16 build and capture its cross-scale
evidence. Because the pipeline is fixed, the "testing strategy" is **pre-flight validation + post-run
assertions on the emitted artifacts**, not new unit tests (the pure scale wiring is already covered by
`src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call)

- [x] `npm run test:unit` green — confirms the pure surface (incl. scale caps) is intact.
- [x] Confirm `baml_client/` present and `GEMINI_API_KEY` resolvable by `src/nano-banana.mjs` (`.env`).
      claude `-p` shim exists at `~/.local/bin/claude`.
- [x] Sanity-spot the args: subject `"a moai statue"` (== anchor run 003), scale `16` (≥ SCALE_MIN 8).
      `assertSculptureSpec` rejects anything malformed before billing.

Verification: tests pass; env keys resolve; no metered call yet.

## Step 1 — Run the benchmark (the live, metered scale-16 build)

```
npm run bench:sculpture -- --subject "a moai statue" --scale 16 --note "T-037-01 scale-16 study"
```

Runs in the background with a generous timeout (~10 min; the scale-32 moai took ~minutes). Streams
stage logs (`stage 1 … chars`, `stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/NNN-vConcept-a-moai-statue/` (seq ~010, or higher if a sibling
  raced) with all output files + `turntable/` frames.
- `summary.json` parses; **`scale == 16`**; `blocks > 0`, `unmapped == 0`; bounds within ≲16³.
- `artifact.json` parses and came from the schema-enforced seam (clean exit ⇒ AJV passed).
- Console "done …" line printed with block/token/cost.

Failure branch: on a genuine pipeline error (non-zero exit / thrown stage), record the cause in
`progress.md` and re-run the whole benchmark (new seq dir; remove/note any stale partial). Do **not**
hand-edit `artifact.json`. A *coarse but valid* moai is **not** a failure — do not re-run for looks
(Design Decision 6).

## Step 2 — Inspect the renders (the fidelity note inputs)

- [ ] `Read` `concept.png` and `render-3q.png` (and a couple of turntable frames) as images.
- [ ] Note: does it read as *a moai* at 16 — monolithic head, heavy brow, long nose, set mouth,
      topknot, plinth? Which features **survived** the ~⅛ volume budget and which **merged/dropped**
      (eye sockets gone? nose stubby? mouth lost?). Does the fixed 45° still flatter it or should a
      turntable frame be cited (azimuth lesson from 002 / T-036-04)?
- [ ] Pull run 003's render facts (scale-32 anchor: 2402 blocks, bounds 11×32×11) for the comparison.

Verification: I have looked at the actual pixels of *both* scales, not inferred from token counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render, relative into the run dir; + best turntable frame if needed).
- [ ] One line on faithfulness *at scale 16*.
- [ ] Where it fell short.
- [ ] **Scale-16 vs scale-32 (run 003) subsection** — the AC's cross-scale note: block-count delta
      (this run vs 2402), feature-by-feature survived/merged/dropped, bounds delta, any value drift.
- [ ] Categorical judgment: `faithful|recognizable|loose|failed` **+** Category-enum map
      (`Weak|Competent|Strong|Exceptional`, comparable to run 003's "Competent/form Strong") + rationale.
- [ ] Run facts copied from `summary.json` incl. **scale** for a self-contained record.

Verification: file exists, has all sections incl. the cross-scale subsection, judgment is a valid
category in both vocabularies, the prediction ("graceful degradation, still recognizable but coarser")
is *compared* to the observed result, not substituted for it.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with real numbers (doc chars, concept ms, build ops, render blocks, bounds,
      tokens, cost, wall time) from console + `summary.json`. **Cite seq + scale explicitly.**
- [ ] Any deviations (retry, seq race, frame-count) and why.

Verification: a reviewer can reconstruct the run, and which scale it was, without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir, the regenerated `benchmarks/sculpture/README.md`, and the work-dir docs.
- [ ] Commit: `feat(E-13 T-037-01): vConcept build "a moai statue" @scale 16 (scale study) + fidelity read`.
- [ ] Separate `docs(...)` commit for the review handoff (sibling pattern). Commit only — push is
      Lisa/human's call.

Verification: `git status` clean for the intended paths; commit message ties to the ticket *and names
the scale*.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, the scale-16-vs-32 finding, test
      coverage note (no new code → existing coverage holds), open concerns (single-view, feature loss
      at low res, value drift, slug collision).

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the scale wiring (`sculptureScaleCaps`,
  scale-threaded prompts) is already unit-tested. Adding tests for a one-off run would test the data,
  not the code.
- **The live run is the integration test** of the archetype at a *new scale* — pass/fail signal: clean
  exit + schema-valid + 0 unmapped + `scale==16` in summary + a render depicting a moai. The *quality*
  (fidelity bucket, cross-scale delta) is recorded, not asserted (coarsening at 16 is expected).
- **Regression guard:** `npm test` before and after.

## Risks

- **Face features collapse at 16** (too few blocks for brow/eyes/nose/mouth). Mitigation: none in code
  (deliberate — it's the measurement); recorded honestly as the cross-scale finding.
- **Value drift recurs** (`gray_concrete` darker than concept, as at scale 32). Mitigation: note it;
  not a build defect.
- **45° still under-shows it.** Mitigation: cite a better turntable frame; don't change the shared view.
- **Slug collision with run 003 / seq race.** Mitigation: cite seq + scale everywhere; link exact dir.
- **Cost/time** likely *lower* than scale 32 (fewer blocks/ops). Acceptable for a single build.
