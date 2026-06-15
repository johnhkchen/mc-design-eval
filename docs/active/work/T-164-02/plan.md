# T-164-02 — Plan

Ordered, independently-verifiable steps. Each ends green and commits atomically. Verification per step.

## Step 1 — `RouteCritique` contract + bridge row
- `baml_src/department.baml`: append `DispatchItem`, `Dispatch`, `function RouteCritique(critique_block,
  department_idioms_block) → Dispatch` with the routing prompt (no images, no style, no gate vocabulary).
- `npm run baml:gen` to regenerate `baml_client` (so `b.request/parse.RouteCritique` exist).
- `src/baml/bridge.mts`: add the `RouteCritique` FNS row (request + parse).
- **Verify:** `npm run baml:gen` succeeds; a one-off `bamlRender({fn:"RouteCritique", args})` returns a
  prompt (manual node check); `npm run test:unit` still green (DPT3 still passes — enum unchanged).
- **Commit:** `feat(T-164-02): RouteCritique BAML contract + bridge row (Layer B)`.

## Step 2 — `src/workshop/route.mjs` (pure core) + unit tests
- Implement `ROUTE_SCHEMA`, `critiqueBlock`, `departmentIdiomsBlock`, `routeRenderArgs`, `resolveDispatch`,
  `dispatchToVerdict`.
- `src/workshop/route.test.mjs`: RT1–RT4 (render-args content/determinism/single-source; resolveDispatch
  membership + empty throws; dispatchToVerdict shape + done + trace envelope).
- **Verify:** `node --test src/workshop/route.test.mjs` green; no GL/IO imports.
- **Commit:** `feat(T-164-02): route.mjs — serializer, membership gate, verdict adapter`.

## Step 3 — route fixtures + fixtures.test.mjs + TG5
- Author `src/baml/fixtures/route/reply.txt` (3-item dispatch: ROOF→roof.gable, WALL→quoin,
  OPENING→opening-dressing) + `expected.json` + `reply-bad-idiom.txt`.
- Generate `inputs.json` (= `routeRenderArgs` over the committed barn Critique) and mint
  `prompt.golden.txt` offline via the bridge render (a small node script / inline). Pin-guard: these are
  new files (first derivation writes freely).
- `src/baml/fixtures.test.mjs`: append `R[18]–R[20]` ops + `FX-RT1`/`FX-RT2`.
- `src/baml/transport-guard.test.mjs`: add `"department.baml"` to the TG5 list.
- **Verify:** `node --test src/baml/fixtures.test.mjs` green (FX-RT1 byte-identical golden, FX-RT2 parse +
  non-vacuous); `node --test src/baml/transport-guard.test.mjs` green (TG3 importer set unchanged, TG5
  scans department.baml clean).
- **Commit:** `test(T-164-02): RouteCritique fixtures + parse pins + TG5 scope`.

## Step 4 — `--split` wiring in workshop.mjs
- Add `--split` flag; build `splitExchange` (diagnose→route via `runAsyncReplyPolicy`); select it in
  `seams.exchange`; accumulate + write `dispatch-trace.json` after a live split run; console-log routing.
- Imports added: `diagnoseRenderArgs`, `routeRenderArgs`/`resolveDispatch`/`dispatchToVerdict`,
  `runAsyncReplyPolicy`, `bamlParse`.
- **Verify:** `npm run workshop:offline` and `npm run workshop:replay` still pass (fused default unchanged —
  byte-identical committed records); `node --test src/workshop/isolation.test.mjs` green (no judge
  vocabulary added). Static read: `--split` defaults off, fused path untouched.
- **Commit:** `feat(T-164-02): workshop --split runs diagnose→route, fused default retained`.

## Step 5 — `route:smoke` witness + live run (AC3)
- `benchmarks/sculpture/route-smoke.mjs` (mirror diagnose-smoke): barn, diagnose→route ONE call each,
  resolve, `renderBesideConcept`, write `route-smoke-barn.json`.
- `package.json`: `route:smoke` script.
- **Verify (live, metered — spend caution):** `npm run route:smoke -- --subject barn` produces a resolved
  dispatch (every item a real idiom), a beside-concept PNG, and the trace JSON. Capture evidence into the
  work dir. If GL or assets are missing, the named errors fire (assertGlAvailable / missing-image).
- **Commit:** `feat(T-164-02): route:smoke live witness + barn dispatch evidence`.

## Step 6 — full suite + review
- **Verify:** `npm test` green end-to-end (validation + `test:unit`); `npm run baml:gen` clean (pretest).
- Write `review.md`.

## Testing strategy
- **Unit (in `npm test`):** route.mjs core (RT1–RT4); RouteCritique render golden + parse + non-vacuous
  (FX-RT1/2); resolveDispatch membership failure (route.test RT3); TG3/TG5; isolation; fused replay/offline
  byte-identity (regression guard that `--split` is inert by default).
- **Not automated (live, manual):** route:smoke (one metered call per layer, non-deterministic) — its
  OUTPUT is committed evidence, like diagnose-smoke; not a gating test.
- **Verification criteria per AC:**
  - AC1 → FX-RT1/2 + RT3 (every item resolves; bad idiom throws); `b.parse` fixture-tested.
  - AC2 → `--split` present, fused default; replay/offline byte-identical (fused untouched).
  - AC3 → route:smoke renders beside concept + writes the dispatch trace.
  - AC4 → `npm test` green; TG1–TG4 untouched, TG5 extended; loop.mjs + frozen instrument untouched.

## Risks / mitigations
- **`baml:gen` drift** could change another function's generated client — mitigate: only ADD classes/fn,
  run full suite (FX-C1/FX-DB1 goldens catch drift).
- **Golden mint** must be offline (no model) — use the bridge render mode exactly as diagnose did.
- **Async-parse re-ask** in splitExchange: use `runAsyncReplyPolicy` (not the sync `runReplyPolicy`); a null
  `expected` (exhausted) maps to a refused exchange the loop already handles.
- **Spend** on Step 5: ONE call per layer, no re-ask; preflight assets before any call (diagnose-smoke
  precedent).
