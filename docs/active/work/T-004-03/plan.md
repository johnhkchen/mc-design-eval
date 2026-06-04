# T-004-03 Plan — end-to-end-smoke-trial

Three commits, leaf-first (shared helper → orchestrator → entrypoint), each
independently verifiable. Baseline: `npm test` = 83/83 pass.

## Testing strategy

- **Pure unit (`npm test`, offline, no SDK/GL):** the extracted `renderSummary`, and
  the orchestrator's `renderToolOptions` + `attachRender`. These are the only new
  pure surfaces and they carry the load-bearing invariants (safe options, immutable
  record augmentation, correct tool name).
- **Behavior-preservation guard:** `toToolResult`'s existing tests must stay green
  after the `renderSummary` extraction — that *is* the proof the refactor changed
  nothing observable.
- **Live verification (NOT in `npm test`, spec §4 billing + GL):**
  - *Render half, unmetered:* run `renderArtifact` on the shipped sample artifact
    through the orchestrator's render+`attachRender` path (no SDK) to confirm
    `render.png` is a real PNG and the record gains a correct `render` field. GL-gated
    — skip with a note if headless WebGL is unavailable.
  - *Full path, metered (optional, needs API key):* `npm run trial:run` end to end.
    Documented in `progress.md`; not required to land if no credentials.

## Verification criteria (map to ACs)

- AC #1 — `renderToolOptions(server)` yields `mcpServers.render` +
  `allowedTools:["mcp__render__render"]` and passes `assertSafeOptions`; `runSmokeTrial`
  passes it into `runTrial`'s `options`. (Unit + code-read.)
- AC #2 — `runSmokeTrial` builds the house prompt, gets a schema-valid attributed
  artifact, and `renderArtifact` materializes + renders it. (Live render check.)
- AC #3 — `render.png` lands in `trials/<trial_id>/` and `trial.json` gains a `render`
  field referencing it, beside `artifact.json`/`transcript.jsonl`/token counts. (Live
  render check inspects the dir.)
- AC #4 — `npm run trial:run` is the single command and prints the viewable image path.
  (Manual.)

## Step 1 — Extract `renderSummary` (commit 1)

1. In `src/render-tool.mjs`, add exported pure `renderSummary(report)` holding the
   summary-object construction currently inside `toToolResult` (path, bytes, placed,
   `unmapped` count, `bounds`, and the `unmapped_detail` ≤5 sample when non-zero).
2. Rewrite `toToolResult` to `const summary = renderSummary(report)` then keep the
   image-block append unchanged.
3. In `src/render-tool.test.mjs`, import `renderSummary` and add one test asserting
   the shape on the existing `report` fixture, plus the `unmapped_detail` cap/absence.
4. **Verify:** `npm test` → 83 existing + 1 new pass, 0 fail. `toToolResult` tests
   unchanged and green.
5. **Commit:** `T-004-03: extract shared renderSummary from toToolResult (no behavior change)`.

## Step 2 — Orchestrator + pure tests (commit 2)

1. Create `src/smoke-trial.mjs`:
   - `renderToolOptions(server)` (pure).
   - `attachRender(record, summary, imageName="render.png")` (pure, immutable).
   - `runSmokeTrial(spec)` (live): build prompt → `dir = join(outDir, trialId)` →
     `createRenderServer({ outDir: dir })` → `runTrial({ ..., options:
     renderToolOptions(server) })` → `assertAttribution` → dynamic-import
     `renderArtifact` → render to `join(dir,"render.png")` → `renderSummary` →
     `attachRender` → rewrite `trial.json` → return `{ record, artifact, report, dir,
     imagePath }`. `outDir` defaults to `"trials"`.
2. Create `src/smoke-trial.test.mjs` with the four pure cases (Structure §test):
   `renderToolOptions` shape; it passes `assertSafeOptions`; `attachRender` shape +
   no-mutation; custom `imageName`.
3. **Verify:** `npm test` → all pass incl. the new suite. Importing `smoke-trial.mjs`
   must not load the SDK or GL (the test running offline proves it).
4. **Commit:** `T-004-03: smoke-trial orchestrator wires render tool + saves image`.

## Step 3 — Single-command entrypoint + docs (commit 3)

1. `scripts/run-trial.mjs`: import `runSmokeTrial`, swap the call (same `spec`
   literal), and log the saved `imagePath` + `placed`/`unmapped` from
   `record.render`. Keep the friendly catch.
2. `package.json`: add `"smoke:run": "node scripts/run-trial.mjs"`.
3. `src/README.md`: add the "Smoke trial (the milestone)" section — the full path, the
   updated trial-store layout (incl. `render.png` + `render` field), the single
   command, and AC #1 wiring vs. post-generation render.
4. **Verify:**
   - `npm test` still fully green (no pure surface changed here).
   - *Live render check* (GL-gated, unmetered): render the shipped sample artifact via
     the orchestrator's render+`attachRender` path; assert `render.png` PNG signature
     and a well-formed `render` field. Record result in `progress.md`.
   - *Optional metered:* `npm run trial:run` if credentials present; else note the SDK
     path is unexercised and why.
5. **Commit:** `T-004-03: run-trial renders the milestone image end to end (AC #1–#4)`.

## Risk register

- *Extraction regresses `toToolResult`.* Mitigated by step 1 verifying existing tests
  stay green before any dependent code exists.
- *Orchestrator accidentally pulls GL into pure tests.* Mitigated by the dynamic
  `import` of `renderArtifact` and the offline test suite proving it.
- *Render tool in-session perturbs single-shot.* Prompt unchanged → attribution
  unchanged; `assertSafeOptions` pass is unit-asserted. Documented in `progress.md`.
- *No GL / no API key in this env.* Pure suite is the gate that must pass; live checks
  are best-effort and their status is recorded honestly in `progress.md`/`review.md`.

## Out of scope (restated)

Scoring/rating (E-04/E-05), multi-shot/multimodal archetypes, the 3×3 matrix run,
and any change to the render domain or the metered SDK seam.
