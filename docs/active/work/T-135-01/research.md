# T-135-01 proportion-conformance — Research

Descriptive map of what exists. No solutions proposed here.

## 1. The defect this ticket instruments

The T-127 cottage chain ran 6 workshop rounds; **every round passed all 6 conformance checks with
0 findings**, while the model's own critique named the proportion defect in rounds 1, 2, 4, 6
(`benchmarks/sculpture/workshop/cottage.json`), e.g. round 4: *"Spruce roof plus deep jetty+eave
overhang swallows the upper walls; the build reads as 'mostly roof', whereas the concept shows two
clearly-framed wall storeys."* No check owns proportion; no round carried a numeric target.

Numerically the defect is large: the seed program's bands put the roof at y∈[8,20] of a 21-block
elevation (roof share ≈ 0.62), while the conditioned sketch measures the concept at
`eaveFrac 0.7073` (roof share ≈ 0.29) — `benchmarks/sculpture/form-sketch/cottage.json`
(`proportions: {eaveBlocks: 19.3, heightBlocks: 27.3}`, `footprint.planDims: [40,48]`).

## 2. The silhouette machinery (E-22/E-15 era — "machinery we own")

`src/form/form-fidelity.mjs` — pure, GL-free, byte-stable:
- `extractSilhouette(img, bgOpts)` → `{w,h,data:Uint8Array,fgCount,bbox}` binary mask from a
  decoded RGBA image; background test reuses E-10 `isBackground` (`src/color/palette-extract.mjs`).
- Presets: `RENDER_BG` (flat sky `#ADD8E6`, tol 24) and `CONCEPT_BG` (near-black, tol 40) —
  concept.png is background-segmentable today.
- `normalizeSilhouette(mask, {grid,fit,bbox?})`, `normalizePlacement(bbox)` (the single letterbox
  transform), `iou`, `regionIoU(a,b,{x0..y1} normalized fractions)`, `formFidelity`, and the only
  decode caller `formFidelityFromPair(renderPath, conceptPath)`.
- `sideStats` already reports per-side `bbox` and `aspect` (w/h) — proportion-adjacent but no
  ridge/eave/roof-share metrics exist anywhere on masks.

`src/recognition/measured-program.mjs` (T-133-01, fresh):
- `silhouetteRatios(workshopProgram)` — ridgeToEave, roofShare, aspect **from compiled program
  geometry** (roof specs' `eaveY`/`ridgeY`, shell footprints). Header says explicitly: *"the
  record-scoped diagnostic of E-33 Rule 2's named ratios. NOT S-135's render-vs-concept gate
  metric."*
- `sketchTargetRatios(sketch)` — the same three ratios from sketch measurements (nullable per
  constituent); `sketchMeasurements(sketch)` normalizes the sketch into registry blocks and
  exposes `primaries[]` (per-mass bbox + pitch) from `sketch.proportions.masses` (cottage:
  one primary, `mass-0`; `massCount: 1` even though the program has 2 shells).
- `benchmarks/sculpture/measured-proportions.mjs` (runner) already records
  before/after/target ratio rows in `benchmarks/sculpture/measured/<runKey>.*`; its digest says
  *"standalone diagnostic — S-135 owns the gate metric"*.

`src/view/occupancy.mjs`: `artifactOccupancy(artifact)` / `occupancyFromCells` → `occ.cells`
(Map `"x,y,z"`→block), `occ.block(x,y,z)`, `bareBlock`. No orthographic projection helper exists;
`src/view/silhouette-residual.mjs` (T-109) projects exposed-face meshes for the judge side.

## 3. The workshop per-round gate (where this wires in)

`src/pack/conformance.mjs` — `runConformance({occ, declarations}, pack)` runs **exactly the checks
the pack lists** (`pack.conformance.checks`; rustic lists the 6 regularity names). Check verdicts
are `{name, passed, findings[]}` capped at 12 findings. `CONFORMANCE_CHECK_NAMES` is the closed
vocabulary; `src/pack/style-pack.mjs` rejects unknown names at pack-validation time. Charter in
the header: *declared, never inferred* — undeclared properties pass vacuously (symmetry precedent).

`src/workshop/loop.mjs` — `runWorkshopLoop({program, pack, seams})`:
- per round: realize → `conform({artifact, declarations})` (**before**) → render seam (model's
  eyes only — *"GL bytes never decide"*) → exchange → apply ONE action → conform (**after**) →
  `isRegression(before, after)` rolls back on lexicographic regression (checks passed desc,
  findings asc; equal accepted).
- Round entries: `{round, renders, replies, askCount, critique, decision, rationale, action,
  applied, conformance:{before, after, accepted, reason}}`. Ledger schema `workshop-ledger/v1`
  carries the SEED program; `final.conformance` re-derived at the end.
- The conform seam is injectable; default = pure occupancy + runConformance.

`src/workshop/program.mjs` — `parseWorkshopProgram` requires `declarations` to be an object but
does **not** restrict its keys (bands/symmetry/openings today; extra keys pass validation).
`applyParamAdjust` touches element specs only — *"declarations are constant across adjust-params"*
(replay.mjs:128 comment).

`src/workshop/critique.mjs` — `critiqueRenderArgs` serializes round context into the typed inputs
of BAML `CritiqueWorkshopRound` (`baml_src/critique.baml`); `conformance_block` is a plain string
param assembled in JS (per-check PASS/FAIL lines). The prompt skeleton lives in the BAML template;
golden-pinned by `src/baml/fixtures.test.mjs`. The exchange ctx already carries `conformance`
(the before-report) — that is how the gate's numbers reach the model today.

## 4. Replay / offline constraints (the hard edges)

- `src/workshop/replay.mjs` `replayLedger` re-applies accepted rounds (adjusts + paint) from the
  seed; **no gate re-runs during --replay** (byte-compare of final artifact only).
- `offlineAssert` re-derives `final.conformance` via the injected conform closed over the
  **current pack file** and compares `JSON.stringify`-identical to the committed report
  (replay.mjs:126-133). ⇒ **Adding a check name to `packs/rustic.json` would make every committed
  rustic chain's offline re-assert diverge** (recomputed report gains a 7th entry). Committed
  records: `workshop/{fixture,cottage,barn}.json` (rustic) and `workshop/barn--saltcrag.json`
  (saltcrag). It also re-asserts the cage's arithmetic per round via `isRegression` on the
  *recorded* reports.
- Renders are **gitignored** (`cottage.md`: "Render evidence (gitignored, regen via the live
  runner)") — round PNGs exist locally but are not committed; the concept IS committed
  (`benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png`, sha pinned in
  `ledger.conceptRef`). Memory/lessons: byte-reproducible runs exclude GL from decisions.
- Pin discipline: all workshop record writes go through `guardedWriteRecord` (domain "workshop");
  re-writing committed ledgers/seeds requires `--rotate-pins` in an owning ticket (T-119).

## 5. Isolation scan (must keep passing)

`src/workshop/isolation.test.mjs`:
- ISO1: every `src/workshop/*.mjs` (glob — new files auto-covered) + `workshop.mjs` +
  `pattern-book.mjs` must not contain judge-seam tokens (`multi-angle-gate`, `gate-instrument`,
  `spawnGate`, `judgeThroughPolicy`, `aggregateMultiAngle`, `parseMultiAngleVerdict`,
  `benchmarks/sculpture/multi-angle/`).
- ISO2: runner may import `src/view/multi-angle.mjs` (lens) and never `form/multi-angle*`.
- ISO3: pin-guard refuses workshop-domain writes into the gate-record namespace.
- ISO4: loop core files (`loop, program, actions, critique, replay`) may not import
  `sdk-binding`, `model-tier`, `render/`, `prismarine`, `baml`. Importing `src/form/form-fidelity.mjs`
  or `src/recognition/measured-program.mjs` is not banned by any pin.

## 6. The committed T-127 fixture (witness substrate)

- Ledger `benchmarks/sculpture/workshop/cottage.json` (6 rounds, outcome `done`); seed program at
  `ledger.program` (2 shells, plinth/jetty×3, roof.gable×2, chimney, heads); declarations bands:
  base y[0,3], upper y[4,7], roof y[8,20]. Final artifact
  `workshop/cottage/final-artifact.json`; digest `cottage.md`.
- Judge-side record describing the defect's effect: `multi-angle/cottage-patternbook.{json,md}` —
  FAIL, band1 (upper storey) zero coverage at every view (eaves+jetty occlusion) — the "squat
  upper storey / shallow read" the AC quotes. (Workshop code may not write there; reading is the
  pattern-book-compare runner's business, deliberately outside ISO1's file list.)
- Replay entry points: `npm run workshop:replay` (fixture subject; cottage via
  `node benchmarks/sculpture/workshop.mjs --subject cottage --replay`), `patternbook:repro`,
  `measured:repro` — all green at HEAD (T-128 note: live-chain-vs-pins drift is pre-existing and
  proven via baseline worktree; never regenerate pins).

## 7. Docs & conventions

- "Pack-conformance docs" = `packs/README.md` (names the conformance checks the workshop runs)
  + `schema/style-pack.schema.json` + semantic validation in `src/pack/style-pack.mjs`
  (`proportions`: storeyHeight, pitchClasses, openingRhythm — integer-bounded, style-level).
- npm script naming: `workshop:*`, `measured:{cottage,barn,repro,offline}` precedent; runner flags
  need `--` or direct `node` (npm swallows flags).
- Test conventions: pure modules + tests live under `src/**/*.test.mjs` (node:test); synthetic-
  image patterns in `src/form/form-fidelity.test.mjs` (RGBA buffers built in-test);
  `src/pack/brush-door.conformance.test.mjs` sweeps registry/vocabulary discipline (currently has
  a working-tree modification + a known sibling-session failure mode around unregistered modules).

## 8. Constraints & assumptions surfaced

1. **Determinism vs "from renders":** E-33 Rule 2 says ratios "computed from renders"; the loop's
   charter says GL bytes never decide, renders are uncommitted, and replay must stay byte-identical
   with no GL. Any gate-side build silhouette must therefore come from deterministic geometry
   (occupancy/program), with render-side measurement at most evidence. This tension is the central
   design decision.
2. **Concept-side measurement happens once,** somewhere impure (concept.png decode), and its
   numbers must be *recorded* for the pure gate to consume (declarations or a committed record).
   The concept is a ~3/4 perspective view — ridge:eave from its silhouette is approximate; the
   sketch is the sanctioned fallback per ratio (AC parenthetical, E-33 honesty note).
3. **Committed chains must stay valid:** rustic.json's check list effectively cannot grow without
   breaking `offlineAssert` JSON-equality on 3 committed records; tolerance/metric placement must
   respect that.
4. **Per-mass:** the only mass-naming record is `sketch.proportions.masses` (cottage names 1);
   `component-plan.json` names roof cells only.
5. **Sibling-session flux:** `src/view/roof-steep.mjs` (T-134) is untracked and currently trips
   `brush-door.conformance.test.mjs` (not this ticket's to fix); same-ticket double-dispatch was
   checked — no T-135-01 work dir existed before this session.
