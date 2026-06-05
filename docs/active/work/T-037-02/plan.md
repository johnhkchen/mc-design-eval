# T-037-02 — Plan

Ordered, independently verifiable steps to execute the scale-48 build and capture its cross-scale
evidence. Because the pipeline is fixed, the "testing strategy" is **pre-flight validation + post-run
assertions on the emitted artifacts**, not new unit tests (the pure scale wiring is already covered by
`src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call)

- [ ] `npm run test:unit` green — confirms the pure surface (incl. scale caps) is intact.
- [ ] Confirm `baml_client/` present and `GEMINI_API_KEY` resolvable by `src/nano-banana.mjs` (`.env`).
      claude `-p` shim exists at `~/.local/bin/claude`.
- [ ] Sanity-spot the args: subject `"a moai statue"` (== anchors 003/010), scale `48`
      (≤ SCALE_MAX 64). `assertSculptureSpec` rejects anything malformed before billing.

Verification: tests pass; env keys resolve; no metered call yet.

## Step 1 — Run the benchmark (the live, metered scale-48 build)

```
npm run bench:sculpture -- --subject "a moai statue" --scale 48 --note "T-037-02 scale-48 study"
```

Runs in the background with a generous timeout (~15 min; scale 48 has ~3.4× the volume of the
scale-32 moai, which took ~392 s — expect more build ops, larger render world, longer wall time).
Streams stage logs (`stage 1 … chars`, `stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/NNN-vConcept-a-moai-statue/` (seq ≥ 011, higher if a sibling
  raced) with all output files + `turntable/` frames.
- `summary.json` parses; **`scale == 48`**; `blocks > 0`, `unmapped == 0`; bounds within ≲48³.
- `artifact.json` parses and came from the schema-enforced seam (clean exit ⇒ AJV passed).
- Console "done …" line printed with block/token/cost.

Failure branch: on a genuine pipeline error (non-zero exit / thrown stage), record the cause in
`progress.md` and re-run the whole benchmark (new seq dir; remove/note any stale partial). Do **not**
hand-edit `artifact.json`. A moai that is *no more faithful* than scale-32 (form saturated) is **not** a
failure — do not re-run for looks (Design Decision 6).

## Step 2 — Inspect the renders (the fidelity note inputs)

- [ ] `Read` `concept.png` and `render-3q.png` (and a couple of turntable frames) as images.
- [ ] Note: does it read as *a moai* at 48 — monolithic head, heavy brow, long nose, set mouth,
      topknot, plinth? With ~3.4× the budget, did the model resolve features **finer** than at 32
      (subtler profile, cleaner eye sockets, crisper mouth) or just build a **bigger** moai? Any new
      artifacts the extra surface introduced (busier recess fragmentation, stronger value drift)?
- [ ] Does the fixed 45° still flatter it, or should a turntable frame be cited (azimuth lesson from
      002 / T-036-04)?
- [ ] Pull run 003's render facts (scale-32 anchor: 2402 blocks, bounds 11×32×11) and run 010's
      (scale-16) if its `summary.json` exists, for the comparison.

Verification: I have looked at the actual pixels of the scale-48 build (and the anchors), not inferred
fidelity from token counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render, relative into the run dir; + best turntable frame if needed).
- [ ] One line on faithfulness *at scale 48*.
- [ ] Where it fell short.
- [ ] **Scale-48 vs scale-32 (run 003), vs scale-16 (run 010) subsection** — the AC's cross-scale note:
      block-count delta (this run vs 2402 @32 vs @16), feature-by-feature improved/same/worse, bounds
      delta, value drift — explicitly answering **"did more budget close the gap, or plateau?"**
- [ ] Categorical judgment: `faithful|recognizable|loose|failed` **+** Category-enum map
      (`Weak|Competent|Strong|Exceptional`, comparable to run 003's "Competent/form Strong") + rationale.
- [ ] Run facts copied from `summary.json` incl. **scale** for a self-contained record.

Verification: file exists, has all sections incl. the cross-scale subsection, judgment is a valid
category in both vocabularies, the prediction ("at least as faithful as 32; question is whether extra
budget meaningfully helps") is *compared* to the observed result, not substituted for it.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with real numbers (doc chars, concept ms, build ops, render blocks, bounds,
      tokens, cost, wall time) from console + `summary.json`. **Cite seq + scale explicitly.**
- [ ] Any deviations (retry, seq race, frame-count) and why.

Verification: a reviewer can reconstruct the run, and which scale it was, without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir, the regenerated `benchmarks/sculpture/README.md`, and the work-dir docs.
- [ ] Commit: `feat(E-13 T-037-02): vConcept build "a moai statue" @scale 48 (scale study) + fidelity read`.
- [ ] Separate `docs(...)` commit for the review handoff (sibling pattern). Commit only — push is
      Lisa/human's call.

Verification: `git status` clean for the intended paths; commit message ties to the ticket *and names
the scale*.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, the scale-48-vs-32(-vs-16)
      finding, test coverage note (no new code → existing coverage holds), open concerns (single-view,
      whether extra budget helped, value drift, slug collision across three runs).

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the scale wiring (`sculptureScaleCaps`,
  scale-threaded prompts) is already unit-tested. Adding tests for a one-off run would test the data,
  not the code.
- **The live run is the integration test** of the archetype at a *new (large) scale* — pass/fail
  signal: clean exit + schema-valid + 0 unmapped + `scale==48` in summary + a render depicting a moai.
  The *quality* (fidelity bucket, cross-scale delta) is recorded, not asserted (whether 48 beats 32 is
  the measurement, not a gate).
- **Regression guard:** `npm test` before and after.

## Risks

- **Form already saturated at 32** (extra budget adds bulk, not fidelity). Mitigation: none in code
  (deliberate — it's the measurement); recorded honestly as the cross-scale finding.
- **Value drift recurs / worsens** (`gray_concrete` darker than concept, possibly stronger over more
  surface). Mitigation: note it; not a build defect.
- **Larger surface invites busier recesses** (the tiki-leaning fragmentation noted at 32 could amplify).
  Mitigation: cite it in the read; don't change prompts.
- **45° still under-shows it.** Mitigation: cite a better turntable frame; don't change the shared view.
- **Slug collision with runs 003 & 010 / seq race.** Mitigation: cite seq + scale everywhere; link the
  exact dir.
- **Cost/time** higher than scale 32 (more blocks/ops, larger render). Acceptable for a single build;
  budget a generous timeout.
