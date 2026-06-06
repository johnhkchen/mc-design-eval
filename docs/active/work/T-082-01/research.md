# Research — T-082-01 right-sized-model-routing

Epic **E-23** / Story **S-082**, the **agentic-engineering** story. Because the 2.5-D layer
(T-078-01) scopes each op to a *view*, many sub-tasks are narrow enough for a **lighter model tier**.
This ticket builds the per-op tier seam over the subscription shim and proves it with two light-tier
exemplar detectors (roof-patch, hollowable-mass) run live on the cottage. Descriptive only.

## The model-invocation seam (where a `--model` override goes)

- **`src/sdk-binding.mjs`** — the single live, metered seam. The DEFAULT path shells out to the
  `claude -p` headless CLI authenticated by the **subscription** (not the Agent SDK over a metered API
  key). Every public entry already takes a `model` param that becomes `--model <id>` in the spawned
  argv:
  - `requestDesignArtifact({prompt, model, effort, system, onMessage})` — schema-forced JSON artifact.
  - `requestDesignArtifactWithImage({prompt, images, model, …})` — same, image-bearing.
  - `requestText({prompt, model, effort, system, onMessage})` → `{text, raw}` — **plain text, NO
    schema**. The basis for non-artifact ops.
  - `requestTextWithImage({prompt, images, model, …})` → `{text, raw}` — plain text, image-bearing.
    The LLM-as-judge / detector shape (render in, structured text out).
  - PURE helpers reused everywhere: `toImageBlock`, `serializeStreamJsonInput`, `stripToJson`
    (strips fences / brackets prose → bare JSON).
- **Argv construction** (the load-bearing detail): all four build
  `["-p","--output-format","stream-json","--verbose", …]` and push `--model <id>` ONLY when `model`
  is set, then `spawn(CLAUDE_CLI, args, …)`. **No API key is ever read or injected** — the CLI uses
  the subscription. The `@anthropic-ai/claude-agent-sdk` import is lazy and lives only on the SDK
  alternative path (`designArtifactOutputFormat`), never on the `claude -p` path.
- **`CLAUDE_CLI`** = `process.env.CLAUDE_CLI || "claude"` — overridable for tests.

## The single-sourced config (where tier IDs belong)

- **`src/config.mjs`** — pure data, no SDK import, no I/O. Already single-sources:
  - `PHASE1_MODEL_ID = "claude-opus-4-8"` — the pinned default ("strong" tier).
  - method ids (`DEFAULT_PROMPTING_METHOD_ID`, etc.), `FORBIDDEN_TOOLS`, `SAFE_TRIAL_OPTIONS`.
  - The convention (spec §4): the model id lives in EXACTLY ONE place so a Phase-2 sweep is one edit.
  - **There is no tier table yet.** This ticket adds `MODEL_TIERS = { light, strong }` here, with
    `strong` aliasing `PHASE1_MODEL_ID` so the pinned default stays single-sourced.
- The Haiku light id: the project convention is the dateless rolling alias (mirrors
  `"claude-opus-4-8"`). `claude -p --model` accepts the family alias.

## The views the detectors run on (T-078-01, already on disk)

- **`src/view/occupancy.mjs`** — `artifactOccupancy(artifact)` → `{bounds, dims, size, cells:Map,
  has, block}`. The PURE adapter; the substrate every detector reads.
- **`src/view/surface-grid.mjs`** — `projectSurface(occ, dir)` → a 2.5-D surface grid (front-most
  voxel + depth + normal per cell), `backProject`, `gridMaskOf`. Ortho + 45°.
- **`src/view/structural-read.mjs`** — the geometric feature extractor, all PURE:
  - `roofRegion(occ)` → `{cells:[{x,z,y,block}], yRange, coverage, area}` — **the roof-patch
    detector's input view.** `coverage < 1` ⇒ a hole in the skin.
  - `wallFields(occ)` → per-face `{surfaceCells, holes, blockCounts}` — skin holes + stray-material
    field. `footprint(occ)` → `{cells, bbox, width, depth, area}`. `storeyBands(occ)` →
    `{bands:[{yStart,yEnd,dominantBlock,fill}], floorLines}`. **The hollowable-mass detector's
    input.**
  - `structuralRead(occ)` bundles footprint + storeyBands + roofRegion + wallFields.
- **`src/view/multi-angle.mjs`** — `renderViews(artifact, angles, {outDir,…})` → `[{angle, path,
  bytes}]`. IMPURE (lazy-imports the render tool). The same-angle render a detector SEES. Named angles
  include `top`, `front`, `threeQuarter`, the 45° diagonals.
- **`src/view/reference-quantize.mjs`** — `quantizeToFace(img, grid, {manifest})` → cell-aligned
  material target (read-side). Not strictly required here but available as a richer detector prior.

## The detector PATTERN to mirror (resemblance judge)

- **`src/form/resemblance.mjs`** is the template: a PURE core holding (1) a FIXED judge PROMPT and
  (2) a verdict PARSER (imports `stripToJson` from sdk-binding), with the metered `claude -p` judge
  call living in the IMPURE runner (`benchmarks/sculpture/resemblance.mjs`). Schema tags
  (`RESEMBLANCE_SCHEMA = "resemblance/v1"`) version the contract; a block→Lab table is INJECTED so the
  core never touches fs. **The two detectors should follow this split exactly**: pure prompt-builder +
  pure parser in `src/view/`, metered call in a benchmarks runner.

## The live subject + the runner pattern

- **`benchmarks/sculpture/concept-materials/cottage/after-artifact.json`** — the built cottage, 6429
  `voxel` placements, manifest of 6 blocks (cobblestone, dark_oak_log, dark_oak_planks, spruce_planks,
  stone_bricks, white_terracotta). The roof reads in `roofRegion`; the cottage is the live subject for
  both detectors (the same subject T-078-01's `view:proof` uses).
- **`benchmarks/sculpture/view-layer-proof.mjs`** (npm `view:proof`) — the runner shape to copy: load
  the cottage → `artifactOccupancy` → `structuralRead` → `renderViews` (E-22 fixed lens) → write a
  report JSON to `docs/active/work/<ticket>/`. The detector-routing runner mirrors this, adding the
  two metered light-tier calls.
- **`package.json` scripts** — `view:proof` precedent; this ticket adds a `detect:routing` script.
  `npm test` = validate good/bad artifact + `npm run test:unit` (the `src/**/*.test.mjs` glob, ~816
  passing). New pure cores go in `src/` so the glob covers them.

## Constraints, boundaries, invariants

- **HARD invariant (ticket + standing Phase-1 rule):** lighter models are reached via the `claude -p`
  subscription shim with a `--model` override. **The metered API key must never enter this path.** A
  smaller model is still the subscription, just a smaller `--model`. The tier seam must therefore go
  through `sdk-binding`'s `requestText*` functions and never import the Agent SDK package nor read
  `ANTHROPIC_API_KEY`. This is a *test/assert* AC, not just a comment.
- **Purity split (load-bearing).** Pure cores (tier resolution, prompt builders, parsers, geometric
  priors) live in `src/` under the `src/**/*.test.mjs` glob — no GL, no I/O, no `Date`/`random`. Only
  the runner renders, decodes images, and makes the metered call.
- **Scoping rationale is a deliverable** (AC #3): tier chosen + why, per op, plus a short rubric
  (narrow detector/classification on one view → light; cross-view judgement / authoring a generator /
  material zoning → strong). Recorded as a single-sourced data table AND a written doc.
- **No air op** (`[[facade-recess-by-exclusion]]`): roof holes are the *absence* of a top voxel
  (`coverage < 1`), found by analysis — never stored as air.
- **DI for testability**: the live `requestText*` functions spawn a process and are not unit-tested
  (metered). The tier seam must accept an injected invoker so its routing is unit-testable without a
  spawn — mirroring how the resemblance core injects its block table.
- **Downstream**: the hollowable-mass detector feeds **T-080-01** (seal-before-hollow); its output
  shape (hollowable regions + blockers) should name skin-hole blockers so S-084's seal precedes the
  hollow.
</content>
</invoke>
