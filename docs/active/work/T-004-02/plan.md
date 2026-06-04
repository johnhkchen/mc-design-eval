# Plan — T-004-02 single-shot-archetype

Ordered, independently-verifiable steps. Each step is a single atomic commit. The
pure surface (steps 1–3) is covered by `npm test`; the live leg (step 4) is not
(spec §4 — metered). Verification oracle for every code step: `npm test` green
(currently 54/54) with the new cases added, plus `node --check` on new files.

## Step 1 — `src/palette.mjs` + `src/palette.test.mjs` (shared palette access)

**Do.**
- Create `src/palette.mjs`: file-top comment (consumer #1 of T-001-04; reads
  palette JSON by path, no re-validation). `PALETTES_DIR` resolved relative to the
  module. `loadPalette(id)` → `JSON.parse(readFileSync(join(PALETTES_DIR,
  id + ".json")))`, throwing a clear "unknown palette '<id>' (looked in <dir>)" on
  ENOENT. `formatPaletteBlocks(palette)` → grouped lines when `palette.groups`
  (one line per group, plus an `other:` line for ungrouped blocks), else a flat
  comma list; deterministic key order.
- Create `src/palette.test.mjs`: `loadPalette("industrial")` returns `id ===
  "industrial"` and `blocks` includes `iron_block`; `loadPalette("nope")` throws.
  `formatPaletteBlocks(industrial)` mentions every group name + every block;
  `formatPaletteBlocks({ blocks:["stone","glass"] })` returns the flat list;
  two calls are byte-identical.

**Verify.** `npm test` green; new palette cases pass. `loadPalette` reads the real
shipped file (deterministic, offline).

**Commit.** `T-004-02: shared palette loader + prompt block formatter`

## Step 2 — `src/briefs.mjs` (shared target & style briefs)

**Do.**
- Create `src/briefs.mjs`: frozen `TARGET_BRIEFS` keyed by the schema `target`
  enum (`house` concrete per spec §8 — "bounded volume with interior logic";
  `path`, `landscape` as anticipatory spec-§8 data), each `{ headline, brief }`;
  frozen `STYLE_BRIEFS` with `industrial` `{ name, brief }` (architectural intent
  to pair with the palette's material `description`). `Object.freeze` each map and
  its entries. No functions.

**Verify.** `node --check src/briefs.mjs`; `npm test` still green (no behavior yet;
consumed in step 3). Confirm `Object.keys(TARGET_BRIEFS)` equals the schema enum.

**Commit.** `T-004-02: shared target + style briefs (spec §8) data module`

## Step 3 — `src/single-shot.mjs` pure surface + `src/single-shot.test.mjs`

**Do.**
- Create `src/single-shot.mjs` with the pure surface only (no live wrapper yet):
  - `SINGLE_SHOT` descriptor (`id` = imported `DEFAULT_PROMPTING_METHOD_ID`,
    `version: 1`, `label`).
  - `buildSingleShotPrompt(spec)` — validate spec (target/style in their maps;
    non-empty `paletteId`/`trialId`/`serverStateId`; integer `seed`; throw with a
    field-named message otherwise); load + format the palette; assemble the fixed,
    ordered prompt sections (role/task → target brief → style brief + palette
    description → binding material constraint → metadata directives → style-object
    directive); return `{ prompt, seedMetadata }`.
  - `assertAttribution(artifact, archetype = SINGLE_SHOT)` — throw unless
    `artifact?.metadata?.prompting_method_id === archetype.id`.
- Create `src/single-shot.test.mjs` (no SDK import; uses the real palette):
  - prompt **contains** every industrial whitelist block, the binding-constraint
    phrasing ("only", "violation"/"must"), the house target headline, the
    industrial style brief, and the pinned `single-shot.v1` /
    `trial_id` / `seed 42` / `server_state_id` / `target house` directives.
  - `seedMetadata.prompting_method_id === SINGLE_SHOT.id`.
  - throws on unknown `target`, unknown `style`, missing `trialId`, non-integer
    `seed`.
  - determinism: identical spec → byte-identical prompt.
  - `assertAttribution`: passes on match; throws on mismatch and on absent metadata.

**Verify.** `npm test` green with the new single-shot cases (target ≈ 64+/64+).

**Commit.** `T-004-02: single-shot archetype prompt builder + attribution guard`

## Step 4 — live `runSingleShotTrial` + rewire `scripts/run-trial.mjs`

**Do.**
- Append `runSingleShotTrial(spec)` to `src/single-shot.mjs`: build the prompt,
  call `runTrial({ prompt, metadata: seedMetadata, model: spec.model, outDir:
  spec.outDir })`, `assertAttribution(result.artifact)`, return the result. Header
  note: LIVE/METERED, not in `npm test`.
- Modify `scripts/run-trial.mjs`: drop `SAMPLE_PROMPT` and the inline metadata
  sentence; import `runSingleShotTrial`; call it with the house/industrial demo
  spec (`trialId: "phase1-house-singleshot-demo"`, `seed: 42`,
  `serverStateId: "flat-creative-superflat.v1"`). Keep the one-line usage summary
  and the SDK-not-installed friendly error. Remove the now-unused
  `PHASE1_MODEL_ID`/`DEFAULT_PROMPTING_METHOD_ID` imports if no longer referenced.

**Verify.** `npm test` green (the live wrapper is not exercised — pure cases still
pass; confirm no accidental SDK import at module load by `node --check` and by the
suite importing `single-shot.mjs` without the SDK installed path firing).
`node scripts/run-trial.mjs` without credentials must fail with the friendly
"SDK not installed / live & metered" message, not a stack trace — manual, not CI.

**Commit.** `T-004-02: live single-shot trial wrapper + run-trial CLI rewire`

## Step 5 — `src/README.md` documentation

**Do.** Add a "Single-shot archetype (T-004-02)" section after the trial-runner
section: the archetype = a versioned prompt-construction policy over `runTrial`;
the three ingredients (target brief / style brief / palette whitelist) and the
binding-constraint framing; how `prompting_method_id` attribution is pinned and
*enforced* (`assertAttribution`); the `palette.mjs` / `briefs.mjs` seams; that
`npm run trial:run` now demonstrates the archetype (live/metered).

**Verify.** Prose only; `npm test` unaffected.

**Commit.** `T-004-02: document the single-shot archetype in src/README`

## Testing strategy (summary)

- **Unit (in `npm test`):** `palette.test.mjs` (load + format) and
  `single-shot.test.mjs` (prompt construction, spec validation, determinism,
  attribution). All offline, deterministic, no SDK, no network — they assert over
  the real shipped `industrial` palette and plain artifact objects.
- **Not unit-tested (spec §4):** `runSingleShotTrial` and the rewired CLI — the
  metered live path, identical posture to T-004-01's `runTrial`/`run-trial.mjs`.
- **Regression guard:** the existing 54 tests must stay green; this ticket adds
  only new files plus one CLI rewrite, touching no tested module's behavior.

## Risks & mitigations

- **Palette path coupling.** `loadPalette` resolves `../palettes` relative to
  `src/`. Mitigation: resolve via `import.meta.url` (the repo's idiom in
  `artifact.mjs`); test it against the real file so a wrong path fails CI.
- **Attribution is model-driven.** The prompt asks for `prompting_method_id`;
  `assertAttribution` is the backstop so a non-compliant generation fails loudly
  instead of logging a mislabeled row. Covered by a unit test on the guard itself.
- **Bare vs. namespaced ids.** The prompt explicitly instructs `minecraft:`-prefixed
  emission from the bare whitelist; adherence counting (E-04) already strips the
  prefix, so the two spellings reconcile. No code path here depends on the model
  obeying — it only affects later scoring.
