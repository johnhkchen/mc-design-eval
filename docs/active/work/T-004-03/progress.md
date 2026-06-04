# T-004-03 Progress — end-to-end-smoke-trial

Status: **implementation complete**. All three planned commits landed; pure suite
90/90; the render half verified live (GL) unmetered; the metered SDK half is the only
unexercised path (no credentials in this env) and is documented as such.

## Commits (leaf-first, as planned)

1. `44ab0e1` — extract shared `renderSummary` from `toToolResult` (no behavior change).
2. `669df49` — `smoke-trial.mjs` orchestrator wires the render tool + saves the image.
3. `63a21ba` — `run-trial.mjs` renders the milestone image end to end; `smoke:run`
   alias; README milestone section.

## What was built (vs. plan)

| Plan step | Delivered | Notes |
| --- | --- | --- |
| 1. extract `renderSummary` | `src/render-tool.mjs` + 2 tests in `render-tool.test.mjs` | `toToolResult` rewritten to call it; its existing tests untouched and green. |
| 2. orchestrator + pure tests | `src/smoke-trial.mjs` + `src/smoke-trial.test.mjs` (5 tests) | `runToolOptions`, `attachRender` pure; `runSmokeTrial` live. |
| 3. entrypoint + docs | `scripts/run-trial.mjs`, `package.json`, `src/README.md` | `trial:run`/`smoke:run` both launch the milestone. |

Test count: 83 (baseline) → 85 (step 1) → 90 (step 2) → 90 (step 3). `npm test` (schema
gate + units) fully green at each commit.

## Verification performed

- **Pure suite, offline (`npm test`): 90/90.** The fact that `smoke-trial.test.mjs`
  runs under `node --test` is itself the proof that importing `smoke-trial.mjs` loads
  neither the Agent SDK nor the GL/prismarine core (both are lazy: SDK via
  `createRenderServer`, GL via the dynamic `import("../render/src/render-tool.mjs")`).
- **AC #1 (pure):** `renderToolOptions({}) → { mcpServers:{render}, allowedTools:
  ["mcp__render__render"] }`, and merged over `SAFE_TRIAL_OPTIONS` it passes
  `assertSafeOptions` — wiring the tool introduces no forbidden tool / bypass.
- **AC #2/#3 (live, GL, unmetered):** drove the shipped sample
  `schema/examples/valid-industrial-house.json` through the orchestrator's exact render
  + `attachRender` path (a throwaway probe, since removed). Result: a valid **59,789-byte
  PNG** (correct `89 50 4E 47…` signature) at `trials/_smoke_check/render.png`, and a
  `trial.json` whose record carried
  `render: { image:"render.png", bytes:59789, placed:196, unmapped:0, bounds:{min:[0,0,0],max:[6,4,6]} }`.
  This exercises materialize → render → saved image → self-describing record without the
  SDK. The probe dir was cleaned up afterward.
- **AC #4 (metered, NOT run):** the full `npm run trial:run` (live SDK generation +
  render) was **not** executed — no API credentials in this environment, and the SDK
  call bills at full rates (spec §4). The generation seam is independently covered by
  the `sdk-binding`/`trial` pure suites over mock SDK messages; the render seam is
  covered live above. The only un-run composition is "SDK produces the artifact, then we
  render it," which is straight-line glue over two separately-verified halves.

## Deviations from the plan

1. **`attachRender` drops `summary.path` instead of storing it.** The design said the
   record stores `image` (relative) and "keeps the summary fields"; `renderSummary`
   includes an absolute, env-specific `path`. Storing both the absolute path and the
   relative image is redundant and leaks the runner's filesystem layout into the logged
   record. `attachRender` therefore destructures `path` out and keeps only `image` +
   the portable fields (`bytes`, `placed`, `unmapped`, `bounds`). Pure-tested
   (`assert path === undefined`). Rationale recorded here per the workflow.
2. **Added `RENDER_IMAGE_NAME` / `RENDER_TOOL_FQN` exported constants.** Not named in
   the structure; introduced to avoid stringly-typed `"render.png"` / the
   `mcp__render__render` literal appearing in both the module and its test. Trivial,
   improves the test's intent. No behavior change.
3. **`createRenderServer` is pointed at the trial dir (`outDir: dir`).** So that any
   *in-session* tool render (multimodal, future) also lands in the trial store rather
   than the render domain's default `render/out/`. The canonical milestone image is
   still the harness's post-generation `render.png`; this only unifies where an
   in-session render would go. Mentioned in design's "Resulting shape"; restated here
   as it is a real wiring choice.

No deviations to the commit sequence, the module boundaries, or the public surface
named in `structure.md` beyond the two added constants.

## Known limitations (carried to review)

- The live end-to-end (`trial:run`) is unproven *in this environment* for lack of
  credentials; the metered seam is the only unexercised link and it is thin glue.
- `runSmokeTrial` rewrites `trial.json` (written first by `runTrial`, then again with
  the `render` field). One extra small write per trial — accepted for a self-describing
  single record (design Decision 3).
