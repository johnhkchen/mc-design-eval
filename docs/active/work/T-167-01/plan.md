# T-167-01 Plan — ordered, verifiable steps

Each step is small, independently checkable, and committed atomically. Testing strategy is inline.

## Step 1 — JSON Schema (`schema/defect-corpus.schema.json`)

Write the draft-2020-12 schema from Structure: discriminated `oneOf` on `kind`, `additionalProperties:
false` throughout, `minItems:8` on `states`, enums for `confidence`/`moreFaithful`.

**Verify:** `node -e "new (require('ajv/dist/2020.js'))().compile(require('./schema/defect-corpus.schema.json'))"`
compiles without throwing (ESM/CJS interop — actually do it via the loader in Step 2).

**Commit:** `feat(T-167-01): defect-corpus JSON Schema (v1)`

## Step 2 — Loader (`src/workshop/defect-corpus.mjs`)

Implement the interface from Structure: `loadCorpusSchema`, memoized `compileCorpusValidator`,
`parseDefectCorpus` (non-throwing), `loadDefectCorpus` (fail-fast + `assertSemantics`), `singleStates`,
`pairStates`, `assertSemantics`. Reuse `formatErrors`; import `DEPARTMENTS`.

**Verify:** importing the module compiles the schema (proves Step 1 well-formed). No data yet, so test
the negative path against an inline malformed object.

**Commit:** `feat(T-167-01): pure defect-corpus loader + ajv schema gate`

## Step 3 — Corpus data (`experiments/eval-alignment/corpus/defect-corpus.json`)

Author the 8 states + exclusions, labels from this session's direct inspection (Design §final
composition). Exact entries:

Single states:
- `barn-roofless` — concept 017, renderDir `builds/barn/round-1`, axis `roof`, worstDepartment `ROOF`,
  confidence `high`, note "open box, no roof at all".
- `barn-holey-walls` — concept 017, renderDir `builds/barn/new-roof`, axis `structural-integrity`,
  worstDepartment `WALL`, confidence `medium`, note "roof now reads; walls riddled with holes/ragged".
- `cottage-plain-upper` — concept 014, renderDir `builds/cottage/new-roof`, axis `surface-relief`,
  worstDepartment `WALL`, confidence `medium`, note "upper storey plain — missing half-timber studs;
  chimney also absent (secondary CHIMNEY) — hence medium not high".
- `gatehouse-gaping-gate` — concept 015, renderDir `builds/gatehouse/new-roof`, axis `opening`,
  worstDepartment `OPENING`, confidence `medium`, note "front gate is an unframed rectangular gap; no
  arch/timber treatment vs concept's arched gate".

Pair states (all renderDir clean, moreFaithful `matched`, confidence `high`):
- `gatehouse-vs-arc` — matched 015, wrongStyle `arc-A-flash.png`, renderDir `builds/gatehouse/new-roof`.
- `gatehouse-vs-chapelle` — matched 015, wrongStyle `chapelle-A-flash.png`, renderDir same.
- `cottage-vs-arc` — matched 014, wrongStyle `arc-A-flash.png`, renderDir `builds/cottage/new-roof`.
- `cottage-vs-chapelle` — matched 014, wrongStyle `chapelle-A-flash.png`, renderDir same.

Excluded (with reasons): `barn-round-3`, `barn-final` (duplicate roofless frames); `cottage-round-1`
(chaotic, no single worst dept); `cottage-cream-vs-pink` (sub-threshold tint, ambiguous moreFaithful —
E-38 flat blind-rank); `builds-autonomy-and-saltcrag` (no rendered views on disk).

`rater`: "single-rater: claude (agent), 2026-06-16, by direct render inspection beside concept;
single-rater honest — no inter-rater aggregation."

**Verify:** `loadDefectCorpus()` returns; `states.length === 8`; `excluded.length >= 4`.

**Commit:** `feat(T-167-01): labeled defect corpus — 8 states + logged exclusions`

## Step 4 — Unit test (`src/workshop/defect-corpus.test.mjs`)

All cases from Structure, including on-disk path existence for every referenced asset.

**Verify:** `npm run test:unit` green; then full `npm test` green (includes `pretest`→`baml:gen` + the
two artifact validations + unit glob). Confirm the test count went up.

**Commit:** `test(T-167-01): defect-corpus loader, schema, and path-existence coverage`

## Step 5 — Convenience script (`package.json`)

Re-Read `package.json` immediately before editing (shared-file lesson). Add additive `corpus:check`
script. Verify `npm run corpus:check` prints "corpus OK 8 states".

**Commit:** `chore(T-167-01): npm run corpus:check (no-spend corpus reader)`

## Testing strategy summary

- **Unit (in `npm test`):** schema validity (positive on committed corpus, negative on malformed
  fixture), DEPARTMENTS membership, id uniqueness, kind partition, path existence, exclusions present.
- **No integration / no model spend:** reading + validating the corpus is pure I/O; the labels are
  committed data. S-168/S-169 will be the ones that spend model calls against these labels.
- **Manual:** I will eyeball each referenced render once more during Implement to confirm the label
  before committing — the labels are the product, and the falsifiable claim is about *my* reliability
  as rater, so the honest move is to look, not to trust the filename.

## Risks & mitigations

- *Risk:* a referenced asset path is wrong → caught by Step 4 path-existence test before commit.
- *Risk:* `minItems:8` + only 8 states is brittle if one asset is later pruned → acceptable; the corpus
  is the contract and S-168/S-169 want a stable ≥8. Document the count in `notes`.
- *Risk (claim):* if during Implement a pair's `moreFaithful` is genuinely ambiguous, I move it to
  `excluded` rather than guess — and report it in `review.md` as the claim's (a) failure mode.
