# T-136-01 geometry-levers — Research

Epic E-33 / Story S-136. The finding to close (T-127 cottage ledger): the model critiqued the
proportion defect in 4 of 6 rounds and never fixed it — `adjust-params` couldn't be aimed at
geometry, and `re-recognize` parses but has no applier. Eyes right; no hands.

## 1. The workshop stack as it stands

### The pure core (`src/workshop/`)

- **`loop.mjs`** — `runWorkshopLoop({program, pack, seams, appliers, meta})`. Per round: realize →
  conform (before) → render (injected, evidence only) → `exchange` (injected, metered) → ONE
  action via `applyAction` → conform (after) → accept or roll back on `isRegression`
  (lexicographic: checks passed desc, then total findings asc; lateral moves accepted). Every
  round ledgered (`workshop-ledger/v1`): critique, action, applied, conformance both sides, raw
  replies, askCount. `applyAction` is called **synchronously** (loop.mjs:133) — an async applier
  (a model call) would break it today.
- **`actions.mjs`** — `ACTION_NAMES = ["adjust-params", "spray-paint", "re-recognize"]`.
  `parseAction` already validates `re-recognize.elementId` against `program.elements`;
  `DEFAULT_APPLIERS` deliberately omits it, so selecting it yields `{kind:"unavailable"}` —
  the round is recorded, not crashed. The injectable-applier seam is already proven by test
  (`actions.test.mjs` AP2: appliers override wires re-recognize in).
- **`program.mjs`** — `workshop-program/v1`: `{schema, subject, pack, budget, declarations,
  elements}`. `applyParamAdjust(program, {elementId, params})` merges top-level spec keys into ONE
  element and re-validates. This is why geometry is out of reach: a proportion change must move
  the shell `height`, the roof `eaveY`/`ridgeY`, dormer seats, chimney base/height, head AABBs,
  and the `declarations` bands **together** — single-element spec merges either realize-throw or
  regress conformance. `parseWorkshopProgram` validates named fields only (unknown top-level keys
  survive `structuredClone` but the committed seeds are byte-pinned — adding keys to seeds means
  pin rotation).
- **`critique.mjs`** — `critiqueRenderArgs` serializes round context into the BAML function's
  typed inputs; `program_json` currently shows **`{elements}` only** — the model never sees a
  mass-level surface. `parseWorkshopReply` is strict and throws (routed into judge-reply's
  bounded same-prompt re-ask). `liveActionNames(appliers)` derives the prompt's "live now" list.
- **`replay.mjs`** — `replayLedger` re-applies accepted rounds: `applied.kind === "program"` must
  be `adjust-params` (replay.mjs:47 throws otherwise); `"paint"` re-applies recorded placements
  verbatim ("the ledger IS an input"). `offlineAssert` re-checks final conformance using **the
  seed program's declarations** with the comment "declarations are constant across adjust-params"
  — a geometry revision breaks that assumption (recompile re-derives bands).
- **`seed.mjs`** — `seedWorkshopProgram({program: buildingProgram, pack, budget})` =
  `compileProgram` → assert → realize → conform. `chainRels`/`recognitionRels` are the ONE place
  record paths derive (pack-namespaced via `packNs`). `PATTERN_BOOK_BUDGET = {rounds: 6}`.
- **`isolation.test.mjs`** — ISO1 token scan over every non-test `src/workshop/*.mjs` (directory
  glob: new modules auto-covered) **plus** `benchmarks/sculpture/workshop.mjs` and
  `pattern-book.mjs` (explicit list — a new runner composing the workshop must be added). ISO3
  pin-guard refusal for domain "workshop" → gate records. ISO4 bans `sdk-binding`, `model-tier`,
  `render/`, `prismarine`, `baml` imports in the five core modules (named list — new core
  modules should join it).

### The impure runner (`benchmarks/sculpture/workshop.mjs`)

Loads the **workshop program only** (`chainRels(key, pack).seed`) — it never sees the
building-program or the sketch today. Exchange seam: `critiqueRenderArgs` → `bamlRender({fn:
"CritiqueWorkshopRound"})` → `runTieredOp({tier:"strong"})` (op `workshop-critique`,
model-tier.mjs:123) wrapped in `runReplyPolicy` (judge-reply.mjs, `MAX_REPLY_ATTEMPTS = 3`,
same-prompt re-asks). Pin-guarded writes (ledger/digest/final), preflight before spend; committed
cottage/barn ledgers are tracked pins — a re-run of subject `cottage` needs `--rotate-pins` in an
owning ticket OR new record paths (the measured-proportions precedent chose new paths).

## 2. The T-133 measured-parameter surface (`src/recognition/measured-program.mjs`)

The geometry vocabulary the AC names, all pure and mass-scoped:

- `factorEave({eaveBlocks, recognizedStoreys, packBand})` → `{storeys, storeyHeight, used,
  residual}` — expresses a measured eave height under schema bounds (storeys 1–4, sh 2–6),
  deterministic total order.
- `snapPitch(ratio, pack.proportions.pitchClasses)` — nearest class, ties down.
- `scaleFootprint(masses, {w, d})` — shared per-axis endpoint affine; touching masses stay
  aligned; min extent 3.
- `impliedRidgeRise(mass)` — the compiler's ridge formula mirrored (drift-pinned by test).
- `applyMeasuredProportions({program, sketch, pack})` — the attempt-ladder seam (most-measured
  rung whose only validation findings are its own predicted band excursions wins).
- `silhouetteRatios(workshopProgram)` → `{ridgeToEave, roofShare, aspect}` (compiled geometry);
  `sketchTargetRatios(sketch)` — same definitions from the sketch's measurements. These two are
  the ratio check the AC's cottage proof names.

## 3. The recompile channel (geometry coherence already exists)

`compileProgram(buildingProgram, pack)` (src/recognition/compile.mjs) deterministically lowers
masses → elements **and declarations**: shell height = storeys×sh, roof eaveY/ridgeY from
pitchClass and the expanded footprint, dormer seats `eaveY + max(1, ⌈pitch⌉)`, chimney through
ridge+2, opening lanes re-laid by rhythm, bands re-derived from what was assigned. A mass-level
parameter change recompiles into a coherent workshop program — this is "realized through the
registry" without duplicating any geometry math. Gates around it: `assertBuildingProgram` (AJV,
`schema/building-program.schema.json`, mass = `{id, rect{x0,z0,w,d}, storeys, storeyHeight,
walls, plinth?, jetty?, roof{idiom, ridgeAxis?, pitchClass, fieldRole,…}, chimney?, openings}`,
additionalProperties:false) and `validateProgramAgainstPack` (roles, pitchClass ∈ pack
vocabulary, storeyHeight ∈ pack band, opening/dormer feasibility, connectivity).

Note `budget: {rounds: 1}` is hardcoded in compileProgram's output; seedWorkshopProgram overrides
it — any in-loop recompile must preserve the live program's budget the same way.

## 4. Recognition exchange (the re-recognize donor pattern)

`benchmarks/sculpture/recognize.mjs`: `recognitionRenderArgs({pack, sketch})` →
`bamlRender({fn:"RecognizeBuildingProgram"})` → strong tier → `runReplyPolicy` with
`parseProgramReply` (strip → AJV → pack-vocabulary gate; throws = MALFORMED = bounded same-prompt
re-ask; raw replies + askCount committed — the T-114 pattern). There is **no fragment-scoped
prompt or parser today**; recognition is whole-building. `prompt.mjs` exposes `sketchDigest`,
`packDigest`, `loadProgramSchema` — reusable for a fragment prompt. BAML templates live in
`baml_src/` (critique.baml already declares `WorkshopReRecognize {action, elementId}` in the
reply union and lists re-recognize in the prompt's sanctioned actions — the model can already
*ask* for it; `parseAction` accepts; the applier is the missing piece).

## 5. The conformance gate and the T-135 seam

`runConformance` checks (src/pack/conformance.mjs): courses-even, symmetry-held,
openings-rhythm, palette-in-pack, watertight, single-component — **regularity only; nothing
proportion-aware**. T-135 (proportion conformance in the workshop gate) has an empty work dir and
no commits as of now — **not landed**; a sibling session was researching it ~9:05pm. The AC
anticipates this: "regularity + T-135 proportion if landed, else regularity + a ratio guard".
Anything T-136 adds must not collide with T-135's planned `proportion-ratios` check in
conformance.mjs (concurrent-session risk — the T-133/T-134 interleaving precedent; prefer
touching conformance.mjs not at all).

## 6. The cottage fixture (the proof subject)

- Seed (committed pin): `workshop/cottage/program.json` — 19 elements, 2 masses upstream
  (`main` 18×28, `wing` 8×15, both storeys 2 × sh 4 → eave 8, pitch 1). Ratios before:
  ridgeToEave **2.25**, roofShare 0.5556, aspect 1.0769.
- Sketch target (`form-sketch/cottage.json` via `sketchTargetRatios`): ridgeToEave **1.4145**,
  roofShare 0.293, aspect 1.1852.
- T-133's measured re-seed (`measured/cottage.*`, NEW paths): storeys 4 × sh 5 → eave 20, after
  ratios ridgeToEave **1.55** — proof the mass-level surface closes most of the gap (sh=5 is a
  recorded band excursion; rustic band is [3,4], pitchClasses `[1]`; saltcrag has `[2,1,0.5]`).
- T-127 ledger (`workshop/cottage.json`, 6 rounds, outcome done): rounds 1–6 all name the
  proportion defect ("roof mass dominates", "reads as 'mostly roof'", "thin sliver") — every
  action taken was spray-paint or a block-material adjust-params. The round-4-class critique the
  AC cites: "Spruce roof plus deep jetty+eave overhang swallows the upper walls; the build reads
  as 'mostly roof'".

## 7. Constraints and assumptions surfaced

1. **Replay reach**: `replayLedger` and `offlineAssert` must learn any new `applied.kind`;
   re-recognize's accepted fragment is a model output, so the ledger must carry it verbatim
   (paint precedent), while a geometry adjust can re-derive deterministically.
2. **Declarations move** under geometry revision (recompile re-derives bands/openings);
   offlineAssert's seed-declarations shortcut and the loop's `conform` calls already take
   per-program declarations (`candidateProgram.declarations`) — the loop side is safe; the
   offline side needs the replayed program's declarations.
3. **The loop core may not import** sdk-binding / model-tier / baml (ISO4) — a re-recognize
   applier that calls the model must arrive **injected from the runner**, like `exchange`.
   `applyAction` must therefore tolerate an async applier.
4. **The workshop runner has no building-program or sketch input today**; geometry levers and
   ratio targets need those wired in as data (recognitionRels/measured paths + form-sketch path),
   no per-building constants.
5. **Pins**: cottage/barn workshop ledgers are tracked. The cottage proof either rotates them in
   this owning ticket or writes under new paths (measured-proportions precedent). The fixture
   subject (`workshop:fixture`) is the cheap synthetic path for tests of the live wiring.
6. **Budget bound**: re-recognize is "bounded by the round budget" — it consumes its round; its
   model exchange gets judge-reply's bounded re-asks (askCount recorded per round already).
7. **Prompt surface**: the critique prompt must expose the mass-level geometry surface (and the
   measured/target ratios?) for the model to aim at it — today it sees only compiled elements.
   The prompt is BAML-template-owned (T-129) with a byte-pinned golden fixture
   (`src/baml/fixtures/critique/prompt.golden.txt`) that will need re-minting.
8. **`npm test`** currently green at ~1949 tests; brush-door conformance allowlist episode
   (T-133/134) resolved. New runner files composing the workshop must join ISO1's explicit list.
