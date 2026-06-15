# T-130-01 style-formation — Plan

Phase: Plan. Eight steps, each atomically committable and independently verifiable.
Structure.md names the files; design.md (D1–D8) the rationale.

## Step 1 — Ratification contract (schema + tests)

- `schema/style-pack.schema.json`: optional top-level `ratification {by, date, note?}`
  (by minLength 1; date format date-time; additionalProperties false).
- `src/pack/style-pack.test.mjs`: (a) rustic (no ratification) still valid; (b) a stamped
  pack valid; (c) `ratification` missing `by`/`date` or with extras → schema_invalid;
  (d) a `style-pack/draft-v1`-tagged object → `parseStylePack` rejects (const).
- **Verify:** `npm run test:unit -- --test-name-pattern` is unreliable with globs — run
  `node --test src/pack/style-pack.test.mjs`; then full `npm test` before commit.
- **Commit:** `feat(E-32 T-130-01): ratification field — the pack records who/when`.

## Step 2 — `baml_src/formation.baml` (DerivePalette, DeriveProportions)

- Two functions per structure §1; prompts teach the D2 gates (vocabulary membership, source
  keys, one dominant per band, role naming, pitch ∈ {0.5,1,2}, min≤max, decoration optional).
  Diegetic framing mirrors vernacular.baml ("reason from the place; cite the story").
- Leniency comments: which malformed shapes SAP degrades silently (all-array class ⇒ empty;
  ints coerced) and what the runner's classifiers must therefore catch.
- **Verify:** `npm run baml:gen` clean; a tiny ad-hoc bridge batch renders both prompts and
  parses a hand-written reply for each (throwaway, not committed); transport-guard TG5 list
  extended to formation.baml and green.
- **Commit:** `feat(E-32 T-130-01): formation BAML functions — palette + proportions typed`.

## Step 3 — `src/baml/ask.mjs` + tests

- `askParsed` per structure §2 (budget MAX_REPLY_ATTEMPTS, classify hook, injectable
  transport, full rawTexts, per-attempt ledger entries, transport throws flagged).
- `src/baml/ask.test.mjs` with a scripted fake transport + fake parse (no bridge spawn):
  first-try accept; parse-fail→re-ask→accept; gate-fail (classify) → re-ask; budget
  exhaustion → expected null + complete ledger; transport error entry shape.
  NOTE: bamlParse is bridge-spawning — ask.mjs takes `parse` injectable too (default
  bamlParse) so unit tests stay spawn-free.
- **Verify:** `node --test src/baml/ask.test.mjs`; judge-reply untouched (git).
- **Commit:** `feat(E-32 T-130-01): askParsed — the shared bounded re-ask, third caller
  arrives (T-129 review #3)`.

## Step 4 — `src/pack/formation.mjs` + unit tests (the bulk)

Order within the module: digests → sources slugging → classifiers → stamping → idiom
seeding → assembly → near-tone report → comparePacks → draftReadme.

Key behaviors to pin in `formation.test.mjs` (injected mini block-table + vocab):
- `sourcesFromStory`: kebab slugs, collision-suffixing, narrative = source + typical_use;
  keys match the schema's `^[a-z][a-z0-9-]*$`.
- `blockVocabularyDigest`: families grouped, L* shown rounded, excluded candidates absent,
  non-cube section present.
- `classifyPalette`: off-vocab block / unknown citation / zero roles / two dominants in one
  band / tier-without-band ⇒ `{ok:false, reason}` naming the offender; a valid parse ⇒ ok.
- `classifyProportions`: pitch outside {0.5,1,2}, min>max ⇒ malformed.
- `classifyBacklog`: empty union ⇒ malformed (FX-D1 discharge); items-only or notes-only ok.
- `stampValueChecks`: cube in table → {cube, true, family, exact table lab}; trapdoor →
  fixture; fence → rail; off-table cube-ish names impossible (classifier ran first).
- `seedIdiomParams`: roof.* get field/stairs/slab from roof.field/roof.course/roof.step
  roles when present; plinth/arch/head.flat from wall.dressing; chimney from chimney.* +
  cap; brushes without a mechanical rule emit `{name}` only.
- `assembleDraftPack`: draft tag; conformance = CONFORMANCE_CHECK_NAMES in full;
  `parseStylePack` rejects it; after tag-swap + ratification stamp it passes
  `assertStylePack` AND `validateStylePack` (the round-trip proof, using the REAL table for
  one realistic fixture case).
- `comparePacks`: synthetic derived-vs-curated pair exercises same-block / same-family /
  different verdicts, role alignment by name then (band,tier), missing/extra named,
  proportion deltas, idiom set diff.
- **Verify:** `node --test src/pack/formation.test.mjs`; then full `npm test`.
- **Commit:** `feat(E-32 T-130-01): formation pure half — assembly, gates, value stamping,
  pack comparison`.

## Step 5 — Runner, ratify script, guards, wiring

- `scripts/form-style.mjs`, `scripts/ratify-pack.mjs` per structure §4–5. preflightPins
  BEFORE any spend lists every file of the run (stages + draft + README + ledger
  [+ comparison]). Stage-1 replay mode copies the vernacular fixture's
  inputs/prompt/reply/expected into the draft's stage dir with `source: "replay-of-fixture"`
  in its stage ledger.
- `src/pack/formation-guard.test.mjs` (D7 no-optics import-surface pins) and
  `src/pack/formation-replay.test.mjs` (skip-clean while no drafts exist).
- package.json: `style:form`, `style:ratify`.
- **Verify:** full `npm test` (guards + replay-skip green); `node scripts/form-style.mjs`
  with no args prints usage and exits nonzero without spending; pin-preflight refusal
  exercised by pointing at an existing tracked path in a dry sandbox dir (manual check).
- **Commit:** `feat(E-32 T-130-01): formation chain runner + ratification gate, no-optics
  pinned`.

## Step 6 — LIVE: rustic re-derivation fixture (~4 strong calls)

- Brief: one paragraph from rustic's `provenance.setting` (pasture, small quarry, oak
  coppice, sawpit, yeoman wealth) — **no block names, no palette hints** (craft/color split).
- `npm run style:form -- --brief-file docs/active/work/T-130-01/rustic-brief.txt --slug
  rustic-rederived --compare packs/rustic.json`.
- Inspect: comparison.json divergences NAMED; README readable; gate failures (if any) in the
  ledger honestly.
- **Verify:** `npm run style:form -- ... --offline` reproduces draft.json byte-identically;
  formation-replay test now exercises the committed stages; full `npm test`.
- **Commit:** `feat(E-32 T-130-01): rustic re-derived from a theme brief — closeness
  recorded, divergences named`.

## Step 7 — LIVE: saltcrag formed, ratified, committed (~3 strong calls)

- `npm run style:form -- --story-replay vernacular --slug saltcrag` (stage 1 deterministic
  from the committed fixture; palette/proportions/decompose live).
- Read the draft README (the ratification sheet); apply the documented taste checklist.
- `npm run style:ratify -- --style saltcrag --by "T-130-01 autonomous run (ticket-sanctioned;
  provisional pending human taste pass)" --note "..."`.
- **Verify:** `node scripts/validate-pack.mjs packs/saltcrag.json` green; `--offline` replay
  byte-identical; full `npm test` (replay suite now covers both drafts).
- **Commit:** `feat(E-32 T-130-01): saltcrag — the first formed style, ratified provisional`.

## Step 8 — Evidence + closeout

- Grep evidence into progress.md: no GLB/texture/image tokens on the formation import
  surface (match imports, not comments — generalization-grep memory); zero `images:` at
  formation bamlRender call sites; transport notes (no metered key).
- AC trace in progress.md; review.md last.
- **Commit:** docs commit with progress/review (+ this work dir), per repo convention.

## Testing strategy summary

Unit (spawn-free): formation.mjs, ask.mjs, style-pack schema cases. Bridge-spawning
(batched, one per file): formation-replay. Guards: formation-guard + extended
transport-guard. Live paths covered by committed ledgers + offline replay, never by
`npm test` (inherited policy). Budget: ~7 strong-tier calls, all pin-guarded.

## Risks / contingencies

- **DerivePalette quality** (off-vocab picks): the digest + taught gates should hold; if the
  budget exhausts, the ledger commits the refusal honestly (mint precedent) and the step
  re-runs with `--rotate-pins` under this ticket's sanction — recorded in progress.md.
- **Story fixture lacks pack-shaped fields** (no storey/pitch language): DeriveProportions
  reasons from roofing_economy/wealth prose — acceptable; divergence shows in rustic
  comparison.
- **Slug collisions** (scale-study memory): `--slug` flag pins directory names; style_name
  from the model is recorded but the slug governs paths.
- **ask.mjs vs judge-reply drift**: semantics mirrored, never imported both ways; guard test
  asserts judge files untouched (existing TG4 suffices).
