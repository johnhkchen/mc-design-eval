# T-003-04 render-tool — Structure

File-level blueprint for the three-layer tool (Design D1). Not code — the shape of it.

## Files created

### 1. `render/src/render-tool.mjs` — L1 composition core (render-domain, SDK-free)

The one place artifact→PNG is composed. Imports only render's own modules.

```
import { buildWorldFromArtifact } from './world.mjs'
import { renderBuild, GL_AVAILABLE, GL_LOAD_ERROR } from './render.mjs'
export { GL_AVAILABLE, GL_LOAD_ERROR }   // re-export so callers gate without a second import

/**
 * Construct the world from a (schema-valid) artifact, render it headless, and
 * return the union build+render report. Fresh world every call (AC #2: reset = stateless).
 * @param {{ placements: object[] }} artifact   schema-valid; validation is the caller's door
 * @param {{ outPath?: string, view?: object, strict?: boolean }} [opts]
 * @returns {Promise<RenderReport>}
 */
export async function renderArtifact (artifact, opts = {}) { ... }
```

`RenderReport = { path, bytes, placed, unmapped: Unmapped[], bounds, view }`.

Body (≈15 lines):
1. `const build = await buildWorldFromArtifact(artifact, { strict: opts.strict })`
   — `build = { world, center, bounds, placed, unmapped }`.
2. `const r = await renderBuild(build, { outPath: opts.outPath, view: opts.view })`
   — `r = { path, bytes, view }`. (`renderBuild` already handles the empty-build,
   `bounds == null` fallback, so an all-unmapped artifact still returns a path.)
3. `return { path: r.path, bytes: r.bytes, placed: build.placed,
             unmapped: build.unmapped, bounds: build.bounds, view: r.view }`.

No GL gate of its own — `renderBuild` throws on `!GL_AVAILABLE`, which is the
correct environment-fault behavior (Design D4).

### 2. `src/render-tool.mjs` — L2 pure adapters + L3 SDK factory (top-level package)

The SDK + zod live here. Pure helpers (L2) are exported and unit-tested; the factory
(L3) dynamically imports the SDK and L1.

Exports:

```
// --- L2 pure (no SDK, no GL, no prismarine) ---
export const RENDER_SERVER_NAME = 'render'        // → mcp__render__render (config.mjs pre-commit)
export const RENDER_TOOL_NAME   = 'render'

/** Per-call output path; disambiguates repeat renders of one trial (D5). */
export function derivePath (outDir, trialId, n) { ... }

/** Map a model-supplied artifact arg → parsed artifact or an error result (D4). */
export function coerceArtifact (input) // → { ok:true, artifact } | { ok:false, result: CallToolResult }

/** Build the CallToolResult from a RenderReport (+ raw PNG buffer when embedding). (D3) */
export function toToolResult (report, { embedImage, pngBuffer } = {}) // → CallToolResult

/** The error CallToolResult for a located validation failure (D4). */
export function toErrorResult (lines) // → { isError:true, content:[{type:'text', text}] }

// --- L3 live-ish factory (dynamic SDK import; not run by npm test) ---
/**
 * Build the in-process `render` MCP server (AC #3). dynamic-imports `tool` +
 * `createSdkMcpServer` from the SDK and `renderArtifact` from render/.
 * @param {{ outDir?: string, embedImage?: boolean, view?: object }} [opts]
 * @returns {Promise<McpSdkServerConfigWithInstance>}
 */
export async function createRenderServer (opts = {}) { ... }
```

`createRenderServer` internals:
- `const { tool, createSdkMcpServer } = await import('@anthropic-ai/claude-agent-sdk')`
  in a try/catch that rethrows the established "not installed — run npm install" message
  (copy the phrasing from `sdk-binding.mjs`).
- `const { z } = await import('zod')`.
- input shape: `{ artifact: z.record(z.string(), z.unknown()).describe('A complete,
  schema-valid design artifact (schema_version, metadata, style, palette, placements).'),
  embedImage: z.boolean().optional().describe('Return the PNG inline for visual review.') }`.
- handler `(args) =>`:
  1. `const c = coerceArtifact(args.artifact)`; if `!c.ok` return `c.result` (error).
  2. `const trialId = c.artifact.metadata?.trial_id || 'render'`;
     `const n = counter.get(trialId) ?? 0; counter.set(trialId, n + 1)`.
  3. `const outPath = derivePath(outDir, trialId, n)`.
  4. lazy `const { renderArtifact } = await import('../render/src/render-tool.mjs')`
     (kept dynamic so importing this module for L2 unit tests never loads prismarine/GL).
  5. `const report = await renderArtifact(c.artifact, { outPath, view })`.
  6. `const pngBuffer = embed ? readFileSync(report.path) : null`.
  7. `return toToolResult(report, { embedImage: embed, pngBuffer })`.
- `const counter = new Map()` is the ONLY per-server state (D5).
- wrap: `return createSdkMcpServer({ name: RENDER_SERVER_NAME, version: '0.1.0',
  tools: [ tool(RENDER_TOOL_NAME, '<desc>', shape, handler) ] })`.

`embed`/`outDir`/`view` resolve from `opts` with defaults (`embedImage` default `true`,
`outDir` default `render/out`).

## Files created (tests)

### 3. `src/render-tool.test.mjs` — L2 pure unit tests (`npm test`)
- `derivePath`: `n=0` → `<trialId>.png`; `n=1` → `<trialId>-rev1.png`; distinct trials → distinct paths.
- `coerceArtifact`: valid sample → `{ ok:true }`; missing `placements` / bad JSON → `{ ok:false }` with located lines in `result`.
- `toToolResult`: `embedImage:false` → exactly one text block whose JSON has `path/placed/unmapped`; `embedImage:true` + buffer → text + image block (`mimeType:'image/png'`, base64).
- `toErrorResult`: `isError === true`, text carries the lines.
- No SDK import, no GL — pure data.

### 4. `render/test/render-tool.test.mjs` — L1 GL-gated integration test (`render`'s `npm test`)
- Load `../../schema/examples/valid-industrial-house.json` (via `readFileSync` + `JSON.parse`).
- `t.skip(reason)` when `!GL_AVAILABLE` (copy the gate from `view.test.mjs`).
- AC #4: `renderArtifact(sample, { outPath: tmp })` → file exists, first 8 bytes === PNG magic, `bytes > 0`, `placed > 0`, `unmapped.length === 0` (the sample is all-mappable).
- AC #2: render two *different* artifacts sequentially (sample, and a 1-block artifact) → distinct paths, `placed` reflects each independently (no bleed).

## Files modified

### 5. `render/README.md`
Add a short "T-003-04 — render tool" subsection: `renderArtifact` is the artifact→PNG
composition; the SDK wrapper (`createRenderServer`) lives top-level. One usage snippet.

### 6. `README.md` (top-level) — module table
Add `src/render-tool.mjs` row: "in-process `mcp__render__render` tool (construct+render)".
Add `render/src/render-tool.mjs` row: "artifact→PNG composition core".

### 7. `package.json` (top-level) — NO functional change required
`zod` and the SDK are already present. The render tool needs no new dependency. (Confirm,
don't edit, unless a `test:unit` glob miss is found.) `src/**/*.test.mjs` already globs the
new test.

## Module boundary summary

```
   model (SDK session)
        │  mcp__render__render(artifact, embedImage?)
        ▼
 src/render-tool.mjs   ── L3 createRenderServer (SDK + zod, dynamic import)
        │               └ L2 coerceArtifact / derivePath / toToolResult  (pure, tested)
        ▼  dynamic import
 render/src/render-tool.mjs  ── L1 renderArtifact (GL-gated)
        │                 ┌ world.mjs  buildWorldFromArtifact  (T-003-02)
        └─────────────────┤
                          └ render.mjs renderBuild            (T-003-03)
```

Dependency direction is one-way (top-level `src/` → `render/src/`), matching the existing
`render/ → src/expand.mjs` seam in reverse. No package gains a new heavy dependency.

## Ordering of changes (feeds Plan)
1. L1 `render/src/render-tool.mjs` + its GL-gated test (self-contained; provable in `render/`).
2. L2 pure helpers in `src/render-tool.mjs` + `src/render-tool.test.mjs` (provable in `npm test`).
3. L3 `createRenderServer` factory (wires L2+L1+SDK; no new test gate beyond a smoke import).
4. Docs (both READMEs).
