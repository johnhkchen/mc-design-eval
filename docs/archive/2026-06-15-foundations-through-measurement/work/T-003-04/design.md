# T-003-04 render-tool — Design

Decide the shape of the construct+render tool, grounded in Research. The happy-path
composition is trivial (`buildWorldFromArtifact` → `renderBuild`); the real choices
are *where the seam splits*, *what the tool returns*, and *how it is wrapped for the SDK*.

## Decision 1 — Three layers, split by dependency, not by convenience

The codebase's load-bearing pattern is "pure core, thin live glue, tested asymmetrically"
(`trial.mjs`, `sdk-binding.mjs`). Mirror it, but note this tool straddles TWO packages
with DIFFERENT heavy dependencies (render needs prismarine/GL; the wrapper needs the SDK).
So the split is along **dependency lines**:

- **L1 — composition core (`render/src/render-tool.mjs`):** `renderArtifact(artifact, opts)`.
  Pure render-domain: artifact in → `{ path, bytes, placed, unmapped, bounds, view }` out.
  Imports only render's own modules (world.mjs, render.mjs). Needs GL only to *run*;
  GL-gated tested like the rest of `render/test/`. **No SDK.**
- **L2 — pure adapter helpers (top-level `src/render-tool.mjs`):** `toToolResult(...)`,
  `coerceArtifact(...)`, `derivePath(...)`, the zod input shape. Plain data → data.
  **No SDK, no GL, no prismarine** — unit-tested by `npm test`.
- **L3 — SDK factory (same file):** `createRenderServer(opts)` — dynamically imports
  `tool` + `createSdkMcpServer`, wires one tool whose handler lazily imports L1 and
  calls it. Touches the SDK; NOT run by `npm test` (mirrors the live-call quarantine),
  though it is metering-free.

*Rejected:* a single module in `render/` that also depends on the SDK. That would add
the Agent SDK to `render/package.json` — a second copy of a heavy dep, in a package
whose whole identity (spec §3) is "no server, no bot, just build+render." The SDK belongs
where the harness and `query()` already live (top-level `src/`). Research confirms
top-level `src/` → `render/src/` imports resolve, so L3 reaching L1 is free.

*Rejected:* folding L1 into `renderBuild` itself (render.mjs). `renderBuild` is the
generic "BuildResult → PNG path" primitive (T-003-03) and knows nothing about artifacts.
Teaching it `expandArtifact` would couple the render contract to the artifact contract
and break the clean "render is artifact-agnostic" boundary world.mjs/render.mjs hold.

## Decision 2 — The core returns a report, not just a path

`renderBuild` returns `{ path, bytes, view }`. The tool needs more, because the agentic
caller (scoring, multimodal revision) must know *what was actually built*. So
`renderArtifact` threads through the `BuildResult` facts:

```
renderArtifact(artifact, opts) → {
  path, bytes,            // from renderBuild (AC #1 currency)
  placed,                 // BuildResult.placed — voxels actually written
  unmapped,               // BuildResult.unmapped[] — skipped blocks + reasons
  bounds, view            // framing provenance
}
```

This is the union of T-003-02's build report and T-003-03's render report, computed in
one pass. `unmapped` is first-class because construction is total (Research): a build that
silently drops 30% of its blocks but returns a clean path is a measurement bug. The
summary makes partial builds visible.

*Rejected:* returning only the path and re-deriving placement facts elsewhere. The facts
exist for free inside `renderArtifact`; discarding them forces a second world build.

## Decision 3 — The tool returns BOTH a text summary AND an image block

Spec §4: the model "receives a rendered image back for a revision turn." AC #1: returns a
PNG path. These are not in tension — satisfy both:

- a **text** content block carrying a compact JSON summary `{ path, bytes, placed,
  unmapped: N, bounds }` — the durable, loggable, path-bearing handle (AC #1, and what
  the single-shot harness needs);
- an **image** content block (`{ type:"image", data:<base64 PNG>, mimeType:"image/png" }`)
  — the visual grounding for multimodal archetypes (spec §7).

`createRenderServer({ embedImage = true })` gates the image block. Default `true` (the
image is the point of the tool turn); a non-multimodal caller can set it `false` to save
image tokens while still getting the path. The PNG is *always* written to disk and named
in the text block, so AC #1 holds regardless of `embedImage`.

*Rejected:* image-only return. The path must be logged per trial (spec §9) and the
single-shot/agentic harness joins on it — text is the loggable channel.

## Decision 4 — Validate at the door; partial builds are NOT errors

The tool receives model-authored JSON. Two distinct failure modes, handled differently:

- **Schema-invalid artifact** → return `{ isError: true, content:[text: located errors] }`.
  An agent can read the errors and revise — far better than a thrown stack trace. Reuse
  `parseArtifact` (`src/artifact.mjs`) — the ONE schema source (Decision: do not re-author
  in zod). The zod input shape stays minimal: `{ artifact: <object>, embedImage?: bool }`
  with a description; the real contract is `parseArtifact`.
- **Unmappable blocks** (`unmapped.length > 0`) → NOT an error. The build is total; the
  render happens; the count rides in the summary. Forcing an error here would punish a
  design for one bad block id and defeat the "complete report" property.

A render-infrastructure failure (GL unavailable, viewer throw) propagates as a thrown
error from L1 — that is an environment fault, not a model-correctable one, so it should
surface loudly, exactly as `renderBuild` already throws on `!GL_AVAILABLE`.

## Decision 5 — State reset = statelessness + per-call paths

AC #2 says "resetting state between trials." Research established there is no shared world
state — `createEmptyWorld()` is fresh per call. So the *world* reset is automatic; the
design just must NOT introduce shared mutable state (no cached world, no module-level
viewer). The one stateful concern is the **output path**: `renderBuild` defaults to a
single `build.png`, so two renders would overwrite. The factory owns an `outDir` and
derives a per-render path from the artifact's `metadata.trial_id`, disambiguating repeat
renders of the same trial (multimodal revision turns) with a small per-server counter:

```
derivePath(outDir, trialId, n) → join(outDir, n === 0 ? `${trialId}.png`
                                                       : `${trialId}-rev${n}.png`)
```

The counter is the ONLY per-server state, and it is monotonic + scoped to one server
instance — it cannot leak build geometry between trials. A test asserts two sequential
renders of *different* artifacts yield independent `placed` counts and distinct paths.

## Decision 6 — Verifying AC #4 without a GPU-only test suite

AC #4 ("sample artifact returns a correct image") is verified two ways, matching the
codebase's GL gate:
- **GL-gated integration test** (`render/test/render-tool.test.mjs`): load
  `schema/examples/valid-industrial-house.json`, call `renderArtifact`, assert the file
  exists, begins with the PNG magic bytes, `bytes > 0`, and `placed > 0`. Skips with the
  captured reason when `!GL_AVAILABLE` (so CI without a GPU stays green).
- **Pure unit tests** (`src/render-tool.test.mjs`): `toToolResult` produces the right
  content blocks for both `embedImage` modes and for the error case; `coerceArtifact`
  routes invalid input to an error result; `derivePath` is correct and collision-free.
  These run in `npm test` with no SDK, no GL.

The live `createRenderServer` (L3) is not unit-tested — like every SDK-touching function
in the repo — but a tiny smoke assertion (server name === "render", one tool named
"render") can run *if* the SDK is importable, gated like the GL tests.

## Summary of the chosen design

A three-layer tool: a GL-gated `renderArtifact` composition core in `render/`, a set of
SDK-free pure adapters in top-level `src/`, and an `createRenderServer` factory that wraps
them as the pre-committed `mcp__render__render` in-process tool. It returns a path-bearing
text summary (AC #1) plus an optional image (spec §4 multimodal), builds a fresh world
every call (AC #2), is invocable from any SDK session (AC #3), and is proven on the shipped
sample artifact (AC #4).
