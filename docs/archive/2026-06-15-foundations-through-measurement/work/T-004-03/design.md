# T-004-03 Design — end-to-end-smoke-trial

The milestone is *composition*, not new domain logic. The four research questions
each become a decision below. Guiding principle: keep the metered seam (`runTrial`)
and the archetype (`single-shot.mjs`) untouched in spirit; add a thin **milestone
orchestrator** that wires the render tool in and persists the image into the trial
store, following the established PURE/LIVE split.

## Decision 1 — A dedicated orchestrator module, not edits to `runTrial`/`runSingleShotTrial`

**Chosen:** new `src/smoke-trial.mjs` exposing LIVE `runSmokeTrial(spec)` plus pure
helpers. It composes the existing building blocks; it does not bloat them.

Options considered:

- **(A) Extend `runTrial` with an optional render step.** Rejected: `trial.mjs` is
  deliberately *SDK-only* — the one metered seam. Importing the render domain there
  couples the SDK seam to GL/prismarine and muddies "one concern per module." It
  would also force every trial (incl. pure-tested paths) to reason about rendering.
- **(B) Extend `runSingleShotTrial` to render + forward options.** Rejected:
  `single-shot.mjs` is a *prompt-construction policy* shared by future archetypes
  (multi-shot, multimodal). Rendering is orthogonal to prompt construction; adding it
  there couples the archetype to the render domain and to the trial store layout.
- **(C) New orchestrator that composes generation + render.** **Chosen.** It mirrors
  how the codebase already layers (`single-shot` layers on `trial`, which layers on
  `sdk-binding`). The orchestrator is the E-06 sink: the one place "generate, then
  photograph, then file both together" lives. Generation and render each stay pure of
  the other.

The orchestrator reuses single-shot's *pure* building blocks directly
(`buildSingleShotPrompt`, `assertAttribution`, `SINGLE_SHOT`) rather than calling
`runSingleShotTrial`, because it needs to thread SDK `options` (the render tool) into
`runTrial` — something `runSingleShotTrial` does not forward (Research §1). This is a
small, honest duplication of glue (build prompt → runTrial → assert), justified by the
added responsibilities (tool wiring + render + image persistence).

## Decision 2 — AC #1 and AC #2–4 are met by two distinct mechanisms

Single-shot is "one generation, no revision," so the model does **not** take a render
turn. The two obligations are therefore separate (Research §6 boundary):

- **AC #1 "wired into the harness as an invocable tool":** build the render MCP server
  via `createRenderServer({ outDir: <trial dir> })` and pass it into the trial's SDK
  options — `mcpServers: { render: <server> }` and `allowedTools:
  ["mcp__render__render"]`. This is exactly the wiring `config.mjs`'s
  `SAFE_TRIAL_OPTIONS` docstring already anticipates ("…added to `allowedTools` as an
  `mcp__render__*` tool…without touching this posture"). The tool is genuinely
  present and invocable in the session; the model is simply not prompted to use it.
- **AC #2–4 "materialize → render → saved image":** after the artifact is produced and
  attribution is asserted, the orchestrator deterministically renders the **final**
  artifact via the render-domain core `renderArtifact(artifact, { outPath })`, writing
  the canonical milestone image into the trial store. This guarantees the image exists
  regardless of whether any tool turn occurred — the robust, testable mechanism for
  "see an image."

Why both, not just the post-generation render? Because AC #1 is explicit and the
config already declares the intent; wiring the tool in is cheap, low-risk
(non-code-exec, passes `assertSafeOptions`), and makes the harness genuinely
render-capable for the multimodal archetype that follows. Why not rely on a model tool
call for the image? Because single-shot must not depend on emergent tool use for its
deliverable — the milestone image is a property of the harness, not the model's whim.

Alternative rejected: **invoke the render purely in-session and skip the post-hoc
render.** Rejected — single-shot won't call it, so there'd be no image; it would also
make the milestone non-deterministic and untestable offline.

## Decision 3 — Record the render in `trial.json` (rewrite), not a sidecar

**Chosen:** attach a `render` field to the record and rewrite
`trials/<trial_id>/trial.json`; the PNG is written to
`trials/<trial_id>/render.png`.

- The trial record already carries the token counts; making it *also* reference its
  image (`render: { image, bytes, placed, unmapped, bounds }`) yields a single,
  self-describing row that downstream scoring (E-04) joins on — the record points to
  every artifact of the trial. A sidecar `render.json` would split that.
- `runTrial` writes `trial.json` first; the orchestrator rewrites it with the render
  field appended. One extra small write, in exchange for a coherent record. The
  rewrite is a pure transform (`attachRender(record, summary)`) + one `writeFileSync`.
- The image filename is a constant `render.png` (the canonical "final photo"). The
  in-session tool, if ever invoked, writes its own `derivePath`-named files into the
  same dir — they never collide with `render.png`.

## Decision 4 — Reuse the tool's summary shape via an extracted `renderSummary(report)`

**Chosen:** factor the plain-object summary that `toToolResult` already builds into an
exported pure `renderSummary(report)` in `src/render-tool.mjs`; have `toToolResult`
call it (behavior unchanged), and have the orchestrator's record use it too.

- The tool result and the trial record want the *same* loggable facts (path, bytes,
  placed, unmapped count + bounded detail, bounds). One shape, one source — no drift
  between "what the model saw" and "what we logged."
- Extraction is behavior-preserving: `toToolResult`'s existing tests
  (`render-tool.test.mjs`) assert the summary fields and must still pass. The refactor
  is internal; the public surface of `toToolResult` is identical.
- The record stores `image: "render.png"` (the trial-relative name) plus the summary
  fields; it does **not** store the absolute `report.path` (that's environment-specific
  and already implied by the dir). `renderSummary` keeps `path`; the orchestrator maps
  it to the relative `image` for the record.

## Resulting shape (`runSmokeTrial(spec)`, LIVE)

```
const { prompt, seedMetadata } = buildSingleShotPrompt(spec)        // pure
const dir = join(outDir, spec.trialId)                              // known up front
const server = await createRenderServer({ outDir: dir })           // AC #1 wiring
const { record, artifact } = await runTrial({
  prompt, metadata: seedMetadata, model: spec.model, outDir,
  options: renderToolOptions(server),                              // mcpServers+allowedTools
})
assertAttribution(artifact)                                        // AC #4 (reuse)
const report = await renderArtifact(artifact, { outPath: join(dir,"render.png") })
const summary = renderSummary(report)                              // reuse tool shape
const finalRecord = attachRender(record, summary)                  // pure
writeFileSync(join(dir,"trial.json"), JSON.stringify(finalRecord,null,2)+"\n")
return { record: finalRecord, artifact, report, dir, imagePath: join(dir,"render.png") }
```

## Pure (npm test) vs. Live (out of npm test)

- **PURE, tested:** `renderToolOptions(server)` (shape + passes `assertSafeOptions`),
  `attachRender(record, summary)` (immutable augmentation), `renderSummary(report)`
  (the extracted shared shape).
- **LIVE, not in npm test (spec §4 billing + GL):** `runSmokeTrial`, exercised by the
  single command `npm run trial:run`. Its only non-pure logic is `createRenderServer`,
  `runTrial`, and `renderArtifact` — each already its own module's tested-or-documented
  live seam.

## Risk & mitigation

- *Adding a tool changes single-shot behavior.* The **prompt** is unchanged →
  attribution unchanged; the tool is merely available. `permissionMode:"dontAsk"` +
  the non-code-exec MCP tool means no interactive hang and no safety regression
  (`assertSafeOptions` still passes — verified by a pure test).
- *GL unavailable in some envs.* `renderArtifact` throws a clear GL-unavailable error;
  `run-trial.mjs` already has a friendly catch and will surface it. Pure tests never
  touch GL.
