# T-005-04 — Research: iterative-neoclassical-trial-run

Map of what exists, where, and how it connects for the runnable end-to-end
neoclassical iterative trial. Descriptive only.

## Ticket in one line

One command runs the `iterative-multimodal.v1` archetype building a neoclassical
house on the `claude -p` path, saving **per-round WIP renders** so improvement is
visible round by round, plus a final render, with **per-round token usage** and total
cost in the trial record. This is the "watch it get better" deliverable.

## The DAG context (S-005)

- `T-005-01` shipped `palettes/neoclassical.json` (43 blocks) + `STYLE_BRIEFS.neoclassical`.
- `T-005-02` shipped the multimodal seam `requestDesignArtifactWithImage` in `sdk-binding.mjs`.
- `T-005-03` shipped the **archetype + loop**: `src/iterative-multimodal.mjs` (`runIterativeTrial`)
  + 26 pure unit tests. Committed at `61a5973`.
- `T-005-04` (this) is the **runnable trial + WIP renders** layered on that archetype —
  it mirrors `scripts/run-trial.mjs` the way `run-trial.mjs` exposes `runSmokeTrial`.

## Key files

### `src/iterative-multimodal.mjs` (the archetype, already exists)

`runIterativeTrial(spec)` — the LIVE driver (not unit-tested, spec §4). Today it:
1. Builds the round-0 draft via `requestDesignArtifact` (text seam) → writes `artifact-round0.json`,
   pushes a round-0 record (mode `text`, **no render**).
2. For `r = 1..N`: renders the **current (prior)** artifact to `derivePath(dir, trialId, r)`
   = `<trialId>-rev<r>.png`, feeds that PNG back through `requestDesignArtifactWithImage`
   with `buildRevisionPrompt(spec, r)`, guards (`assertTrialId` / `assertAttribution` /
   `assertInPalette`), writes `artifact-round<r>.json`, pushes a `multimodal` round record
   carrying that render summary + image name. Stops after N rounds or on `isNoOpRevision`.
3. Writes `artifact.json` (final), `transcript.jsonl` (all rounds concatenated), `trial.json`
   (`buildIterativeRecord`).

Pure, exported, unit-tested helpers: `assertSpec`, `seedMetadataFor`, `buildRound0Prompt`,
`buildRevisionPrompt`, `isNoOpRevision`, `assertInPalette`, `assertTrialId`,
`buildRoundRecord`, `buildIterativeRecord`, plus the frozen `ITERATIVE_MULTIMODAL`
descriptor (`id: "iterative-multimodal.v1"`, `defaultRounds: 3`).

`buildRoundRecord({round, mode, messages, raw, render?, image?})` already accepts an
optional `render`/`image` for ANY round (including 0) — it tallies usage via
`tallyUsage` and folds in `renderSummary(report)` with the absolute path stripped.

`buildIterativeRecord({artifact, rounds, roundsConfigured, stoppedReason, finishedAt})`
pulls identity from the final artifact, sums per-round totals via `sumTotals` (which
includes `total_cost_usd`), and records `archetype.rounds_run` / `stopped_reason`.

### `scripts/run-trial.mjs` (the model to mirror)

Thin entrypoint: imports `runSmokeTrial`, calls it with a fixed spec
(`{target, paletteId, style, trialId, seed, serverStateId}`), prints a one-block summary
(`status/model/method/turns/in/out/cost`, then the image path), `process.exit(0/1)`, and on
a `/Claude CLI/` error prints the "install + login" hint. `npm run trial:run` / `smoke:run`
both point at it.

### `src/smoke-trial.mjs` (the single-shot end-to-end precedent)

`runSmokeTrial` composes prompt → `runTrial` → render FINAL artifact → rewrite `trial.json`
with a top-level `render: { image: "render.png", bytes, placed, unmapped, bounds }`.
Defines `RENDER_IMAGE_NAME = "render.png"` and `attachRender(record, summary, name)`
(immutable; strips absolute path, keeps relative `image`). The baseline
`trials/phase1-house-singleshot-demo/trial.json` carries exactly that `render` block —
the format the iterative record should stay consistent with.

### `src/render-tool.mjs`

`derivePath(outDir, trialId, n)` → `<trialId>.png` (n=0) else `<trialId>-rev<n>.png`;
sanitizes the model-authored trialId so it can't escape `outDir`. `renderSummary(report)`
→ `{path, bytes, placed, unmapped, bounds, unmapped_detail?}` (the one shared loggable
shape). The live GL/prismarine core is `render/src/render-tool.mjs`'s `renderArtifact(artifact, {outPath})`
→ a `RenderReport` (`{path, bytes, placed, unmapped[], bounds}`), lazy-imported.

### `benchmarks/temple/run.mjs`

Independent precedent for a LIVE runner that renders + summarizes + keeps a progression
gallery; renders the final artifact to `render.png`, writes `summary.json`, regenerates a
README table. Notes `v1-iterative-multimodal` as a future approach "once S-005 lands."

### Config / data

`src/config.mjs`: `PHASE1_MODEL_ID = "claude-opus-4-8"`, `ITERATIVE_MULTIMODAL_METHOD_ID`,
`SAFE_TRIAL_OPTIONS` (no code-exec). `src/briefs.mjs`: `TARGET_BRIEFS.house` (modest 7×7–9×9),
`STYLE_BRIEFS.neoclassical`. `palettes/neoclassical.json`: 43-block whitelist for MC 1.20.1.

## Boundaries / constraints

- **One live seam.** All model calls go through `sdk-binding.mjs` (`requestDesignArtifact` /
  `requestDesignArtifactWithImage`). The archetype already orchestrates the seam directly.
- **`trials/` is git-ignored** (root `.gitignore`). The baseline demo is force-added; new trial
  output will not be committed unless explicitly force-added.
- **Live + metered + headless GL.** `runIterativeTrial` is excluded from `npm test`; only its
  pure helpers are tested. The runner script will follow that convention.
- **Spec §7 attribution.** `prompting_method_id` is single-sourced as `iterative-multimodal.v1`;
  any prompt-construction change bumps `.v2`. Round images and the record must stay keyed by
  the §5 `trial_id`.

## Gaps the ticket exposes (carried into Design)

1. **No runner / npm entry** — nothing mirrors `run-trial.mjs` for the iterative archetype.
2. **Image naming + final render.** Renders are `<trialId>-rev<n>.png`, not `round-N.png`,
   round 0 is never rendered, and the FINAL revision's output is never rendered (the loop
   renders only the *input* to each revision), so there is no `render.png` and no round-0 image.
   AC #2 wants `round-0.png … round-N.png` **plus** `render.png`, all referenced from `trial.json`.
3. **Per-round tokens + total cost (AC #3)** are already satisfied by `buildRoundRecord` /
   `sumTotals`; what's missing is referencing the round image LIST and the final image in the record.
4. **AC #4** is by-eye against `trials/phase1-house-singleshot-demo/` — requires a real live run.
