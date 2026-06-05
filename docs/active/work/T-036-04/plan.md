# T-036-04 — Plan

Ordered, independently verifiable steps to execute the build and capture its evidence. Because the
pipeline is fixed, the "testing strategy" here is **pre-flight validation + post-run assertions on the
emitted artifacts**, not new unit tests (the pure logic is already covered by `src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call)

- [ ] `npm run test:unit` green — confirms the pure surface is intact on this checkout.
- [ ] Confirm `baml_client/` present (it is) and `GEMINI_API_KEY` resolvable by `src/nano-banana.mjs`
      (reads `.env`, present). The claude `-p` shim exists at `~/.local/bin/claude`.
- [ ] Sanity-spot the args: subject `"a bow and arrow"`, scale `32` — `assertSculptureSpec` rejects
      anything malformed before billing, so a bad invocation costs nothing.

Verification: tests pass; env keys resolve; no metered call yet.

## Step 1 — Run the benchmark (the live, metered build)

```
npm run bench:sculpture -- --subject "a bow and arrow" --scale 32 --note "T-036-04 build"
```

Runs in the background with a generous timeout (~10 min; siblings took ~180–500 s). Streams stage
logs (`stage 1 … chars`, `stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/005-vConcept-a-bow-and-arrow/` exists with all nine output
  files + `turntable/` frames.
- `summary.json` parses; `blocks > 0`, `unmapped == 0` (every placed block mapped to a texture).
- `artifact.json` parses and was emitted by the schema-enforced seam (clean exit *is* the
  schema-valid assertion — if stage 3 had thrown, the run would have exited non-zero).
- Console "done …" line printed with block/token/cost.

Failure branch: if any stage **errors** (schema reject, transient Gemini/claude, GL), record the
cause in `progress.md` and re-run the whole benchmark (new seq dir). Remove any stale partial run dir
and note it. Do **not** hand-edit `artifact.json`. **A low-fidelity but schema-valid bow is a success,
not a failure** — never re-run merely to get a prettier result (Design Decision 6).

## Step 2 — Inspect the renders (the fidelity read inputs)

- [ ] `Read` `concept.png` and `render-3q.png` as images, plus **a sweep of turntable frames** to
      find the most informative angle (the dancing-man finding warns the fixed 45° still may
      misrepresent a thin, orientation-sensitive subject — string edge-on vs broadside, bow plane).
- [ ] Answer concretely, per element: does the **bow stave** read as a curved arc? Did the
      **bowstring** survive (and is it a clean line, a dotted/broken run, or a thick bar)? Did the
      **arrow** (shaft / head / fletching) survive, and how chunky? Is the whole thing an object in
      the round or a near-flat relief?

Verification: I have looked at the actual pixels across multiple angles, not inferred from token
counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render ↔ best/illustrative turntable frame, relative into the
      run dir).
- [ ] One line on faithfulness to the concept.
- [ ] Where it fell short.
- [ ] **Thin-element survival subsection** — explicit per-element verdict (bow stave / bowstring /
      arrow shaft+head+fletching): survived / thickened to N blocks / dotted-broken / dropped. This
      is the AC's named question and the reason the subject is in the set.
- [ ] Categorical judgment: `faithful | recognizable | loose | failed` + one-line rationale,
      *comparing* the observed result to the ticket's "largest gap" prediction (not substituting it).
- [ ] Run facts copied from `summary.json` (blocks, bounds, ops, tokens, cost) for a self-contained
      record.

Verification: file exists, contains all six sections, judgment is one of the four categories, the
thin-element verdict names each linear element explicitly.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with the real numbers (doc chars, concept ms, build ops, render blocks,
      bounds, tokens, cost, wall time) pulled from console + `summary.json`.
- [ ] Any deviations from this plan and why (e.g. a retry, a frame choice).

Verification: a reviewer can reconstruct the run without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir, the regenerated `benchmarks/sculpture/README.md`, and the work-dir docs.
- [ ] Commit: `feat(E-13 T-036-04): vConcept build "a bow and arrow" @scale 32 + fidelity read`.
- [ ] (Per project convention, commit only — Lisa/the human decides on push.)

Verification: `git status` clean for the intended paths; commit message ties to the ticket.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, the thin-element result as the
      headline finding, test coverage note (no new code → existing coverage holds), open concerns
      (single-view back, thin/linear fidelity, cost).

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the archetype's wiring is already
  unit-tested (`src/sculpture.test.mjs`). Adding tests for a one-off run would test the data, not the
  code.
- **The live run is the integration test** of the archetype on its *hardest* subject — its pass/fail
  signal is: clean exit + schema-valid artifact + 0 unmapped + a render that depicts *a bow-and-arrow
  arrangement*. The *quality* (fidelity bucket, thin-element survival) is recorded, not asserted — a
  large gap is the expected, acceptable, commissioned outcome.
- **Regression guard:** `npm test` before and after, to prove the build path didn't perturb the
  tested surface.

## Risks

- **String/arrow voxel-break or disappearance** at scale 32 (sub-block linear elements). Mitigation:
  none in code (deliberate — it *is* the measurement); recorded honestly in the read, expected to
  drive a lower fidelity bucket than the moai/dancing-man siblings.
- **Near-planar composition reads as a relief**, and the fixed 45° hero still shows it edge-on or
  broadside unflatteringly. Mitigation: cite the best turntable frame, as 002 did; record as a
  curation finding, do not change shared framing.
- **Cost/time** ~$0.5–0.7 and ~3–8 min, comparable to siblings. Acceptable for a single build.
- **Transient model/Gemini errors.** Mitigation: re-run whole benchmark, log it.
