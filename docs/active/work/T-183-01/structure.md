# T-183-01 — Structure

File-level blueprint. Five artifacts: a JSON schema, a manifest data file, a loader module, its test,
and a replay script. Plus the synthesized build output dir + beside-PNGs. Nothing under `measurements/`.

## Created

### 1. `schema/style-corpus.schema.json` (new)
JSON Schema (draft 2020-12, `$schema` like `schema/defect-corpus.schema.json`) for the manifest.
Top-level:
- `schema`: const `"eval-alignment/style-corpus/v1"`.
- `rater`: string (single-rater honesty disclosure).
- `notes`: string (constructibility + structural-confound + contestability disclosures).
- `packs`: object map `{matched, foreign}` → pack file paths (the two packs the factorial uses).
- `states`: array (min 8) of state objects.
- `excluded` (optional): array of `{id, reason}` (no-padding evidence, defect-corpus idiom).

State object (`additionalProperties:false`):
- `id`: string, unique.
- `subject`: string (`gatehouse|cottage|barn`).
- `cellType`: enum `match|same-pack-wrong-picture|wrong-pack-right-picture|cross|hard-middle`.
- `build`: string — build dir relative to repo root (e.g. `builds/gatehouse/faithful-covered`).
- `pack`: string — pack file path (e.g. `packs/rustic.json`).
- `concept`: string — concept image path.
- `intendedFaithfulness`: enum `high|middle|low`.
- `renderDir`: string — dir holding the 4 `view-*.png` (usually == `build`; explicit for synth dirs).
- `beside`: string — the composed beside-concept PNG path.
- `synthesized` (optional bool) — true for replay-generated mutated builds.
- `note`: string — label rationale + (for hard-middle) the contestability call.

JSON Schema keeps `cellType`/`subject` enums *inline* (it cannot import .mjs); the .mjs loader holds the
authoritative constant and re-checks (single composition point, the defect-corpus pattern).

### 2. `experiments/eval-alignment/corpus/style-corpus.json` (new)
The committed manifest — ~12 states per design's factorial table, the two packs, the honest `notes`,
and any `excluded`. Written by the replay script (step 5) but committed as data.

### 3. `src/workshop/style-corpus.mjs` (new) — loader (mirrors `defect-corpus.mjs`)
Exports:
- `STYLE_CORPUS_SCHEMA = "eval-alignment/style-corpus/v1"`, `STYLE_CORPUS_SCHEMA_PATH`,
  `STYLE_CORPUS_PATH`, `REPO_ROOT`.
- `CELL_TYPES` (frozen array), `FAITHFULNESS` (frozen array) — the authoritative enums.
- `loadStyleCorpusSchema(path?)`.
- `compileStyleCorpusValidator(schema?)` — memoized Ajv2020 strict + addFormats.
- `parseStyleCorpus(input)` → `{ok,corpus}` | `{ok:false,errors}` (value, not throw).
- `assertSemantics(corpus)` — duplicate-id check; `cellType ∈ CELL_TYPES`;
  `intendedFaithfulness ∈ FAITHFULNESS`; **coverage assert**: all four crux cell types present and
  ≥2 `hard-middle`; ≥3 distinct `subject`s. Throws on violation (data error).
- `loadStyleCorpus(path?)` — fail-fast wrapper (throws formatted errors).
- `statePaths(state)` → `[build-or-renderDir, pack, concept, beside]` (for the test's existence guard).
- Partition helpers: `byCellType(corpus, type)`, `cruxCells(corpus)`, `hardMiddle(corpus)`,
  `matchedRows(corpus)` — what S-184 imports.

### 4. `src/workshop/style-corpus.test.mjs` (new) — covered by `npm test`
Mirrors `defect-corpus.test.mjs`:
- SC1: committed manifest loads; ≥8 states; carries `rater` + `notes`; `excluded[].reason` non-empty if
  present.
- SC2: every `cellType ∈ CELL_TYPES`, every `intendedFaithfulness ∈ FAITHFULNESS`.
- SC3: coverage — all four crux cell types present, ≥2 hard-middle, ≥3 subjects (asserts the AC's
  shape so a future edit can't silently drop a crux cell).
- SC4: **asset existence** — for each state, `build`/`renderDir` exists, the 4 `view-*.png` exist, the
  `pack`/`concept`/`beside` files exist (the reproducibility guard; a moved asset fails `npm test`).
- SC5: parse-returns-value on malformed input (invalid → `{ok:false}`, no throw); `loadStyleCorpus`
  throws on the same.

### 5. `experiments/eval-alignment/corpus-build.mjs` (new) — the replay script
Model-free. Steps, in order:
1. **Asset guard** — every reuse build dir + concept + pack exists before any work (referee idiom).
2. **Synthesize hard-middle** — read `builds/gatehouse/faithful-covered/artifact.json`; apply a pure
   deterministic mutation (`stone_bricks → cobblestone` on the dressing role) producing
   `builds/gatehouse/faithful-covered-mid/artifact.json` (+ `SOURCE.md` recording the one-factor change).
   Helper `mutateMaterial(artifact, from, to)` — maps placements + palette manifest, pure.
3. **Render synth** — `renderViews` → 4 `view-*.png`; `renderBesideConcept` → `beside-concept.png`
   (GL; `assertGlAvailable` makes a missing GL loud).
4. **Compose reuse beside-PNGs** — for every non-synth state, `composeTwo(concept, build view-+x+z.png,
   out)` writing `experiments/eval-alignment/corpus/beside/<id>.png` (GL-free).
5. **Emit manifest** — assemble the states array (design table), validate via `parseStyleCorpus`
   (fail-fast before write), write `style-corpus.json`. Print a summary table.
Flags/env: `--no-render` (skip GL synth render, reuse committed synth renders — for re-emitting the
manifest without GL), `GUARD_ONLY=1` (asset guard then exit). `composeTwo`, `toB64`, `mutateMaterial`
are local helpers (composeTwo lifted from the referee verbatim — tiny, kept local per project idiom).

## Created (generated output, committed)
- `builds/gatehouse/faithful-covered-mid/` — `artifact.json`, `SOURCE.md`, 4 `view-*.png`,
  `beside-concept.png` (the synthesized one-wrong-material gatehouse).
- `experiments/eval-alignment/corpus/beside/<id>.png` — one beside-concept composite per state.

## Modified
- None of the existing source. (The referee is untouched — S-184 writes the consuming harness; T-183-01
  only lands the corpus + loader.) No `package.json` script entry is required, but optionally add
  `"corpus:build": "node experiments/eval-alignment/corpus-build.mjs"` for discoverability — additive,
  no flag-swallowing risk (memory: npm-run-flag-swallowing — the script reads `process.argv`/env, no
  forwarded npm flags).

## Deleted
- None.

## Ordering of changes (why this order)
Schema → loader+test (red: no manifest yet) → replay script → run script (emits manifest + renders) →
test goes green → inspect hard-middle renders (contestability AC) → adjust mutation if obvious. The
loader/test exist before the data so the data is validated the moment it lands. Inspection is **after**
the render exists and **gates** the final label (a non-contestable synth state is re-typed/dropped, the
manifest re-emitted).

## Module boundaries
- `style-corpus.mjs` is **pure data + validation** — no model, no GL, no dependency on
  `bakeoff-score.mjs` (upstream data, exactly like `defect-corpus.mjs`). S-184 joins corpus↔scorer.
- `corpus-build.mjs` is the **only** thing that does GL/IO synthesis; it imports the loader's
  `parseStyleCorpus` to self-validate before writing (no unvalidated manifest can be committed).
- No `measurements/` path appears anywhere.
