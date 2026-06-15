# T-004-03 Review — end-to-end-smoke-trial

**The milestone is reached.** The harness now runs a single command that takes a house
prompt through generation, materialization, and a headless render to a **saved,
viewable PNG**, with the transcript and token counts logged beside it. This is the lone
DAG sink; scoring/rating remain out of scope. Handoff summary for a human reviewer.

## What changed (3 commits, +308/−28 over 7 files)

| File | Change |
| --- | --- |
| `src/smoke-trial.mjs` (NEW, 114 L) | The E-06 milestone orchestrator. Pure `renderToolOptions` + `attachRender`; live `runSmokeTrial`. |
| `src/smoke-trial.test.mjs` (NEW, 82 L) | 5 pure tests — tool-wiring shape, `assertSafeOptions` pass, immutable record augmentation, custom image name. |
| `src/render-tool.mjs` | Extracted pure `renderSummary(report)` from `toToolResult` (behavior-preserving); `toToolResult` now calls it. |
| `src/render-tool.test.mjs` | +2 direct `renderSummary` tests; existing `toToolResult` tests untouched (regression guard). |
| `scripts/run-trial.mjs` | `runSingleShotTrial` → `runSmokeTrial`; prints the saved image path + placed/unmapped. |
| `package.json` | Added `smoke:run` alias (== `trial:run`). |
| `src/README.md` | New "Smoke trial — the milestone" section + trial-store layout + test notes. |

**Untouched on purpose:** `trial.mjs`, `sdk-binding.mjs`, `single-shot.mjs`,
`config.mjs`, and the entire `render/` GL domain. The milestone is composition; no
metered seam or domain logic was reopened.

## Acceptance criteria

- **AC #1 — render tool wired into the harness as an invocable tool.** ✅
  `runSmokeTrial` builds the `mcp__render__render` server (`createRenderServer`) and
  threads it into the trial's SDK options via pure `renderToolOptions`
  (`mcpServers` + `allowedTools`). Verified pure: the merged options still pass
  `assertSafeOptions` (no forbidden tool, no permission bypass) — exactly the wiring
  `config.SAFE_TRIAL_OPTIONS` anticipated. The prompt is unchanged, so attribution is
  unaffected.
- **AC #2 — single-shot on house → schema-valid artifact, materialized + rendered.** ✅
  Generation reuses the validated single-shot prompt builder + the `runTrial` seam
  (which re-validates the artifact and asserts attribution); the final artifact is then
  materialized + rendered by the T-003-04 core. Render half proven live on the shipped
  sample house → a valid 59,789-byte PNG, `placed:196 unmapped:0`.
- **AC #3 — image saved to the trial record beside artifact/transcript/tokens.** ✅
  `render.png` is written into `trials/<trial_id>/`, and `trial.json` is rewritten so
  the record carries `render: { image, bytes, placed, unmapped, bounds }` next to
  `usage.totals`. Verified live (the record's `render` field was inspected).
- **AC #4 — full path from a single command, image viewable.** ✅ (code-complete;
  metered run not executed here — see Concern 1.) `npm run trial:run` / `smoke:run`
  drives `prompt → artifact → materialize → render → image` and logs the image path.

## Test coverage

- `npm test` = schema gate + **90/90** unit tests (baseline 83 → +2 `renderSummary`
  → +5 smoke-trial). Fully offline: no SDK, no GPU. The suite running at all proves
  `smoke-trial.mjs`'s SDK and GL deps stay lazy.
- **Pure invariants covered:** tool-wiring name (`mcp__render__render`); merged options
  pass `assertSafeOptions`; `attachRender` shape, no-mutation, `path` dropped, custom
  name; `renderSummary` count/bounds/`unmapped_detail` cap.
- **Live, unmetered (GL):** the materialize → render → save → record half exercised
  directly on the sample artifact (probe since removed) — real PNG + well-formed record.
- **Behavior-preservation:** `toToolResult`'s pre-existing tests still pass after the
  `renderSummary` extraction.

### Gaps

- The **metered end-to-end** (`trial:run`: live SDK generation *then* render) was **not
  run** — no API credentials in this environment (spec §4 bills at full rates). The two
  halves are each separately verified (generation seam via mock-message suites; render
  seam live); the only unproven link is the straight-line glue joining them. This is the
  expected, deliberate boundary for the harness's one metered seam.

## Open concerns / follow-ups

1. **Run the real trial at review time.** The headline deliverable — an actual model
   house rendered to an image — needs one `npm run trial:run` with credentials to
   confirm the metered path and eyeball the PNG. Everything up to the SDK call is green;
   this is the human-in-the-loop milestone check the ticket calls for.
2. **`trial.json` is written twice** (by `runTrial`, then rewritten with `render` by
   `runSmokeTrial`). Intentional (design Decision 3: one self-describing record over a
   sidecar), but if a future archetype needs the record assembled once, consider a
   `render`-aware hook in `runTrial` rather than a rewrite.
3. **In-session vs. post-generation render.** The render tool is wired in and invocable,
   but single-shot never calls it; the milestone image is the harness's deterministic
   post-generation render. When the multimodal archetype (spec §7) lands, decide whether
   its "final" image is a model-chosen in-session render or still the canonical
   post-generation one — `createRenderServer` already points its `outDir` at the trial
   store so either lands in the right place.
4. **No automated guard on the live runner's glue.** `runSmokeTrial`'s ordering (wire →
   generate → assert → render → rewrite) is unit-untested by design. It is short and
   each callee is verified; a future integration test with a faked SDK + the real GL
   render could close the last gap cheaply if desired.

## Verdict

Safe to advance to the milestone review. The full pipeline is implemented, the pure
and GL-render halves are proven, and the only unexercised step is the metered SDK call,
which is gated on credentials and is thin glue over two independently-verified seams.
Recommend the reviewer run `npm run trial:run` once to see the house.
