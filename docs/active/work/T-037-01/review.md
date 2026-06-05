# T-037-01 — Review

vConcept sculpture build of **"a moai statue" at scale 16** (E-13 / S-037, the *scale study*) — the
angular-small leg of the 16/32/48 moai triptych. Handoff for a human reviewer. This is a
**build/measurement** ticket: it ran the existing T-035-01 pipeline at a new scale and recorded
cross-scale evidence; it changed **no source code**.

## What changed

### Generated artifacts (committed) — `benchmarks/sculpture/runs/010-vConcept-a-moai-statue/` (scale 16)
- `design-doc.md` + `design-doc.prompt.txt` — imagined doc (2108 ch): head-and-torso monolith,
  identity = nose ridge + heavy brow + jaw; monochrome tuff; ~7×8×16 budget plan.
- `concept.png` — one 3/4 Nano Banana concept (Gemini `gemini-3-pro-image-preview`, 17.3 s).
- `build.prompt.txt` + `artifact.json` — schema-valid `DesignArtifact`, 37 ops → **732 blocks, 0
  unmapped**, bounds `[-3,0,-3]..[3,15,5]` (7×16×9), palette gray_concrete / deepslate / andesite /
  cobblestone.
- `render-3q.png` — 3/4 hero still. `turntable/frame.000..023.png` — 24-frame front-arc rock
  (gitignored). `summary.json` (incl. `scale: 16`); `transcript.jsonl` (gitignored).
- `benchmarks/sculpture/README.md` — RUNS gallery regenerated; a second `a moai statue` row appears,
  distinguished by the scale column (16 vs run 003's 32).

### Authored evidence (committed) — `docs/active/work/T-037-01/`
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI planning artifacts.
- `progress.md` — live run log (numbers, cross-scale observations, the no-race note).
- `fidelity-read.md` — **the AC#2/#3 deliverable**: concept↔render side-by-side + near-frontal frame +
  the scale-32 anchor, faithfulness line, shortfalls, the explicit **scale-16-vs-32 comparison table**,
  run facts, and the categorical judgment (both vocabularies).
- `review.md` — this file.

### Source code
- **None.** No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, schema, or config files were
  created, modified, or deleted. The pipeline is T-035-01's, invoked with `--scale 16`.

## Acceptance criteria — status

- **AC1 — end-to-end run at scale 16, artifacts saved.** ✅ `--subject "a moai statue" --scale 16` ran
  clean (exit 0): doc → 3/4 concept → schema-valid 3-D `DesignArtifact` → 3/4 render + 24-frame rock
  turntable. `summary.json.scale == 16`. All outputs under the run dir.
- **AC2 — fidelity note at this scale, for the 16/32/48 comparison.** ✅ `fidelity-read.md` includes a
  dedicated **scale-16-vs-32 (run 003)** table — block delta (732 vs 2402), feature-by-feature
  survived/merged/dropped, bounds delta, value drift — exactly the cross-scale note the AC asks for.
- **AC3 — judged (categorical); renders/clips saved.** ✅ **`recognizable` (strong)** /
  Category-enum **`Competent` (form Strong)**; `render-3q.png` + 24 turntable frames saved.

## Result in one line

The angular hero **degrades gracefully**: at half the linear resolution (~⅛ volume, 732 vs 2402
blocks) every identity-bearing feature — brow, eye sockets, nose, mouth, monolith silhouette —
**survives**, while secondary detail (carved arms, crisp plinth) drops out and the `gray_concrete`
value drift reads murkier; **form holds, finish is lost**.

## Test coverage & gaps

- `npm run test:unit` = **312 pass / 0 fail**, before and after the live run (unchanged — the
  metered/GL path is intentionally outside `npm test`; the pure surface `src/sculpture.mjs`, including
  the `sculptureScaleCaps`/scale-threading this study exercises, keeps its existing unit coverage).
- **No new tests** — correct for this ticket: it adds no logic. The "integration test" is the live run
  (clean exit + schema-valid + 0 unmapped + `scale==16` + a render depicting a moai), all ✅.
- **Gap (inherent, not a regression):** build quality/fidelity and the cross-scale delta are
  human-judged from the renders, not asserted — by design (coarsening at 16 is the commissioned
  outcome). Recorded categorically in both vocabularies for comparability with the anchor.

## Open concerns / notes for the reviewer

1. **Triptych join key (for T-038-01).** The run id slug (`a-moai-statue`) **collides** with the
   scale-32 run 003 and does not encode scale — join the 16/32/48 set on **seq + `summary.json.scale`**,
   not the slug. Cited explicitly throughout the evidence docs.
2. **45° hero still under-shows a dark, low-res monochrome build.** Recommend the near-frontal
   turntable frame as the scale-16 hero in the triptych. Same azimuth lesson as 002 / T-036-04, milder.
   **Not changed here** — editing the shared `SCULPTURE_VIEW_3Q`/palette would fork the archetype and
   break scale comparability.
3. **Value drift recurs and worsens at low res** (`gray_concrete` darker than concept) — a Phase-1
   concept↔block property (memory *concept-image-not-color-value-preview*), not a build defect; noted.
4. **Topknot absence is a concept-stage difference**, not a resolution loss — flagged so the cross-scale
   read isn't over-attributed to scale.
5. **Cost did not drop with scale** ($0.6314 @16 vs $0.5684 @32) — lower resolution ≠ cheaper run; a
   useful datum for budgeting the rest of S-037.
6. **Pair pending.** The 16-end is recorded; the triptych closes when T-037-02 (moai@48) lands.
7. **No human attention required to proceed.** ACs met, tests green, artifact schema-valid.

## Verdict

All three ACs met. The pipeline produced a schema-valid, recognizable scale-16 moai on the first
attempt; the fidelity read is honest about both the win (form + all signature features survive the
resolution cut) and the limits (lost secondary detail, amplified value-drift murk, a weak hero angle).
The result cleanly supports the S-037 thesis for an angular form — **graceful degradation: form before
finish** — and is ready to set against the organic pineapple legs and assemble into the 16/32/48
triptych at T-038-01. Additive and reproducible — no shared code touched, scale/breadth comparability
preserved.
