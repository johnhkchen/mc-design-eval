# T-037-04 — Review (handoff)

Self-assessment of the completed work. Ticket: Epic E-13 / story S-037 (scale study) — run the fixed
`vConcept` sculpture pipeline on **"a pineapple" @ scale 48** (the organic hero's large end), save
artifacts, record a fidelity-vs-concept note framed for the 16/32/48 comparison, judge categorically.

## What was done

Ran the existing pipeline **unmodified** at scale 48, inspected the actual pixels (concept, hero render,
cardinal turntable frame) against both cross-scale anchors (run 004 @32, run 012 @16 — the latter
completed during this ticket), and recorded the evidence. **No source code was written or changed** —
this is a build/measurement ticket, exactly as scoped in Design Decision 1. The headline result is a
clean, somewhat *encouraging* datum that runs counter to its angular twin.

### Build outcome (run 013, scale 48)
- Clean exit, **schema-valid** (AJV gate passed), **12176 blocks, 0 unmapped**, bounds
  `[-12,0,-12]..[12,47,12]` (25×48×25), `scale==48` in `summary.json`. 124 ops; 20,801/17,283 tok;
  **$0.6518**; ~229 s; 24-frame rock turntable.

### Judgment & headline finding
- **`faithful` (lower edge) / `Strong` on form** (vs the scale-32 anchor's `recognizable / Competent`).
  The best of the three scale points: rounded ovoid body, spiky frond crown, faithful palette, **and a
  diamond cross-hatch lattice that reads** — the signature texture that *washed out* at scale 32.
- **For the organic form, more budget broadly closed the gap — the opposite of the moai@48 regression
  (run 011).** *Form* fidelity is roughly monotonic in scale (16 coarse → 32 smooth → 48 smooth +
  detailed). Two nuances, both evidenced in `fidelity-read.md`:
  1. **The cross-hatch is U-shaped in scale** (reads at 16 as a bold blocky checker → vanishes at 32 →
     reads at 48 as a fine diamond grid). Its failure at 32 was a resolution-and-value problem that
     *more rows* fixed — so there is **no hard "organic ceiling"** for this pattern, contrary to the
     more pessimistic Design prior.
  2. **Effort still did not scale with the canvas** (tokens out 15.7k → **31.0k** → 17.3k; ops 213 →
     124 — scale 32 drew the most), the *same* under-spend that wrecked the moai@48. Here it was
     **harmless**: a rounded fruit + repeating surface texture tolerates coarse volumetric fills,
     whereas the moai needed fine relief that fills destroyed. **Form-tolerance, not model diligence, is
     why 48 succeeds for the pineapple and fails for the moai** — the cleanest single takeaway of the
     S-037 large-end pair.

## Files created / modified / deleted

**Created — work dir** `docs/active/work/T-037-04/`: `research.md`, `design.md`, `structure.md`,
`plan.md`, `progress.md`, `fidelity-read.md` (AC#2/#3 deliverable), `review.md` (this file).

**Created — run dir (by the runner)** `benchmarks/sculpture/runs/013-vConcept-a-pineapple/`:
`design-doc.prompt.txt`, `design-doc.md`, `build.prompt.txt`, `concept.png`, `artifact.json`,
`render-3q.png`, `summary.json`, `turntable/` (24 frames, gitignored), `transcript.jsonl` (gitignored).

**Modified (by the runner):** `benchmarks/sculpture/README.md` — generated `RUNS` block regenerated;
now three `a pineapple` rows (scales 32/16/48), disambiguated by the `scale` column.

**Deleted:** none.

**Commits:** `feat(E-13 T-037-04): vConcept build "a pineapple" @scale 48 (scale study) + fidelity read`
(run dir + README + research/design/structure/plan/progress/fidelity-read). This `review.md` is the
follow-up `docs(...)` commit per the sibling pattern. **Not pushed** (Lisa/human's call). The ticket
file `docs/active/tickets/T-037-04.md` was **not** staged/edited — phase/status left to Lisa.

## Test coverage

- **No new tests** — and none warranted. This ticket adds no source logic; the scale wiring it exercises
  (`sculptureScaleCaps`, scale-threaded prompts in `src/sculpture.mjs`) is already covered by
  `src/sculpture.test.mjs`. New tests would assert on one-off run *data*, not code.
- **Regression guard:** `npm run test:unit` **312 pass / 0 fail** both before and after the live run
  (the metered path never touches the pure surface). The live run itself is the *integration test* of
  the archetype at the large scale — pass signal met (clean exit, schema-valid, 0 unmapped, `scale==48`,
  render depicts a pineapple). Build *quality* is recorded, not asserted — by design.

## Open concerns / TODOs

- **Slug collision (×3).** Runs 004 / 012 / 013 share the slug `a-pineapple`; only `summary.json.scale`
  + seq disambiguate. The evidence docs cite seq + scale everywhere. T-038-01 must join on
  `summary.json.scale`, not the slug, to assemble the 16/32/48 triptych.
- **Fixed 45° hero shows a body corner** — the run-004 problem recurs; the cross-hatch reads best in the
  near-frontal turntable frame (frame.018, az ≈ 5°), which `fidelity-read.md` cites. Re-confirms the
  azimuth lesson (002 / T-036-04 / moai@48 011); a cardinal hero would serve patterned subjects better.
- **Crown morphology is a model habit, not a scale artifact** — the spidery radiating-arm crown appears
  at both 32 and 48 (vs the concept's dense tuft). Not fixable by scale; a prompt/design-doc concern if
  crown density ever matters to scoring.
- **Effort under-spend at large scale persists** (scale 32 drew more output tokens/ops than scale 48).
  It was *benign* for the pineapple but is the same mechanism that sank the moai@48 — a real, reusable
  observation about the archetype. Candidate for a follow-up prompt/budget-guidance investigation, not a
  change this ticket.

## Critical issues to surface for human review

1. **The result is the deliverable — do not re-run to "improve" it.** A faithful scale-48 pineapple is
   the commissioned measurement (Design Decision 6); it exited clean and schema-valid and was not
   re-rolled for looks. Equally, had it regressed like the moai, *that* would have been the datum.
2. **S-037's central answer is now form-dependent, and this build supplies the contrast.** "Does more
   budget close the gap?" — **for the organic patterned form, yes (pineapple: 48 > 32 > 16, cross-hatch
   recovered); for the angular relief form, no (moai: 32 > 16 > 48, features lost).** The discriminator
   is whether the subject's identity lives in *bulk + repeating surface* (scale-tolerant) or in *fine
   relief* (scale-fragile under the model's coarse-fill under-spend). This pair is the strongest
   conclusion of the scale study and should anchor T-038-01's triptych and any future scale sweep.
3. **Value-contrast is still the soft spot even when it succeeds.** The lattice reads at 48 because it
   finally has the rows, but orange-on-yellow remains low-value-contrast (memory
   *concept-image-not-color-value-preview*); any future fidelity scoring (E-04/E-05) should weigh render
   value mapping, not just geometry.

## AC checklist

- [x] `vConcept --subject "a pineapple" --scale 48` ran end-to-end → doc + 3/4 concept + 3-D
      `DesignArtifact` + 3/4 render + rock turntable; artifacts saved (run 013).
- [x] Fidelity-vs-concept note recorded at this scale, framed for the 16/32/48 comparison
      (`fidelity-read.md`, with the full three-way table + form-monotonic / pattern-U-shaped finding).
- [x] Judged categorically (`faithful` / `Strong`); renders + 24 turntable clips saved.
