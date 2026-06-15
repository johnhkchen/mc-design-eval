# T-037-02 — Review (handoff)

Self-assessment of the completed work. Ticket: Epic E-13 / story S-037 (scale study) — run the fixed
`vConcept` sculpture pipeline on **"a moai statue" @ scale 48** (the angular hero's large end), save
artifacts, record a fidelity-vs-concept note framed for the 16/32/48 comparison, judge categorically.

## What was done

Ran the existing pipeline **unmodified** at scale 48, inspected the actual pixels (concept, hero render,
turntable frames) against both cross-scale anchors (run 003 @32, run 010 @16), and recorded the
evidence. **No source code was written or changed** — this is a build/measurement ticket, exactly as
scoped in Design Decision 1. The headline result is a clean, somewhat surprising **negative datum**.

### Build outcome (run 011, scale 48)
- Clean exit, **schema-valid** (AJV gate passed), **6283 blocks, 0 unmapped**, bounds
  `[-7,0,-8]..[7,47,4]` (15×48×13), `scale==48` in `summary.json`. 33 ops; 21,156/7,272 tok; **$0.4002**;
  ~135 s; 24-frame rock turntable.

### Judgment & headline finding
- **`loose` → `failed` / `Weak`** (vs scale-32 anchor's `Competent / form Strong`).
- **Fidelity is non-monotonic in scale: 32 (best) > 16 > 48 (worst).** More block budget did **not**
  close the gap to the concept — it widened it. The largest build renders as a near-black, near-
  featureless monolith; its moai face does not read from any saved view.
- **Mechanisms** (both evidenced in `fidelity-read.md`): (1) output tokens *fell* with scale
  (16,752 → 14,273 → **7,272**) and the build used only 33 coarse volumetric fills — the model spent the
  larger canvas on *bulk*, not *carving*, and dropped the eye sockets + pukao topknot that carried the
  read at 16/32; (2) value drift (`gray_concrete` → near-black) dominates more completely over a large
  flat slab, erasing the deepslate carving; (3) orientation lottery — the face is on −z, away from the
  fixed 45° hero and front-right rock turntable.

## Files created / modified / deleted

**Created — work dir** `docs/active/work/T-037-02/`: `research.md`, `design.md`, `structure.md`,
`plan.md`, `progress.md`, `fidelity-read.md` (AC#2/#3 deliverable), `review.md` (this file).

**Created — run dir (by the runner)** `benchmarks/sculpture/runs/011-vConcept-a-moai-statue/`:
`design-doc.prompt.txt`, `design-doc.md`, `build.prompt.txt`, `concept.png`, `artifact.json`,
`render-3q.png`, `summary.json`, `turntable/` (24 frames, gitignored), `transcript.jsonl` (gitignored).

**Modified (by the runner):** `benchmarks/sculpture/README.md` — generated `RUNS` block regenerated;
now three `a moai statue` rows (scales 32/16/48), disambiguated by the `scale` column.

**Deleted:** none.

**Commits:** `feat(E-13 T-037-02): vConcept build "a moai statue" @scale 48 (scale study) + fidelity
read` (run dir + README + research/design/structure/plan/progress/fidelity-read). This `review.md` is
the follow-up `docs(...)` commit per the sibling pattern. **Not pushed** (Lisa/human's call). The
ticket file `docs/active/tickets/T-037-02.md` was **not** staged/edited — phase/status left to Lisa.

## Test coverage

- **No new tests** — and none warranted. This ticket adds no source logic; the scale wiring it exercises
  (`sculptureScaleCaps`, scale-threaded prompts in `src/sculpture.mjs`) is already covered by
  `src/sculpture.test.mjs`. New tests would assert on one-off run *data*, not code.
- **Regression guard:** `npm run test:unit` **312 pass / 0 fail** both before and after the live run
  (the metered path never touches the pure surface). The live run itself is the *integration test* of
  the archetype at a new scale — pass signal met (clean exit, schema-valid, 0 unmapped, `scale==48`,
  render depicts the build). Build *quality* is recorded, not asserted — by design.

## Open concerns / TODOs

- **Slug collision (×3).** Runs 003 / 010 / 011 share the slug `a-moai-statue`; only `summary.json.scale`
  + seq disambiguate. The evidence docs cite seq + scale everywhere. T-038-01 must join on
  `summary.json.scale`, not the slug, to assemble the 16/32/48 triptych.
- **Eye sockets specified but not built.** The design doc promised "2×2 deepslate voids"; the artifact
  has only a deepslate brow line + corners. A model-fidelity gap (doc → build), not a pipeline bug.
- **No saved view shows the face.** The fixed hero + ±40° rock never face −z. `fidelity-read.md` cites
  frame 023 as the least-bad, but it remains poor. Re-confirms the azimuth lesson (002 / T-036-04).

## Critical issues to surface for human review

1. **The negative result is the deliverable — do not "fix" it by re-running.** A coarse/abstract moai at
   scale 48 is the commissioned measurement (Design Decision 6). It exited clean and schema-valid; it was
   intentionally not re-rolled for looks. The value is the finding, not a pretty render.
2. **Pipeline behavior is non-monotonic in scale and effort *decreases* as the canvas grows** — a
   genuine, reusable observation about the archetype (model under-spends large budgets, favoring coarse
   fills over relief). Worth weighing before S-037's conclusions and any future scale sweeps; recorded to
   project memory. Not actionable as a code change this ticket, but a candidate prompt/budget-guidance
   investigation for a follow-up story.
3. **Value drift is now a load-bearing confound at large flat scale**, not a cosmetic note — it, plus
   orientation, is what tips this build from "coarse" to "unrecognizable." Any future fidelity scoring
   (E-04/E-05) should account for render value mapping, not just geometry.

## AC checklist

- [x] `vConcept --subject "a moai statue" --scale 48` ran end-to-end → doc + 3/4 concept + 3-D
      `DesignArtifact` + 3/4 render + rock turntable; artifacts saved (run 011).
- [x] Fidelity-vs-concept note recorded at this scale, framed for the 16/32/48 comparison
      (`fidelity-read.md`, with the full three-way table + non-monotonic finding).
- [x] Judged categorically (`loose`→`failed` / `Weak`); renders + 24 clips saved.
