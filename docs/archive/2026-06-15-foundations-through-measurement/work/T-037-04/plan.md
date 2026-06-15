# T-037-04 — Plan

Ordered, independently verifiable steps to execute the scale-48 pineapple build and capture its
cross-scale evidence. Because the pipeline is fixed, the "testing strategy" is **pre-flight validation +
post-run assertions on the emitted artifacts**, not new unit tests (the pure scale wiring is already
covered by `src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call)

- [ ] `npm run test:unit` green — confirms the pure surface (incl. `sculptureScaleCaps`) is intact.
- [ ] Confirm `baml_client/` present and `GEMINI_API_KEY` resolvable by `src/nano-banana.mjs` (`.env`).
      claude `-p` shim exists at `~/.local/bin/claude`.
- [ ] Sanity-spot the args: subject `"a pineapple"` (== anchors 004/012), scale `48`
      (≤ SCALE_MAX 64). `assertSculptureSpec` rejects anything malformed before billing.

Verification: tests pass; env keys resolve; no metered call yet.

## Step 1 — Run the benchmark (the live, metered scale-48 build)

```
npm run bench:sculpture -- --subject "a pineapple" --scale 48 --note "T-037-04 scale-48 study"
```

Runs in the background with a generous timeout (~15 min; scale 48 has ~3.4× the volume of the scale-32
pineapple, which took ~382 s — though the moai@48 sibling actually ran *faster* than its scale-32 anchor
because the model emitted fewer ops, so wall time is unpredictable). Streams stage logs
(`stage 1 … chars`, `stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/NNN-vConcept-a-pineapple/` (seq ≥ 013, higher if a sibling raced)
  with all output files + `turntable/` frames.
- `summary.json` parses; **`scale == 48`**; `blocks > 0`, `unmapped == 0`; bounds within ≲48³.
- `artifact.json` parses and came from the schema-enforced seam (clean exit ⇒ AJV passed).
- Console "done …" line printed with block/token/cost.

Failure branch: on a genuine pipeline error (non-zero exit / thrown stage), record the cause in
`progress.md` and re-run the whole benchmark (new seq dir; remove/note any stale partial). Do **not**
hand-edit `artifact.json`. A pineapple that is *no more faithful* than scale-32 (form saturated, or a
moai@48-style regression with a washed cross-hatch and a coarse barrel) is **not** a failure — do not
re-run for looks (Design Decision 6).

## Step 2 — Inspect the renders (the fidelity note inputs)

- [ ] `Read` `concept.png` and `render-3q.png` (and several turntable frames) as images.
- [ ] Note: does it read as *a pineapple* at 48 — rounded ovoid body, cross-hatch diamond skin, spiky
      frond crown? With ~3.4× the budget, did the model resolve the **cross-hatch finer** (more rows →
      a lattice that finally reads), individuate the **fronds** more, smooth the **ovoid** — or just
      build a **bigger** pineapple (bulk, not detail)? Did value drift (orange-on-yellow) improve (more
      rows to register) or worsen (more flat surface, the moai@48 mechanism)?
- [ ] Does the fixed 45° still flatter it, or should a cardinal turntable frame be cited? Run 004 found
      45° shows a corner and the pattern reads best near-frontal (`frame.018`, az ≈ 5°) — find the
      analogous near-frontal frame here.
- [ ] Pull run 004's render facts (scale-32 anchor: 213 ops, 3314 blocks, bounds 17×32×17) and run 012's
      (scale-16) if its `summary.json` exists, for the comparison.

Verification: I have looked at the actual pixels of the scale-48 build (and the anchors), not inferred
fidelity from token counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render, relative into the run dir; + cardinal turntable frame; +
      anchor renders).
- [ ] One line on faithfulness *at scale 48*.
- [ ] Where it fell short.
- [ ] **Scale-48 vs scale-32 (run 004), vs scale-16 (run 012) subsection** — the AC's cross-scale note:
      block/ops delta (this run vs 3314 blk / 213 ops @32 vs @16), feature-by-feature
      (body / cross-hatch / banding / crown) improved/same/worse, bounds delta, value drift — explicitly
      answering **"did more budget close the gap, plateau (organic ceiling), or regress (moai-echo)?"**
- [ ] Categorical judgment: `faithful|recognizable|loose|failed` **+** Category-enum map
      (`Weak|Competent|Strong|Exceptional`, comparable to run 004's `recognizable`) + rationale.
- [ ] Run facts copied from `summary.json` incl. **scale** for a self-contained record.

Verification: file exists, has all sections incl. the cross-scale subsection, judgment is a valid
category in both vocabularies, the prediction (two hypotheses: pattern-helps vs organic-ceiling/
moai-echo) is *compared* to the observed result, not substituted for it.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with real numbers (doc chars, concept ms, build ops, render blocks, bounds,
      tokens, cost, wall time) from console + `summary.json`. **Cite seq + scale explicitly.**
- [ ] Any deviations (retry, seq race, frame-count) and why.

Verification: a reviewer can reconstruct the run, and which scale it was, without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir, the regenerated `benchmarks/sculpture/README.md`, and the work-dir docs.
- [ ] Commit: `feat(E-13 T-037-04): vConcept build "a pineapple" @scale 48 (scale study) + fidelity read`.
- [ ] Separate `docs(...)` commit for the review handoff (sibling pattern). Commit only — push is
      Lisa/human's call.

Verification: `git status` clean for the intended paths; commit message ties to the ticket *and names
the scale*.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, the scale-48-vs-32(-vs-16)
      finding, test coverage note (no new code → existing coverage holds), open concerns (single-view,
      whether extra budget helped / organic ceiling, value drift, slug collision across three runs).

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the scale wiring (`sculptureScaleCaps`,
  scale-threaded prompts) is already unit-tested. Adding tests for a one-off run would test the data,
  not the code.
- **The live run is the integration test** of the archetype at the *large* scale — pass/fail signal:
  clean exit + schema-valid + 0 unmapped + `scale==48` in summary + a render depicting a pineapple. The
  *quality* (fidelity bucket, cross-scale delta) is recorded, not asserted (whether 48 beats 32 is the
  measurement, not a gate).
- **Regression guard:** `npm test` before and after.

## Risks

- **Form already saturated at 32 / organic ceiling** (extra budget adds bulk, the cross-hatch stays
  washed because it's a value/hue problem scale can't fix). Mitigation: none in code (deliberate — it's
  the measurement); recorded honestly as the cross-scale finding.
- **moai@48-style regression** (model under-spends the big budget — fewer ops than run 004's 213 —
  value drift dominates a bigger surface). Mitigation: note it; not a build defect; it's a key datum.
- **45° still shows a corner** (run 004's exact problem — worst angle for a cardinal-face pattern).
  Mitigation: cite a near-frontal turntable frame; don't change the shared view.
- **Slug collision with runs 004 & 012 / seq race.** Mitigation: cite seq + scale everywhere; link the
  exact dir.
- **Cost/time** potentially higher than scale 32 (more blocks/ops, larger render) — or lower if the
  model under-spends (moai@48 did). Either way acceptable for a single build; budget a generous timeout.
