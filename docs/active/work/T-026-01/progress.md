# T-026-01 Progress — review-bookend (diagnostic critic)

Status: **implementation complete**, all ACs met, `npm test` green (254/254).

## Steps executed (per plan.md)

- **Step 1 — BAML `DiagnoseFacade` + regen.** Added `baml_src/review.baml` (enum `Defect`,
  `class FacadeDefect`, `class FacadeDiagnosis`, `function DiagnoseFacade(brief, render)`,
  client `ClaudeStub`). Ran `npm run baml:gen` — exit 0, "Wrote 14 files"; `DiagnoseFacade`
  now present across `baml_client/` (`request`/`parse`/`sync`/`async`).
- **Step 2+3 — pure routing core + tests.** `src/sculptor/review.mjs`: `DEFECTS`,
  `ROUTING_TABLE`, `ROUTE_TARGETS`, `DefectVocabularyError`, `assertDefect`, `routeDefect`,
  `routeDiagnosis`, the live leaves `defaultRender`/`defaultDiagnose` (lazy), and the
  injectable `reviewBuildState`. `src/sculptor/review.test.mjs`: 10 tests — vocabulary/table
  invariants, per-defect routing, flat state-driven disambiguation (untextured→material,
  textured-flat→relief), vocabulary guard, `routeDiagnosis` order/empty, and the orchestrator
  end-to-end with stubbed render+diagnose (flat fixture → `flat→material`; clean fixture → no
  defects; brief forwarded). All 10 green; the test file loads no GL/SDK/BAML.
- **Step 4 — live BAML bridge.** `src/sculptor/baml-review.mts`, a line-for-line analogue of
  `benchmarks/temple-facade/baml-judge.mts`: stdin `{imagePath, brief}` → `b.request`/`b.parse`
  `DiagnoseFacade` piped through `requestTextWithImage` → PascalCase→kebab map → `{defects}`
  JSON. Verified it transpiles (esbuild exit 0); NOT run by `npm test` (metered + BAML).
- **Step 5 — export + docs.** Added the review surface to `src/sculptor/index.mjs` (barrel
  resolves — verified) and documented the critic + boundary note in `src/sculptor/README.md`.

## Deviations from plan

- **None substantive.** Verification of the `.mts` used `npx esbuild … (exit 0)` rather than a
  `tsx --check` flag (tsx has no such flag); the esbuild transform is the equivalent
  parse/transpile gate.
- **Concurrency note:** `src/sculptor/massing.mjs` (T-025-01, the parallel bookend-1 thread)
  landed in `index.mjs`/`README.md` between my Research read and Implement. I appended the
  review exports/docs after the massing block; no overlap. Baseline test count rose to 244
  (massing's tests) + my 10 = **254**.

## AC verification

- **AC#1 — structured `{defect,where,route}[]`, explicit vocabulary + routing table.**
  `DEFECTS` + frozen `ROUTING_TABLE` are the explicit vocabulary/table; `routeDiagnosis`
  returns the structured list, not prose. ✔ (tests: table invariants, per-defect routing)
- **AC#2 — routes, never re-emits; flat fixture → flat→relief/material; clean → none.**
  Output references a stage to re-run (`route ∈ {massing,material,relief,curve,detail}`), never
  an artifact. Flat untextured fixture → `flat→material` (one of the relief/material pair,
  chosen from the state); clean fixture → `[]`. ✔
- **AC#3 — stage-agnostic build-state consumer.** `review.mjs` imports only `occupiedCells`
  from `build-state.mjs`; reads `occupied`/`material` cell fields only; no coupling to any
  pass. ✔
- **AC#4 — `npm test` green, model call stubbable, routing tested directly.** 254/254;
  `reviewBuildState` injects `render`/`diagnose`, the tests stub both; pure routing tested
  directly. The live BAML path is left to consolidation (S-029) per the ticket. ✔

## Files

Created: `baml_src/review.baml`, `src/sculptor/review.mjs`, `src/sculptor/review.test.mjs`,
`src/sculptor/baml-review.mts`. Modified: `src/sculptor/index.mjs`, `src/sculptor/README.md`,
regenerated `baml_client/**`.
</content>
