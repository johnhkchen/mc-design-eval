# T-164-02 — Structure

File-level blueprint. The shape of the code, not the code. Ordering where it matters.

## Created

### `baml_src/department.baml` — APPEND (not a new file)
Add Layer B's contract + function alongside the existing Critique/Department/DiagnoseBuild (one file owns the
E-39 contract). New classes + function:

```
class DispatchItem {
  department Department
  idiom string @description("an idiom-registry name from the department's candidate set")
  why string @description("why this idiom addresses the critique item")
}
class Dispatch { items DispatchItem[] }

function RouteCritique(critique_block: string, department_idioms_block: string) -> Dispatch {
  client ClaudeStub
  prompt #"… you are routing a diagnosis to construction departments/idioms …
           {{ critique_block }} … candidates per department: {{ department_idioms_block }} …
           {{ ctx.output_format }}"#
}
```
No images. No `style`. No gate vocabulary (TG5). `enum Department` reused.

### `src/workshop/route.mjs` — NEW (the pure core)
Public interface:
- `ROUTE_SCHEMA = "dispatch/v1"` — the contract tag.
- `critiqueBlock({ critique })` → string. One numbered line per item: `department — expected: … / present:
  … / missing: … (severity)`. The router's reading material.
- `departmentIdiomsBlock()` → string. Per department, `DEPARTMENT: idiom, idiom, …` from
  `departmentToIdioms`. Single-sourced; deterministic (DEPARTMENTS + idiomNames are sorted).
- `routeRenderArgs({ critique })` → `{ critique_block, department_idioms_block }` — the typed BAML inputs.
- `resolveDispatch(dispatch)` → frozen validated `DispatchItem[]`. THROWS on: empty items
  (emptied-list-is-malformed), unknown department, idiom ∉ `departmentToIdioms(department)`, empty `why`.
- `dispatchToVerdict({ critique, dispatch })` → `{ verdict: { critique:{issues}, decision:"done",
  action:null, rationale }, dispatch }` — maps Critique items to loop issues, summarizes, attaches the
  resolved dispatch in the envelope (NOT inside verdict).

Imports: `DEPARTMENTS`, `departmentToIdioms` from `../pack/departments.mjs`. Pure — no GL/IO/Date/random;
runs under `src/**/*.test.mjs`.

### `src/workshop/route.test.mjs` — NEW (pure unit pins)
- `RT1` `routeRenderArgs` content: critique_block lists every item + department; department_idioms_block
  lists all 5 departments with their real idioms; deterministic across two calls.
- `RT2` `departmentIdiomsBlock` is single-sourced — every listed idiom resolves via `departmentToIdioms`
  and the union equals `idiomNames()` (no hand-list drift).
- `RT3` `resolveDispatch` accepts a good dispatch; THROWS on empty items, on `idiom` outside the
  department's set, on unknown department, on empty `why`.
- `RT4` `dispatchToVerdict`: verdict shape (`decision:"done"`, `action:null`, issues mirror the critique),
  dispatch carried in the envelope, rationale names the worst item's `department→idiom`.

### `src/baml/fixtures/route/` — NEW fixture set
- `inputs.json` — `routeRenderArgs({ critique })` over the committed barn Critique (diagnose `expected.json`).
- `prompt.golden.txt` — minted offline via the bridge render (no model).
- `reply.txt` — hand-authored 3-item dispatch (ROOF→roof.gable, WALL→quoin|surface.clinker,
  OPENING→opening-dressing), each `why` non-empty.
- `expected.json` — the parsed `Dispatch` the reply yields (post-`b.parse`, pre-resolve).
- `reply-bad-idiom.txt` — a dispatch routing a WALL item to `roof.gable` (idiom outside the department) —
  parses via `b.parse` but `resolveDispatch` must throw.

### `benchmarks/sculpture/route-smoke.mjs` — NEW (the AC3 witness)
Mirrors `diagnose-smoke.mjs`. Barn: load recognized program + pack + concept + committed renders; render
DiagnoseBuild → ONE tiered call → `bamlParse` → assert non-empty; render RouteCritique(`routeRenderArgs`) →
ONE tiered call → `bamlParse` → `resolveDispatch`; `renderBesideConcept(buildArtifact, conceptPath, …)`;
print + write `docs/active/work/T-164-02/route-smoke-barn.json` (the dispatch trace). Not in `npm test`.

## Modified

### `src/baml/bridge.mts` — ADD one `FNS` row
```
RouteCritique: {
  request: (a) => b.request.RouteCritique(a.critique_block, a.department_idioms_block),
  parse: (t) => b.parse.RouteCritique(t),
},
```
No images. No new `baml_client` importer (bridge.mts is already pinned) → **TG3 unchanged**.

### `benchmarks/sculpture/workshop.mjs` — ADD `--split` + `splitExchange`
- `const split = argv.includes("--split");`
- A `splitExchange(ctx)` closure beside the existing `exchange`: renders DiagnoseBuild +
  `diagnoseRenderArgs`, `runAsyncReplyPolicy` (parse = `bamlParse` + assert-non-empty Critique); then
  RouteCritique + `routeRenderArgs`, `runAsyncReplyPolicy` (parse = `bamlParse` + `resolveDispatch`);
  `dispatchToVerdict`; push the dispatch into a `dispatchTrace` array; return `{verdict, replies, askCount}`.
- `seams: { exchange: split ? splitExchange : exchange, render }`.
- After the loop (live mode): when `split`, write `dispatchTrace` to `rels.dir/dispatch-trace.json` and
  console-log the per-round `department→idiom` routing.
- Imports: `diagnoseRenderArgs` (diagnose.mjs), `routeRenderArgs`, `resolveDispatch`, `dispatchToVerdict`
  (route.mjs), `runAsyncReplyPolicy` (baml/reply-policy.mjs), `bamlParse` (already have `bamlRender`).
- No gate vocabulary added (isolation test unaffected).

### `src/baml/fixtures.test.mjs` — APPEND RouteCritique pins
- `const ROUTE = "src/baml/fixtures/route";`
- batch ops `R[18]` render (golden bytes, no images), `R[19]` parse `reply.txt` → `expected.json`,
  `R[20]` parse `reply-bad-idiom.txt` (parses ok — the membership failure is `resolveDispatch`'s, asserted
  in route.test.mjs, not here).
- `FX-RT1` render golden + grounding (`departmentIdiomsBlock` lists real idioms); `FX-RT2` parse round-trip
  + non-vacuous `why`.

### `src/baml/transport-guard.test.mjs` — ADD `route.baml` to TG5 list
Append `"department.baml"` is NOT currently listed; TG5 lists recognition/critique/vernacular/decompose/
formation. Add **both** `department.baml` (carries DiagnoseBuild — should already be clean) and the new
contract — but department.baml is one file. Add `"department.baml"` to the TG5 array (covers Layer A + B
in one file). Hygiene only; no behavior change.

### `package.json` — ADD `route:smoke`
`"route:smoke": "node benchmarks/sculpture/route-smoke.mjs"`.

## Ordering (dependencies)

1. `route.baml` classes/function → run `baml:gen` (so `b.request/parse.RouteCritique` exist).
2. `bridge.mts` FNS row (depends on 1).
3. `src/workshop/route.mjs` + `route.test.mjs` (pure; depends on departments.mjs only — parallel to 1–2).
4. Route fixtures (mint golden via bridge — depends on 1–3).
5. `fixtures.test.mjs` + `transport-guard` TG5 (depends on 4).
6. `workshop.mjs --split` (depends on 3 + bridge).
7. `route-smoke.mjs` + `package.json` (depends on 3 + bridge; live witness, run last).

## Boundaries preserved
- Frozen instrument + transport-guard TG1–TG4 untouched (AC4); TG5 only gains a file to scan.
- `loop.mjs` untouched (dispatch rides the exchange envelope).
- Fused path is the default; `--split` is opt-in (AC2 "behind a flag").
- One composition point: `departments.mjs` is the only department/idiom authority both layers read.
