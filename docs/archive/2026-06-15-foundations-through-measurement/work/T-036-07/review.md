# T-036-07 — Review

vConcept sculpture build of **"a mushroom"** at scale 32 (E-13 / S-036). Handoff for a human reviewer.
This is a **build/measurement** ticket — it ran the existing T-035-01 pipeline and recorded evidence;
it changed **no source code**.

## What changed

### Generated artifacts (committed) — `benchmarks/sculpture/runs/008-vConcept-a-mushroom/`
- `design-doc.md` + `design-doc.prompt.txt` — imagined object design doc (2225 ch): "amanita-toadstool
  naturalism", a wide cap **overhanging** a tapered bone stem on a mossy mound, complementary red↔green
  palette; the doc explicitly invoked the dome-overhang rule.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 20.3 s): a classic
  *Amanita muscaria* — red domed cap, white spots, pale stem, green base.
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, 50 ops → **4411 blocks, 0
  unmapped**, bounds `[-11,0,-11]..[11,30,11]` (radially symmetric 23×23 footprint × 31 tall),
  palette `red_concrete` / `bone_block` / `moss_block` / `white_concrete`.
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored, like the sibling runs). `summary.json`, `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery auto-regenerated (row/gallery `008`).

### Authored evidence (committed) — `docs/active/work/T-036-07/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts.
- `progress.md` — live run log (numbers, the overhang/stepped-cone findings, deviations).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side, faithfulness line,
  shortfalls (incl. cap-overhang read + block-vocabulary note), run facts, categorical judgment.
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, schema, or config files were
  created, modified, or deleted. The pipeline is T-035-01's, invoked verbatim.

### Commit
- `c6d3b9b` — `feat(E-13 T-036-07): vConcept build "a mushroom" @scale 32 + fidelity read`.

## Acceptance criteria — status

- **AC1 — end-to-end run, artifacts saved.** ✅ `--subject "a mushroom" --scale 32` ran clean
  (exit 0): doc → 3/4 concept → schema-valid 3-D `DesignArtifact` → 3/4 render + 24-frame rock
  turntable. All outputs under the run dir.
- **AC2 — fidelity-vs-concept read recorded.** ✅ `fidelity-read.md`: concept vs render side-by-side
  (plus the rescuing near-side turntable frame) + a one-line faithfulness statement + an explicit
  shortfall section (cap-overhang / stepped-cone, color-value, spots, block vocabulary).
- **AC3 — judged (categorical); renders/clips saved.** ✅ Categorical judgment **`recognizable`
  (strong)**; `render-3q.png` + 24 turntable frames saved.

## Result in one line

The friendliest organic subject in the breadth set: a radially-symmetric cap-on-stem whose **overhang —
the make-or-break mushroom cue — survived voxelization intact**, reproducing the concept's Amanita
item-for-item; the only real loss is the smooth dome terracing into a stepped cone (most visible in the
look-down hero still, rescued by the near-side turntable frame).

## Test coverage & gaps

- `npm run test:unit` = **312 pass / 0 fail**, before and after the live run (unchanged — the
  metered/GL path is intentionally outside `npm test`; the pure surface `src/sculpture.mjs` is covered
  by its existing unit tests).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live run
  itself (clean exit + schema-valid + 0 unmapped + a render depicting the subject), all ✅.
- **Gap (inherent, not a regression):** build *quality*/fidelity is human-judged from the render, not
  asserted — by design. Recorded categorically.

## Open concerns / notes for the reviewer

1. **Finding for E-13 curation (T-038-01): the fixed el 30° hero-still under-shows top-heavy/overhanging
   subjects.** The canonical `SCULPTURE_VIEW_3Q` looks *down* onto the cap and hides the stem, making
   the still read as a stepped red pyramid; the mushroom gestalt is clearest in a near-side turntable
   frame (`frame.006`). This is the **second** subject to surface the hero-still-angle signal (the
   dancing man, T-036-01, was the first — a cantilevered limb there). Curation may want to pick the
   best turntable frame as the gallery hero, or the archetype may later tune the still angle per
   subject. **Deliberately not changed here** — editing the shared view/runner would fork the archetype
   and break breadth comparability across the eight T-036-* builds.
2. **Block-vocabulary choice.** The model built from generic naturalism blocks (`red_concrete`,
   `bone_block`, `moss_block`, `white_concrete`) rather than Minecraft's literal `red_mushroom_block` /
   `mushroom_stem`. A defensible, schema-valid choice giving cleaner solids; noted as a craft
   observation, not a defect.
3. **Color-value gap held as expected** (memory *concept-image-not-color-value-preview*): concept
   scarlet → `red_concrete` renders a deeper brick/crimson. Hue right, value muted; no cost to
   recognizability for this subject.
4. **Single-view limitation was low-risk here** — a near-symmetric solid of revolution has almost no
   "imagined back", so back-invention (the concern that dominated the asymmetric heart, T-036-05) is a
   non-issue for the mushroom. The rock turntable confirms a consistent body all the way round.
5. **Block count high (4411) vs the figure** (dancing man 1073), close to the moai (3414) — expected:
   a solid dome + stem is a dense connected mass, where a figure is mostly air around thin limbs.
6. **Cost/time** $0.6459 / ~375 s — within the ~$0.7 / ~8 min budget the moai smoke set; the higher
   end of the sibling range, consistent with the larger solid block count.
7. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid. A clean,
   strong data point for the **forgiving-organic** end of the fidelity frontier.

## Verdict

All three ACs met. The pipeline produced a schema-valid, strongly recognizable mushroom sculpture on
the first attempt; the fidelity read is honest about both the win (overhang + every concept element
present, the organic high-water mark of S-036) and the limit (stepped-cone dome, look-down still angle,
muted red). Additive and reproducible — no shared code touched, breadth comparability preserved. Ready
for the remaining T-036-* siblings and T-038-01 curation.
