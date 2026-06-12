# T-132-01 factory-milestone — Research

Descriptive map for the E-32 terminal run: one new style end-to-end (formed pack → backlog →
gap brushes → one building via the E-31 workshop → one frozen-gate run) plus the compounding
receipts. What exists, where, how it connects. No solutions proposed here.

## 1. Dependency state (as of 2026-06-11 ~17:45)

- **T-127-01 (E-31 terminal, done):** the pattern-book chain is live and proven on `cottage`
  and `barn` under `packs/rustic.json`. Barn is the project best: gate same-object **4/4, 8
  gaps all minor, kit presence PASS**, achieved by the seed draft alone; cottage FAILed by
  coverage (occluded upper storey, judge never called). Records:
  `benchmarks/sculpture/pattern-book/{cottage,barn}.{json,md}`, workshop ledgers under
  `benchmarks/sculpture/workshop/`, gate records `multi-angle/{cottage,barn}-patternbook.*`,
  head-to-head `pattern-book/head-to-head.{json,md}`.
- **T-130-01 (style-formation, marked done; live runs IN FLIGHT by a sibling session):** the
  chain code is committed (steps 1–5, `8dfacde` + `69e230c`): `scripts/form-style.mjs`,
  `scripts/ratify-pack.mjs`, `src/pack/formation.mjs`, formation/replay/no-optics guard tests.
  Steps 6–8 (live `rustic-rederived` comparison run, live **saltcrag** formation +
  provisional ratification, review.md) were mid-flight at 17:37 — `packs/drafts/
  rustic-rederived/stages/vernacular/` exists on disk (untracked), no `review.md` yet.
  **`packs/` currently holds only `rustic.json`; no new style is ratified yet.**
- **T-131-01 (design-backlog-factory, done):** `scripts/design-backlog.mjs` live-proven against
  rustic: 4 drafts (`rustic--{dressing.pier,opening.door,roof.fascia,window.lattice}.md`) +
  parametrization notes + records under `docs/active/backlog/`, outside lisa's scan dirs.
  **Open halves T-131 explicitly left for later:** (a) human promotion of ≥1 draft + the
  rework measure (README rework log table); (b) a second run against the T-130 new style —
  "one command: `node scripts/design-backlog.mjs --pack packs/<style>.json`".

The new style is **saltcrag** (granite-coast fishing village): its MaterialStory is the
committed T-129 vernacular fixture (`src/baml/fixtures/vernacular/expected.json`,
`style_name: "saltcrag"`), so formation stage 1 can run spend-free via `--story-replay
vernacular`; T-130's plan step 7 names exactly this.

## 2. The composition path (how a building in a style gets built)

`benchmarks/sculpture/pattern-book.mjs` (359 lines), one command per subject:

1. **Sketch** — committed conditioned sketch `form-sketch/<key>.{json,-sheet.png}` (T-123),
   sha-receipted, never re-derived.
2. **Recognition** — committed model-recognized **building program**
   `recognition/<key>.program.json` (T-125), re-parsed via `parseProgramReply(text, {pack})`,
   re-compiled (`compileProgram(program, pack)`), re-realized, byte-compared to the committed
   draft artifact. **The program is role-space** (palette roles + idiom names) — materials
   enter only at compile time from the pack. This is the recognition+substitution seam: the
   same committed program compiled under a different pack is a building in that style.
3. **Seed** — `seedWorkshopProgram({program, pack})` (src/workshop/seed.mjs): compile under
   the declared budget (`PATTERN_BOOK_BUDGET` = 6 rounds), realize, refuse to spend if pack
   conformance fails. Writes `workshop/<key>/program.json`.
4. **Workshop** — spawned via `workshop.mjs --subject <key>` CLI: budgeted, ledgered model
   revision (adjust-params / paint), conformance-caged; writes `workshop/<key>.json` (ledger)
   and `workshop/<key>/final-artifact.json`.
5. **Plan + record** — `componentPlanFrom(finalProgram)` → `workshop/<key>/component-plan.json`
   (T-106: the gate censuses the roof the chain built); chain record
   `pattern-book/<key>.{json,md}` embeds the generalization self-grep.

**Hardcoded pack:** `pattern-book.mjs:60` `PACK_PATH = join(ROOT, "packs/rustic.json")`;
`workshop.mjs:62,64` `pack: "packs/rustic.json"` (fixture row) and
`workshopSubjectsFrom(REGISTRY, {relDir, packRel: "packs/rustic.json"})`. **All chain output
paths are keyed by subject only** (`workshop/<key>/…`, `pattern-book/<key>.*`) — a second-pack
run of the same subject would collide with the committed rustic records (pin-guard would
refuse, and rotating would destroy the rustic milestone). Path namespacing per pack does not
exist yet.

**Qualifying subjects** (`def.glb && def.generated?.scale`, durable-skin registry): cottage,
gatehouse, church, barn all carry `generated.scale`; committed sketches exist for all four
(`sketch:*` scripts), committed recognition programs exist for **cottage and barn** only
(`recognize:cottage|barn`). Subjects are registry data; runners contain no subject keys
(`isolation.test.mjs` + per-record self-grep assert this).

**Modes:** live (preflights pins before spend), `--repro` (no model/GL: seed byte-compare +
`replayLedger` → byte-identical final), `--offline` (repro + `offlineAssert` ledger bounds),
`--plan-only` (backfill). npm: `patternbook:{cottage,barn,repro,offline}`.

## 3. The factory pieces

- **Brush registry** (`src/pack/idiom-registry.mjs`): **19 brushes** today (11 constructs:
  roof.gable/hip/pyramid, arch, head.flat, course.stairs, course.slab, dormer, chimney, jetty,
  plinth; 8 passes: timber-frame, opening-dressing, hollow, floorplan, surface.fill,
  surface.paint, surface.roof-courses, surface.strip-salt). The **single door**: entries carry
  kind, generate/fn, source, tests, composition {consumes, emits}, paramsSchema (must accept
  `{}`), preview; `validateBrushRegistry()` (brush-contract.mjs) sweeps every entry;
  `brush-door.conformance.test.mjs` fails the build if any pipeline file imports a technique
  module directly. Catalog: `npm run brush:catalog`.
- **Formation** (`scripts/form-style.mjs`): brief → AuthorMaterialStory → DerivePalette →
  DeriveProportions → DecomposeBrushBacklog, all text-only (no-optics pinned by
  `formation-guard.test.mjs` FG1–FG3), each stage a mint-shape record under
  `packs/drafts/<slug>/stages/<stage>/` (inputs/prompt/reply/expected/ledger), draft assembly
  via `deriveDraftFromStages` (shared with `formation-replay.test.mjs` — byte-identical
  replay of every committed draft), `--compare` writes comparison.json. `--slug` required;
  preflightPins before any spend. Transport: subscription shim, strong tier, askParsed
  (bounded same-prompt re-asks, gate failure = MALFORMED; `src/baml/ask.mjs`).
- **Ratification** (`scripts/ratify-pack.mjs --style <slug> --by <who> [--note]`): tag swap
  draft-v1 → style-pack/v1 + `ratification {by, date, note?}` stamp + full gates +
  pin-guarded write to `packs/<slug>.json`. Zero model calls. The E-32 Rule 4 human-taste
  gate; the draft README is the ratification sheet.
- **Backlog** (`scripts/design-backlog.mjs --pack packs/<style>.json`): packSummary +
  registryDigest → DecomposeBrushBacklog → `enforceRegistryDedup` (owned name → demoted to
  parametrization note; unknown existing_brush → warning) → drafts
  `docs/active/backlog/<style>--<brush>.md` + notes + records. Drafts are structurally
  un-schedulable (outside `.lisa.toml` scan dirs, asserted by a test against the real
  config). **Promotion is human/planner-only** (E-32 Rule 3): README one-pager — review,
  assign ticket identity, move into `docs/active/tickets/`, record rework in the README table
  + draft `rework:` frontmatter.

## 4. The frozen gate, pins, replies

`benchmarks/sculpture/multi-angle-gate.mjs --subject <key> --label <label> --artifact <rel>
--reference <rel>`: 4 azimuths × 30° elevation, per-view coverage precondition then one judge
call vs the subject's **concept** (resemblance / same-object; the patternbook label passes
`--reference recognition/<key>.artifact.json` for same-object ground truth). Record
`multi-angle/<key>-<label>.{json,md}` + sheet `pr/assets/frames/multi-angle-<key>-<label>.png`.
Verdict aggregation pure + unit-tested; **receipts**: `instrumentReceipt()` proves the judge
and contract are byte-identical to the committed instrument (`diffs: []`). T-114 replies:
`runReplyPolicy` (max 3 same-prompt asks, every reply ledgered in `views[].replies[]`);
`gate:rejudge` completes committed records with unparsed views. T-119: `preflightPins` before
any spend; `guardedWriteRecord` refuses tracked-path overwrites without `--rotate-pins`;
domain="workshop" can never write under `multi-angle/` (judge isolation, ISO3).

## 5. Receipts raw material (where the numbers live)

- Registry count before/after: `brushNames().length` (19 now); catalog page.
- Reuse fraction: pack `idioms[]` names ∩ rustic's vs newly-registered names.
- Draft rework: `docs/active/backlog/README.md` rework-log table + draft frontmatter
  (`rework: []`), defined by T-131 as the factory's quality metric; currently empty (no draft
  ever promoted).
- Cost shape: per-stage ledgers — formation `packs/drafts/<slug>/{ledger.json, stages/*/
  ledger.json}` (askCount, budget, usage tokens), backlog `records/<style>/ledger.json`,
  workshop ledger rounds (model calls per round), gate `views[].replies[]`.
- Verdict comparison target: rustic's best = barn-patternbook (4/4, 8 minor, all-minor
  profile); `pattern-book/head-to-head.{json,md}` and `src/form/head-to-head.mjs` (pure
  composer) already exist.

## 6. Constraints and assumptions

- **Spend**: the subscription monthly limit refused 3/3 earlier today (zero-token notice
  replies classify MALFORMED and burn the re-ask budget); it was responsive again by ~17:20.
  Probe with a minimal `claude -p` before any chained spend. Live spends ahead: formation
  stages (≤4 asks ×3), backlog (1×3), workshop (≤6 rounds), gate judge (4 views ×3).
- **Sibling concurrency**: a T-130 session was live at 17:37 finishing rustic-rederived +
  saltcrag formation + ratification. Re-check `packs/` and `packs/drafts/` mtimes before
  Implement; do not race the formation runs; consume `packs/saltcrag.json` if it lands,
  otherwise run step-7 ourselves (the chain is committed and tested either way).
- **Honest verdict expectation**: the frozen gate judges vs the subject's committed concept
  (rustic-look). A diegetic-substituted build diverges in palette **by construction**; the AC
  pre-authorizes this as "a named finding with causes, not a hidden one".
- **Generalization**: no subject key and no style slug may enter runner sources; npm scripts
  (package.json) are the sanctioned place for encoded flags. `npm run` needs `--` before
  flags (or call node directly).
- **Isolation**: pattern-book/workshop sources may not name the judge seam (ISO1/2/4);
  verdict reading belongs to `pattern-book-compare.mjs` (outside the scan).
- **No re-rolls**: committed records/ledgers are never regenerated to fix cosmetic fields;
  rustic chain records must remain byte-asserted by `--repro` after any chain change.

## 7. Open questions for Design

1. Pack parameterization + record namespacing: how `--pack` enters pattern-book.mjs /
   workshop.mjs without colliding with the committed rustic records or breaking their replay.
2. Subject choice for the new-style building (barn = rustic's best ⇒ cleanest like-for-like).
3. Promotion authority inside T-132: the ticket AC says "gap brushes implemented off
   *promoted* drafts" — what promotion looks like when executed under this ticket without
   violating E-32 Rule 3 (the *factory* never schedules; this ticket was human-scheduled).
4. Where the receipts table lives (one table: registry before/after, reuse fraction, rework,
   cost shape) and its determinism/replay story.
5. Whether the saltcrag backlog's gap brushes are implemented before or after the building
   run (the pack's idioms must all resolve in the registry for compile/conformance).
