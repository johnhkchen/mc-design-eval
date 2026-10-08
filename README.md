# mc-design-eval

A measurement instrument for evaluating an LLM's spatial/material *design* capability via
constrained, styled Minecraft builds. See `docs/specification.md`. Phase 1 holds the model
fixed and compares prompting methods.

**New here (human or agent)? Read [`docs/knowledge/what-we-learned.md`](docs/knowledge/what-we-learned.md)
first** — the harvest of what worked, what stalled, and why.

## Setup on a fresh clone

Verified 2026-10-07 on macOS (Node 22): fresh clone → the steps below → `npm test` 2446/2446.

```sh
npm ci                      # root harness (ajv, minecraft-data, BAML, Agent SDK)
(cd render && npm ci)       # render package; postinstall patches prismarine-viewer (stairs lens fix)
npm run baml:gen            # generate baml_client/ (gitignored)
npm test                    # 2446 tests, no network/GPU/keys needed
```

- **Node 20+.** `canvas` and `gl` are native modules: macOS uses prebuilt binaries; on Linux you
  may need build tools plus `libxi-dev libglu1-mesa-dev libcairo2-dev libpango1.0-dev`, and
  `xvfb-run` for headless GL. Probe GL with `cd render && node -e 'import("gl").then(m=>console.log(!!m.default(1,1)))'`.
- **Model calls** go through the `claude -p` headless shim — install Claude Code and log in; no API key.
- **Secrets** (only for concept-image / image→3D generation): `cp .env.example .env` and fill
  `GEMINI_API_KEY`, `MODAL_ENDPOINT_URL`. Never committed — carry them over by hand.
- **Not in git (local-only, regenerable or legacy):** render PNGs under `builds/` and
  `benchmarks/`, `trials/`, and the TRELLIS GLBs in `benchmarks/sculpture/glb/*.glb` (~60 MB,
  non-deterministic, the stalled 3-D path — copy them by hand only if you need to replay that path;
  manifest in `benchmarks/sculpture/glb/README.md`).
- **Ticket workflow:** `.lisa.toml` + `docs/knowledge/rdspi-workflow.md` (lisa is optional).

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
