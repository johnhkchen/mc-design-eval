# T-036-08 — Plan

Ordered, independently verifiable steps to execute the build and capture its evidence. Because the
pipeline is fixed, the "testing strategy" here is **pre-flight validation + post-run assertions on the
emitted artifacts**, not new unit tests (the pure logic is already covered by `src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call) — DONE

- [x] `npm run test:unit` green — **312 pass / 0 fail** — confirms the pure surface is intact.
- [x] Confirm `baml_client/` present (it is) and `GEMINI_API_KEY` resolvable by `src/nano-banana.mjs`
      (reads `.env`, present, 2 hits). The claude `-p` shim exists at `~/.local/bin/claude`. `render/`
      deps present.
- [x] Sanity-spot the args: subject `"a koi fish"`, scale `32` — `assertSculptureSpec` will reject
      anything malformed before billing, so a bad invocation costs nothing.

Verification: tests pass; env keys resolve; no metered call yet. ✅

## Step 1 — Run the benchmark (the live, metered build)

```
npm run bench:sculpture -- --subject "a koi fish" --scale 32 --note "T-036-08 build"
```

Runs in the background with a generous timeout (~10 min; moai took ~500s, dancing-man ~181s, sword
~165s). Streams stage logs (`stage 1 … chars`, `stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/009-vConcept-a-koi-fish/` exists (or `010-…` if a sibling
  claimed 009 — see Structure concurrency note) with all nine output files + `turntable/` frames.
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
- [ ] Note: does it read as *a fish* / specifically *a koi* — elongated streamlined body, dorsal +
      pectoral fins, swept tail, head/mouth, white-orange-black mottling? Where does it break (body
      stepped to a lozenge? fins lost or reduced to single-block flags? tail collapsed? colour pattern
      gone? body foreshortened by the 45° still? named-block value off vs concept — cf. memory
      *concept-image-not-color-value-preview*?).
- [ ] Record the orientation the model chose (horizontal vs arced "swimming") and whether the
      canonical still flatters or flattens it (broadside vs head-on).

Verification: I have looked at the actual pixels, not inferred from token counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render, relative into the run dir; + best turntable frame if the
      still foreshortens the body/tail).
- [ ] One line on faithfulness to the concept.
- [ ] Where it fell short — **including the AC-mandated one line on the curve/fin loss** (the organic
      smoothing the voxel grid can't represent).
- [ ] Categorical judgment: `faithful | recognizable | loose | failed` + one-line rationale.
- [ ] Run facts copied from `summary.json` (blocks, bounds, ops, tokens, cost) for a self-contained
      record.

Verification: file exists, contains all five sections, the curve/fin-loss line is present, judgment is
one of the four categories, the prediction ("large gap, smooth-organic anchor") is *compared* to the
observed result, not substituted for it.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with the real numbers (doc chars, concept ms, build ops, render blocks,
      bounds, tokens, cost, wall time) pulled from console + `summary.json`.
- [ ] The actual seq claimed (009 or higher) and any deviations from this plan and why (retries,
      frame-count choices, seq anomaly).

Verification: a reviewer can reconstruct the run without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir, the regenerated `benchmarks/sculpture/README.md`, and the work-dir docs.
- [ ] Commit: `feat(E-13 T-036-08): vConcept build "a koi fish" @scale 32 + fidelity read`.
- [ ] (Per project convention, commit only — Lisa/the human decides on push.)

Verification: `git status` clean for the intended paths; commit message ties to the ticket.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, test coverage note (no new code
      → existing coverage holds), open concerns (single-view back, organic-curve fidelity at the hard
      anchor, cost), and a note that this **closes the eight-subject S-036 breadth set**.

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the archetype's wiring is already
  unit-tested (`src/sculpture.test.mjs`). Adding tests for a one-off run would test the data, not the
  code.
- **The live run is the integration test** of the archetype on a *new* subject — its pass/fail signal
  is: clean exit + schema-valid artifact + 0 unmapped + a render that depicts a fish. The *quality*
  (fidelity bucket) is recorded, not asserted (a large gap is the expected, acceptable outcome per the
  ticket's own form note — this is the spread's hard anchor).
- **Regression guard:** `npm test` before and after, to prove the build path didn't perturb the tested
  surface.

## Risks

- **Body and fins may collapse to an unrecognizable blob** at scale 32 — the genuine hard case.
  Mitigation: none in code (deliberate — it's the measurement); recorded honestly in the read. A
  `loose` or even `failed` bucket here is a *legitimate* breadth data point, not a defect.
- **The 45° still may foreshorten a long horizontal body or hide the broadside colour pattern.**
  Mitigation: cite a better turntable frame if so (cf. dancing-man azimuth finding); do not change the
  shared view.
- **Koi colour values may differ from concept** (memory *concept-image-not-color-value-preview*) — the
  white/orange/black mottling depends on chosen named blocks. Mitigation: note it in the read; not a
  build defect.
- **Cost/time** ~$0.5–0.7 and ~3–8 min, comparable to siblings. Acceptable for a single build.
- **Transient model/Gemini errors / seq race with a concurrent sibling.** Mitigation: re-run whole
  benchmark; log the actual seq.
