# T-096-01 kit-extraction — Design

Goal restated: ask the multimodal model *"which Minecraft block is this?"* (recognition), validate
answers against the real vocabulary, value-verify cube blocks in Lab as a **flag** (never a silent
snap), tie entries to the T-092 bands, and let recognition beat the color-snap at the one renaming
point. Two subjects through one untuned path; pinned re-runs; `npm test` green.

## Decision 1 — LLM invocation: direct shim prompt, not BAML

**Chosen**: a pure prompt-builder in `src/form/kit.mjs` + an impure runner calling
`requestTextWithImage` (strong tier, `claude -p` subscription) — the T-093 multi-angle-gate
pattern (`multi-angle-gate.mjs:282`).

**Rejected**: a new `baml_src/kit.baml` + tsx bridge (E-21 pattern). Reasons: (a) the newest
multimodal-judge precedent already moved off BAML; (b) BAML adds codegen churn (`baml_client/`
regen) and the fake-API-key render dance for zero validation benefit — our pure parser must
re-validate everything anyway (collect-don't-throw); (c) the prompt lives in a unit-testable pure
module instead of a `.baml` file outside `npm test`'s reach. AC #1 only requires "the multimodal
LLM via the `claude -p` subscription shim" — satisfied via `requestTextWithImage` with
`model: MODEL_TIERS.strong` (explicitly never the metered API; the shim is the only invoker
imported).

## Decision 2 — Vocabulary: build-time script → committed `block-vocab.json`

**Chosen**: `scripts/build-block-vocab.mjs` reads `minecraft-data` (1.20.1) through a
`createRequire` against the `palettes/` workspace (where it is a declared dependency, the
`palettes/validate.mjs` precedent), subtracts the same `NON_SURVIVAL` denylist policy, and writes
a committed `src/form/block-vocab.json` (`{schema, minecraftVersion, source, blocks: [names…]}`).
Runtime validation (`src/form/kit.mjs`) loads the committed JSON with zero Minecraft deps — the
exact `block-lab-table.json` precedent (build-time-only heavy deps, dependency-free runtime).

**Rejected**: (a) root `minecraft-data` dependency — root runtime deps are deliberately minimal
and the block-table precedent shows build-time derivation is the house style; (b) runtime
`createRequire` into `palettes/node_modules` — couples the hot path to a sibling workspace's
install state. CLAUDE.md's "canonical vocabulary comes from minecraft-data" is satisfied: the
committed JSON records its provenance (`source: "minecraft-data"`, version, count).

## Decision 3 — Kit schema and formClass semantics

LLM reply contract (strict JSON, fenced-tolerant):

```json
{ "ingredients": [ { "block": "smooth_sandstone", "role": "upper-storey panel field",
    "formClass": "cube", "whereUsed": ["band1"], "confidence": "high",
    "rationale": "flat cream panels with the faint horizontal seam of smooth sandstone…" } ],
  "unidentified": [ { "surface": "…", "reason": "…" } ] }
```

Pure validation per entry (collect-don't-throw, `dropped[]` like `parseMaterialMap`):
- `block` must exist in the committed vocabulary (else drop `unknown-block` — but now the
  vocabulary is the FULL survival set, so trapdoors/fences/doors/lanterns survive; the E-21
  defect — recognition discarded by a full-cube-only validator — is structurally gone).
- `formClass ∈ {cube, fixture, rail}` (drop `unknown-form-class` if absent/invalid).
- **Derived cross-check** (deterministic, testable): `derivedFormClass(block)` = `cube` iff the
  block is in the block→Lab table (full-cube by construction); else `rail` iff the name matches
  the connecting-thin-element pattern (`/(fence|wall|pane|bars|rail|chain)$/` minus `fence_gate`,
  which is a fixture); else `fixture`. A declared/derived mismatch does NOT drop the entry — the
  entry keeps the derived class and gains a `flags: ["form-class-corrected"]` note (the LLM's
  declaration is preserved as `declaredFormClass`). Rationale: form class decides which
  verification applies, so it must be ground-truthed, but a disagreement is reviewer signal,
  not garbage.
- `whereUsed` refs validated against the committed zone-map record's band names (`band0…`,
  `roof`) plus the open feature terms (`openings`, `trim`, `corners-edges`, `base`) — unknown
  refs flagged (`unknown-where-ref`), not dropped. This is AC #3's "references the same bands;
  does not re-derive them": the band geometry enters the kit by *reference to the committed
  record*, and the prompt hands the LLM the band names + roles **with block IDs stripped** so
  the old map's color-guesses (`white_terracotta`) cannot anchor the recognition.
- `confidence ∈ {high, medium, low}` (default `medium` with flag).
- Dedup on `(block, role)` keep-first.

## Decision 4 — Value verification: flag, never snap (AC #2)

For each kept entry with **derived `formClass: "cube"`** (only cubes have Lab rows and field
presence; fixtures/rails are vocabulary-validated only — recorded as `valueCheck: null`,
reason `non-cube`):

- Concept region located the proven T-086 way: validate-mode `gridFromPixels(concept,
  {whitelist: kitCubeBlocks, n: SAMPLE_GRID_N, dropColor: estimateBorderColor, cellMeans: true})`
  → `sampleRoleSwatches` → per-block `{lab, cells}`.
- `weightedDeltaE(swatchLab, tableLab(block), CHROMA_WEIGHT)` (the chroma-weighted metric —
  plain ΔE76 is the known pink-block trap).
- Verdicts (recorded per entry): `verified` (ΔEw ≤ `KIT_VERIFY_DELTA_MAX`, cells ≥ `MIN_CELLS`),
  `flagged-mismatch` (ΔEw above the gate → `flaggedForReview: true` — it must NOT silently fall
  back to color-snap; the entry stays in the kit, loudly marked), `thin-sample` (cells <
  `MIN_CELLS` → flagged, evidence insufficient), `no-swatch` (block claimed no cells → flagged).
- `KIT_VERIFY_DELTA_MAX` is a generic exported constant (default **16** ΔEw — above T-086's
  observed same-material sampling noise, below the cross-family distances that motivated the
  terracotta correction; tunable, recorded in `params`).
- **Known caveat, recorded in the artifact**: whitelist-quantization is partly self-fulfilling
  (`ablation-value-de-tautology`) — the check is *evidence for a human reviewer line-by-line*
  (the AC's framing), not a decision gate, consistent with
  `reproducibility-excludes-gl-from-decisions`.
- `unidentified[]` surfaces declared by the extractor get the **recorded** fallback:
  `fallback: { mode: "color-snap" }` — i.e., those surfaces remain governed by the existing
  T-086 value-true chain, and the record says so explicitly (AC #2's second half).

## Decision 5 — Recognition beats snap at the ONE renaming point

The zone map's `dominantRole → block` resolution ships through `buildSkin`'s
`sub = substitution[named] ?? named` (value-true snap) applied at `mapPolicy`. **Chosen seam**: a
pure `kitOverrides(kit, materialMap)` → `{ namedBlock → recognizedBlock }` containing only
entries that are `verified` cubes whose `whereUsed` covers a band (band ref or `roof`) and whose
role matches a map row (matching by the map row whose `block` the zone-map band resolves —
i.e., keyed on the band's `dominantBlock` in named space). In `buildSkin`:
`subK = (b) => kitOv[b] ?? substitution[b] ?? b` — recognition wins, snap remains for everything
the kit doesn't verify, fallback prior untouched. `SUBJECTS` gain `kitRecord: "kit/<subj>.json"`
(data, not code — E-25 Rule 3); absence ⇒ behavior identical to today.

Why this is safe against the committed agreement assertions: the value-select assertion compares
the *snap substitution itself* (still computed identically, before kit composition) and the
zone-map assertion compares *named-space bands* (unchanged). The kit changes only the shipped
rename, recorded in the durable-skin record (`zoneMap.kit = {overrides, source}`).

**Rejected**: feeding the kit into `selectValueTrueMap` (mutating the snap) — breaks the
committed value-select agreement and muddles two distinct mechanisms; re-deriving bands inside
the kit extractor — AC #3 forbids a second concept-reading seam.

## Decision 6 — Pinning and re-runs (E-24 Rule 2)

The material-map runner's idiom verbatim: live run writes `kit/<subj>.raw.json` (the exact model
reply) beside the parsed `kit/<subj>.json`; `--offline` re-validates the committed raw with zero
live calls (byte-stable: parsing, vocabulary check, verification, and diff are all deterministic
over committed inputs). The record carries `generatedFrom` (concept, materialMap, zoneMapRecord
paths) + `params` (model id, thresholds, grid n). No `Date`/randomness in the record body.

## Decision 7 — Cottage/gatehouse proof artifacts (AC #4/#5)

The runner computes `diff` vs the old E-21 map: per old map row, the kit entry covering the same
band/role with `old.block ≠ kit.block` → a `corrections[]` row (the `white_terracotta →
smooth_sandstone`-class correction made visible); kit entries with no old-map counterpart
(trapdoors, fences, doors — formerly `dropped`) → `recovered[]`. A sibling `kit/<subj>.md`
renders the kit line-by-line (block, role, formClass, whereUsed, confidence, value verdict,
rationale) for the human check against the picture. Gatehouse runs the identical path — its
registry entry is data only.

## Out of scope

Re-running the full durable-skin live sweep / regenerating its committed records and renders
(heavy, GL); the wiring + unit tests prove the seam, and a record regen is a one-command
follow-up. Kit-driven *placement* of fixtures/rails (dressed openings) is E-26's later story —
this ticket extracts and verifies the kit and wires cube recognition only.
