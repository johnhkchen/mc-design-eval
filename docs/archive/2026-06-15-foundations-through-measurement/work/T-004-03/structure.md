# T-004-03 Structure — end-to-end-smoke-trial

The blueprint: 1 new module + 1 new test, a behavior-preserving extraction in the
render-tool wrapper, the entrypoint rewired, and docs. No changes to `trial.mjs`,
`sdk-binding.mjs`, `single-shot.mjs`, `config.mjs`, or the render domain.

## Files

### CREATE `src/smoke-trial.mjs` — the milestone orchestrator (E-06 sink)

Header comment: this is the lone DAG sink; composes single-shot generation + render
into `prompt → artifact → materialize → render → saved image`, persisting the image
into the trial store. Names the PURE/LIVE split and that the live runner is out of
`npm test`.

Imports:
- `node:fs` → `writeFileSync`; `node:path` → `join`.
- `./single-shot.mjs` → `buildSingleShotPrompt`, `assertAttribution`, `SINGLE_SHOT`.
- `./trial.mjs` → `runTrial`.
- `./render-tool.mjs` → `createRenderServer`, `renderSummary`, `RENDER_TOOL_NAME`,
  `RENDER_SERVER_NAME`.
- The render-domain core `renderArtifact` is **dynamically imported inside the live
  runner** (`await import("../render/src/render-tool.mjs")`) so importing this module
  for pure tests never loads GL — mirrors `render-tool.mjs`/`trial.mjs`.

Public interface:

```
// PURE — the SDK options that wire the render tool into a trial session (AC #1).
// server: the McpSdkServerConfigWithInstance from createRenderServer.
export function renderToolOptions(server)
  → { mcpServers: { [RENDER_SERVER_NAME]: server },
      allowedTools: [`mcp__${RENDER_SERVER_NAME}__${RENDER_TOOL_NAME}`] }

// PURE — return a new record with a `render` field; never mutates `record`.
// summary: the renderSummary(report) object. imageName: trial-relative png name.
export function attachRender(record, summary, imageName = "render.png")
  → { ...record, render: { image: imageName, bytes, placed, unmapped, bounds } }

// LIVE — the single-command milestone path (AC #1–#4). Not in npm test.
export async function runSmokeTrial(spec)
  → { record, artifact, report, dir, imagePath }
```

`runSmokeTrial` flow (Design "Resulting shape"): build prompt (pure) → compute
`dir = join(outDir, spec.trialId)` → `createRenderServer({ outDir: dir })` →
`runTrial({ prompt, metadata, model, outDir, options: renderToolOptions(server) })`
→ `assertAttribution(artifact)` → dynamic-import `renderArtifact` → render to
`join(dir,"render.png")` → `renderSummary(report)` → `attachRender(record, summary)`
→ rewrite `join(dir,"trial.json")` → return. `outDir` defaults to `"trials"` (matches
`runTrial`). `spec` is the single-shot `TrialSpec`; `assertSpec` runs inside
`buildSingleShotPrompt`, so a bad spec fails before any metered/GL work.

### CREATE `src/smoke-trial.test.mjs` — pure unit suite (`npm test`)

`node:test` + `node:assert/strict`. Imports `renderToolOptions`, `attachRender` from
`./smoke-trial.mjs` and `assertSafeOptions` from `./trial.mjs`. **Never** calls
`runSmokeTrial` (so neither SDK nor GL loads). Cases:

1. `renderToolOptions`: returns `mcpServers.render === server` and `allowedTools`
   contains exactly `"mcp__render__render"`.
2. `renderToolOptions` output **passes `assertSafeOptions`** (merged over
   `SAFE_TRIAL_OPTIONS`) — the wiring introduces no forbidden tool / bypass (Design
   risk mitigation).
3. `attachRender`: produces `record.render.image === "render.png"` and copies the
   summary fields; **does not mutate** the input record (deep-equal the original).
4. `attachRender`: a custom `imageName` is honored.

(`renderSummary` is covered by its own test in `render-tool.test.mjs` — see below.)

### MODIFY `src/render-tool.mjs` — extract `renderSummary(report)` (behavior-preserving)

Factor the plain-object summary currently inlined in `toToolResult` into a new
exported pure function:

```
// PURE — the loggable build summary shared by the tool result (model-facing) and
// the trial record (logged). path, bytes, placed, unmapped count + bounded detail
// sample (≤5) when non-zero, bounds.
export function renderSummary(report) → { path, bytes, placed, unmapped, bounds, unmapped_detail? }
```

`toToolResult` is rewritten to `const summary = renderSummary(report)` then
append-image-block exactly as before. Public behavior of `toToolResult` is
unchanged — its existing tests must stay green. The `unmapped`/`unmapped_detail`
logic moves verbatim into `renderSummary`.

### MODIFY `src/render-tool.test.mjs` — add a direct `renderSummary` case

Add one test importing `renderSummary` asserting the shape on the existing `report`
fixture (path/bytes/placed/unmapped count/bounds) and that `unmapped_detail` is
capped at 5 / absent when empty. Existing `toToolResult` tests are untouched
(regression guard for the extraction).

### MODIFY `scripts/run-trial.mjs` — render in the single command (AC #4)

Swap `runSingleShotTrial` → `runSmokeTrial` (same `spec` literal). On success also
log the saved image path and the render summary (`placed`, `unmapped`) so the one
command visibly produces a *viewable image*. Keep the existing friendly
SDK-not-installed catch; it already surfaces a clear GL-unavailable error too.

### MODIFY `package.json` — name the milestone command

Add `"smoke:run": "node scripts/run-trial.mjs"` as an intention-revealing alias
alongside the existing `trial:run` (both launch the same milestone now). No test-script
change — the pure suite is still `node --test "src/**/*.test.mjs"`, which now also
picks up `smoke-trial.test.mjs`.

### MODIFY `src/README.md` — document the milestone path

Add a "Smoke trial (the milestone)" section after the single-shot section: the
`prompt → artifact → materialize → render → saved image` path, the trial-store layout
now including `render.png` and the record's `render` field, and that `npm run
trial:run` / `smoke:run` is the single command. Note AC #1 wiring (the tool is
exposed as `mcp__render__render`) vs. the deterministic post-generation render.

## Module boundary summary

| Module | Concern | Touched? |
| --- | --- | --- |
| `src/smoke-trial.mjs` | compose generate+render, persist image (NEW) | create |
| `src/render-tool.mjs` | extract shared `renderSummary` | modify (no behavior change) |
| `scripts/run-trial.mjs` | single-command entrypoint, now renders | modify |
| `package.json` | name the command | modify |
| `src/README.md` | document the milestone | modify |
| `trial.mjs` / `sdk-binding.mjs` / `single-shot.mjs` / `config.mjs` | unchanged | — |
| `render/` (GL core) | unchanged | — |

## Ordering (so each step is independently verifiable)

1. Extract `renderSummary` in `render-tool.mjs` + its test → `npm test` green
   (proves the extraction is behavior-preserving before anything depends on it).
2. Create `smoke-trial.mjs` (pure helpers + live runner) + `smoke-trial.test.mjs` →
   `npm test` green (pure helpers verified, no SDK/GL).
3. Rewire `run-trial.mjs` + `package.json` + `README` → manual/live verification of
   the full path (GL render of the final artifact; SDK call is metered, optional).

## Trial-store layout after this ticket

```
trials/<trial_id>/
  artifact.json      # the validated design (runTrial)
  transcript.jsonl   # full SDK transcript (runTrial)
  trial.json         # record incl. usage.totals AND the new `render` field
  render.png         # the milestone image (runSmokeTrial)   ← AC #3
```
