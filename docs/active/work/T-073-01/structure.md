# T-073-01 — concept-refine-pass · Structure

The blueprint. Five new files + two additive edits. The E-15 loop core is UNTOUCHED. Module boundaries
mirror the form side: pure cores under `src/`, the metered bridge as `.mts`, the impure runner under
`benchmarks/`. Ordering matters where noted.

## Created

### 1. `src/form/material-target.mjs` (pure core — the accept metric)
The material analogue of `form-target.mjs`. GL-free kernel; `_decode` injectable.
- `export const MATERIAL_TARGET_SCHEMA = "material-target/v1"`
- `regionColorClusters(decodedImg, {k, region?}) → {clusters:[{lab,coverage}], foregroundPx}` — PURE.
  `aggregateForeground` + `medianCutLab`; optional normalized 2-D `region` bbox clips the pixel set.
- `colorAgreement({renderClusters, conceptClusters, deltaEMax}) → number` in [0,1] — PURE kernel.
  Coverage-weighted nearest-concept-cluster similarity (`1 − min(ΔE,max)/max`). The unit-tested heart.
- `conceptMaterialTarget({conceptPath, k, deltaEMax, region?, _decode?}) → {kind:"concept", conceptPath,
  scoreRender(renderPath, R), wholeObjectScore(renderPath)}` — lazy-decodes the concept once (memoized),
  decodes the render per call, returns `colorAgreement`. `scoreRender` uses the per-region `region` if
  given (else whole); `wholeObjectScore` never clips (the AC verdict signal).
- `resolveMaterialTarget(cfg) → {scoreRender}` — `cfg.materialTarget` pass-through, else `cfg.conceptPath`
  → `conceptMaterialTarget`, else throw. Mirrors `resolveFormTarget`.
- `liveMaterialScore(cfg) → (artifact, R) => Promise<number>` — lazy-imports `observeRegion`; renders R
  to a temp PNG; `resolveMaterialTarget(cfg).scoreRender(path, R)`. The loop's `score` seam. (GL leaf,
  not unit-tested; the kernel above is.)

### 2. `src/form/material-policy.mjs` (pure core — the palette policy, AC#2/#3)
- `export const POLICY_SCHEMA = "material-policy/v1"`
- `allowedPalette({mapPalette = [], secondary = [], additions = []}) → Set<string>` — normalized
  (`normalizeBlock`) union; the AC#3 augmented set.
- `gateAddition(addition, {allowed, table?}) → {ok:boolean, reason:string, block?:string}` — AC#2 gate:
  real block (`isKnownBlock`) ∧ not already in `allowed` (distinct role) ∧ non-empty `conceptMaterial`
  ∧ non-empty `where`. Returns the normalized block on ok.
- `classifySwap(op, {allowed}) → "in-palette" | "needs-addition" | "off-palette"` — swap target block vs
  `allowed`.
- `applyCorrection(inRegion, subBounds, {swaps, additions}, {allowed, table?}) → {placements, applied,
  rejected, accepted Additions}` — orchestrates: gate additions → grow a working `allowed` → keep only
  swaps whose block ∈ grown allowed → delegate to `applyFormEdit(inRegion, subBounds, swapOps)` (REUSE,
  swap-only). PURE. Returns the additions actually accepted (for the log) + per-op rejections w/ reason.

### 3. `src/revise/material-edit.mjs` (the editor — analogue of form-edit.mjs)
- `export const MATERIAL_EDIT_ROUTE = "material-correct"`
- `makeMaterialEditor({critic?, propose?, validate?, applyEdit?, policy}) → {diagnose, tweakFor, stash,
  proposals, additions}` — shares a private stash keyed by `regionKey`. `diagnose` (async): run critic;
  for a `material-correct` route, `await propose(...)` → `applyCorrection(...)` (policy) → `applyRegionEdit`
  (lock) → `validate` (AJV); on success stash the corrected placements, push accepted additions to the
  shared `additions` log, record a proposal. `tweakFor` (sync): replay the stash for the material route,
  else identity. Mirrors `makeFormEditor` exactly (async-propose/sync-replay crux).
- `defaultProposeCorrection(artifact, R, observation, ctx, opts?) → {swaps, additions}` — the LIVE leaf
  (lazy spawn of the `.mts` bridge with the render crop + concept + indexed placements + current palette).
  NOT unit-tested.

### 4. `baml_src/materialcorrect.baml` (the proposer prompt)
- `class MaterialSwap { target int; block string }`
- `class MaterialAddition { block string; conceptMaterial string; where string; rationale string }`
- `class RegionCorrection { swaps MaterialSwap[]; additions MaterialAddition[] }`
- `function CorrectRegion(subject, region, current_palette, placements, render: image, concept: image) ->
  RegionCorrection` — prompt: compare the build render to the concept; for each mis-zoned placement emit a
  recolor swap to a palette block; if a concept material is MISSING from the palette, emit an addition with
  its concept justification (material + where). RECOLOR ONLY — never move/add/remove geometry. `client
  ClaudeStub` (the project transport).

### 5. `src/revise/baml-material-correct.mts` (the live bridge)
Clone of `baml-revise.mts` but: reads `{renderPath, conceptPath, subject, region, currentPalette,
placements}`, sends **two** images (render + concept) via `requestTextWithImage`, parses
`b.parse.CorrectRegion`, writes `{swaps, additions}` to stdout. NOT unit-tested (metered).

### 6. `benchmarks/sculpture/material-correct.mjs` (the impure runner — the gatehouse proof)
Mirrors `glb-voxel-surgical.mjs` + `material-assign.mjs`. Steps:
- Input "before": `material-assign/gatehouse/artifact.json` (T-072). Concept:
  `runs/015-…/concept.png`. Map palette: `material-map/gatehouse.json` `.palette`. Secondary: artifact
  manifest ∖ map palette.
- `target = conceptMaterialTarget({conceptPath})`; `beforeAgreement = wholeObjectIoU-analogue`.
- Build `editor = makeMaterialEditor({critic: makeRegionCritic(regions), policy:{mapPalette, secondary}})`.
- `reviseLoop(artifact, {regions, observe, diagnose, tweakFor, score: liveMaterialScore({materialTarget:
  target})})` — the UNCHANGED loop.
- `afterAgreement`; per-region kept/rolled-back; `p14Report`; verdict (`improved|held|regressed`).
- Write `material-correct/gatehouse.json` (record: corrections, additions log, agreement before/after,
  matrix, p14) + `material-correct/gatehouse/artifact.json` (corrected, AJV-valid) + `.md`. `--offline`
  re-derives the verdict + re-validates from committed numbers (no GL/model).

## Unit test files (created, CI-safe — no GL, no metered call)

### 7. `src/form/material-target.test.mjs`
`colorAgreement`: identical clusters → 1; orthogonal far colors → ~0; coverage weighting; ΔEmax clamp.
`regionColorClusters` with a synthetic decoded image (hand-built RGBA) + injected `_decode`.
`conceptMaterialTarget.scoreRender` via `_decode` stubs (zero PNG decode). `resolveMaterialTarget`
pass-through + throw.

### 8. `src/form/material-policy.test.mjs`
`allowedPalette` union + normalization + dedup. `gateAddition`: accept a real, distinct, justified block;
reject unknown block / already-in-palette (no new role) / missing conceptMaterial / missing where; ACCEPT
a near-TONE distinct block (cobblestone beside stone_bricks — the AC#2 point). `classifySwap` three
branches. `applyCorrection`: in-palette swap applies; needs-addition swap applies iff its addition gated
ok and grows allowed; off-palette swap dropped (recorded); geometry-immutable (positions unchanged);
additions log correct.

### 9. `src/revise/material-edit.test.mjs`
`makeMaterialEditor` with an INJECTED `propose` (no model): a material route → swaps stashed → `tweakFor`
replays; an out-of-policy swap → nothing stashed → identity no-op (rolled back by the gate); the
async-propose/sync-replay contract; additions surfaced in the shared log; AJV revalidation path.

## Modified (additive only)

- **`package.json`** — add `"material:correct": "node benchmarks/sculpture/material-correct.mjs"`.
- **`.gitignore`** — add `benchmarks/sculpture/material-correct/**/*.png` (renders derived/gitignored,
  the project convention; the `.json`/`.md` + corrected `artifact.json` are committed).

## Untouched (zero regression surface)
`src/revise/loop.mjs`, `region.mjs`, `tweak.mjs`, `form-edit.mjs`; `src/form/form-target.mjs`,
`material-map.mjs`, `feature-classify.mjs`, `palette-augment.mjs`; the schema, the block→Lab table, every
frozen BAML fn, every existing runner. The loop is consumed, never modified.

## Ordering of changes
1. `material-policy.mjs` (+ test) — no deps beyond `material-map`/`cielab`; the foundation.
2. `material-target.mjs` (+ test) — depends on the color engine only.
3. `material-edit.mjs` (+ test) — depends on policy + `form-edit`'s `applyFormEdit`/`region`.
4. `materialcorrect.baml` + `baml-material-correct.mts` — the live proposer (after the pure consumer
   shape is fixed).
5. `material-correct.mjs` runner + `package.json`/`.gitignore` — wires it on the gatehouse.
6. Live gatehouse run → commit the record. Each step commits atomically; 1–3 are independently
   `npm test`-verifiable before any live call.
