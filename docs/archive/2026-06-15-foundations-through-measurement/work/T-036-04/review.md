# T-036-04 — Review

vConcept sculpture build of **"a bow and arrow"** at scale 32 (E-13 / S-036) — the **hardest case in
the breadth set** (thin/linear). Handoff for a human reviewer. This is a **build/measurement** ticket:
it ran the existing T-035-01 pipeline and recorded evidence; it changed **no source code**.

## What changed

### Generated artifacts (committed earlier) — `benchmarks/sculpture/runs/005-vConcept-a-bow-and-arrow/`
- `design-doc.md` + `design-doc.prompt.txt` — imagined doc (2124 ch): tensioned recurve "D" bow, bone
  string, diagonal arrow, oval plinth.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 20.8 s).
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, 169 ops → **411 blocks, 0
  unmapped**, bounds `[-5,0,-6]..[18,33,6]`, palette spruce_planks / stripped_oak_log /
  dark_oak_planks / bone_block / iron_block / red_concrete.
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored). `summary.json`; `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery row/gallery `005`.

### Authored evidence — `docs/active/work/T-036-04/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts (written earlier).
- `progress.md` — live run log (numbers, the thin-element survival observations, the azimuth finding).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side + the rescuing
  near-frontal frame + the side-on frame, faithfulness line, shortfalls, the **explicit thin-element
  survival verdict**, run facts, and the categorical judgment.
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, schema, or config files were
  created, modified, or deleted. The pipeline is T-035-01's, invoked verbatim.

## Acceptance criteria — status

- **AC1 — end-to-end run, artifacts saved.** ✅ `--subject "a bow and arrow" --scale 32` ran clean
  (exit 0): doc → 3/4 concept → schema-valid 3-D `DesignArtifact` → 3/4 render + 24-frame rock
  turntable. All outputs under the run dir.
- **AC2 — fidelity read recorded, with the explicit thin-element note.** ✅ `fidelity-read.md` has a
  dedicated *thin-element survival verdict* table answering the AC's question directly: the arrow and
  string both **survived** (string as a continuous 1-wide line; arrow chunky), nothing vanished;
  chunkiness + an unflattering hero angle are the loss, not disappearance.
- **AC3 — judged (categorical); renders/clips saved.** ✅ Categorical judgment **`recognizable`**;
  `render-3q.png` + 24 turntable frames saved.

## Result in one line

The set's hardest subject **beat its worst-case prediction**: every thin element survived (the
near-sub-block bone string held as a clean 1-wide run), palette is faithful, and the build reads as a
clear bow-and-arrow from the near-frontal turntable frame — the real limit is **finesse + the fixed
45° hero angle**, not thin-element survivability.

## Test coverage & gaps

- `npm run test:unit` = **312 pass / 0 fail** (re-confirmed; the metered/GL path is intentionally
  outside `npm test`; the pure surface `src/sculpture.mjs` keeps its existing unit coverage).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live run
  itself (clean exit + schema-valid + 0 unmapped + a render depicting the subject), all ✅.
- **Gap (inherent, not a regression):** build *quality*/fidelity is human-judged from the render, not
  asserted — by design (a large gap is the commissioned outcome for this subject). Recorded
  categorically with the thin-element verdict.

## Open concerns / notes for the reviewer

1. **Strongest azimuth finding yet (for T-038-01 curation).** A bow-and-arrow's signature is a single
   horizontal axis; at the fixed 45° hero azimuth that axis aims into depth and the subject is
   unreadable from its own canonical still, while `frame.018` (near-frontal) reads almost like the
   concept. Recommendation: pick the near-frontal turntable frame as the gallery hero for thin/linear
   subjects, or tune the still azimuth per subject. **Deliberately not changed here** — editing shared
   `SCULPTURE_VIEW_3Q`/the runner would fork the archetype and break breadth comparability.
2. **Thin/linear survivability is better than feared.** At scale 32 the thin elements thickened into
   chunky-but-continuous runs rather than vanishing — the Phase-1 limit for these subjects is finesse
   and framing, not raw survival. A useful, slightly surprising datum for the measurement.
3. **Cost/time is the series outlier** — $1.09 / ~453 s / 34,999 output tokens, ~2× the others. The
   thin/linear subject drove far more ops (169) and output. Worth noting if a budget per build matters;
   not a defect.
4. **Single-view limitation held as expected.** The build reconstructed a coherent in-the-round
   bow-and-arrow from the one concept view; the rock turntable never paraded an imagined back.
5. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid.

## Verdict

All three ACs met. The pipeline produced a schema-valid, complete bow-and-arrow on the first attempt;
the fidelity read is honest about both the win (every thin element survived, palette faithful) and the
limits (chunky head/fletching, and a hero angle that hides the arrow). The hardest case in the breadth
set turned out to be primarily an **angle/finesse** story, not a survivability failure — a clean,
informative data point. Additive and reproducible — no shared code touched, breadth comparability
preserved. Ready for the remaining T-036-* siblings and T-038-01 curation.
