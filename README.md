# mc-design-eval

A measurement instrument for evaluating an LLM's spatial/material *design* capability via
constrained, styled Minecraft builds. See `docs/specification.md`. Phase 1 holds the model
fixed and compares prompting methods.

## Harness modules (`src/`)

| File | Responsibility |
| --- | --- |
| `src/artifact.mjs` | the design-artifact schema binding: `parseArtifact()`, `assertArtifact()`, `toModelSchema()` (T-001-01) |
| `src/expand.mjs` | placement-primitive → voxel expansion (`expandArtifact()`) (T-001-02) |
| `src/config.mjs` | single-sourced Phase-1 config: pinned model id, safe trial options (T-004-01) |
| `src/sdk-binding.mjs` | the one metered Agent SDK seam: `requestDesignArtifact()` (structured output) (T-001-03) |
| `src/trial.mjs` | the trial runner — prompt+model in, validated artifact + logged transcript + token tally out (T-004-01) |
| `src/single-shot.mjs` | the single-shot prompting archetype (spec §7) layered on the runner (T-004-02) |
| `src/render-tool.mjs` | the in-process **`mcp__render__render`** Agent SDK tool: construct+render an artifact, returning the PNG path (+ image) — `createRenderServer()` (T-003-04) |

The render harness (in-memory voxel world → headless PNG, no Minecraft server, no bot)
lives in `render/` as a separate package — see `render/README.md`. `src/render-tool.mjs`
is the SDK-facing wrapper around `render/src/render-tool.mjs`'s `renderArtifact` core.

## Test

```sh
npm test                # schema validation + all src/**/*.test.mjs (no SDK, no GPU)
cd render && npm test   # render scaffold + GL-gated render suites
```
