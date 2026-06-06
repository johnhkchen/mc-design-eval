# T-037-03 — Plan

Ordered, independently verifiable steps to execute the scale-16 pineapple build and capture its
cross-scale evidence. Because the pipeline is fixed, the "testing strategy" is **pre-flight validation +
post-run assertions on the emitted artifacts**, not new unit tests (the pure scale wiring is already
covered by `src/sculpture.test.mjs`).

## Step 0 — Pre-flight (fail cheap, before any metered call) — DONE this session

- [x] `npm run test:unit` green — **312 pass / 0 fail** (confirms the pure surface, incl. scale caps).
- [x] Confirm `baml_client/` present and `GEMINI_API_KEY` resolvable by `src/nano-banana.mjs` (`.env`).
      claude `-p` shim exists at `~/.local/bin/claude`.
- [x] Sanity-spot the args: subject `"a pineapple"` (== anchor run 004), scale `16` (≥ SCALE_MIN 8).
      `assertSculptureSpec` rejects anything malformed before billing.

Verification: tests pass; env keys resolve; no metered call yet. ✅

## Step 1 — Run the benchmark (the live, metered scale-16 build)

```
npm run bench:sculpture -- --subject "a pineapple" --scale 16 --note "T-037-03 scale-16 study"
```

Runs in the background with a generous timeout (~10 min; the scale-32 pineapple took ~382 s — its
op-heavy cross-hatch made it the slowest in the set). Streams stage logs (`stage 1 … chars`,
`stage 2 … ms`, `stage 3 … ops`, render block counts).

Verification (on completion):
- A new dir `benchmarks/sculpture/runs/NNN-vConcept-a-pineapple/` (seq ~012, or higher if a sibling
  raced) with all output files + `turntable/` frames.
- `summary.json` parses; **`scale == 16`**; `blocks > 0`, `unmapped == 0`; bounds within ≲16³.
- `artifact.json` parses and came from the schema-enforced seam (clean exit ⇒ AJV passed).
- Console "done …" line printed with block/token/cost.

Failure branch: on a genuine pipeline error (non-zero exit / thrown stage), record the cause in
`progress.md` and re-run the whole benchmark (new seq dir; remove/note any stale partial). Do **not**
hand-edit `artifact.json`. A *coarse but valid* pineapple — banded barrel, collapsed crown, no visible
diamond skin — is **not** a failure; do not re-run for looks (Design Decision 6).

## Step 2 — Inspect the renders (the fidelity note inputs)

- [ ] `Read` `concept.png` and `render-3q.png` (and a couple of turntable frames, incl. a near-frontal
      one ~`frame.018`) as images.
- [ ] Note: does it read as *a pineapple* at 16 — two-mass form (rounded fruit body + radiating frond
      crown), warm yellow body / green crown palette? Which of run 004's two named stressors **survived**
      the ~⅛ volume budget: did any **cross-hatch / diamond skin** register (or only horizontal banding,
      or nothing)? Did the **spiky frond crown** read as fronds or collapse to a green cap? Is the body
      a real rounded ovoid or a square prism at low res?
- [ ] Does the fixed 45° still (a *corner*) under-show a cardinal-face pattern? Cite a near-frontal
      turntable frame if so — run 004 found `frame.018` (az ≈ 5°) the truer read for the pineapple.
- [ ] Pull run 004's render facts (scale-32 anchor: 213 ops / 3314 blocks, bounds 17×32×17) for the
      comparison.

Verification: I have looked at the actual pixels of *both* scales, not inferred from token counts.

## Step 3 — Write `fidelity-read.md` (AC#2 + AC#3 deliverable)

- [ ] Side-by-side links (concept ↔ render, relative into the run dir; + cardinal turntable frame if needed).
- [ ] One line on faithfulness *at scale 16*.
- [ ] Where it fell short — the three run-004 axes (cross-hatch skin · spiky crown · rounded body) at ⅛ volume.
- [ ] **Scale-16 vs scale-32 (run 004) subsection** — the AC's cross-scale note: block-count delta
      (this run vs 3314), feature-by-feature survived/merged/dropped, bounds delta, any contrast/value drift.
- [ ] Categorical judgment: `faithful|recognizable|loose|failed` **+** Category-enum map
      (`Weak|Competent|Strong|Exceptional`), comparable to run 004's **`recognizable`** + rationale.
- [ ] Run facts copied from `summary.json` incl. **scale** for a self-contained record.

Verification: file exists, has all sections incl. the cross-scale subsection, judgment is a valid
category in both vocabularies, the prediction ("organic drop steeper than the moai; cross-hatch + crown
likely lost") is *compared* to the observed result, not substituted for it.

## Step 4 — Write `progress.md` (the run log)

- [ ] What ran, in order, with real numbers (doc chars, concept ms, build ops, render blocks, bounds,
      tokens, cost, wall time) from console + `summary.json`. **Cite seq + scale explicitly.**
- [ ] Any deviations (retry, seq race, frame-count) and why.

Verification: a reviewer can reconstruct the run, and which scale it was, without re-executing it.

## Step 5 — Commit the run + evidence

- [ ] `git add` the run dir, the regenerated `benchmarks/sculpture/README.md`, and the work-dir docs.
- [ ] Commit: `feat(E-13 T-037-03): vConcept build "a pineapple" @scale 16 (scale study) + fidelity read`.
- [ ] Separate `docs(...)` commit for the review handoff (sibling pattern). Commit only — push is
      Lisa/human's call. (Will commit only if/when the workflow reaches that point; the RDSPI run itself
      stops after `review.md`.)

Verification: `git status` clean for the intended paths; commit message ties to the ticket *and names
the scale*.

## Step 6 — Review

- [ ] `npm run test:unit` still green (the live run never touched the pure path, but confirm).
- [ ] Write `review.md`: files changed, the build outcome + judgment, the scale-16-vs-32 finding, test
      coverage note (no new code → existing coverage holds), open concerns (single-view, feature loss
      at low res — cross-hatch/crown, contrast drift, slug collision, cost-not-tracking-scale).

Verification: `review.md` exists and summarizes the work for handoff.

## Testing strategy summary

- **No new unit tests** — this ticket adds no source logic; the scale wiring (`sculptureScaleCaps`,
  scale-threaded prompts) is already unit-tested. Adding tests for a one-off run would test the data,
  not the code.
- **The live run is the integration test** of the archetype at a *new scale* — pass/fail signal: clean
  exit + schema-valid + 0 unmapped + `scale==16` in summary + a render depicting a pineapple. The
  *quality* (fidelity bucket, cross-scale delta) is recorded, not asserted (coarsening at 16 — and the
  loss of the cross-hatch/crown — is expected and is the measurement).
- **Regression guard:** `npm test` before (312/312) and after.

## Risks

- **Cross-hatch skin disappears entirely at 16** (too few rows for a diamond lattice). Mitigation: none
  in code (deliberate — it's the measurement); recorded honestly as the cross-scale finding.
- **Thin frond crown collapses to a green cap.** Mitigation: note it; not a build defect (run 004
  predicted exactly this).
- **Contrast/value drift recurs/worsens** (orange-on-yellow diamonds washing out, as at scale 32).
  Mitigation: note it; not a build defect.
- **45° still under-shows it** (corner angle hides the cardinal-face pattern). Mitigation: cite a
  near-frontal turntable frame; don't change the shared view.
- **Slug collision with run 004 / seq race.** Mitigation: cite seq + scale everywhere; link exact dir.
- **Cost/time** may *not* fall with scale (the moai @16 cost *more* than @32; run 004 was the priciest
  in the set at $0.99). Acceptable for a single build; record the datum.
