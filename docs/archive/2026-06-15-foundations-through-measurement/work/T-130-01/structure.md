# T-130-01 style-formation — Structure

Phase: Structure. Files, boundaries, interfaces, ordering. Design decisions D1–D8 govern.

## Created

### 1. `baml_src/formation.baml` — the two new typed functions (D1)

ClaudeStub client (render-only), `ctx.output_format`, header comments in the house style
(ticket/epic, diegetic rule, transport note, leniency notes).

```baml
class PaletteRoleChoice {
  role string            // lowercase dotted, e.g. wall.field.ground
  block string           // a name from the supplied block vocabulary, bare id
  rationale string       // must read from the material story
  provenance string[]    // keys from the supplied source-key list
  band string?           // zone seat (optional, with tier)
  tier ("dominant" | "preserve")?
}
class DecorationChoice { item string  block string  where string[] }
class PaletteDerivation { roles PaletteRoleChoice[]  decoration DecorationChoice[] }
function DerivePalette(story_digest: string, source_keys: string,
                       block_vocabulary: string) -> PaletteDerivation

class ProportionRules {
  storey_min int   storey_max int
  pitch_classes float[]          // from {0.5, 1, 2} — taught in prompt
  opening_min int  opening_max int
}
function DeriveProportions(story_digest: string, palette_digest: string) -> ProportionRules
```

Prompts teach every post-parse gate (D2): vocabulary membership, citation keys, one dominant
per band, pitch vocabulary, min≤max. PaletteDerivation/ProportionRules leniency notes mirror
decompose's FX-D1 comment (all-array / all-scalar SAP behavior documented).

### 2. `src/baml/ask.mjs` — the shared bounded re-ask helper (D6)

The promoted T-114-shape async loop (T-129 review #3). Transport lives HERE (not the bridge).

```js
export async function askParsed({ fn, prompt, model, classify = null,
                                  maxAttempts = MAX_REPLY_ATTEMPTS, transport = requestText })
// → { expected: object|null, replies: [{attempt, parsed, rawReply(clip), parseError?,
//     gateError?, usage, source:"live"}], rawTexts: string[], askCount }
```

`classify(parsed)` → `{ok:true}|{ok:false, reason}` — a gate failure is MALFORMED (same-prompt
re-ask), mirroring judge-reply semantics without touching the frozen module. `transport`
injectable for tests; default import from `sdk-binding.mjs`.

### 3. `src/pack/formation.mjs` — the pure half (D6)

PURE: committed-file reads only (block table / block vocab via existing loaders, injectable).

```js
export const DRAFT_SCHEMA_TAG = "style-pack/draft-v1";
export const FORMATION_LEDGER_SCHEMA = "style-formation-ledger/v1";
export function blockVocabularyDigest({ table, vocab })        // cube families + L*, non-cube names
export function storyDigest(story)                              // MaterialStory → one-page prose
export function sourcesFromStory(story)                         // → {kebab-key: narrative}; keys slugged
                                                                //   from available_materials[].material
export function paletteDigest(roles)                            // roles → prose for DeriveProportions
export function styleSummaryFromParts({ story, roles, proportions }) // decompose's style_summary input
export function classifyPalette(parsed, { sourceKeys, vocabNames })   // D2 gates → {ok}|{ok:false,reason}
export function classifyProportions(parsed)
export function classifyBacklog(parsed)                         // empty union ⇒ malformed (FX-D1)
export function stampValueChecks(roles, { table })              // + valueCheck (validateStylePack's derivation)
export function seedIdiomParams({ owned, paletteEntries })      // mechanical subset (D6); rest param-less
export function assembleDraftPack({ story, paletteEntries, decoration, proportions, idioms, styleSlug })
                                                                // → draft pack (DRAFT_SCHEMA_TAG)
export function nearToneReport(paletteEntries)                  // same-family pairs: weightedDeltaE + ΔE76
export function comparePacks(derived, curated)                  // D5 alignment + verdicts + deltas
export function draftReadme({ pack, nearTone, needs, comparison }) // human ratification sheet
```

Boundaries: imports ONLY `../color/{block-table,value-select,cielab}.mjs`, `../form/kit.mjs`
(derivedFormClass, loadBlockVocab), `./idiom-registry.mjs`, `./conformance.mjs`,
`./style-pack.mjs`. **No view/GLB/image imports — pinned by the guard test (D7).**

### 4. `scripts/form-style.mjs` — the impure chain runner (D6)

CLI: `--brief "<text>" | --brief-file <p> | --story-replay <fixture>` (mutually exclusive
stage-1 source), `--slug <override>`, `--compare <pack path>`, `--offline`, `--rotate-pins`.

Flow: resolve stage-1 (live mint via askParsed, or replay the committed
`src/baml/fixtures/vernacular/` reply through `bamlParse`) → `preflightPins` for EVERY file
the run writes (before any spend) → stages 2–4 via `bamlRender`+`askParsed`(+classify) →
pure assembly → writes under `packs/drafts/<slug>/`:

```
packs/drafts/<slug>/
  draft.json                 # DRAFT_SCHEMA_TAG — structurally not a pack (D3)
  README.md                  # ratification sheet: story, rationale, value evidence, needs
  ledger.json                # style-formation-ledger/v1: per-stage promptSha256, askCounts,
                             # model, transport note, gate failures
  comparison.json            # only with --compare
  stages/<vernacular|palette|proportions|decompose>/
    inputs.json  prompt.txt  reply.txt  expected.json  ledger.json   # the T-114/mint shape
```

`--offline`: no transport — re-render prompts via bridge (sha256 == stage ledgers), re-parse
committed reply.txt, re-assemble, assert `draft.json` byte-identical; exit nonzero on drift.

### 5. `scripts/ratify-pack.mjs` — the gate's second half (D3)

CLI: `--style <slug> --by "<who>" [--note "<text>"] [--rotate-pins]`. Reads
`packs/drafts/<slug>/draft.json`, swaps tag → `style-pack/v1`, stamps
`ratification {by, date, note?}`, `assertStylePack` + `validateStylePack` fail-loud,
`guardedWriteRecord` → `packs/<slug>.json`. Echoes the draft README's evidence summary so
the ratifier sees what they are signing.

### 6. Tests (new files)

- `src/pack/formation.test.mjs` — pure units: digests, slugging (collision-safe), all three
  classifiers (incl. empty-backlog malformed, unknown citation key, off-vocab block, two
  dominants in a band), stamping vs an injected mini-table, param seeding, assembly →
  `parseStylePack` REJECTS the draft tag, comparePacks verdicts on a synthetic pair.
- `src/baml/ask.test.mjs` — askParsed with injected transport: accepts-on-first, re-asks on
  parse fail / gate fail, exhausts budget → null, ledger entries complete.
- `src/pack/formation-replay.test.mjs` — for each committed `packs/drafts/*/stages/*`: one
  batched bridge spawn re-renders prompts (sha vs ledger) + re-parses replies (== expected);
  re-assembles draft.json byte-identical. Skips cleanly if no drafts committed yet.
- `src/pack/formation-guard.test.mjs` — D7: import-surface regex over formation.mjs,
  form-style.mjs, ratify-pack.mjs, ask.mjs + `baml_src/formation.baml` has no `image`-typed
  input; no `images` arg at any formation `bamlRender` call site.

## Modified

- `schema/style-pack.schema.json` — optional top-level `ratification`:
  `{required: [by, date], additionalProperties: false, properties: {by: string minLength 1,
  date: string format date-time, note: string}}`. Additive; rustic stays valid.
- `src/pack/style-pack.test.mjs` — ratified-pack valid / bad-ratification invalid /
  draft-tag rejected cases.
- `src/baml/transport-guard.test.mjs` — TG5 list gains `formation.baml`; TG2/TG3 untouched
  (ask.mjs holds no key token; no new `.mts`).
- `package.json` — `"style:form": "node scripts/form-style.mjs"`,
  `"style:ratify": "node scripts/ratify-pack.mjs"` (invoke with `--` for flags —
  npm-run-flag-swallowing).

## Committed run artifacts (live spends, pin-guarded)

- `packs/drafts/<rustic-rederived-slug>/` + `comparison.json` (vs `packs/rustic.json`;
  brief = yeoman-farmstead paragraph derived from rustic's setting, no block names, recorded
  in stage-1 inputs.json). Never ratified.
- `packs/drafts/saltcrag/` (stage 1 replayed from the committed vernacular fixture; 2–4 live)
  → ratified → `packs/saltcrag.json` (provisional note, D3).

## Ordering

1. Schema extension + style-pack tests (independent, unblocks ratify).
2. `formation.baml` + `baml:gen` + bridge render smoke (prompts render, schemas parse).
3. `ask.mjs` + tests (pure-injectable; unblocks the runner).
4. `formation.mjs` + tests (the bulk; pure).
5. Runner + ratify scripts + npm scripts + guard tests (wiring).
6. Live: rustic re-derivation (+ comparison committed).
7. Live: saltcrag formation → ratify → `pack:validate` on saltcrag → replay test green.
8. Full `npm test`; grep evidence recorded in progress.md.

Boundary notes: judge-reply, multi-angle-gate, recognition/critique seams, mint script — all
untouched. The bridge stays transport-free; transport concentrates in ask.mjs + sdk-binding.
