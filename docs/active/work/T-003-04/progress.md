# T-003-04 render-tool — Progress

Status: **implementation complete.** All five plan steps landed across three commits;
both test suites green; the live tool path smoke-verified end to end.

## Commits

1. `32b2dd0` — L1 composition core `render/src/render-tool.mjs` + GL-gated test.
2. `6e36269` — L2 pure adapters `src/render-tool.mjs` + unit tests.
3. `bcbbff5` — L3 `createRenderServer` factory + both READMEs.

## What was built (vs. plan)

### Step 1–2 (Commit 1) — `renderArtifact` core + GL-gated test ✅
- `render/src/render-tool.mjs`: `renderArtifact(artifact, opts)` = `buildWorldFromArtifact`
  (T-003-02) → `renderBuild` (T-003-03), returning the union report
  `{ path, bytes, placed, unmapped, bounds, view }`. Re-exports `GL_AVAILABLE`/`GL_LOAD_ERROR`.
- `render/test/render-tool.test.mjs`: two GL-gated tests. Against real GL here:
  - sample artifact (`valid-industrial-house.json`) → valid PNG signature, `bytes > 2000`,
    `placed > 0`, `unmapped === 0`, non-null bounds. **(AC #1, #4.)**
  - sample then a 1-block artifact → distinct paths, `placed` independent (1-block → 1).
    **(AC #2: fresh world per call, no bleed.)**

### Step 3–4 (Commit 2) — pure adapters + unit tests ✅
- `src/render-tool.mjs` (L2 only at this commit): `RENDER_SERVER_NAME`/`RENDER_TOOL_NAME`,
  `derivePath`, `coerceArtifact` (→ `parseArtifact`), `toToolResult`, `toErrorResult`.
- `src/render-tool.test.mjs`: 11 pure tests — path derivation + traversal sanitization,
  valid/invalid/malformed artifact coercion, text-only vs. image-embedded results, the
  unmapped count + bounded detail sample, and the error-result shape. No SDK, no GL.

### Step 5 (Commit 3) — SDK factory + docs ✅
- Appended `createRenderServer(opts)` to `src/render-tool.mjs`: dynamic-imports the SDK
  (`tool`, `createSdkMcpServer`) and `zod`; defines a permissive zod input shape
  (`artifact` object + optional `embedImage`); handler coerces → derives path (per-server
  `counter` Map) → lazy-imports the L1 core → reads the PNG when embedding → `toToolResult`.
  Returns the `createSdkMcpServer({ name:'render', tools:[tool('render', …)] })` config.
- `render/README.md`: new module rows + a "Construct + render as one unit" section; the
  out-of-scope note now lists T-003-04 as implemented.
- top-level `README.md`: replaced the bare title with a harness-module table naming
  `src/render-tool.mjs` as the `mcp__render__render` wrapper, plus test instructions.

## Verification performed

- `npm test` (top level): **83 pass / 0 fail** — includes the 11 new pure tests, and
  proves importing `src/render-tool.mjs` pulls neither the SDK nor GL (the pure suite
  imports the whole module, `createRenderServer`'s heavy imports being dynamic).
- `cd render && npm test`: **24 pass / 0 fail** — includes the 2 new GL-gated tests,
  which ran (not skipped) against the available headless GL.
- **Live tool smoke** (manual, not in `npm test`): built the server with
  `createRenderServer()` → `name === 'render'`, one registered tool `render`; then invoked
  that registered tool's handler with the sample artifact → returned `text` + `image`
  content blocks, wrote `render/out/phase1-house-singleshot-0001.png`, `placed: 196`,
  `unmapped: 0`, valid PNG signature, ~79.7 KB base64 image block. This exercises AC #1–#4
  through the actual `mcp__render__render` surface, not just the underlying core.

## Deviations from plan

1. **Default-outDir helper.** L3 needed a concrete default output directory. Added a small
   `DEFAULT_OUT_DIR` (= `render/out/`) derived via a local `dirnameOf(import.meta.url)`
   helper rather than a top-level `node:url` import — keeps the module's import surface
   minimal and the default lands renders next to the existing sample/CLI output. Within
   the plan's intent ("factory owns an `outDir`"); just made the default explicit.
2. **Traversal assertion tightened correctly.** The first `derivePath` traversal test
   asserted `!path.includes("..")`, which failed because sanitization maps `/`→`_` but
   leaves literal dots (harmless inside one filename segment). Reworked the assertion to
   the real safety property: `dirname(path) === outDir` — the id collapses to a single
   segment and cannot escape. (Plan §"Risk" anticipated assertion fiddling.)
3. **Stronger live smoke than planned.** Plan §Step 5 called for a server-name/tool-name
   smoke only. Because GL is available in this environment, I additionally drove the
   registered tool's handler end-to-end on the sample artifact (above) — a fuller AC #3
   proof. Still manual / outside `npm test` (SDK-touching), consistent with repo policy.
4. **zod shape kept, no fallback needed.** Plan §Risk flagged a possible
   `z.record(...)` rejection by the installed zod; it was accepted as-is (server built
   cleanly), so no `.passthrough()` fallback was required.

## Nothing left open in scope
All four ACs are met and verified. Remaining items are explicitly out of this ticket's
scope (see review.md "Open concerns").
