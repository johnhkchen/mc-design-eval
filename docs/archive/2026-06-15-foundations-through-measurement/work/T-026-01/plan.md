# T-026-01 Plan — review-bookend (diagnostic critic)

Ordered, independently-verifiable steps. Each is small enough to commit atomically. The pure
routing core (steps 2–3) is the unit-tested heart; the BAML/GL leaves (steps 1, 4) are
verified by inspection + the codegen/typecheck, not by `npm test` (spec §4: metered + GL).

## Step 1 — BAML `DiagnoseFacade` + regenerate client

- Add `baml_src/review.baml`: `enum Defect`, `class FacadeDefect`, `class FacadeDiagnosis`,
  `function DiagnoseFacade(brief, render) -> FacadeDiagnosis` (client `ClaudeStub`), mirroring
  `judge.baml`.
- Run `npm run baml:gen`.
- **Verify:** command exits 0; `baml_client/` now references `DiagnoseFacade`
  (`grep -r DiagnoseFacade baml_client | head`). No `.mjs`/test impact yet.
- **Commit:** `feat(sculptor): DiagnoseFacade BAML function + regen client (T-026-01)`.

## Step 2 — Pure routing core in `review.mjs`

- Create `src/sculptor/review.mjs` with: header (pure-vs-live split), `DEFECTS`,
  `ROUTING_TABLE`, `ROUTE_TARGETS`, `DefectVocabularyError`, `assertDefect`, `routeDefect`,
  `routeDiagnosis`. Import only `occupiedCells` from `./build-state.mjs`. No live code yet.
- **Verify:** `node -e "import('./src/sculptor/review.mjs').then(m=>console.log(m.routeDefect))"`
  loads without pulling GL/SDK. (Full assertions land in step 3.)

## Step 3 — Unit tests for routing + stubbed orchestrator

- Add the live seam to `review.mjs`: `defaultRender`, `defaultDiagnose` (lazy imports), and
  `reviewBuildState({render, diagnose})` with the injectable defaults.
- Create `src/sculptor/review.test.mjs` covering (per structure.md test surface):
  table shape; per-defect routing; flat untextured→material vs textured-flat→relief; bad
  defect throws; `reviewBuildState` with stub render+diagnose for flat / clean fixtures;
  `routeDiagnosis([]) → []` and order preservation.
- **Verify:** `node --test src/sculptor/review.test.mjs` green; then full `npm test` green
  (target ≥ baseline 230 + new tests). The test file must NOT load GL/SDK/BAML (uses stubs).
- **Commit:** `feat(sculptor): diagnostic review critic — routing core + tests (T-026-01)`.

## Step 4 — Live BAML bridge `baml-review.mts`

- Create `src/sculptor/baml-review.mts` adapted from `baml-judge.mts`: stdin
  `{imagePath, brief}`; `b.request.DiagnoseFacade` (key dance); `requestTextWithImage`;
  brace-slice; `b.parse.DiagnoseFacade`; enum→kebab map; emit `{defects}` JSON. Single sample.
- Wire `defaultDiagnose` (step 3) to spawn `npx tsx baml-review.mts` if not already.
- **Verify:** `npx tsc --noEmit`-style sanity is not configured; instead
  `npx tsx --check src/sculptor/baml-review.mts` (parse) or a dry import. NOT run by
  `npm test`. Optional manual smoke against a real render is deferred to S-029.
- **Commit:** `feat(sculptor): live BAML diagnose bridge (T-026-01)`.

## Step 5 — Export + docs

- `src/sculptor/index.mjs`: add the review exports.
- `src/sculptor/README.md`: add the `review.mjs` bullet + boundary note.
- **Verify:** `node -e "import('./src/sculptor/index.mjs').then(m=>console.log(!!m.reviewBuildState))"`
  prints `true`; `npm test` still green.
- **Commit:** `feat(sculptor): export review critic + README (T-026-01)`.

## Testing strategy

- **Unit (npm test):** all routing logic, the vocabulary/table invariants, the flat
  state-driven disambiguation, and the full `reviewBuildState` pipeline with stub render +
  stub diagnose. This is the entirety of AC#1–#3 and the testable half of AC#4.
- **Not unit-tested (by design):** `defaultRender` (GL), `defaultDiagnose`/`baml-review.mts`
  (metered claude -p + BAML). Verified by codegen success + parse-check; live behavior is
  demonstrated in consolidation S-029, as the ticket states.
- **Regression:** full `npm test` must stay green end-to-end (validate self-tests + unit).

## Risks & mitigations

- **R1 — `npm run baml:gen` mangles unrelated client files.** Mitigate: run once, `git diff
  --stat baml_client` to confirm only additive `DiagnoseFacade` symbols changed; the generator
  is deterministic at pinned 0.222.0.
- **R2 — the test glob `src/**/*.test.mjs` accidentally loads the live seam.** Mitigate: the
  test imports only pure symbols and injects stubs; `reviewBuildState` defaults are never
  invoked in tests. Confirm by the test running with no GL/SDK installed.
- **R3 — `flat` disambiguation reads the wrong field.** Mitigate: two explicit fixtures
  (untextured vs textured-flat) lock both branches of D4.
- **R4 — enum case drift (BAML PascalCase vs JS kebab).** Mitigate: the mapping lives only in
  `baml-review.mts`; JS code and tests use the kebab vocabulary exclusively; a table test
  asserts `DEFECTS` matches `ROUTING_TABLE` keys.

## Done when

All ACs satisfied: structured `{defect,where,route}[]` from a render with an explicit
vocabulary + routing table (AC#1); routes-never-re-emits, flat fixture→`flat→material`, clean
fixture→none (AC#2); critic reads only build-state fields, no pass coupling (AC#3); `npm test`
green with the model call stubbed and routing tested directly (AC#4).
</content>
