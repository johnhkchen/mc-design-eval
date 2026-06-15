# T-036-05 — Plan

Ordered, independently verifiable steps to execute the build and capture its evidence. Because the
pipeline is fixed, the "testing strategy" here is **pre-flight validation + post-run assertions on the
emitted artifacts**, not new unit tests (the pure logic is already covered by `src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call) — DONE

- [x] `npm run test:unit` green (ran: **0 fail**) — confirms the pure surface is intact on this checkout.
- [x] `baml_client/` present; `GEMINI_API_KEY` resolvable in `.env` (read by `src/nano-banana.mjs`);
      claude `-p` shim present at `~/.local/bin/claude` (→ 2.1.165).
- [x] Sanity-spot the args: subject `"an anatomically correct human heart"`, scale `32` —
      `assertSculptureSpec` will reject anything malformed before billing, so a bad invocation costs
      nothing.

Verification: tests pass; env keys resolve; no metered call yet. ✅

## Step 1 — Run the benchmark (the live, metered build)

```
npm run bench:sculpture -- --subject "an anatomically correct human heart" --scale 32 --note "T-036-05 build"
```

Run in the background with a generous timeout (~10 min; moai took ~500s, dancing man ~181s). Streams
stage logs (`stage 1 … chars`, `stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/` exists with
  all nine output files + `turntable/` frames.
- `summary.json` parses; `blocks > 0`, `unmapped == 0` (every placed block mapped to a texture).
- `artifact.json` parses and was emitted by the schema-enforced seam (if stage 3 had thrown, the run
  would have exited non-zero — so a clean exit *is* the schema-valid assertion).
- Console "done …" line printed with block/token/cost.

Failure branch: if any stage errors (schema reject, transient Gemini/claude, GL), record the cause in
`progress.md` and re-run the whole benchmark (new seq dir). Remove any stale partial run dir and note
it. Do **not** hand-edit `artifact.json`.

## Step 2 — Inspect the renders (the fidelity read inputs)

- [ ] `Read` `concept.png` and `render-3q.png` (and a couple of turntable frames) as images to judge
      what the build actually looks like vs the concept.
- [ ] Note for the **organic-curve loss**: do the lobed chambers read as distinct masses or merge into
      one blob? Do the great vessels (aorta/pulmonary trunk/venae cavae) read at the top, or stub off?
      How badly do the smooth curves stair-step at scale 32?
- [ ] Note for the **color value gap** (memory *concept-image-not-color-value-preview*): does the
      rendered block red match the concept's arterial red, or render darker/duller (maroon/brown)?

Verification: I have looked at the actual pixels, not inferred from token counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render, relative into the run dir; add a best turntable frame if
      the fixed 3/4 still under-shows the form, as happened on T-036-01).
- [ ] One line on faithfulness to the concept.
- [ ] Where it fell short, **including the AC-mandated one line on the organic-curve loss** and the
      color-value check.
- [ ] Categorical judgment: `faithful | recognizable | loose | failed` + one-line rationale. Ticket
      predicts a "large gap" → expected `loose` (or `recognizable` at best); record the *observed*
      bucket, comparing to the prediction rather than substituting it.
- [ ] Run facts copied from `summary.json` (blocks, bounds, ops, tokens, cost) for a self-contained
      record.

Verification: file exists, contains all sections, judgment is one of the four categories, the
organic-curve line is present (AC#2), prediction is *compared* to the observed result.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with the real numbers (doc chars, concept ms, build ops, render blocks,
      bounds, tokens, cost, wall time) pulled from console + `summary.json`.
- [ ] Any deviations from this plan and why (e.g. a retry, a frame-count choice, an added turntable
      frame in the read).

Verification: a reviewer can reconstruct the run without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir, the regenerated `benchmarks/sculpture/README.md`, and the work-dir docs.
- [ ] Commit: `feat(E-13 T-036-05): vConcept build "an anatomically correct human heart" @scale 32 + fidelity read`.
- [ ] (Per project convention, commit only — Lisa/the human decides on push.)

Verification: `git status` clean for the intended paths; commit message ties to the ticket.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, test coverage note (no new code →
      existing coverage holds), open concerns (single-view back on an asymmetric subject, organic-curve
      fidelity, color-value gap, cost).

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the archetype's wiring is already
  unit-tested (`src/sculpture.test.mjs`). Adding tests for a one-off run would test the data, not the
  code.
- **The live run is the integration test** of the archetype on a *new, harder* subject — its
  pass/fail signal is: clean exit + schema-valid artifact + 0 unmapped + a render that depicts a
  heart. The *quality* (fidelity bucket) is recorded, not asserted (a large organic-curve gap is an
  expected, acceptable outcome per the ticket's own form note).
- **Regression guard:** `npm test`/`test:unit` before and after, to prove the build path didn't
  perturb the tested surface.

## Risks

- **Organic curves voxel-break worst of the breadth set** at scale 32 (smooth lobes → stair-stepped
  blobs, thin vessels merge). Mitigation: none in code (deliberate — it's the measurement); recorded
  honestly in the read. This is the *expected* outcome, not a failure of the ticket.
- **Color-value gap** could cost the heart its strongest cue (red → maroon). Mitigation: inspect and
  report; do not edit the artifact.
- **Single-view back-invention** on an asymmetric subject. Mitigation: the rock turntable hides the
  back; note it as an inherent limit.
- **Cost/time** ~$0.5–0.7 and ~3–8 min, comparable to the siblings. Acceptable for a single build.
- **Transient model/Gemini errors.** Mitigation: re-run whole benchmark, log it.
