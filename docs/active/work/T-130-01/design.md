# T-130-01 style-formation — Design

Phase: Design. Options weighed against the research map; decisions with rationale.

## D1 — Chain shape: two new BAML functions, two reused

**Decision:** the formation chain is four typed calls plus pure assembly:

1. `AuthorMaterialStory` (exists, T-129) — theme brief → `MaterialStory`.
2. **`DerivePalette` (new)** — story digest + provenance-source keys + block-vocabulary
   digest → `{roles[], decoration[]}` with per-role rationale and `provenance` citations.
3. **`DeriveProportions` (new)** — story digest + palette digest → `{storeyHeight,
   pitchClasses, openingRhythm}`.
4. `DecomposeBrushBacklog` (exists, T-129) — assembled style summary + `registryDigest()` →
   brush-needs (`items` = missing, `parametrization_notes` = owned).
5. Pure assembly (no model): pack JSON from stages 1–4 — provenance sources slugged from
   `available_materials`, valueCheck stamped from the committed block-Lab table, idioms from
   the needs stage's owned brushes with purely-seeded params, conformance = the standard
   check vocabulary.

**Rejected — one mega-function** (brief → whole pack): unpinnable stages, one malformed reply
re-asks everything, and the AC names the stages separately ("palette derivation → proportion
rules → brush-needs"). **Rejected — three+ new functions** (separate idiom-selection call):
idiom selection falls out of the needs stage (owned brushes) for free; another live call buys
nothing. **Rejected — asking the model for conformance checks:** the vocabulary is closed
(`CONFORMANCE_CHECK_NAMES`); formation defaults to the full standard set, same as rustic.

## D2 — Palette derivation: language-space choice, deterministic value stamping

The model picks **named blocks** (recognize-blocks-don't-color-match), constrained by a
vocabulary digest supplied in the prompt: the 305 table cubes grouped by `familyOf` family
(with L* so darkness is knowable — concept-image-≠-value-preview), plus the non-cube
vocabulary (`loadBlockVocab`). The runner then stamps `valueCheck` **deterministically** with
the exact derivation `validateStylePack` re-checks (`derivedFormClass`, inTable, `familyOf`,
table Lab) — authoring-time and validation-time can never disagree.

T-086 tooling at ratification time: beyond the snapshot, the draft record carries a
**near-tone separation report** — `weightedDeltaE` (w=2) between same-family role pairs
(the rustic near-tone pair cobble/stone_bricks is the precedent) — evidence for the
ratifier, not a gate (reproducibility-excludes-GL: deterministic table arithmetic only).

**Post-parse gates (each taught in the prompt — same-prompt-seam rule: the prompt teaches
what the gate enforces):** every block ∈ vocabulary; provenance keys ⊆ the supplied source
keys; ≥1 role; each declared band has exactly one dominant. Violation ⇒ MALFORMED ⇒ bounded
same-prompt re-ask (T-114 semantics). For `DecomposeBrushBacklog`, the consuming gate
classifies the **empty union as MALFORMED** — discharging T-129 review concern #1 here, as
that review demanded of the next consumer.

**Rejected — optical derivation** (sampling any image): forbidden by construction (Rule 4);
the chain has no image input anywhere, which is what makes AC3 provable by grep + isolation
test. **Rejected — letting the model invent provenance source keys:** keys are derived
mechanically (slug of each `available_materials.material`) before the palette call, so
citations are checkable and referential integrity holds by construction.

## D3 — Ratification: draft schema tag + ratify script + optional `ratification` field

**Decision:** three mechanisms compose the gate:

1. **Drafts are structurally not packs.** The chain emits `packs/drafts/<style>/draft.json`
   with `"schema": "style-pack/draft-v1"`. `parseStylePack`'s `const` check rejects it, so a
   draft cannot be loaded, registered, or built from by any existing code path — the gate is
   honored by construction, not by convention.
2. **`scripts/ratify-pack.mjs`** (`npm run style:ratify -- --style <s> --by <who>`): reads
   the draft, swaps the tag to `style-pack/v1`, stamps `ratification: {by, date}`, runs
   `assertStylePack` + `validateStylePack` (fail-loud), and pin-guard-writes
   `packs/<style>.json`. Ratifying twice without `--rotate-pins` is refused (T-119).
3. **Schema extension:** optional top-level `ratification {by, date, note?}` added to
   `style-pack.schema.json` (additive; `rustic` stays valid without it). Inside `provenance`
   was rejected — provenance is the material story, not process metadata.

**Who ratifies here:** Rule 4's taste step is the human's. This autonomous run records
honestly: the new style's pack is ratified `--by` the T-130-01 run under explicit ticket
sanction ("ratified, committed" is an AC), with a `note` marking it **provisional pending a
human taste pass** — flagged in review.md. The flow for future styles (human reads the draft
record — story, palette rationale, value evidence — then runs ratify) is documented in the
draft record's README. Rejected — leaving AC5 unmet awaiting a live human: the ticket text
is the explicit user direction (the Rule-3 planner precedent).

## D4 — The new style: saltcrag, seeded from the committed story

**Decision:** the genuinely new style is **`saltcrag`** ("a fishing village on a cold
coast" — the epic's headline brief). Stage 1 **replays** from the committed T-129 vernacular
fixture (raws already committed; deterministic per E-31 Rule 5 — and the brief is recorded
in `fixtures/vernacular/inputs.json`). Stages 2–4 are minted live (3 strong-tier calls).

Rejected — minting a fresh brief: spends a strong call to re-derive a story we already own,
and forks the epic's named example. Rejected — reusing the committed decompose fixture for
saltcrag: its inputs were rustic's summary; saltcrag's needs stage must see saltcrag's
summary.

## D5 — Rustic re-derivation fixture: same setting in, closeness measured, never ratified

**Decision:** run the full chain live with the theme brief = a one-paragraph yeoman-farmstead
brief derived from `rustic`'s `provenance.setting` (recorded in the run's `inputs.json`;
contains **no block names** — craft/color split: the brief grounds place, never palette).
The draft lands in `packs/drafts/` like any other and is **never ratified** (rustic stays
the curated pack of record).

**Comparison = pure function + committed record** (`comparePacks(derived, curated)`):
- role alignment by exact role name, then by zone `(band, tier)` for the rest; leftovers
  named as missing/extra;
- per aligned role: block verdict `same-block | same-family | different` (familyOf), Lab
  distance (`weightedDeltaE` + true ΔE76 reported separately — value-drift-is-hue);
- proportions deltas; idiom set intersection/difference; provenance-citation coverage.
Divergences are NAMED in `comparison.json` + a human-readable section in the draft README —
closeness is evidence of chain quality, not a gate (the chain isn't graded by the frozen
instrument; this is workshop-mode measurement).

Rejected — fuzzy role matching beyond band/tier (e.g. Lab-nearest): mean-color-style
collapse risk; unmatched roles are more honest as named divergences.

## D6 — Runner shape: pure half in `src/pack/formation.mjs`, impure runner in `scripts/`

The repo idiom (value-select, brush-catalog, mint): pure logic + tests under `src/`, impure
orchestration in a script.

- **`src/pack/formation.mjs` (pure):** vocabulary digest, story→sources slugging, stage
  post-parse gates (classification only — no transport), pack assembly, valueCheck stamping,
  idiom param seeding (the mechanical subset: `roof.*` field/stairs/slab from roof roles,
  `plinth`/`arch`/`head.flat` from `wall.dressing`, `chimney` from chimney roles; the rest
  param-less — `params` is optional in the schema, and partial seeding is recorded in the
  draft README), near-tone report, `comparePacks`, draft/record serialization.
- **`scripts/form-style.mjs` (impure):** `--brief <file|string> | --story-fixture vernacular`
  selection, bridge render → `requestText` (MODEL_TIERS.strong) → bridge parse with the
  bounded re-ask loop, `--offline` replay (re-render prompts, assert sha256 vs ledger;
  re-parse committed raws, assert pack byte-identical), pin-guarded writes.
- **`scripts/ratify-pack.mjs` (impure):** D3.
- The bounded async-parse re-ask loop is **promoted to `src/baml/ask.mjs`** (`askParsed`) —
  the shared non-judge variant T-129 review #3 anticipated; budget from
  `MAX_REPLY_ATTEMPTS`, per-attempt ledger entries, full raws, post-parse gate hook.
  `scripts/mint-baml-fixture.mjs` is NOT refactored onto it (committed minter; churn without
  re-mint risks silent drift — noted for a cleanup ticket).

Record layout per run: `packs/drafts/<style>/{draft.json, README.md, comparison.json?}` +
`stages/<fn>/{inputs.json, prompt.txt, reply.txt, expected.json, ledger.json}` (the T-114/
mint fixture shape, one dir per stage). Raw replies committed in full.

## D7 — Provability of no-optics + precedence (AC3)

- Formation never takes an image/GLB input: no stage has an `images` arg, and the modules
  import nothing from `src/form/glb*`, `src/view`, TRELLIS, or texture paths. Pinned by an
  **isolation test** (the `isolation.test.mjs` pattern): formation module + runner sources
  must not match `/glb|trellis|texture|\.png|images:/` import/usage patterns; grep output
  also recorded in progress.md (generalization-grep memory: match imports, not comments).
- Precedence by construction: formation authors only the middle tier (`pack-assignment`)
  and the story (`vernacular-default` territory); concept evidence is not an input, so the
  chain *cannot* override it — asserted in prose + the existing `MATERIAL_PRECEDENCE`
  contract untouched.

## D8 — Test strategy (summary; Plan details)

- Pure unit tests for every formation.mjs surface (vocab digest, gates incl. empty-decompose
  = malformed, assembly, stamping, param seeding, comparePacks) — table/fixture injected.
- Replay pins: committed saltcrag + rustic-rederive stage records re-render byte-identical
  prompts and re-parse to the committed draft (the fixtures.test.mjs batched-bridge pattern;
  one spawn per file).
- Schema: ratification-field round-trip (rustic without it stays valid; a stamped pack
  validates; a draft-tagged file is rejected by `parseStylePack`).
- Transport-guard: extend the allowed-importer pins to the two new scripts + ask.mjs;
  metered-key ban unchanged.
- Live spends: ~7 strong-tier calls (4 rustic-rederive + 3 saltcrag), each pin-guarded with
  `preflightPins` before spend.
