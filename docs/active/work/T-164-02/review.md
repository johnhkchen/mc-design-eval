# T-164-02 — Review

**Ticket:** layer-b-router-into-departments (Story S-164, Epic E-39). Handoff for a human reviewer.

## What changed

Layer B of the E-39 split — the unified **router** `RouteCritique(Critique) → [{department, idiom, why}]`
— is now a real BAML function with a pure serializer, a membership gate that guarantees every routed item
resolves to a real idiom-registry entry, and a verdict adapter. The creation loop runs on **diagnose→route**
behind a `--split` flag; the fused `CritiqueWorkshopRound` path stays the **default** (S-166 bake-off needs
both). A live witness routed a real divergent barn build and rendered it beside the concept.

### Files created
- `src/workshop/route.mjs` — the pure core. `routeRenderArgs({critique})` → the typed BAML inputs
  (`critique_block` = the diagnosis prose, `department_idioms_block` = the single-sourced registry menu from
  `departmentToIdioms`); `resolveDispatch(dispatch)` → the **membership gate** (throws on empty items, an
  unknown department, an idiom outside its department's set, or an empty `why`); `dispatchToVerdict` → the
  loop verdict + the resolved dispatch carried in the envelope. Tag `ROUTE_SCHEMA = "dispatch/v1"`. No
  GL/IO/Date/random.
- `src/workshop/route.test.mjs` — RT1–RT4 (serializer content/determinism, single-source check, membership
  throws, verdict shape + trace).
- `src/baml/fixtures/route/{inputs.json, prompt.golden.txt, reply.txt, expected.json, reply-bad-idiom.txt}`
  — minted from the committed barn Critique (golden offline via the bridge; replies hand-authored).
- `benchmarks/sculpture/route-smoke.mjs` — the live witness (not in `npm test`).
- `docs/active/work/T-164-02/route-smoke-barn.{json,png}` — committed live evidence.

### Files modified
- `baml_src/department.baml` — appended `DispatchItem{department: Department, idiom: string, why}`,
  `Dispatch{items[]}`, and `RouteCritique(critique_block, department_idioms_block) → Dispatch`. Style-
  agnostic, no images, no gate vocabulary. The frozen Critique/Department contract is untouched.
- `src/baml/bridge.mts` — one new `FNS.RouteCritique` row (request + parse). **No new `baml_client`
  importer** → TG3 unchanged.
- `benchmarks/sculpture/workshop.mjs` — `--split` flag + `splitExchange` (diagnose→route over the async
  reply policy, two tiered exchanges per round) + the post-loop `dispatch-trace.json` write. Fused is the
  default; `loop.mjs` is untouched (the dispatch rides the exchange's return envelope).
- `src/baml/fixtures.test.mjs` — `R[18]–R[20]` + FX-RT1/FX-RT2.
- `src/baml/transport-guard.test.mjs` — TG5 now also scans `department.baml`.
- `package.json` — `route:smoke` script.

## Acceptance criteria — status

- [x] **`RouteCritique` → dispatch list; every item resolves to a real idiom; `b.parse` fixture-tested.**
  `resolveDispatch` rejects any idiom outside `departmentToIdioms(department)` (RT3) — the "unbuildable
  idiom" failure is loud, never silent. FX-RT1 pins the render golden + the single-sourced menu; FX-RT2
  pins the parse round-trip + non-vacuous `why`. The live barn run resolved 4/4 items.
- [x] **Loop runs on diagnose→route, replacing the fused action path; fused retained behind a flag.**
  `--split` selects `splitExchange`; fused (`CritiqueWorkshopRound`) is the default and byte-identical
  (`workshop:replay`/`workshop:offline` still pass, isolation 4/4).
- [x] **One loop run rendered beside concept (judge-free witness); dispatch trace logged.** `route:smoke`
  renders `route-smoke-barn.png` (concept + 4 azimuths) and writes the dispatch trace JSON; `--split`
  writes `dispatch-trace.json` per loop run + console-logs the routing.
- [x] **`npm test` green; frozen instrument + transport-guard untouched.** 2212/2212 (baseline 2206 + 6).
  TG1–TG4 unchanged; TG5 extended (additive scan); frozen scalar instrument + `loop.mjs` untouched.

## Falsifiable-claim assessment (anti-hedge)

The claim: the router selects, for the worst item, a department/idiom that actually addresses it. **Live
evidence (barn):** Layer A diagnosed a roofless, holey-walled build; Layer B routed ROOF→`roof.gable.steep`
(picking up the diagnosis's explicit "steeper pitch" — the *most specific* roof idiom, not just `roof.gable`),
the watertight-wall + gable-end-triangle items→`surface.fill`, and the ragged openings→`opening-dressing`.
Each `why` names how the idiom resolves the missing element. This is exactly the routing the bake-off scores.

**The honest boundary (recorded, not hidden):** a routed idiom is **not** a wired loop action — the loop's
appliers are geometry/recolor levers; none constructs a registry idiom. So the split path **does not climb
via idioms** this ticket; `dispatchToVerdict` declares `done` once the dispatch is logged. This is the
ticket's own named "generator-epic gap" ("the registry lacks the tool" / construction is a separate effort).
The deliverable here is a **scorable dispatch**, wired and logged; whether the split *beats* fused on
dispatch correctness — and whether it should climb — is **S-166's** referee call, with both paths runnable.

## Test coverage & gaps

- **Covered (in `npm test`):** route serializer + single-source + membership throws (RT1–RT4); render golden
  + parse + non-vacuous (FX-RT1/2); SAP leniency characterized (R[20] parses, `resolveDispatch` throws —
  the gate is the .mjs's, not `b.parse`'s); TG3 importer set unchanged + TG5 scans department.baml; fused
  byte-identity (`workshop:replay`/`offline`); isolation.
- **Gaps / not automated:** the live `route:smoke` is metered + non-deterministic (one un-retried call per
  layer, spend caution) — its *output* is committed evidence, not a gating test. The golden + witness are
  **barn-only** (rustic). The `--split` loop's end-to-end live run (metered, pin-guarded) was not executed
  here — the lighter `route:smoke` is the witness, as T-164-01 set precedent; the `--split` path is proven
  by the shared `route.mjs` core + the fused-inert regression guards. The router's *dispatch correctness*
  (is the chosen idiom the BEST one?) is judged by eye from the witness, not asserted — appropriate for a
  creation-loop function; the bake-off (S-166) is the quantitative referee.

## Open concerns / for the next tickets

1. **Climb is deferred to a generator effort.** The split path produces a dispatch but cannot apply a
   construction idiom (no wired applier). S-166 must score on **dispatch correctness**, not climb, OR name
   the idiom-applier work as a prerequisite if climb is to be compared.
2. **Per-style Layer A is S-165.** This router is style-agnostic by design; the per-style diagnostic
   gradient (and a cottage golden) are S-165.
3. **Reply-gate leniency handled.** Both all-array classes (Critique, Dispatch) are gated: `splitExchange`
   throws on an emptied Critique and `resolveDispatch` throws on an emptied/dead-end dispatch — the
   T-164-01 carried-forward warning is closed for Layer B.

## Risk

Low. The fused path (default) is byte-identical (replay/offline pass); `loop.mjs` and the frozen instrument
are untouched; the only new `baml_client` surface is one bridge row (TG3 unchanged). Reverting Step 4
restores the fused-only runner and leaves the pure `route.mjs` + fixtures intact.
