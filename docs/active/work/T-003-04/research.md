# T-003-04 render-tool — Research

Epic E-02, spec §4. Expose construct + render as ONE tool the Agent SDK invokes
with a design artifact, returning the rendered image. This phase maps what already
exists; it proposes nothing.

## What the ticket asks

The four ACs reduce to: a single callable that (1) takes a design artifact,
(2) builds the voxel world (T-003-02) then renders it headless (T-003-03) with
state reset between trials, (3) is invocable from an Agent SDK session as an
in-process tool / MCP server, and (4) produces a correct image for a sample
artifact. The ticket explicitly frames this as the seam the experiment harness
calls during a trial "and, later, for multimodal revision turns."

Spec §4 sharpens AC #3: "The model reasons about the design, calls the tool with
a design artifact, and — when the prompting method calls for it — receives a
rendered image back for a revision turn." So the tool's *return* is naturally an
image (for multimodal grounding, spec §7 archetype 3), with the PNG path as the
durable, loggable handle (AC #1).

## The two halves to combine (already built)

### T-003-02 — voxel-world construction (`render/src/world.mjs`)
- `buildWorldFromArtifact(artifact, opts?) → Promise<BuildResult>` is the exact
  entry point: it calls `expandArtifact` (the cross-package seam to `src/expand.mjs`)
  then `buildWorldFromVoxels`.
- `BuildResult = { world, center: Vec3, bounds: Bounds|null, placed: number,
  unmapped: Unmapped[] }`. Construction is **total**: an unmappable voxel is
  recorded in `unmapped`, not thrown (so a single pass yields a complete report).
- `createEmptyWorld()` builds a **fresh** `prismarine-world` every call. There is
  no module-level mutable world — so "reset state between trials" (AC #2) is
  satisfied by *statelessness*: each build starts from a new empty world. Nothing
  to clear; nothing can bleed between calls.

### T-003-03 — headless render (`render/src/render.mjs`)
- `renderBuild(build, opts?) → Promise<{ path, bytes, view }>` is the named entry
  point the ticket text says T-003-04 "wraps". It takes the `BuildResult` shape
  (`{ world, bounds, center? }`), frames a comparable camera (`camera.mjs`) when
  `bounds` is present, writes the PNG to `opts.outPath` (default `render/out/build.png`),
  and **returns the path** — already AC #1's currency.
- `renderWorldToPng` is the lower-level call; `renderBuild` is the right altitude.
- GL gate: `GL_AVAILABLE` / `GL_LOAD_ERROR` are re-exported. Rendering throws if
  headless GL is unavailable. Every render test in `render/test/` skips (via
  `t.skip(reason)`) when `!GL_AVAILABLE` — the established pattern for GPU-optional CI.
- The render path already terminates prismarine-viewer's worker threads and drops
  the GL context per call (comment cites T-003-04 by name: "important for repeated
  calls"). So repeated tool invocations in one process are already supported.

**Composition is therefore trivial in the happy path:**
`buildWorldFromArtifact(artifact)` → `renderBuild(buildResult, { outPath })`.
The work of this ticket is (a) naming that composition as a stable unit with a
useful return shape, and (b) wrapping it as an SDK tool.

## The Agent SDK tool surface (`@anthropic-ai/claude-agent-sdk`)

- Top-level `optionalDependency` (`^0.3.162`), installed. `zod` is present
  top-level (verified) — the SDK's `tool()` input schema is a Zod raw shape.
- `tool(name, description, inputSchema, handler, extras?) → SdkMcpToolDefinition`.
  `handler: (args, extra) => Promise<CallToolResult>`. `inputSchema` is an
  `AnyZodRawShape` (a plain object of zod types, e.g. `{ artifact: z.object(...) }`).
- `createSdkMcpServer({ name, version?, tools[] }) → McpSdkServerConfigWithInstance`.
  A server named `render` surfaces its tools to the model as `mcp__render__<tool>`.
- `CallToolResult` carries `content: [...]` blocks — text and image
  (`{ type:"image", data:<base64>, mimeType:"image/png" }`) — plus optional
  `isError: true`. Image blocks are how a render is "returned" to the model (§4).
- Crucially, `tool()` and `createSdkMcpServer()` are **pure factory functions** —
  not network calls. Unlike `query()` they are free to call. Only `query()` is the
  live, metered seam. So building the server costs nothing and need not be quarantined
  the way `requestDesignArtifact` is — but the SDK *import* must still be optional.

## Established patterns this ticket must echo

- **One metered seam.** `src/sdk-binding.mjs` is the only place `query()` is reached,
  behind a dynamic `import(SDK_PACKAGE)` with a clear "not installed" error. `config.mjs`
  already anticipates this ticket: *"When the render tool is later exposed to the harness
  it is added to `allowedTools` as an `mcp__render__*` tool — a non-code-exec in-process
  tool."* So the server name `render` and the `mcp__render__*` shape are pre-committed.
- **Pure core / thin live glue split.** `trial.mjs`, `sdk-binding.mjs`, and
  `single-shot.mjs` all separate PURE, unit-tested functions from a single LIVE
  function that is NOT run by `npm test`. The render-tool must mirror this: a
  GL-/SDK-free pure layer (result formatting, input coercion, path derivation),
  a GL-gated composition core, and an SDK-touching factory.
- **Re-validate, don't re-author.** `sdk-binding.mjs` Decision 1 rejected a Zod
  re-authoring of the artifact schema; it feeds the JSON Schema to the SDK and
  re-validates output with `parseArtifact` (`src/artifact.mjs`). The render tool's
  zod input should stay minimal (an object with a description) and lean on
  `parseArtifact` / `assertArtifact` as the one contract check.
- **Cross-package imports resolve.** `render/src/world.mjs` already imports
  `../../src/expand.mjs`; node resolves `node_modules` from the importer's directory,
  so a top-level `src/` module importing `../render/src/*.mjs` gets `render/node_modules`
  (prismarine, gl) for free. Both directions of the seam are proven.

## Where the pieces live (boundary constraints)

- `render/` is a separate package (`mc-design-eval-render`) with its own
  `node_modules` (prismarine-*, gl, three, canvas) and `package.json`. It does NOT
  depend on the Agent SDK.
- The Agent SDK + `zod` live at the **top-level** package, alongside the harness
  (`src/trial.mjs`, `src/sdk-binding.mjs`, `src/single-shot.mjs`).
- Therefore the artifact→PNG composition (render-domain, SDK-free) belongs in
  `render/`, and the SDK tool wrapper belongs in top-level `src/` (where the SDK is
  declared and where the harness wires `query` options). This keeps each package's
  dependency set honest.

## The sample (AC #4)

`schema/examples/valid-industrial-house.json` is the shipped, schema-valid sample
artifact (fill floor + box shell + lines, industrial palette). It is the natural
AC #4 subject — an end-to-end "render a real artifact" check, distinct from
T-003-03's hand-built `buildSampleWorld()` (which bypasses the artifact contract).
`render/test/world-build.test.mjs` already exercises `buildWorldFromArtifact`; the
render side is GL-gated in `render/test/view.test.mjs`.

## Constraints & assumptions surfaced

- **Schema validity is assumed at the construction boundary** (T-003-02 doc:
  "gated upstream by `src/artifact.mjs`"). The tool receives model-authored JSON,
  so it must validate at its own door (defense in depth) — invalid input should
  become a tool error the agent can act on, not a thrown stack trace.
- **`unmapped` voxels are not failures.** Unknown/illegal blocks are skipped and
  reported; the render still happens. The tool's summary must surface the count so
  a scoring/agentic caller can see partial builds.
- **Path collisions across turns.** Multimodal revision means the same trial may
  render several times in one session; `renderBuild` defaults to a single
  `build.png`. The tool needs per-call distinct paths (derive from `trial_id` +
  a turn counter) so renders aren't overwritten.
- **GL may be absent.** Pure layers and the SDK factory must import and test
  without GL; only the actual render call needs it. Tests follow the `t.skip` gate.
