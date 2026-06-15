# T-036-01 — Plan

Ordered, independently verifiable steps to execute the build and capture its evidence. Because the
pipeline is fixed, the "testing strategy" here is **pre-flight validation + post-run assertions on
the emitted artifacts**, not new unit tests (the pure logic is already covered by
`src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call)

- [x] `npm run test:unit` green (ran: 0 fail) — confirms the pure surface is intact on this checkout.
- [ ] Confirm `baml_client/` present (it is) and `GEMINI_API_KEY` resolvable by `src/nano-banana.mjs`
      (reads `.env`, present). The claude `-p` shim exists at `~/.local/bin/claude`.
- [ ] Sanity-spot the args: subject `"a dancing man"`, scale `32` — `assertSculptureSpec` will reject
      anything malformed before billing, so a bad invocation costs nothing.

Verification: tests pass; env keys resolve; no metered call yet.

## Step 1 — Run the benchmark (the live, metered build)

```
npm run bench:sculpture -- --subject "a dancing man" --scale 32 --note "T-036-01 build"
```

Runs in the background with a generous timeout (~10 min; moai took ~500s). Streams stage logs
(`stage 1 … chars`, `stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/002-vConcept-a-dancing-man/` exists with all nine output
  files + `turntable/` frames.
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
- [ ] Note: does the figure read as a *dancing man* — head/torso/limbs/pose? Where does it break
      (thin limbs voxel-broken? pose collapsed to a stiff stance? imagined back incoherent?).

Verification: I have looked at the actual pixels, not inferred from token counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render, relative into the run dir).
- [ ] One line on faithfulness to the concept.
- [ ] Where it fell short (the articulated-figure stress points).
- [ ] Categorical judgment: `faithful | recognizable | loose | failed` + one-line rationale.
- [ ] Run facts copied from `summary.json` (blocks, bounds, ops, tokens, cost) for a self-contained
      record.

Verification: file exists, contains all five sections, judgment is one of the four categories,
prediction ("stiff but recognizable") is *compared* to the observed result, not substituted for it.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with the real numbers (doc chars, concept ms, build ops, render blocks,
      bounds, tokens, cost, wall time) pulled from console + `summary.json`.
- [ ] Any deviations from this plan and why (e.g. a retry, a frame-count choice).

Verification: a reviewer can reconstruct the run without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir, the regenerated `benchmarks/sculpture/README.md`, and the work-dir docs.
- [ ] Commit: `feat(E-13 T-036-01): vConcept build "a dancing man" @scale 32 + fidelity read`.
- [ ] (Per project convention, commit only — Lisa/the human decides on push.)

Verification: `git status` clean for the intended paths; commit message ties to the ticket.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, test coverage note (no new
      code → existing coverage holds), open concerns (single-view back, figure fidelity, cost).

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the archetype's wiring is already
  unit-tested (`src/sculpture.test.mjs`, 10 tests). Adding tests for a one-off run would test the
  data, not the code.
- **The live run is the integration test** of the archetype on a *new, harder* subject — its
  pass/fail signal is: clean exit + schema-valid artifact + 0 unmapped + a render that depicts a
  figure. The *quality* (fidelity bucket) is recorded, not asserted (a stiff figure is an expected,
  acceptable outcome per the ticket's own form note).
- **Regression guard:** `npm test` before and after, to prove the build path didn't perturb the
  tested surface.

## Risks

- **Articulated figure may voxel-break** at scale 32 (thin limbs, dynamic pose). Mitigation: none in
  code (deliberate — it's the measurement); recorded honestly in the read.
- **Cost/time** ~$0.7 and ~8 min, comparable to moai. Acceptable for a single build.
- **Transient model/Gemini errors.** Mitigation: re-run whole benchmark, log it.
