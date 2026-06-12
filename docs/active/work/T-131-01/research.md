# T-131-01 design-backlog-factory — Research

Phase: Research. Descriptive map of what exists; no solutions proposed.

## The ticket in one line

Build the conveyor: formed style (T-130) + current brush-registry state (T-128) →
`DecomposeBrushBacklog` (T-129) → self-contained **brush work-item drafts** in
`docs/active/backlog/` — structurally outside lisa's scheduling, with code-level duplicate
detection, a documented human promotion flow, and a live proof with the rework measure recorded.

## What the dependencies delivered (both `phase: done`)

### T-129-01 — the decomposition function (the factory's core)

- `baml_src/decompose.baml`: `DecomposeBrushBacklog(style_summary: string, registry_state: string)
  -> BrushBacklog`. Classes: `BrushWorkItem` {name, purpose, parameter_sketch, composition_notes,
  test_plan, preview_subject, context, acceptance_criteria[]} — exactly the draft-quality-contract
  fields the T-131 AC enumerates — and `ParametrizationNote` {need, existing_brush, note}.
  `BrushBacklog` = {items[], parametrization_notes[]}. The prompt already instructs the
  duplicate-vs-registry distinction (owned brush → note, never a duplicate work item).
- **Transport pattern (decided in T-129 D1, proven live):** BAML is render/parse authority only.
  `src/baml/bridge.mjs` exports `bamlRender({fn,args,images}) → {prompt,images}` and
  `bamlParse({fn,text}) → parsed` (spawns `bridge.mts` per batch; `ClaudeStub` is render-only).
  The caller transports the rendered prompt itself via `requestText` (`src/sdk-binding.mjs`),
  model from `MODEL_TIERS` (`src/config.mjs`) — the subscription shim, never a metered key.
- **The one real T-129 finding (pinned FX-D1, flagged for T-131 by name):** `BrushBacklog` is an
  all-array class, so BAML's SAP parser **never rejects** — any malformed reply degrades to the
  EMPTY backlog. `bamlParse` alone cannot distinguish refusal from emptiness; *the consuming
  runner must classify the empty union (no items AND no notes) as MALFORMED* for the re-ask
  policy.
- **Committed fixture** `src/baml/fixtures/decompose/` {inputs, prompt, reply, expected, ledger}:
  live-minted against `packs/rustic.json` + `registryDigest()` at STRONG tier. The accepted reply
  decomposed rustic into **3 work items** (opening-fill, corner-dressing, buttress) and **18
  parametrization notes** (each naming an owned brush) — the function works end-to-end and the
  registry digest successfully suppresses duplicates at the prompt level.
- `scripts/mint-baml-fixture.mjs` (`npm run baml:mint -- --fn decompose`): the house live-ask
  shape — `preflightPins` **before any spend** (T-119), bounded **same-prompt** re-asks with
  T-114 ledger semantics (every attempt ledgered, full `rawTexts` committed, parsed = final,
  budget `MAX_REPLY_ATTEMPTS = 3`), `guardedWriteRecord` for every record. It also contains
  `packSummary(pack)` — the neutral one-page style-pack digest used as `style_summary` (style +
  setting, palette role→block with rationale, idioms, proportions). Local to the script today.
- **T-129 review concern #3 (explicit invitation):** the bounded same-prompt loop exists twice —
  sync in frozen `src/form/judge-reply.mjs` (`classifyReply` is sync; instrument surface, cannot
  host an async variant) and a local async copy in the mint script. "If a third caller needs
  async-parse reply policy, promote a shared async variant in a non-judge module." T-131's
  runner is that third caller.

### T-128-01 — the registry (the dedup target)

- `src/pack/idiom-registry.mjs`: `BRUSH_REGISTRY` (frozen; aliases `IDIOM_REGISTRY`),
  `brushNames()`, `getBrush(name)`. Every technique enters through this one door (E-32 Rule 1).
  18 brushes registered (matches the fixture's 18 parametrization notes naming them).
- `src/pack/brush-catalog.mjs`: `registryDigest(registry = BRUSH_REGISTRY)` — pure, deterministic
  one-line-per-brush serialization (name, kind, consumes/emits, param names+kinds). Purpose-built
  as decompose's `registry_state` input. Also `brushCatalogMarkdown` (the committed baseline page,
  brush count = factory growth baseline) — context, not a dependency.
- Contract for what a draft must eventually satisfy: `schema/brush.schema.json` +
  `src/pack/brush-contract.mjs` — parametrized (paramsSchema), composable (consumes/emits),
  unit-tested, preview-carded. Draft fields map 1:1 (parameter_sketch / composition_notes /
  test_plan / preview_subject).

## The structural constraint (E-32 Rule 3)

`.lisa.toml` `[dirs]`: `tickets = "docs/active/tickets"`, `stories = "docs/active/stories"`,
`work = "docs/active/work"`. **`docs/active/backlog/` does not exist yet** and is not under any
scan dir. The AC wants a test asserting this from the config, not from convention. No TOML parser
in `package.json` dependencies; `.lisa.toml` is flat key-value (trivially line-parseable).

## House conventions the factory must match

- **Ticket format** (rdspi-workflow.md + live tickets): YAML frontmatter {id, story, title
  (kebab), type, status, priority, phase, depends_on} + `## Context (self-contained)` +
  `## Acceptance Criteria` checkboxes. Drafts are "house ticket style" but must NOT be tickets
  (no id/story/phase that lisa could ever schedule — promotion assigns those).
- **Pure/impure split:** pure logic in `src/<area>/*.mjs` with sibling `*.test.mjs` (picked up by
  `npm run test:unit` glob `src/**/*.test.mjs`); impure runners in `scripts/` (mint precedent) or
  `benchmarks/sculpture/` (chain runners). `npm test` = artifact self-test + unit glob;
  `pretest` runs `baml:gen`.
- **Pin discipline (T-119, structural):** every record-writer preflights all writes before any
  live spend; committed records refuse silent overwrite (`--rotate-pins` + owning ticket to
  rotate). Nine writers already guarded; the factory writes records and drafts.
- **Ledger discipline (T-114):** raw replies committed in full, one ledger entry per attempt,
  parsed = final, transport throws flagged, usage recorded.
- **npm flag swallowing:** `npm run x -- --flag` or direct `node scripts/…` (a dropped flag once
  live-swept pins).
- **Transport guards (TG1–TG5)** pin: no `ANTHROPIC_API_KEY` token in any non-test `.mjs`
  (src/benchmarks/scripts — new files included); `baml_client` importer set frozen (`.mts` only —
  importing `bridge.mjs` from new `.mjs` files is fine); judge path BAML-free (the factory must
  not touch `src/form/judge-reply.mjs` etc.).

## Assumption surfaced: the T-130 input does not exist yet

The live-proof AC says "drafts generated for the T-130 new style's brush-needs", but T-131
`depends_on: [T-128-01, T-129-01]` only — and T-130-01 is at `phase: research` with **no work
dir and no formed style on disk**. The only formed style is `packs/rustic.json` (the fixture's
subject). Whatever the design chooses, the factory cannot be hard-wired to a pack that does not
exist; the gap between "the milestone style" and "what exists today" must be handled explicitly
and recorded, not hidden.

Similarly, "≥1 draft promoted by hand and executed by lisa cleanly" is by the ticket's own
structure a **human** act (the system never schedules its own work) — a session working the
ticket cannot perform the promotion without violating the rule the ticket exists to encode.

## Files that will be relevant

| concern | where |
| --- | --- |
| decompose function + fixture | `baml_src/decompose.baml`, `src/baml/fixtures/decompose/` |
| bridge (render/parse) | `src/baml/bridge.mjs` (`bamlRender`/`bamlParse`) |
| transport | `src/sdk-binding.mjs` `requestText`, `src/config.mjs` `MODEL_TIERS` |
| registry + digest | `src/pack/idiom-registry.mjs`, `src/pack/brush-catalog.mjs` |
| style pack load | `src/pack/style-pack.mjs` `loadStylePack(path)` |
| pack summary (style_summary) | local `packSummary` in `scripts/mint-baml-fixture.mjs` |
| reply policy semantics | `src/form/judge-reply.mjs` (frozen, sync) + mint's local async loop |
| pin guard | `src/form/pin-guard.mjs` (preflightPins, guardedWriteRecord, loadTrackedSet) |
| scan config | `.lisa.toml` `[dirs]` |
| guards to keep green | `src/baml/transport-guard.test.mjs` (TG2 walks scripts/ for the key token) |

## Constraints carried into Design

1. Empty parsed backlog (0 items AND 0 notes) = MALFORMED for the re-ask gate (FX-D1).
2. Duplicate detection must be **code-enforced post-parse**, not just prompt-instructed, and
   unit-tested both ways (owned name → note; new name → work item).
3. Drafts outside scan dirs, asserted by a test that reads `.lisa.toml`.
4. Promotion is documentation + human action; the factory never writes into `docs/active/tickets/`.
5. The rework measure needs a durable recording place (the factory's quality metric).
6. Live runs: preflight before spend, full raws committed, deterministic offline replay
   (E-31 Rule 5: reproducible-by-replay).
