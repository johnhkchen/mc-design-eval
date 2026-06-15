# T-129-01 baml-design-functions — Structure

Phase: Structure. The shape of the change; ordering where it matters.

## New files

### BAML sources (one per function; existing facade-era files untouched)
- **`baml_src/recognition.baml`** — `RecognizeBuildingProgram(pack_digest: string, sketch_digest:
  string, schema_json: string, concept: image, sketch_sheet: image) -> BuildingProgram`.
  Classes mirror `schema/building-program.schema.json`: `BuildingProgram{schema, subject, pack,
  reading: Reading, masses: Mass[]}`, `Mass{id, rect: Rect, storeys, storeyHeight, walls: Walls,
  plinth?, jetty?, roof: Roof, chimney?, openings: Opening[]}` etc. Template = the
  `buildRecognitionPrompt` skeleton verbatim, interpolating the three string params; images
  placed AFTER all text (preserves sdk-binding's `[text, ...images]` block order).
- **`baml_src/critique.baml`** — `CritiqueWorkshopRound(round: int, budget: int, image_list:
  string, program_json: string, palette_block: string, conformance_block: string,
  last_round_note: string, live_actions: string, max_issues: int, concept: image,
  renders: image[]) -> WorkshopReply`. `WorkshopReply{critique: Critique, decision:
  ReplyDecision, action?: WorkshopAction, rationale}`, `Critique{issues: Issue[]}`,
  `Issue{region, issue, severity: IssueSeverity}`; `WorkshopAction` = `AdjustParams |
  SprayPaint | ReRecognize` with `AdjustParams.params` as a map (value type fixed at codegen;
  fallback documented in design D4.2). Template = `buildWorkshopPrompt` skeleton verbatim.
- **`baml_src/vernacular.baml`** — `AuthorMaterialStory(theme_brief: string) -> MaterialStory`.
  `MaterialStory{style_name, setting, geology, timber, wealth_class, roofing_economy, trade,
  available_materials: AvailableMaterial[]}`, `AvailableMaterial{material, source, abundance,
  typical_use}`.
- **`baml_src/decompose.baml`** — `DecomposeBrushBacklog(style_summary: string, registry_state:
  string) -> BrushBacklog`. `BrushBacklog{items: BrushWorkItem[], parametrization_notes:
  ParametrizationNote[]}`, `BrushWorkItem{name, purpose, parameter_sketch, composition_notes,
  test_plan, preview_subject, context, acceptance_criteria: string[]}`,
  `ParametrizationNote{need, existing_brush, note}`.

### The adapter
- **`src/baml/bridge.mts`** — the ONLY file importing `baml_client`. Dispatch table
  `fn name → {request(args, images), parse(text)}` over the four functions. Stdin JSON
  `{ops: [{fn, mode: "render"|"parse", args?, images?: {name: {base64, mediaType}}, text?}]}` →
  stdout `{results: [{prompt?, images?: [{base64, mediaType}], parsed?} | {error}]}` (batch: one
  tsx spawn serves a whole test run). Render extracts text AND image blocks from
  `req.body.json().messages` — the rendered request is the single source of truth for content
  and image order. Carries the dummy-key render-only guard (set-if-absent → render → delete);
  contains no call to any actual BAML client function.
- **`src/baml/bridge.mjs`** — pure-`.mjs` spawn wrapper: `bamlBatch(ops)`,
  `bamlRender({fn, args, images})`, `bamlParse({fn, text})`. Spawns
  `npx tsx src/baml/bridge.mts`, JSON over stdio, throws on nonzero exit / per-op `error`.

### Fixtures (committed) + tests (under the `src/**/*.test.mjs` glob)
- **`src/baml/fixtures/critique/`** — `inputs.json` (render args computed from the synthetic
  program/pack fixtures critique.test.mjs already owns), `prompt.golden.txt` (legacy
  `buildWorkshopPrompt` output captured at migration — the byte-identity A/B), `reply-revise.txt`,
  `reply-done.txt`, `expected-revise.json`, `expected-done.json`.
- **`src/baml/fixtures/vernacular/`**, **`src/baml/fixtures/decompose/`** — `inputs.json`,
  `prompt.txt` (rendered at mint; the render-stability pin), `reply.txt` (full raw),
  `expected.json` (`b.parse` output pinned), `ledger.json` (T-114 shape: attempts, usage,
  promptSha256, model, ticket). Recognition needs no new fixture files — its pins are the
  already-committed `benchmarks/sculpture/recognition/{cottage,barn}.{replies,program}.json`.
- **`src/baml/fixtures.test.mjs`** — one `bamlBatch` spawn in `before()`; asserts per function:
  render byte/sha pins (recognition: sha == committed `promptSha256` per subject; critique:
  bytes == `prompt.golden.txt`; vernacular/decompose: bytes == `prompt.txt`), `b.parse` over each
  committed reply deep-equals `expected*.json` (recognition: equals committed `program.json`
  after optional-field/null normalization in the harness), and one malformed specimen per
  function rejects.
- **`src/baml/transport-guard.test.mjs`** — (1) bridge source guard: dummy-key pattern present,
  no `await b.<Fn>(` live-call token, `baml_client` imported nowhere else under `src/`/
  `benchmarks/`; (2) repo-level metered-key grep: `ANTHROPIC_API_KEY` appears only in
  `clients.baml` + the bridge guard (+ `.env.example` if present); (3) **judge isolation (AC3)**:
  `src/form/multi-angle-gate.mjs`, `src/form/judge-reply.mjs`, `src/form/resemblance.mjs`,
  `benchmarks/sculpture/multi-angle-gate.mjs` contain no `baml` token (case-insensitive,
  comment-tolerant token check on import/require lines).

### Minting runner
- **`scripts/mint-baml-fixture.mjs`** — `--fn vernacular|decompose [--rotate-pins]`. Pin-guard
  preflight on the fixture paths → `bamlRender` → `requestText` (no images on these two; strong
  tier via `MODEL_TIERS.strong`) under `runReplyPolicy` (parse = `bamlParse`, maxAttempts 3) →
  write fixture files. Inputs: vernacular `theme_brief` = the epic's example brief;
  decompose `style_summary` derived from `packs/rustic.json` provenance + `registry_state` from
  the new `registryDigest()`.

## Modified files

- **`package.json`** — `"pretest": "npm run baml:gen"`; `"baml:mint":
  "node scripts/mint-baml-fixture.mjs"`.
- **`src/recognition/prompt.mjs`** — `buildRecognitionPrompt` retired; add
  `recognitionRenderArgs({pack, sketch, schemaJson?}) -> {pack_digest, sketch_digest,
  schema_json}` (pure; wraps the kept `packDigest`/`sketchDigest` + `loadProgramSchema`).
  `stripReplyToJson`, `parseProgramReply` unchanged.
- **`benchmarks/sculpture/recognize.mjs`** — `runLive` calls
  `bamlRender({fn: "RecognizeBuildingProgram", args: recognitionRenderArgs(...), images:
  {concept, sketch_sheet}})`; prompt + image blocks come from the render result; sha/ledger/
  policy/records/`--offline` untouched.
- **`src/workshop/critique.mjs`** — `buildWorkshopPrompt` retired; add pure
  `critiqueRenderArgs({program, pack, round, budget, liveActions, azimuths, conformance,
  lastRound}) -> render args` (owns ANGLE_DESCRIPTIONS image-list, palette/decoration block,
  checks block, last-round note — the data serializers). Parser + constants unchanged.
- **`src/workshop/loop.mjs`** — drop the `buildWorkshopPrompt` import/call; `exchange` receives
  `{round, budget, renders, program, conformance: before, lastRound, liveActions, azimuths}`.
  Everything else (cage, ledger, termination) untouched.
- **`benchmarks/sculpture/workshop.mjs`** — exchange closure: `critiqueRenderArgs(ctx)` →
  `bamlRender` (images: concept + round renders) → `runTieredOp` → `runReplyPolicy` with
  `parseWorkshopReply` as today. **Edited last** (T-127-01 contention, design D9); staged alone.
- **`src/pack/brush-catalog.mjs`** — add pure `registryDigest()` (brush name, kind, one-line
  purpose, parameter names per registry entry) if no existing export already serializes this
  (verify at implement; reuse if one does).
- **`src/workshop/loop.test.mjs`** — synthetic exchanges assert the new ctx fields (round,
  conformance present) instead of `prompt` string sniffing.
- **`src/workshop/critique.test.mjs`** — B-group re-targets `critiqueRenderArgs` (pure pins:
  image order list, palette lines, conformance lines, live-actions list, determinism); the
  full-prompt content pins move to `src/baml/fixtures.test.mjs` (where the bridge spawn lives).
- **`src/workshop/isolation.test.mjs`** — extend ISO4's loop-core import ban to include
  `baml` tokens (loop core must not even spawn the bridge; only runners may).

## Deleted
- Nothing deleted on disk; two functions retired from `.mjs` sources (`buildRecognitionPrompt`,
  `buildWorkshopPrompt`) — the grep records their absence from the runners' import graphs.

## Module boundaries (the rules the tests pin)
1. `baml_client` is imported by exactly one file: `src/baml/bridge.mts`.
2. Loop core (`src/workshop/{loop,program,actions,critique,replay}.mjs`) imports neither
   sdk-binding nor the bridge — prompt rendering happens in runners, across the exchange seam.
3. The judge path has no baml dependency (AC3 test).
4. Transport stays in `.mjs` runners via sdk-binding/model-tier — the bridge renders and parses,
   never transports.

## Ordering
1. `baml_src/` four files + codegen green + `pretest` wiring (commit 1 — additive, no behavior).
2. Bridge (`.mts` + `.mjs`) + transport-guard test (commit 2).
3. Recognition migration: iterate template until rendered sha == committed shas (cottage+barn) →
   migrate `prompt.mjs`/`recognize.mjs` → fixture parse cases → `recognize:offline` green
   (commit 3).
4. Critique migration: `critiqueRenderArgs` + golden capture (legacy output committed BEFORE the
   builder is retired) → loop seam + test ports → fixtures → `workshop:replay`/`offline` green
   (commit 4); workshop runner edit + verification as its own commit (commit 5, sibling-aware).
5. Mint vernacular + decompose fixtures live (commit 6).
6. Full `npm test`, grep records, review (commit 7).

## Risks tracked into Plan
- BAML template whitespace/dedent vs byte-identity (mitigation: sha test drives the iteration).
- `AdjustParams.params` map value typing under codegen (decided by `baml:gen` output; fallback
  in design D4.2).
- `b.parse` null/absent normalization for optional fields vs committed `program.json`.
- tsx spawn resolution (`npx tsx` from repo root; `tsx` is a devDependency).
- `benchmarks/sculpture/workshop.mjs` dirty from T-127-01 (stage file alone; re-read first).
