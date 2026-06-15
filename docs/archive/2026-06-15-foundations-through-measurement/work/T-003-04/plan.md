# T-003-04 render-tool — Plan

Five ordered, independently-committable steps, leaf-first (L1 → L2 → L3 → docs).
Each step lists its change, its test oracle, and the AC it advances.

## Step 1 — L1 composition core: `render/src/render-tool.mjs`

**Change.** Create `renderArtifact(artifact, opts)` that calls
`buildWorldFromArtifact` then `renderBuild` and returns the union report
`{ path, bytes, placed, unmapped, bounds, view }`. Re-export `GL_AVAILABLE`,
`GL_LOAD_ERROR` from `render.mjs`.

**Test oracle.** Deferred to Step 2's test file (they ship together as one
`render/` change) — but the function is small enough to eyeball: it must thread
`build.placed`/`build.unmapped`/`build.bounds` from `buildWorldFromArtifact` and
`r.path`/`r.bytes`/`r.view` from `renderBuild`, with no other logic.

**AC.** #1 (returns path), #2 (construct→render, fresh world per call).

## Step 2 — L1 GL-gated test: `render/test/render-tool.test.mjs`

**Change.** Add the integration test from Structure §4.

**Test oracle (`cd render && npm test`):**
- With GL: loads `schema/examples/valid-industrial-house.json`, `renderArtifact`
  writes a PNG whose first 8 bytes are `89 50 4E 47 0D 0A 1A 0A`, `bytes > 0`,
  `placed > 0`, `unmapped.length === 0`. **(AC #4.)**
- Two sequential renders (sample + a 1-block artifact) → distinct `path`s and
  independent `placed` (1-block artifact reports `placed === 1`). **(AC #2.)**
- Without GL: both tests `t.skip(reason)` — suite stays green.

**Commit 1** after Steps 1–2: "T-003-04: renderArtifact composition core + GL-gated test".

## Step 3 — L2 pure adapters: `src/render-tool.mjs` (helpers only)

**Change.** Create the file with the L2 exports ONLY (no `createRenderServer` yet):
`RENDER_SERVER_NAME`, `RENDER_TOOL_NAME`, `derivePath`, `coerceArtifact`,
`toToolResult`, `toErrorResult`. Import `parseArtifact` from `./artifact.mjs`.
No SDK, no GL, no prismarine imports anywhere in the module's top level.

**Test oracle.** Step 4's unit test.

## Step 4 — L2 unit test: `src/render-tool.test.mjs`

**Change.** Add the pure unit tests from Structure §3.

**Test oracle (`npm test` at top level):**
- `derivePath('out','t',0)` → `out/t.png`; `(…,1)` → `out/t-rev1.png`; distinct trialIds → distinct paths.
- `coerceArtifact(validSample)` → `{ ok:true, artifact }`; `coerceArtifact({})` and
  a malformed object → `{ ok:false }` whose `result.isError === true` and whose text
  contains located lines.
- `toToolResult(report, { embedImage:false })` → one `text` block; parsed JSON has
  `path`, `placed`, `unmapped` (a count), `bytes`.
- `toToolResult(report, { embedImage:true, pngBuffer:Buffer.from([0x89,0x50]) })` →
  text block + image block (`type:'image'`, `mimeType:'image/png'`, `data` = base64 of the buffer).
- `toErrorResult(['  bad'])` → `{ isError:true, content:[{type:'text', text:/bad/}] }`.
- Runs with no SDK and no GL (the whole point of the L2/L3 split).

**Commit 2** after Steps 3–4: "T-003-04: pure render-tool adapters + unit tests".

## Step 5 — L3 SDK factory + docs

**Change.**
- Append `createRenderServer(opts)` to `src/render-tool.mjs` (Structure §2 internals):
  dynamic-import the SDK (`tool`, `createSdkMcpServer`) and `zod`, build the input
  shape, define the handler (coerce → derive path → lazy-import L1 `renderArtifact` →
  read PNG if embedding → `toToolResult`), own the per-server `counter` Map, and return
  the `createSdkMcpServer({ name:'render', tools:[tool('render',…)] })` config.
- `render/README.md`: add the "render tool" subsection.
- top-level `README.md`: add the two module-table rows.

**Test oracle.**
- `npm test` (top level) still green — `createRenderServer` is not imported by the
  pure test, and its presence in the module must not pull the SDK at import time
  (the SDK import is INSIDE the async factory, so `import './render-tool.mjs'` stays
  SDK-free). Verify by running the L2 test, which imports the whole module.
- Optional live smoke (manual, not in `npm test`): with the SDK installed,
  `const s = await createRenderServer(); ` → `s.name === 'render'` and its tool list
  contains `render`. Documented in progress.md, not asserted by CI.

**AC.** #3 (invocable from an SDK session as `mcp__render__render`).

**Commit 3** after Step 5: "T-003-04: render MCP server factory + README wiring".

## Testing strategy summary

| Layer | File | Runner | Gate | ACs |
|-------|------|--------|------|-----|
| L1 core | `render/test/render-tool.test.mjs` | `render` `npm test` | GL (`t.skip`) | #1, #2, #4 |
| L2 pure | `src/render-tool.test.mjs` | top `npm test` | none | #1, #2, #4 (formatting) |
| L3 factory | (smoke, manual) | — | SDK installed | #3 |

- **What gets unit tests:** every pure adapter (L2) and the composition contract via
  the GL-gated L1 test. These cover the path return (#1), the stateless/fresh-world
  reset (#2), and the correct-image-on-sample (#4).
- **What is integration-only:** the actual GL render (L1 test, GPU-gated) and the SDK
  server wiring (L3, manual smoke) — consistent with the repo's policy that GL- and
  SDK-touching code is gated/quarantined, never run unconditionally by `npm test`.
- **No regressions:** top-level `npm test` (schema validate + `src/**/*.test.mjs`) and
  `render`'s `npm test` must both stay green after every commit.

## Risk / deviation watch
- If `createRenderServer`'s mere presence somehow pulls the SDK at module load
  (e.g. a static import slips in), the L2 test will fail to import on a machine without
  the SDK. Mitigation: SDK + L1 imports are dynamic, inside the factory/handler only —
  verified by Step 4 passing.
- If `zod`'s `z.record(z.string(), z.unknown())` shape is rejected by the installed zod
  major, fall back to `z.object({}).passthrough()` (or `z.any()`); the contract check is
  `parseArtifact` regardless, so the zod shape is cosmetic. Document any such swap.
