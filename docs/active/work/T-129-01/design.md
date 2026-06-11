# T-129-01 baml-design-functions — Design

Phase: Design. Decisions with rationale, grounded in research.md.

## D1. Transport: facade-era adapter pattern (BAML renders/parses, sdk-binding transports)

**Decision.** BAML is the schema/prompt/test authority; execution goes through the existing
`src/sdk-binding.mjs` subscription shim. Concretely: `b.request.Fn(...)` renders the request
(under a render-only dummy `ANTHROPIC_API_KEY`, deleted immediately after — the exact
`src/revise/baml-revise.mts:29-33` precedent), the rendered text + image blocks are extracted,
the runner sends them via `requestTextWithImage`/`runTieredOp`, and `b.parse.Fn(text)` is the
typed parser (exercised on pinned fixtures; live gates below). **No BAML client is ever invoked.**

**Rejected: BAML-native transport via a local shim proxy.** It would require a localhost HTTP
server impersonating the Anthropic messages API and forwarding to `claude -p`: (a) it puts
key-shaped config (`base_url` + a dummy key) on the live path — exactly the surface AC2 forbids;
(b) it duplicates retry/usage/stream handling that `runReplyPolicy` + sdk-binding already own,
and BAML's internal retries would fight the T-114 same-prompt ledger policy; (c) the facade era
already proved the adapter pattern in eight bridges; reviving the proven thing is the ticket's
premise. The decision + proof (live fixture-mint ledgers through the shim, env grep, source
guard) are recorded per AC2.

## D2. Authority split (what BAML owns vs what stays .mjs)

| Layer | Owner | Why |
| --- | --- | --- |
| Prompt prose/skeleton | `.baml` templates | "Design once" — the ticket's point |
| Data→string digests (`packDigest`, `sketchDigest`, palette/checks formatting) | `.mjs` serializers | Pure data formatting over live JS objects; BAML receives them as typed string params (facade-era `design_doc` precedent) |
| Output schema (typed classes) | `.baml` classes | Reviewable, fixture-tested via `b.parse` |
| Live reply gates | existing `.mjs` (`parseProgramReply` AJV+pack gate, `parseWorkshopReply`+`parseAction`) | Data-dependent cross-field validation (pack vocabulary, action grounding against the current program) that a static type system cannot express; keeping them preserves the MALFORMED classification behavior byte-for-byte |
| Transport, reply policy, ledger, pins | existing `.mjs` | Untouched (T-114/T-119 machinery) |

**Rejected: `b.parse` on the live path.** It is strictly weaker than the pack-vocabulary gates,
and swapping the parser changes which replies classify MALFORMED — a behavior change AC4 forbids.
`b.parse` instead runs in fixture tests over committed raw replies, proving the BAML schema
matches reality (and stays matching as prompts evolve).

## D3. One generic bridge, not per-function bridges

A single `src/baml/bridge.mts` (spawned via `npx tsx`, JSON stdin→stdout) with a dispatch table
over the four functions and two modes: `render` (args → `{prompt, images[]}` extracted from the
BAML-rendered request — the rendered request is the single source of truth for text AND image
order) and `parse` (raw text → typed JSON via `b.parse`). A thin `.mjs` wrapper
(`src/baml/bridge.mjs`) owns the spawn. **Rejected:** the facade-era one-`.mts`-per-function
layout — it copy-pasted the same 5-step dance eight times; industrializing that duplication is
what E-32 is about. Cost: one tsx spawn (~1-2s) per render/parse — negligible against a model
call; the workshop pays one render per round (6 rounds).

## D4. The four functions

All on client `ClaudeStub` (unchanged). New files, one per function — `judge.baml` and the other
facade-era files are **not touched**.

1. **`RecognizeBuildingProgram(pack_digest: string, sketch_digest: string, schema_json: string,
   concept: image, sketch_sheet: image) -> BuildingProgram`** (`baml_src/recognition.baml`).
   Template reproduces `buildRecognitionPrompt` **byte-identically** (skeleton prose moves into
   the template; digests/schema arrive pre-serialized). Proof: rendered-prompt sha256 ==
   committed `promptSha256` in `recognition/{cottage,barn}.replies.json` (fixture test).
   `BuildingProgram` classes mirror `schema/building-program.schema.json` (masses, walls, roof,
   openings, …); the AJV schema stays the live gate — the embedded `schema_json` param keeps the
   prompt's schema text identical to today's.
2. **`CritiqueWorkshopRound(round: int, budget: int, image_list: string, program_json: string,
   palette_block: string, conformance_block: string, last_round_note: string,
   live_actions: string, max_issues: int, concept: image, renders: image[]) -> WorkshopReply`**
   (`baml_src/critique.baml`). Template reproduces `buildWorkshopPrompt` output byte-identically
   for identical inputs (proven by an A/B golden test at migration, then content-pins keep it
   honest). `WorkshopReply` types the envelope strictly (issues[], severity enum, decision enum,
   rationale); `action` is typed as the three-variant union with `params` as a map — **the exact
   map value type is codegen-verified at implement time** (research §7.6); if BAML cannot express
   the open param values, `action` falls back to a permissive class and the note is recorded —
   harmless because `parseAction` is the live gate either way.
3. **`AuthorMaterialStory(theme_brief: string) -> MaterialStory`** (`baml_src/vernacular.baml`).
   `MaterialStory`: `style_name`, `setting` (one line, pack-`provenance.setting`-shaped),
   `geology`, `timber`, `wealth_class`, `roofing_economy`, `trade` (each a short paragraph
   grounding what the place affords), `available_materials[]` ({material, source, abundance,
   typical_use} — the hooks T-130's palette derivation will cite). Prompt teaches diegetic
   reasoning (E-32 Rule 4 vocabulary, MATERIAL_PRECEDENCE taught not hard-coded).
4. **`DecomposeBrushBacklog(style_summary: string, registry_state: string) -> BrushBacklog`**
   (`baml_src/decompose.baml`). `BrushBacklog`: `items[]` ({name, purpose, parameter_sketch,
   composition_notes, test_plan, preview_subject, context, acceptance_criteria[]} — the T-131
   draft-quality contract) and `parametrization_notes[]` ({need, existing_brush, note}) — the
   schema *forces* the duplicate-vs-registry distinction T-131 must unit-test. Prompt teaches:
   a need an owned brush covers (registry_state lists each brush with its parameters) becomes a
   note, never an item.

## D5. Workshop prompt construction moves across the exchange seam

`runWorkshopLoop` currently builds the prompt in the pure core (loop.mjs:102). Async bridge
rendering cannot live there (ISO4 purity). **Decision:** the loop passes structured round
context to `exchange` — `{round, budget, renders, program, conformance, lastRound, liveActions,
azimuths}` (everything `buildWorkshopPrompt` consumed) — and the runner's exchange closure
renders the prompt (bridge) before asking. Ledger shape is unchanged (prompts were never
recorded). `critique.mjs` keeps parser + constants; `buildWorkshopPrompt` is retired.
**Rejected:** an injected `promptFor` seam defaulting to the legacy builder — it keeps the
prompt prose alive in `.mjs` as a second source of truth, which is the disease this ticket cures.
Test impact (ported, not weakened): loop.test.mjs synthetic exchanges read ctx instead of
`prompt`; critique.test.mjs B-group content pins re-target one cached bridge render.

## D6. Recognition runner migration

`recognize.mjs` swaps `buildRecognitionPrompt` for one bridge render at the top of `runLive`
(prompt + both image blocks come from the rendered request); everything downstream — sha, ledger,
reply policy, AJV+pack parse, records, `--offline` — is untouched. `prompt.mjs` keeps
digests + `stripReplyToJson` + `parseProgramReply`; the skeleton constant is retired.

## D7. Fixtures & tests (the "pinned fixtures" AC)

- `src/baml/fixtures/` (committed): per-function `{inputs.json, reply.txt, expected.json}`.
  Sources: **recognition** — committed `rawTexts[0]`-style accepted replies + committed
  `promptSha256` (cottage, barn; no new spend); **critique** — the canonical
  revise/done replies already pinned in critique.test.mjs (synthetic, parse-true);
  **vernacular & decompose** — live-minted once via the adapter (the transport proof), raw
  replies + usage committed in T-114 ledger shape under `src/baml/fixtures/`.
- `src/baml/fixtures.test.mjs` (under the `npm test` glob): spawns the bridge harness once,
  asserts (1) render byte-identity/sha pins per function, (2) `b.parse` over every committed
  reply deep-equals `expected.json`, (3) parse rejects a malformed specimen per function.
- `src/baml/transport-guard.test.mjs`: greps `bridge.mts` for the dummy-key
  render-only guard and the absence of any actual BAML call (`b.<Fn>(`), greps the repo for
  metered-key reads outside `clients.baml`/the guard; **judge isolation**: asserts the judge
  path (`src/form/multi-angle-gate.mjs`, `src/form/judge-reply.mjs`, `src/form/resemblance.mjs`,
  `benchmarks/sculpture/multi-angle-gate.mjs`) contains no baml token (AC3's test).
- **Codegen wiring:** `"pretest": "npm run baml:gen"` — every `npm test` regenerates
  `baml_client/` (gitignored, never hand-edited), satisfying "wired into the build" and making
  fixture tests self-sufficient on a fresh clone.
- **Rejected: `baml-cli test` / BAML test blocks as the test vehicle.** BAML-native tests execute
  through the configured client — the metered-key path AC2 forbids. Test blocks may be added
  later as documentation only; the executable fixtures live in node tests on the shim side.

## D8. Live spend & verification plan

Live calls in this ticket: **two** (mint vernacular + decompose fixtures), strong tier through
the shim, pin-guard preflight before spend, ledgered. Recognition/workshop migrate with **zero**
live calls: `npm run recognize:offline` (byte-identical artifact), `npm run workshop:replay` +
`workshop:offline` (byte-identical replay), the prompt-sha fixture test (recognition), and the
A/B golden test (critique) constitute the AC4 re-verification; grep of the migrated runners for
retired prompt prose is recorded in the review.

## D9. Concurrency posture

T-127-01 is concurrently editing `benchmarks/sculpture/workshop.mjs` (dirty at research time).
Mitigation: sequence the workshop-runner edit last; re-read the file immediately before editing;
stage commits per-file and never include sibling hunks; if the file is still mid-flight when the
step arrives, land loop/critique/bridge first (they are sibling-untouched) and apply the runner
delta as the final commit.
