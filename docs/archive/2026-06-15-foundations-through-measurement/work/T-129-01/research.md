# T-129-01 baml-design-functions — Research

Phase: Research. Descriptive only. Sources: repo at HEAD `7c648a6` (2026-06-11), four parallel
codebase sweeps + direct reads of the seam files.

## 1. The facade-era BAML infrastructure (what we are reviving)

- `baml_src/` (9 files): `clients.baml`, `generators.baml`, and seven function files
  (`conceptart`, `facade`, `judge`, `review`, `revise`, `materialcorrect`, `materialmap`).
  All functions use the single client **`ClaudeStub`** (`clients.baml:2-10`): provider
  `anthropic`, model `claude-opus-4-8`, `api_key env.ANTHROPIC_API_KEY`, max_tokens 32000.
- **ClaudeStub is never called.** The file's own comment states the convention: BAML renders
  requests (`b.request.Fn(...)`), the harness extracts the rendered text/image blocks, transport
  rides `claude -p` (subscription), and `b.parse.Fn(text)` validates the reply. The env key is a
  render-only dummy: bridges set `ANTHROPIC_API_KEY="baml-render-only"` if absent, render, then
  delete it (e.g. `src/revise/baml-revise.mts:29-33`).
- **Bridges** are `.mts` files spawned from pure `.mjs` runners via `spawn("npx", ["tsx", …])`
  with JSON on stdout: `benchmarks/temple-facade/baml-build.mts`, `baml-judge.mts`,
  `baml-concept.mts`; `src/sculptor/baml-review.mts`; `src/revise/baml-revise.mts`,
  `baml-material-correct.mts`; `src/form/baml-material-map.mts`;
  `benchmarks/sculpture/baml-concept.mts`. Each repeats the same 5 steps: dummy-key render →
  extract text (+image) blocks from `req.body.json().messages` → `requestTextWithImage(...)`
  (sdk-binding) → fence-strip + `b.parse.Fn(...)` → JSON to stdout.
- **Codegen:** `generators.baml` emits TypeScript to repo root → `baml_client/` (14 files),
  **gitignored** (`.gitignore:13`), regenerated via `npm run baml:gen`
  (`baml-cli generate --from baml_src`). `@boundaryml/baml@^0.222.0` is a runtime dependency;
  `tsx` a devDependency. Generated version pin `0.222.0` (`generators.baml:4`).
- **No test blocks** exist in any `.baml` file; live BAML calls are not exercised by `npm test`.
  `npm test` = artifact self-test + `node --test "src/**/*.test.mjs"` (note: glob covers `src/`
  only, not `benchmarks/`).

## 2. Seam (a) to migrate — T-125-01 idiom recognition

- Runner `benchmarks/sculpture/recognize.mjs`. Live path (`runLive`, lines 115-205):
  - Prompt: `buildRecognitionPrompt({pack, sketch})` (`src/recognition/prompt.mjs:88-130`) —
    deterministic join of: a fixed skeleton (task framing, layout rules, output-format directive),
    `packDigest(pack)` (`prompt.mjs:60-80`), `sketchDigest(sketch)` (`prompt.mjs:39-57`), and
    `JSON.stringify(loadProgramSchema(), null, 2)` embedded verbatim.
  - Transport: `requestTextWithImage({prompt, images:[concept, sketch-sheet], model})`
    (`recognize.mjs:134-141`), model `MODEL_TIERS.strong` = `claude-opus-4-8` (`src/config.mjs`).
  - Parse: `parseProgramReply(text, {pack})` (`prompt.mjs:139-150`): `stripReplyToJson` →
    `assertBuildingProgram` (AJV, `schema/building-program.schema.json`) →
    `validateProgramAgainstPack` (data-dependent pack-vocabulary gate). Any throw = MALFORMED.
  - Reply policy: `runReplyPolicy(ask, {parse, maxAttempts: PROGRAM_REPLY_BUDGET=3})`
    (`src/form/judge-reply.mjs`) — same-prompt bounded re-asks, T-114 ledger.
  - Records (pin-guarded, committed): `benchmarks/sculpture/recognition/{key}.{program.json,
    replies.json, prompt.md, artifact.json, record.json, md}`. `replies.json` carries
    **`promptSha256`** and **full `rawTexts[]`** — committed fixtures already exist for cottage
    (accepted attempt 1) and barn (accepted attempt 3 after 2 malformed).
  - `--offline` (lines 207-226): committed program → compile → realize → **byte-compare** vs
    committed artifact + conformance re-run. The prompt is **not** rebuilt offline.

## 3. Seam (b) to migrate — T-126-01 workshop critique

- Prompt: `buildWorkshopPrompt(...)` (`src/workshop/critique.mjs:39-86`) — per-round template
  interpolating image list (concept + 4 azimuth renders), current program elements JSON, pack
  palette/decoration, conformance checks, last-round outcome, live actions, round/budget.
- **Construction site is the loop core**: `runWorkshopLoop` calls `buildWorkshopPrompt`
  synchronously each round (`src/workshop/loop.mjs:102-104`) and hands `{prompt, round, renders,
  program}` to the injected `exchange` seam. Loop core is pure by contract — `isolation.test.mjs`
  ISO4 pins that loop/program/actions/critique/replay never import sdk-binding/model-tier/render.
- Runner `benchmarks/sculpture/workshop.mjs` (`runLive`, exchange closure lines 181-195): images
  = `[concept, ...renders]`; ask via `runTieredOp({tier:"strong", prompt, images})`
  (`src/model-tier.mjs`, OP_ROUTING `workshop-critique`); parse via
  `parseWorkshopReply(text, {program, pack})` (`critique.mjs:107-142`, strict envelope +
  `parseAction` grounding against program+pack); `runReplyPolicy` maxAttempts 3.
- Ledger `benchmarks/sculpture/workshop/{key}.json` stores per-round `replies[]` with **clipped**
  raws (≤400 chars, `RAW_REPLY_CLIP`); no prompt text/sha is committed. `--replay`/`--offline`
  re-apply recorded actions and re-derive conformance — **prompts are never rebuilt** in either
  mode, so prompt provenance is not pinned by committed workshop records.
- Tests: 62+ across `program/actions/critique/loop/replay/seed/isolation.test.mjs`. The
  critique B-group pins prompt content (round/budget, image order, palette, conformance,
  contract text, determinism) against `buildWorkshopPrompt` directly.
- **Concurrency note:** `benchmarks/sculpture/workshop.mjs` is dirty in the working tree right
  now — T-127-01 (sibling session, in flight) is extending SUBJECTS/registry derivation and
  added `src/workshop/seed.mjs`. T-129 edits to the runner must be staged file-hunk-carefully
  and sequenced late.

## 4. Seams (c) and (d) — new functions, consumer contracts

- **Vernacular reasoning** (consumed by T-130-01 style-formation): theme brief → **material
  story** covering geology, timber, wealth class, roofing economy, trade (E-32 Rule 4; epic
  Background §2). Downstream chain (T-130, out of scope here) derives palette with per-role
  rationale **citing the story**, proportions, brush needs, emitting a T-124-contract style pack
  (`packs/rustic.json`, `src/pack/style-pack.mjs`; pack `provenance.setting` exists today).
  Precedence vocabulary: `MATERIAL_PRECEDENCE` (concept evidence > pack > vernacular default).
- **Concept decomposition** (consumed by T-131-01 design-backlog-factory): formed style +
  **current registry state** (T-128: `src/pack/idiom-registry.mjs` — 19 brushes, every entry
  carrying brush-contract metadata; `src/pack/brush-catalog.mjs` renders the catalog) → brush
  work-item **drafts**: name + purpose, parameter schema sketch, composition notes, test plan,
  preview subject, Context/AC skeleton; a need already covered by an owned brush must surface as
  a *parametrization note*, not a work item (T-131 AC3). Drafts land outside lisa's scan dirs
  (Rule 3) — the *runner* is T-131's; T-129 ships only the typed function.

## 5. The frozen judge path (must not change)

- Live judge = `src/form/multi-angle-gate.mjs` (fixed `buildMultiAngleViewPrompt`,
  `parseMultiAngleVerdict`, `aggregateMultiAngle`, `gateInstrumentDiff`) +
  `src/form/judge-reply.mjs` + `src/form/resemblance.mjs` (verdict/gap vocabulary) + runner
  `benchmarks/sculpture/multi-angle-gate.mjs`. **Zero BAML imports today** (grep confirms).
  `baml_src/judge.baml` is a facade-era artifact nothing live imports; the instrument's prompt
  lives in `.mjs`, not BAML. E-32 Rule 2: not migrated, no prompt change.
- Existing isolation precedents to extend: `src/workshop/isolation.test.mjs` (source-token
  greps), pin-guard domain refusal, model-tier source-guard (no metered key reads).

## 6. Transport & ledger machinery (reused as-is)

- `src/sdk-binding.mjs`: `requestText` / `requestTextWithImage` spawn
  `claude -p --output-format stream-json --verbose [--input-format stream-json] [--model …]`;
  `toImageBlock`/`buildImageTurn` shape content as `[text_block, ...image_blocks]` (text first,
  images after — block order matters for byte-faithful migration). No API key in this path
  (`src/config.mjs:29-31` forbids it).
- T-114 ledger: `runReplyPolicy` (`src/form/judge-reply.mjs:100-153`) — per-attempt
  `{attempt, parsed, rawReply(≤400), parseError?, transport?, usage, source}`; recognition
  additionally commits full `rawTexts[]`. Pin-guard (`src/form/pin-guard.mjs`):
  `preflightPins` before any spend; `guardedWriteRecord` on every record write; rotation only
  via `--rotate-pins` in an owning ticket (T-119).

## 7. Constraints and assumptions surfaced

1. **Hard constraint (AC2):** no metered API keys anywhere in BAML config or env at call time.
   The facade-era render-only dummy-key pattern is the in-repo precedent; `clients.baml`'s
   `env.ANTHROPIC_API_KEY` reference is render-scaffolding, never transported.
2. **Behavior preservation is checkable to the byte for recognition** (committed `promptSha256`
   per subject) but only to content-pins for workshop (no committed prompt sha).
3. `--offline`/`--replay` for both runners never rebuild prompts → prompt-layer migration cannot
   break committed-record re-verification *by construction*; it must be proven anyway (AC4).
4. `npm test` glob is `src/**/*.test.mjs` — new BAML fixture tests must live under `src/` to be
   collected; anything needing the generated client needs `baml_client/` present (gitignored →
   codegen must be wired into the test path).
5. The loop core's purity contract (ISO4) conflicts with async prompt rendering inside
   `runWorkshopLoop` — prompt construction must move across a seam if BAML renders it.
6. BAML's type system has no `any`: `adjust-params.params` is an open map whose values are
   ints/strings/arrays today (`applyParamAdjust` merges arbitrary spec keys) — exact BAML typing
   of the critique `action` union needs a codegen-verified decision.
7. Live calls in this ticket: only fixture-minting for the two new functions (recognition and
   critique already have committed raw replies usable as fixtures). Subscription shim, strong
   tier, T-114 ledger, pin-guard preflight before spend.
8. Sibling-session contention on `benchmarks/sculpture/workshop.mjs` (T-127-01 in flight; file
   dirty at research time). `docs/active/work/T-127-01/` exists; no T-129 work existed before
   this session.
