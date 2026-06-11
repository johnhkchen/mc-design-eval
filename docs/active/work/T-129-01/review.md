# T-129-01 baml-design-functions — Review

Phase: Review. Handoff summary; acceptance criteria traced; open concerns flagged.

## What changed (6 implementation commits: `060572e`, `f81d2cd`, `54b988b`, `85a89a8`, `cd03069`, `414b508`)

**Created**
- `baml_src/{recognition,critique,vernacular,decompose}.baml` — the four typed design functions
  on the unchanged `ClaudeStub` (render-only) client. Recognition/critique templates are
  byte-transplants of the retired `.mjs` builders; vernacular/decompose are the new T-130/T-131
  seams using `ctx.output_format`.
- `src/baml/bridge.mts` — THE one new `baml_client` importer: batch render/parse over stdio,
  render-only dummy-key guard, never transports. `src/baml/bridge.mjs` — the `.mjs` spawn seam
  (`bamlBatch`/`bamlRender`/`bamlParse`).
- `src/baml/fixtures/` — committed pins: critique `inputs.json` + `prompt.golden.txt` (captured
  from the legacy builder before retirement) + canonical replies/expected; vernacular +
  decompose live-minted `inputs/prompt/reply/expected/ledger` (T-114 shape, full raws + usage).
- `src/baml/fixtures.test.mjs` (8 tests, one bridge spawn) and
  `src/baml/transport-guard.test.mjs` (5 tests).
- `scripts/mint-baml-fixture.mjs` (`npm run baml:mint -- --fn vernacular|decompose`).

**Modified**
- `package.json` — `pretest: baml:gen` (codegen wired into the build; gitignored client never
  hand-edited), `baml:mint`.
- `src/recognition/prompt.mjs` — `buildRecognitionPrompt` → `recognitionRenderArgs` (digests
  stay; prose moved to BAML). `benchmarks/sculpture/recognize.mjs` — prompt + image order from
  `bamlRender`; ledger/policy/gates/`--offline` untouched.
- `src/workshop/critique.mjs` — `buildWorkshopPrompt` → `critiqueRenderArgs`; parser unchanged.
  `src/workshop/loop.mjs` — the pure core hands ROUND CONTEXT across the exchange seam (prompt
  rendering is the runner's). `benchmarks/sculpture/workshop.mjs` — exchange closure renders via
  the bridge, transports on the tiered shim.
- `src/pack/brush-catalog.mjs` — `registryDigest()` (decompose's `registry_state`).
- Tests ported, not weakened: `prompt.test.mjs`, `critique.test.mjs` B-group,
  `loop.test.mjs` (ctx contract), `isolation.test.mjs` (ISO4 + `baml` ban).

## Acceptance criteria

1. **Four BAML functions with schemas + pinned fixtures/tests** — DONE. Render pins:
   recognition sha == committed `promptSha256` (cottage, barn); critique bytes == captured
   golden; vernacular/decompose bytes == mint-time prompts. Parse pins: committed accepted raw
   replies == committed programs (recognition), canonical revise/done (critique), minted
   replies (new functions); malformed specimens covered. `baml:gen` wired via `pretest`.
2. **Transport on the subscription shim** — DONE, decision recorded in design.md D1: the
   facade-era pattern (BAML renders/parses; `sdk-binding`/`model-tier` transport). Proof:
   the two live mints ran through `requestText` (ledgered with usage + a transport note), and
   transport-guard tests pin it structurally (bridge never transports; metered key absent from
   every non-test `.mjs`; importer set frozen).
3. **Frozen judge untouched** — DONE. No judge file modified (git); TG4 asserts the four
   judge-path files carry no baml token; TG5 asserts no judge vocabulary in the new functions;
   `baml_src/judge.baml` (facade-era, unimported) not touched.
4. **Runners migrated behavior-preserving** — DONE. `recognize:offline` byte-identical (both
   subjects), `workshop:replay` BYTE-IDENTICAL + `workshop:offline` clean, recognition prompt
   byte-equality proven against the committed live records, critique against the golden A/B.
   Grep recorded (progress.md): retired builders 0 refs; prompt prose 0 hits in both runners.
   Bonus: T-127-01's live workshop runs landed AFTER the migration and replay byte-identically.
5. **`npm test` green; no per-building constants** — DONE: 1849/1849. New code is
   subject-agnostic (fixture inputs are data; recognition pins iterate committed records).

## Test coverage and gaps

- 13 new tests (8 fixtures + 5 guards) + ported suites. The bridge spawn costs ~1-2 s per test
  file (batched).
- **Gap (inherited):** the live `ask` paths (claude -p) are not exercised by `npm test` — by
  design (metered); covered by committed ledgers + offline re-verification.
- **Gap:** `bamlRender` image-block extraction is pinned for count/order, not pixel content
  (text-byte identity is the contract; images pass through base64-unchanged by construction).

## Open concerns for a human reviewer

1. **SAP leniency on all-array classes (the one real finding):** any malformed
   `DecomposeBrushBacklog` reply parses as the EMPTY backlog — pinned in FX-D1 and documented
   in `decompose.baml`. **T-131's reply gate must treat the empty union as MALFORMED**, or a
   refusing model would silently produce an empty backlog.
2. `WorkshopAdjustParams.spec_params @alias("params")` — wire format unchanged, but TS-side
   consumers of `b.parse` output see `spec_params`. Live path unaffected (`parseAction` is the
   gate).
3. The mint runner re-implements the bounded same-prompt loop locally (judge-reply is frozen
   surface and its `classifyReply` is sync; the bridge parse is async). If a third caller needs
   async-parse reply policy, promote a shared async variant in a non-judge module — deliberately
   not done here.
4. The critique golden pins ONE input shape (failing check + rolled-back last round). Round
   variants are covered by `critiqueRenderArgs` unit pins; a second golden (no-lastRound) would
   tighten the A/B at the cost of another fixture — judged unnecessary since the template's only
   conditionals live in the `.mjs`-serialized params.
5. `pretest` adds ~1.5 s codegen to every `npm test`; on a clone without network the
   `@boundaryml/baml` native binary must already be installed (it is a normal dependency).
