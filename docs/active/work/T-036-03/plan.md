# T-036-03 — Plan

Ordered, independently verifiable steps to execute the build and capture its evidence. The pipeline is
fixed, so the "testing strategy" is **pre-flight validation + post-run assertions on the emitted
artifacts**, not new unit tests (the pure logic is already covered by `src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call) — DONE

- [x] `npm run test:unit` green — **312 pass / 0 fail** (pure surface intact on this checkout).
- [x] `baml_client/` present; `GEMINI_API_KEY` resolvable by `src/nano-banana.mjs` (`.env` present);
      claude `-p` shim at `~/.local/bin/claude`; `render/` GL **available**.
- [x] Args sanity: subject `"a pineapple"`, scale `32` — `assertSculptureSpec` rejects anything
      malformed before billing, so a bad invocation costs nothing. Next seq = `004`.

## Step 1 — Run the benchmark (the live, metered build)

```
npm run bench:sculpture -- --subject "a pineapple" --scale 32 --note "T-036-03 build"
```

Run with a generous timeout (~10 min; moai took ~500s, dancing-man ~181s). Streams stage logs
(`stage 1 … chars`, `stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/004-vConcept-a-pineapple/` exists with all output files +
  `turntable/` frames.
- `summary.json` parses; `blocks > 0`, `unmapped == 0` (every placed block mapped to a texture).
- `artifact.json` parses and was emitted by the schema-enforced seam (a clean exit *is* the
  schema-valid assertion; if stage 3 had thrown, the run would have exited non-zero).
- Console "done …" line printed with block/token/cost.

Failure branch: if any stage errors, record the cause in `progress.md` and re-run the whole benchmark
(new seq dir). Remove any stale partial run dir and note it. Do **not** hand-edit `artifact.json`.

## Step 2 — Inspect the renders (the fidelity read inputs)

- [ ] `Read` `concept.png` and `render-3q.png` (and a couple of turntable frames) as images to judge
      what the build actually looks like vs the concept.
- [ ] Note specifically the two named stressors: **(a) cross-hatch skin** — does the build carry a
      diamond/banded skin pattern, or does it flatten to a plain striped barrel? **(b) spiky crown** —
      do the crown fronds read as spikes, or collapse to a green block cap? Plus: does the *body* read
      as rounded vs a square prism, and does the silhouette say "pineapple" at a glance?

Verification: I have looked at the actual pixels, not inferred from token counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render, relative into the run dir; + best turntable frame if it
      reads better than the fixed 45° still).
- [ ] One line on faithfulness to the concept (palette + form intent).
- [ ] Where it fell short — organized around cross-hatch skin and spiky crown (the texture/pattern +
      rounded-form test the ticket names), plus rounded-body read.
- [ ] Categorical judgment: `faithful | recognizable | loose | failed` + one-line rationale, compared
      against the ticket's "moderate fidelity" prediction.
- [ ] Run facts copied from `summary.json` (blocks, bounds, ops, tokens, cost) for a self-contained
      record.
- [ ] A note for the **scale study (S-037)**: did 32 blocks carry the pattern/crown, or is this a case
      where 48 might help / 16 might break? (Seeds the bracketing builds.)

Verification: file exists, contains all sections, judgment is one of the four categories, prediction is
*compared* to the observed result, not substituted for it.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with real numbers (doc chars, concept ms, build ops, render blocks, bounds,
      tokens, cost, wall time) pulled from console + `summary.json`.
- [ ] Any deviations from this plan and why.

Verification: a reviewer can reconstruct the run without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir (minus gitignored transcript/turntable), the regenerated
      `benchmarks/sculpture/README.md`, and the work-dir docs. **Do not** stage the ticket frontmatter
      or other tickets' files.
- [ ] Commit: `feat(E-13 T-036-03): vConcept build "a pineapple" @scale 32 + fidelity read`.
- [ ] (Commit only — Lisa/the human decides on push.)

Verification: `git status` clean for the intended paths; commit message ties to the ticket.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, test coverage note (no new
      code → existing coverage holds), open concerns (cross-hatch fidelity, crown, scale-study seed,
      cost), verdict.

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the archetype's wiring is already
  unit-tested (`src/sculpture.test.mjs`, 10 tests). Testing a one-off run would test the data, not the
  code.
- **The live run is the integration test** of the archetype on a *new, mid-frontier* subject — its
  pass/fail signal is: clean exit + schema-valid artifact + 0 unmapped + a render that depicts a
  pineapple. The *quality* (fidelity bucket) is recorded, not asserted (moderate fidelity is the
  predicted, acceptable outcome).
- **Regression guard:** `npm test` before and after, to prove the build path didn't perturb the tested
  surface.

## Risks

- **Cross-hatch skin may flatten** to plain color bands at block scale (the "block-scale detail only"
  concept guard works against fine pattern). Mitigation: none in code (deliberate — it's the
  measurement); recorded honestly, and it directly informs S-037.
- **Spiky crown may voxel-break or collapse** to a green cap (same thin-element risk the dancing man's
  limbs showed). Recorded, not engineered around.
- **Cost/time** ~$0.5–0.7 and ~3–8 min, comparable to siblings. Acceptable for a single build.
- **Transient model/Gemini errors.** Mitigation: re-run whole benchmark, log it.
