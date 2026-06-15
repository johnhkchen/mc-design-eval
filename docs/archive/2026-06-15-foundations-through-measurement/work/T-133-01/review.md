# T-133-01 measured-proportions — Review

## What shipped

**Identity from language, quantity from geometry is now real code**: the building program's
dimensional parameters are sourced from the conditioned sketch's measurements at seed time, with
a per-parameter provenance ledger, and the re-seeded cottage + barn records show the massing
change the epic asked for.

Commits (both on `main`):
- `8a3a51d` — the seam + tests + RDSPI artifacts (research/design/structure/plan/progress)
- `dc6f167` — the runner, npm scripts, and the committed cottage/barn measured records

### Files created
- `src/recognition/measured-program.mjs` — the pure seam: `applyMeasuredProportions`
  (attempt-ladder validated, sketch-wins conflicts), `sketchMeasurements` (unit normalization —
  `*Blocks` fields ride as-is, cell fields convert by `registryScale/sampleScale`), `factorEave`
  (schema-bounded factorization of the measured eave; pack band demoted to a tie-break
  preference), `snapPitch` (nearest pack class, residual recorded), `scaleFootprint` (endpoint
  scaling keeps touching masses touching), `impliedRidgeRise` (compile's ridge formula mirrored),
  `silhouetteRatios`/`sketchTargetRatios` (standalone, record-scoped).
- `src/recognition/measured-program.test.mjs` — MP1–MP13.
- `benchmarks/sculpture/measured-proportions.mjs` — the named runs; records at
  `benchmarks/sculpture/measured/<runKey>.*`; live / `--repro` / `--offline`; pin-guarded;
  self-grep clean (no subject keys in source); pipeline-failed posture on deterministic throws.
- `benchmarks/sculpture/measured/{cottage,barn}.{program,artifact,record,md}.json/.md` + 8 view
  PNGs — the committed re-seeded records.

### Files modified
- `package.json` — `measured:cottage`, `measured:barn`, `measured:repro`, `measured:offline`.

### Deliberately untouched
`schema/building-program.schema.json`, `program.mjs`, `compile.mjs`, `seed.mjs`,
`pattern-book.mjs`, and every previously committed record — the prior pins' validity is by
construction, and re-proven (below).

## Acceptance criteria, with receipts

1. **The measurement-to-program seam (pure, unit-tested)** ✓ — `applyMeasuredProportions` is pure
   (no I/O/model/GL); sketch-wins is proven by MP7 (recognition 2×4=8 vs measured 19.3 → 4×5=20,
   conflict recorded with both values); qualitative naming untouched by MP9 (roles, idioms,
   openings, ridgeAxis, reading byte-equal).
2. **Defaults demoted to recorded fallbacks** ✓ — MP6 asserts the ledger names a source
   (`measured | fallback`) for every dimensional parameter of every mass; MP8 proves the
   fallback path (unmeasurable pitch/eave keep recognition's value, recorded with the reason).
   On the two real subjects every parameter measured (sources: cottage 10/10, barn 6/6 measured).
3. **Re-seeded programs behind the named runs** ✓ — committed with sources and conflicts;
   conformance PASS both; renders committed and inspected. Ratios (before → after vs target):
   | | ridge:eave | roof share | aspect |
   |---|---|---|---|
   | cottage | 2.25 → **1.55** (target 1.4145) | 0.5556 → **0.3548** (0.293) | 1.0769 → **1.1852** (1.1852, exact) |
   | barn | 2.4444 → **2.4** (target 2.1) | 0.5909 → **0.5833** (0.5238) | 2 → **1.8462** (1.8462, exact) |
   Cottage eave 8 → 20 blocks (the squat mechanism reversed); barn eave 9 → 10, depth 24 → 26.
4. **Replay holds** ✓ — `measured:repro` and `measured:offline` byte-identical (exit 0); prior
   pins re-proven: `patternbook:repro`, `patternbook:saltcrag:repro`, `recognize:offline` all
   green after the records landed.
5. **No judge runs; no per-building constants; npm test** — no judge/workshop spawn anywhere in
   the runner (it is model-free end to end); all logic is generic over (sketch, program, pack);
   suite is green for this ticket's code — see the concurrency note below.

## Test coverage

- Unit: 13 tests over every exported helper, including the drift tripwire (MP5 pins
  `impliedRidgeRise` against `compileProgram`'s emitted ridge across gable/hip and both axes),
  byte-stability (MP10), and the attempt ladder's per-axis fallback (MP11).
- Integration: MP13 seeds a band-excursion measured program through the real
  `seedWorkshopProgram` + conformance gate; the two live runs + repro sweeps are the end-to-end
  receipts.
- **Gaps**: the multi-primary mass mapping (`primaryFor`'s bbox-overlap branch) is untested
  beyond the single-primary path — both current sketches have exactly one primary; the branch is
  small and deterministic but will need a fixture when a multi-primary sketch first appears.
  Ladder rungs 5–8 (eave fallback under infeasibility) are likewise constructible-only paths.

## Open concerns for the reviewer

1. **Suite status is 1937/1938 at the time of writing, and the failure is not this ticket's**:
   `brush door: technique imports … allowlist` trips on `src/view/roof-steep.mjs`, an untracked
   file created mid-run by the concurrent S-134 session (steep-pitch). The suite was 1938/1938
   green at this ticket's `8a3a51d` commit; this ticket adds nothing under `src/view/` or
   `src/pack/`. Expect S-134 to register the brush and clear it.
2. **Rustic's pitch cannot move** — one pitch class (1 ≙ 45°). The cottage's measured 35.5° and
   any steeper concept both snap to 1 with the residual recorded; the barn's remaining
   ridge:eave gap (2.4 vs 2.1) is exactly this ceiling. The vocabulary widening is S-134; the
   seam already consumes arbitrary class lists (proven against `[2, 1, 0.5]`).
3. **Cottage at 4×5 storeys**: the measured eave is expressed as 4 storeys of 5 (storey count is
   treated as the eave's factorization, not identity). Consequences: the ground-stone course
   ends at y4 of a 20-block wall and the recognized openings crowd the lower wall. Geometry
   levers that re-place openings on measured walls are S-136's; recorded here, not hidden.
4. **The sketch is TRELLIS-derived** — the cottage's 19.3-block eave is the mesh's truth, and
   E-33's honesty note makes the *concept* the contract: if the glance says the measured build
   overshoots, S-135's ratio check (computed against the concept, sketch as fallback) is the
   instrument that will say so numerically. This ticket deliberately records both rows
   (after vs target) without judging.
5. **Chain adoption is a handoff**: the pattern-book chain still seeds from the recognition
   program directly. Wiring `applyMeasuredProportions` into stage 3 (and rotating the chain's
   seed/ledger/final pins) belongs to S-136/S-138 under their own tickets — the seam and its
   records are deliberately beside the chain, not inside it (AC 4's "prior pins valid").
6. **`impliedRidgeRise` mirrors compile's formula** (5 lines). MP5 is the drift tripwire — if
   compile's roof lowering ever changes, MP5 fails loudly; re-verify the mirror then.

## No action needed but worth knowing

- The measured records are pack-namespaced (`packNs`) like every other record family; a
  `barn--saltcrag` measured run would land beside, not over, the rustic records.
- The runner's `--offline` is an alias of `--repro` (no model/ledger layer exists on this path);
  both flags are accepted so the AC's invocation forms work.
