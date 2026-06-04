# T-003-04 render-tool — Review

Handoff for a human reviewer. What changed, how it's tested, and what to watch.

## Summary

Exposes construct + render as a single tool the Agent SDK invokes with a design
artifact, returning the rendered image (spec §4). Implemented as three dependency-aligned
layers: a render-domain composition core (`renderArtifact`) in `render/`, SDK-free pure
adapters top-level, and an `createRenderServer` factory that wraps them as the
pre-committed in-process `mcp__render__render` tool. All four ACs met and verified end to
end on the shipped sample artifact.

## Files

**Created**
- `render/src/render-tool.mjs` — L1 `renderArtifact(artifact, opts)`: `buildWorldFromArtifact`
  → `renderBuild`, returning `{ path, bytes, placed, unmapped, bounds, view }`. SDK-free;
  GL only to run. ~65 lines.
- `render/test/render-tool.test.mjs` — GL-gated end-to-end suite (2 tests).
- `src/render-tool.mjs` — L2 pure adapters (`derivePath`, `coerceArtifact`, `toToolResult`,
  `toErrorResult`, identity constants) + L3 `createRenderServer(opts)` factory. ~200 lines.
- `src/render-tool.test.mjs` — pure unit suite (11 tests), no SDK/GL.

**Modified**
- `render/README.md` — module rows + "Construct + render as one unit" section; out-of-scope
  note updated.
- `README.md` (top level) — replaced the bare title with a harness-module table.

No dependencies added: `zod` and the Agent SDK were already present top-level; `render/`
gains nothing. No files deleted.

## Acceptance criteria

| AC | How met | Evidence |
| --- | --- | --- |
| #1 tool accepts an artifact, returns a PNG path | `renderArtifact` returns `path`; the tool's text block carries `{ path, … }` always (even when not embedding the image) | `render/test`: path asserted; `src/test`: `toToolResult` summary; live smoke wrote the file |
| #2 constructs world then renders, resets state between trials | `buildWorldFromArtifact` → `createEmptyWorld` (fresh world per call); only per-server state is a path-disambiguation counter | `render/test` "sequential renders share no state": 1-block render → `placed === 1`, unaffected by the prior large render |
| #3 invocable from an SDK session (in-process tool / MCP server) | `createRenderServer` builds `createSdkMcpServer({ name:'render', tools:[tool('render',…)] })` → `mcp__render__render` | live smoke: server `name === 'render'`, registered tool `render`, handler returns a valid `CallToolResult` |
| #4 sample artifact returns a correct image | `valid-industrial-house.json` rendered: valid PNG signature, 196 blocks placed, 0 unmapped | `render/test` (GL-gated) + live smoke |

## Test coverage

- **Pure (`npm test`, 83 pass):** all L2 adapters — path derivation incl. traversal
  sanitization, valid/invalid/malformed artifact coercion, text-only vs. image-embedded
  results, unmapped count + bounded detail, error-result shape. Also implicitly proves
  `src/render-tool.mjs` imports SDK-free and GL-free (the pure suite imports the whole
  module; `createRenderServer`'s heavy imports are dynamic).
- **GL-gated (`render` `npm test`, 24 pass):** `renderArtifact` against the real sample +
  the no-bleed sequential check. Skip cleanly (with the captured GL reason) on GPU-less CI,
  matching the established `view.test.mjs` / `scaffold.test.mjs` pattern.
- **Not in CI (by repo policy):** the live `createRenderServer` wiring and handler — verified
  by manual smoke here. SDK-touching code is never run unconditionally by `npm test`,
  consistent with `sdk-binding.mjs` / `trial.mjs`. This is the one untested-by-`npm test`
  seam; see Gaps.

### Gaps / what a reviewer should eyeball
- The handler (coerce → derivePath → renderArtifact → toToolResult) is glue over four
  individually-tested pure/integration pieces, but the *composition inside the handler* has
  no automated test — it relies on the manual smoke. If a regression guard is wanted, a
  thin test could import the module, monkeypatch the dynamic `renderArtifact` import, and
  assert the handler's branching (error passthrough, counter increment, embed toggle)
  without GL. Deferred as not required by the ACs.

## Open concerns (all out of this ticket's scope)

1. **Wiring into the harness.** `config.mjs` pre-committed the `mcp__render__*` allowlist
   entry, but `trial.mjs` / the archetypes do not yet pass `mcpServers: { render: await
   createRenderServer() }` into `query()` options. The single-shot archetype (T-004-02)
   renders off the structured-output artifact directly via the core — it does not need the
   tool. The tool is for the **multimodal** archetype (spec §7 archetype 3), which is a
   later ticket. So this is correctly deferred; the seam exists and is proven.
2. **Image-token accounting.** Embedding the PNG returns ~80 KB of base64 per render turn.
   The token-cost metric (spec §8) must attribute these image tokens to the multimodal
   archetype; that lives in the trial runner's tally (T-004-01 already separates per-turn
   usage), not here.
3. **`zod` shape is intentionally permissive.** The input schema declares `artifact` as a
   generic object with a description; the real contract is `parseArtifact` (one schema
   source — consistent with `sdk-binding.mjs` Decision 1). A reviewer who expects a rich
   model-facing JSON Schema for `artifact` should note this is deliberate: the SDK already
   has the canonical schema via the structured-output binding, and re-authoring it in zod
   was previously rejected.
4. **Default output dir.** Renders default to `render/out/` (next to the sample). For a
   real trial batch the harness should pass a per-trial `outDir`; the default is for
   demos/smoke. `render/out/` is git-ignored (`render/.gitignore`), so smoke renders won't
   be committed accidentally.

## Risk assessment
Low. The change is additive — no existing module was modified except two READMEs. The two
new heavy seams (GL render, SDK server) are isolated behind the established gates, both
suites are green, and the full tool path was exercised end to end on a real artifact.
