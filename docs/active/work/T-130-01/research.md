# T-130-01 style-formation — Research

Phase: Research. Descriptive map of what exists; no solutions proposed.

## The ticket in one line

Compose the T-129 BAML seams into a named formation chain (theme brief → material story →
palette → proportions → brush needs → E-31 style pack), gate it behind human ratification,
prove no-optics, re-derive `rustic` as the fixture, and form + ratify one genuinely new style.

## What exists (the chain's parts)

### BAML design-function layer (T-129-01, committed)

- `baml_src/vernacular.baml` — `AuthorMaterialStory(theme_brief: string) -> MaterialStory`.
  Output class: `style_name`, `setting` (one line, "pack provenance.setting shaped"), `geology`,
  `timber`, `wealth_class`, `roofing_economy`, `trade`, `available_materials[]` (each
  `{material, source, abundance, typical_use}` — written as citation hooks for the downstream
  palette derivation). Client `ClaudeStub` (render-only).
- `baml_src/decompose.baml` — `DecomposeBrushBacklog(style_summary, registry_state) ->
  BrushBacklog {items: BrushWorkItem[], parametrization_notes: ParametrizationNote[]}`.
  Already encodes the duplicate-vs-registry rule (owned brush ⇒ parametrization_note, never a
  duplicate work item). **PARSE LENIENCY (FX-D1):** all-array classes never reject — any
  malformed reply parses as the empty backlog; the consuming runner must classify the empty
  union as MALFORMED for the re-ask policy.
- **No BAML function exists for palette derivation or for proportion rules.** Those two chain
  stages have no seam yet; `recognition.baml`/`critique.baml` are unrelated to formation, and
  the facade-era files (`conceptart`, `facade`, `generators`, `judge`, `materialmap`,
  `materialcorrect`, `review`, `revise`) are unimported legacy.
- Bridge: `src/baml/bridge.mjs` — `bamlBatch(ops)`, `bamlRender({fn,args,images}) →
  {prompt,images}`, `bamlParse({fn,text}) → parsed`. Spawns `npx tsx src/baml/bridge.mts`
  (the ONE `baml_client` importer; render-only dummy-key guard; never transports).
  Transport-guard tests pin the importer set frozen and ban `baml` tokens from judge files.
- Codegen: `npm run baml:gen` wired as `pretest`; `baml_src/` is source of truth.

### Committed fixtures (T-129-01) — directly reusable inputs

- `src/baml/fixtures/vernacular/` — a COMPLETE live-minted `MaterialStory` for the brief
  "a fishing village on a cold coast": style_name **`saltcrag`**, 9+ available_materials
  (granite fieldstone, beach cobble, dressed stone, limewash, tarred clinker boarding, tarred
  shingle, turf, thatch, imported slate …), full T-114 ledger with raw texts.
- `src/baml/fixtures/decompose/` — live-minted backlog for `style_summary =
  packSummary(rustic)` + `registry_state = registryDigest()`.
- `scripts/mint-baml-fixture.mjs` is the live-call pattern of record: `preflightPins` BEFORE
  any spend (T-119), `bamlRender` → `requestText({prompt, model: MODEL_TIERS.strong})` →
  `bamlParse`, bounded same-prompt re-asks (`MAX_REPLY_ATTEMPTS` from
  `src/form/judge-reply.mjs`), every attempt ledgered with usage, FULL raw texts committed,
  `guardedWriteRecord` for every file. It also contains `packSummary(pack)` — a neutral
  one-page digest of a committed style pack (decompose's `style_summary` input).
- T-129 review concern #3: the bounded async-parse re-ask loop is duplicated locally in the
  mint script because judge-reply's `classifyReply` is sync instrument surface; "if a third
  caller needs async-parse reply policy, promote a shared async variant in a non-judge
  module — deliberately not done here." The formation runner will be that third caller.

### The pack contract (T-124, committed)

- `schema/style-pack.schema.json` — `style-pack/v1`. Required top-level: `schema`, `style`,
  `provenance {setting, sources{kebab-key→narrative}, wealthClass?, roofingEconomy?}`,
  `palette[] {role, block, rationale, provenance[] (keys into sources), zone?, valueCheck}`,
  `idioms[] {name, params?}`, `proportions {storeyHeight, pitchClasses, openingRhythm}`,
  `decoration[]`, `conformance {checks}`. **`additionalProperties: false` everywhere — there
  is NO ratification field today**; recording "who/when ratified" needs either a schema
  extension or a sidecar.
- `src/pack/style-pack.mjs` — `parseStylePack`/`assertStylePack` (Ajv2020 strict),
  `validateStylePack` (semantic: provenance referential integrity; idioms resolve in the
  registry + params validate; **valueCheck snapshot re-derived from the committed block-Lab
  table** — formClass via `derivedFormClass`, inTable, `familyOf`, exact Lab, exclusion list;
  proportions sanity, pitch ∈ {0.5,1,2}; conformance vocabulary; one dominant per band),
  `loadStylePack` (fail-loud), `packPolicy` (the T-113 authority seam), and
  `MATERIAL_PRECEDENCE = ["concept-evidence","pack-assignment","vernacular-default"]` — the
  precedence the ticket must honor by construction.
- `packs/rustic.json` — the human-curated pack and the re-derivation fixture target: 6
  provenance sources, 13 palette roles (7 cube roles with Lab snapshots, fixtures/rail for
  doors/shutters/lattice/roof members), 15 idioms, pitchClasses [1], storeys 3–4,
  door-lantern decoration, 6 conformance checks.
- `npm run pack:validate` → `scripts/validate-pack.mjs packs/rustic.json` (takes a path).

### T-086 value tooling (pure, committed)

- `src/color/block-table.mjs` — `loadBlockTable()` → `{blocks:[{block, texture, rgb, lab,
  var}]}`, 305 full-cube entries; `EXCLUDE_BLOCKS`.
- `src/color/value-select.mjs` — `familyOf(block)` (curated token families: log/planks/stone/
  brick/smooth; null = no family), `isExcludedCandidate`, `familyCandidates(family, table)`,
  `weightedDeltaE(a,b,w=2)` (CHROMA_WEIGHT=2 — the chroma-weighted metric memory says must
  rank, with true ΔE reported separately).
- `src/form/kit.mjs` — `derivedFormClass(block,{cubeSet})` (cube iff in table, rail by name
  regex, else fixture); `loadBlockVocab()` (`src/form/block-vocab.json` — the legal non-cube
  vocabulary).
- `validateStylePack` already re-derives the whole valueCheck snapshot deterministically, so
  authoring-time stamping has a single source of truth to match.

### T-128 brush registry

- `src/pack/idiom-registry.mjs` — `BRUSH_REGISTRY`, 19 brushes: arch, chimney, course.slab,
  course.stairs, dormer, floorplan, head.flat, hollow, jetty, opening-dressing, plinth,
  roof.gable, roof.hip, roof.pyramid, surface.fill, surface.paint, surface.roof-courses,
  surface.strip-salt, timber-frame. The only door (E-32 Rule 1).
- `src/pack/brush-catalog.mjs` — `registryDigest(registry)` — the one-line-per-brush
  serialization built (T-129) precisely as decompose's `registry_state` input.

### Transport & pins

- `src/sdk-binding.mjs` `requestText({prompt, model})` over the `claude -p` subscription shim;
  `MODEL_TIERS` in `src/config.mjs` (mint used `strong`).
- `src/form/pin-guard.mjs` — `preflightPins({pins, rotate, intent})`, `guardedWriteRecord`,
  `loadTrackedSet`, `isTracked`, `ROTATE_FLAG` ("--rotate-pins"). T-119: all nine existing
  pin-writers preflight before spend; rotation only via an owning ticket.

## Governing rules & constraints

- **E-32 Rule 2:** every model call is a typed BAML function; transport on the shim, never
  metered keys; raw replies committed (T-114 ledger shape).
- **E-32 Rule 3:** the factory emits drafts; humans promote. `docs/active/backlog/` is the
  named outside-lisa-scan-dirs location (T-131's landing zone). For THIS ticket the analogous
  gate is the pack draft: emitted as a draft requiring explicit ratification before
  commit/registration; the ratified pack records who/when.
- **E-32 Rule 4:** materials diegetic; ratification once per style; GLB textures never read —
  the chain must be grep-provably texture-free (the pack module's header documents the same
  claim for T-124; this ticket extends it to the formation chain and records the grep).
- **E-31 Rule 5 (inherited):** reproducible-by-replay — replays deterministic from committed
  raws; `npm test` green (1849 tests as of T-129).
- **Lisa scan dirs:** `docs/active/tickets/`, `docs/active/stories/` (CLAUDE.md). Draft packs
  must not land anywhere lisa schedules from.
- Memory pins that bite here: npm run swallows flags without `--`; judge-reply seams get
  bounded same-prompt re-asks, never prompt-mutating retries; value drift is hue not lightness
  (chroma-weighted w=2 within families, true ΔE reported separately); material identity is
  semantic (no mean-color matching).

## Gaps (what does not exist yet)

1. No `DerivePalette`-style or `DeriveProportions`-style BAML functions (the two missing chain
   stages); no decision yet whether they are one function or two.
2. No formation runner (the "named runner" of the AC) and no formation record/ledger layout.
3. No ratification flow: no draft location, no ratify command, no `ratified {by, when}` field
   in the schema (provenance is `additionalProperties: false`).
4. No rustic re-derivation comparison tooling (closeness measure vs the curated pack).
5. No block-vocabulary digest for prompts: a palette-derivation prompt needs the legal cube
   vocabulary (305 names, ideally family-grouped with Lab) and the non-cube vocabulary
   (block-vocab.json) so the model names real, in-table blocks.
6. The shared async-parse re-ask helper (T-129 review #3) — the formation runner is the
   anticipated third caller.

## Assumptions surfaced

- "BAML functions from T-129-01" reads as "the T-129 layer/pattern" — vernacular + decompose
  exist; palette/proportions functions are authored HERE following the same conventions
  (ClaudeStub, ctx.output_format, fixtures minted live, transport in the runner).
- The committed `saltcrag` story is an eligible deterministic seed for the "genuinely new
  style" (same brief as the epic's headline example; raws already committed) — whether to
  reuse it or mint fresh is a Design decision.
- The brush-needs stage can be `DecomposeBrushBacklog` re-used at formation time (its inputs —
  style summary + registryDigest — are exactly what formation has in hand); whether T-130
  records needs only (T-131 owns backlog emission) is a Design decision.
