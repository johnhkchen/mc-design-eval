# T-036-08 — Review

vConcept sculpture build of **"a koi fish"** at scale 32 (E-13 / S-036). Handoff for a human reviewer.
This is a **build/measurement** ticket — it ran the existing T-035-01 pipeline and recorded evidence;
it changed **no source code**. It is the **eighth and last** of the S-036 sibling builds, the
deliberate smooth-organic / hardest anchor of the breadth spread (opposite the angular moai, 001).

## What changed

### Generated artifacts (committed) — `benchmarks/sculpture/runs/009-vConcept-a-koi-fish/`
- `design-doc.md` + `design-doc.prompt.txt` — imagined object design doc (2130 ch): fat carp mid-swim,
  three masses (deep body / blunt head / fanned tail), shallow S-bend, Kohaku two-tone, water-splash base.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 17.9 s): a vivid
  S-curve Kohaku koi, orange-on-white patches, flowing tail, blue splash.
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, 60 ops → **1997 blocks, 0
  unmapped**, bounds `[-15,0,-7]..[16,15,7]` (32 long × 16 tall × 15 deep), palette white_concrete /
  orange_concrete / red_concrete / black_concrete / light_blue_concrete.
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored, like every run). `summary.json`; `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery regenerated to include row/gallery `009` (generated
  region, stamped "do not edit by hand").

### Authored evidence (committed) — `docs/active/work/T-036-08/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts.
- `progress.md` — live run log (numbers, render findings, deviations).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side (+ broadside frame.018
  and worst-case frame.006), faithfulness line, shortfalls **with the curve/fin-loss line**, run facts,
  and the categorical judgment.
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, schema, or config files were
  created, modified, or deleted. The pipeline is T-035-01's, invoked verbatim.

### Commit
- `752516f` — `feat(E-13 T-036-08): vConcept build "a koi fish" @scale 32 + fidelity read`.

## Acceptance criteria — status

- **AC1 — end-to-end run, artifacts saved.** ✅ `--subject "a koi fish" --scale 32` ran clean (exit 0):
  doc → 3/4 concept → schema-valid 3-D `DesignArtifact` → 3/4 render + 24-frame rock turntable. All
  outputs under the run dir.
- **AC2 — fidelity-vs-concept read recorded.** ✅ `fidelity-read.md`: concept vs render side-by-side
  (plus turntable frames) + a one-line faithfulness statement + an explicit shortfall section that
  **includes the AC-mandated one line on the curve/fin loss**.
- **AC3 — judged (categorical); renders/clips saved.** ✅ Categorical judgment **`recognizable`
  (low–mid, broadside-dependent)**; `render-3q.png` + 24 turntable frames saved.

## Result in one line

A recognizable Kohaku koi — palette and named masses carried verbatim concept → build, unmistakable at
the broadside — but the swimming **S-curve and flowing fins are stepped/stubbed away** (the largest
curve loss of the eight subjects, as predicted for this anchor) and the canonical 45° still foreshortens
it; the smooth-organic floor of the S-036 breadth spread, opposite the angular moai.

## Test coverage & gaps

- `npm run test:unit` = **312 pass / 0 fail**, before and after the live run (unchanged — the
  metered/GL path is intentionally outside `npm test`; the pure surface `src/sculpture.mjs` is covered
  by its existing unit tests).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live run
  itself (clean exit + schema-valid + 0 unmapped + a render depicting the subject), all ✅.
- **Gap (inherent, not a regression):** build *quality*/fidelity is human-judged from the render, not
  asserted — by design (a large curve gap is the expected, predicted outcome for this anchor). Recorded
  categorically.

## Open concerns / notes for the reviewer

1. **View-fragility is acute for a fish.** The canonical 45° hero still (`render-3q.png`/frame.000) and
   the near-end-on frame.006 both read as a stubby blob; only the **broadside frame.018** shows the koi
   honestly. A fish's whole silhouette lives on its broad flank, which the fixed 45° angle quarters
   away — the same azimuth-dependence dancing-man (002) and sword (007) flagged, strongest here. The
   read cites the broadside frame; the shared `SCULPTURE_VIEW_3Q` was **not** changed (would fork the
   archetype and break breadth comparability).
2. **Curve/thin-membrane loss is the measurement, not a defect.** The S-bend → straight loaf and the
   flowing tail → flat ribbed slab are exactly what putting a smooth-organic subject at the hard anchor
   was meant to surface. A `recognizable` (low–mid) outcome — slightly *better* than the ticket's
   pessimistic "large gap" prediction (the silhouette survived at broadside rather than collapsing) —
   is a legitimate, expected breadth data point for E-13 curation (T-038-01).
3. **Findings for E-13 curation (T-038-01), not changed here:** (a) fixed 45° still under-shows a
   broad-flank subject; (b) models step curves and stub thin appendages at scale 32. Cross-subject
   signals the breadth showcase exists to surface.
4. **Single-view limitation held as expected.** A koi is roughly bilaterally symmetric, so the
   single-view reconstruction of the far flank was low-risk; the rock turntable never paraded an
   imagined back.
5. **Cost/time** $0.7560 / ~321 s — the high end of the series (a 1997-block solid body), but within
   the ~$0.7–0.8 / ~8 min envelope the siblings set.
6. **This closes the eight-subject S-036 breadth set** (001 moai … 009 koi; seqs skip 008→009 cleanly,
   no race). The spread now spans angular-best (moai, ~faithful) through planar/round thin (sword
   `recognizable`, arrow) to smooth-organic-worst (koi `recognizable` low–mid). Ready for T-038-01
   curation roll-up.
7. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid.

## Verdict

All three ACs met. The pipeline produced a schema-valid, recognizable koi on the first attempt; the
fidelity read is honest about both the win (Kohaku palette + all masses present, unmistakable at
broadside) and the limit (S-curve and fins stepped/stubbed away, view-fragile at the fixed angle).
Additive and reproducible — no shared code touched, breadth comparability preserved. The smooth-organic
anchor is recorded; the S-036 eight-subject breadth set is complete and ready for T-038-01 curation.
