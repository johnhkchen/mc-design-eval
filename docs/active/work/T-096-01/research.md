# T-096-01 kit-extraction — Research

Epic E-26 / Story S-096. Goal: replace E-21's *color-role guessing* with *block recognition* —
a "kit" of the concept's depicted ingredients (`{block, role, formClass, whereUsed, confidence}`),
validated against the real Minecraft vocabulary, value-verified in CIE-Lab, and consumed by the
T-092 zone-map resolution. This document maps what exists; no solutions proposed.

## 1. The E-21 material-map chain (what the kit replaces/extends)

Three layers, the project's standard PURE/LIVE split:

- **Prompt**: `baml_src/materialmap.baml` — BAML multimodal function `MaterialMap(designDoc, image)`.
- **Bridge (LIVE)**: `src/form/baml-material-map.mts` — tsx script; reads `{conceptPath, docPath?}`
  on stdin, renders the BAML prompt, sends it through `requestTextWithImage` (the `claude -p`
  subscription shim, `PHASE1_MODEL_ID`), SAP-parses, writes `{materials:[…]}` to stdout. Never
  exercised by `npm test`.
- **Pure core**: `src/form/material-map.mjs` — `parseMaterialMap(rawObj)` validates rows
  (collect-don't-throw into `dropped`), `normalizeBlock`/`isKnownBlock`, closed
  `PLACEMENT_RULES = [walls, corners-edges, roof, base, trim, openings]`, `nearTonePairs`,
  `preservesDistinctGreys`. Unit-tested.
- **Runner (IMPURE)**: `benchmarks/sculpture/material-map.mjs` — spawns the bridge per subject,
  writes `material-map/<subj>.json` + `<subj>.raw.json`; **`--offline` re-validates the committed
  raw reply with no live call** — this raw-record + offline-revalidate pattern is the repo's
  E-24 Rule 2 "pinned re-run" idiom (also: durable-skin asserts agreement with committed records
  and throws on divergence).

### The exact defect the ticket names — confirmed in the artifact

`material-map/cottage.json` (committed):

- `white_terracotta` for the plaster panels, rationale "warm, matte CREAM" — a **color-role
  guess**; the concept (`runs/014-vConcept-a-cottage/concept.png`) depicts smooth sandstone
  panels. The contract never asked "which Minecraft block is this?".
- **The `dropped` array is the smoking gun**: the LLM *already recognized*
  `minecraft:spruce_door` (entry door), `minecraft:dark_oak_trapdoor` (shutters/lattice fills),
  `minecraft:lantern` (door lantern) — all dropped with reason `"unknown-block"` because
  `isKnownBlock` checks membership in the **block→Lab table**, which by construction holds only
  *full-cube, survival-obtainable* blocks (`src/color/block-table.mjs`, `classifyBlock`/
  `isFullCubeParent`). Recognition of fixtures already happens and is being discarded by the
  validator, not by the model.
- `stats`: 10 in, 7 kept, 3 dropped; 4 placement rules.

## 2. Block vocabulary sources

- **Block→Lab table** (`src/color/block-table.mjs` → committed `src/color/block-lab-table.json`):
  full-cube survival blocks with `[L,a,b]` (mean opaque texture pixels) and variance. Runtime
  load is zero-dependency (`loadBlockTable()`); the build path (`scripts/build-block-table.mjs`)
  lazily imports `minecraft-assets` + `pngjs` as build-time-only devDeps. **This is the repo's
  precedent for "derive from heavy deps at build time, commit JSON, consume dependency-free."**
- **`minecraft-data`**: NOT a root dependency (root deps = `@boundaryml/baml` only). It exists in
  two sub-workspaces: `render/` (`render/src/version.mjs`, memoised handle for the pinned
  version) and `palettes/` (`palettes/validate.mjs`). Resolvable via `createRequire` from inside
  those trees; verified live: version `1.20.1` → 1003 blocks, includes `oak_trapdoor`,
  `oak_fence`, `smooth_sandstone` (i.e., the full vocabulary covers fixtures/rails the Lab
  table excludes).
- **`palettes/validate.mjs`** is the precedent for "block IDs validated against `minecraft-data`"
  (AC #1): `mcData(version).blocksArray` → name set, plus a `NON_SURVIVAL` denylist (air,
  barrier, command blocks, fluids…) representing the spec's survival-placeable policy.
- `src/color/reuse-boundary.test.mjs` denylists `minecraft-*` imports **only for
  `src/color/cielab.mjs`** (the portable engine); other `src/` modules are not barred, but the
  committed-JSON pattern keeps runtime paths dependency-free.

## 3. The T-092 band-profile seam (what the kit must build on, not re-derive)

- **Pure core**: `src/color/band-profile.mjs` — `extractConceptZoneMap({gridResult, floorLines,
  layerCounts, upperTop, materialMap})` → `{readable, bands[], roof, params}`. Bands carry
  `{name: "band0", yRange, dominantBlock, dominantRole, share, secondaries[]}`; roles resolve
  1:1 from the material map (`resolveBandRoles`); `placementRule` classes gate dominance
  (`fieldBlocks` = walls rows, roof restricted to roof rows; trim/corners/openings are
  cross-band secondaries only).
- **Committed records**: `benchmarks/sculpture/zone-map/{cottage,gatehouse}.json`
  (schema `zone-map/v1`, written by `benchmarks/sculpture/zone-map.mjs`, `npm run zone:map`).
  Cottage derived bands: band0 y0..6 `stone_bricks` (share .919), band1 y7..13
  `white_terracotta` (share 1.0), roof dominant `dark_oak_planks` (per recent findings).
  Gatehouse: single band0 `stone_bricks`, roof `deepslate_tiles`.
- **Consumption point**: `benchmarks/sculpture/durable-skin.mjs` `buildSkin()` —
  step 1 computes the **value-true substitution** (T-086 snap: `gridFromPixels` validate-mode
  grid over the map's named manifest, `sampleRoleSwatches`, `selectValueTrueMap` →
  `substitution{named→chosen}`, agreement asserted against `value-select/<subj>.json`);
  step 4 derives the zone map (`extractConceptZoneMap` on the *same step-1 gridResult*),
  `zonesFromBands` (`src/view/zone-map.mjs`) turns bands into zone fill policies keyed on
  `dominantBlock`/secondaries; agreement asserted against the committed zone-map record.
  The named→shipped block mapping happens at exactly one point: `mapPolicy(policyNamed, sub)`
  where `sub` is the value-true substitution. **This `sub` is the current "snap" the AC says
  recognition must beat.**

## 4. Value-verification machinery available for reuse (AC #2)

`src/color/value-select.mjs` (T-086, pure, unit-tested):

- `SAMPLE_GRID_N = 96`; `estimateBorderColor(img)`; validate-mode `gridFromPixels(img,
  {whitelist, n, dropColor, cellMeans:true})` (`src/color/image-grid.mjs`) — the named block
  LOCATES its concept region (the proven locator T-092 also rides on).
- `sampleRoleSwatches(gridResult, namedBlocks)` → `Map<bare, {lab, cells}>` — per-block concept
  Lab swatch + cell support.
- `weightedDeltaE(a, b, w=CHROMA_WEIGHT=2)` — chroma-weighted distance (memory: plain ΔE76
  ranks pink #1; chroma-weighting is the established metric); `MIN_CELLS = 24` thin-sample
  floor; `familyOf`, `familyCandidates`, `SWITCH_MARGIN`.
- Block render Lab comes from the committed table (`loadBlockTable()`); `block-table.mjs` also
  exposes `srgbToLab` and texture-mean helpers (build path only).
- **Caveat from memory** (`ablation-value-de-tautology`, `value-true-palette-codesign`): when the
  swatch grid is quantized against the same palette being verified, ΔE can be partly
  tautological. The grid whitelist determines which pixels a block "claims"; verification of a
  *different* candidate block against that region is only meaningful if the region is located
  independently (e.g., whitelist = old map's named blocks, or cell means kept raw).

## 5. LLM invocation patterns (newest precedent ≠ BAML)

- `src/sdk-binding.mjs`: `requestText` / `requestTextWithImage({prompt, images, model, system})`
  — the `claude -p` subscription shim (`--output-format stream-json`). The metered Agent-SDK
  path is a drop-in behind the same seam but deliberately unused by tier code.
- `src/model-tier.mjs`: `runTieredOp({tier, prompt, images, invoke})` — tier→`--model` seam;
  `MODEL_TIERS = {light: claude-haiku-4-5, strong: PHASE1_MODEL_ID = claude-opus-4-8}`,
  `DEFAULT_TIER = "strong"`. AC #1 mandates the strong tier via the subscription shim.
- **T-093 precedent** (`benchmarks/sculpture/multi-angle-gate.mjs:282`): calls
  `requestTextWithImage` *directly* with a hand-built prompt + image, no BAML — the most recent
  multimodal-judge path skipped BAML entirely. E-21 (older) used BAML codegen
  (`baml_client/`, regenerated from `baml_src/*.baml`).

## 6. Conventions and constraints that bind this ticket

- **Purity idiom**: pure cores in `src/**` with `node --test "src/**/*.test.mjs"`
  (`npm run test:unit`; suite currently ~1084 tests); impure runners in `benchmarks/sculpture/`
  with file I/O + spawned bridges; GL renders are a lens, never logic.
- **E-25 Rule 3**: zero subject-specific code — subjects contribute data (registry entries),
  thresholds are exported generic constants.
- **E-24 Rule 2**: pinned/seeded re-runs — raw reply committed beside the parsed record,
  `--offline` revalidation, divergence-throws agreement checks between runners and committed
  records (`reproducibility-excludes-gl-from-decisions`).
- **Collect-don't-throw**: a metered call's partially-bad reply keeps good rows, surfaces
  `dropped` loudly (material-map.mjs header states this explicitly).
- **AC #2 sharp edge**: a Lab mismatch must *flag for review*, never silently color-snap;
  only surfaces the extractor *declares* unidentifiable get the (recorded) color-snap fallback.
- **Subjects**: cottage (`runs/014-vConcept-a-cottage/`) and gatehouse
  (`runs/015-vBuilding-…/`), registry shape in `durable-skin.mjs` `SUBJECTS`
  (concept, map, zoneMapRecord, valueSelectRecord paths).
- Output home by convention: `benchmarks/sculpture/<feature>/<subj>.json` + sibling `.md`;
  npm script per runner (`zone:map` precedent).

## 7. Open questions carried to Design

1. BAML function + bridge (E-21 pattern) vs direct `requestTextWithImage` prompt (T-093
   pattern) for the kit extractor.
2. Vocabulary delivery: build-time script → committed vocab JSON (block-table precedent) vs
   runtime `createRequire` into a sub-workspace's `minecraft-data`.
3. `formClass` ground truth: LLM-declared only, or cross-checked (cube ⇔ present in Lab table;
   fixture/rail ⇔ vocabulary-only)?
4. Where "recognition beats snap" lands: the one renaming point is `sub` in
   `buildSkin`/`mapPolicy`; committed value-select/zone-map agreement assertions constrain how
   the kit may alter shipped blocks without invalidating records.
5. How the kit "references the same bands": kit `whereUsed` tied to committed zone-map band
   names (band0/band1/roof) — the records exist for both subjects.
