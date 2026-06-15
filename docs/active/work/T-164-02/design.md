# T-164-02 — Design

Decisions with rejected alternatives, grounded in `research.md`. Layer B router + diagnose→route wiring.

## Decision 1 — `RouteCritique` signature: `(critique_block, department_idioms_block) → Dispatch`

`Dispatch{ items: DispatchItem[] }`, `DispatchItem{ department: Department, idiom: string, why: string }`.

- **Input is a serialized block, not the typed `Critique`.** BAML functions take primitive/string params
  the .mjs serializer fills (the established pattern: diagnose/critique pass `program_block`,
  `palette_block`, never a typed object). So Layer A's `Critique` is serialized to `critique_block` (one
  numbered item per line: department + expected/present/missing + severity) by a pure serializer. The
  router reads that prose, not a re-parsed object.
- **`department_idioms_block`** is the candidate menu: for each department, its `departmentToIdioms(dept)`
  list. This is what makes the router resolve to a REAL idiom and never dead-end — the model picks from the
  set we hand it. Single-sourced from `departments.mjs` (the composition point).
- **`department` is the `Department` enum** (reused — no new enum, no drift). **`idiom` is a `string`**, not
  an enum: 28 idioms would be a second vocabulary to keep mirrored, and the registry grows (E-32 factory).
  Instead idiom is validated POST-parse against `departmentToIdioms(department)` by pure code — a violation
  is the "names an unbuildable idiom" failure, caught loudly, routed to the re-ask gate.
- **Style-agnostic** (ticket Note): no `style` param. A roof item routes to ROOF regardless of style.

**Rejected — `RouteCritique(Critique) → …` with a typed `Critique` input.** No BAML function in this repo
takes a typed class as input; they take the serialized strings the .mjs builds. Following the house pattern
keeps the bridge row uniform and the render golden stable.

**Rejected — `idiom` as a BAML enum.** Mirrors a 28-value list that the factory mutates; DPT3-style drift
guard ×2. The string + post-parse `departmentToIdioms` membership check is the same guarantee with one
authority (`departments.mjs`) instead of two.

**Rejected — one router call per critique item.** N calls = N× latency/variance (the claim's own failure
mode: "two calls double the latency without raising climb"). One call routes the whole critique; the model
sees all items together (better cross-item consistency).

## Decision 2 — `resolveDispatch`: the membership gate (every item → a real idiom)

Pure `resolveDispatch(dispatch)` in `src/workshop/route.mjs`:
- `dispatch.items` must be a non-empty array (the **emptied-list-is-malformed** classification the
  T-164-01 review demands — a dropped bad-enum item yields `{items:[]}`, which `b.parse` accepts but the
  gate must reject so the re-ask fires);
- each item: `department ∈ DEPARTMENTS` (else throw — though the enum filter usually drops it first),
  `idiom ∈ departmentToIdioms(department)` (else throw: "router named idiom X not in department D"),
  `why` non-empty;
- returns the frozen, validated list.

This is **AC1's "every item resolves to a real idiom-registry entry (never an unbuildable department)"** and
the falsifiable-claim guard ("routes to an idiom that can't fix the item" → a thrown, audited finding).

**Rejected — silently re-anchor a bad idiom to the department's first candidate.** Hides the router's miss;
the bake-off would score a correctness it didn't earn. Throw → re-ask → audit instead.

## Decision 3 — the loop verdict: diagnose→route runs ONE round and declares `done` after logging dispatch

The hard fact from research: **a routed idiom is not a loop action.** The loop's appliers (adjust-params,
spray-paint, re-recognize) are geometry/recolor levers; none constructs `roof.gable`/`surface.clinker`/
`pilaster`. Wiring idiom-construction appliers is a separate generator effort — and the ticket's own
falsifiable claim names that gap as "a generator-epic finding," not this ticket's job.

So `dispatchToVerdict({critique, dispatch})` (pure) builds:
- `critique.issues` = Critique items mapped to the loop's `{region: department, issue: "<expected> /
  present: <present> / missing: <missing>", severity}` shape (so the round ledgers the diagnosis);
- `decision: "done"`, `action: null`;
- `rationale` = a one-line summary of the dispatch (the worst item's `department→idiom`);
- `dispatch` = the resolved list, returned ALONGSIDE the verdict (not inside it) so the runner logs it —
  the loop spreads only `{critique, decision, rationale, action}`, so the trace rides the exchange's return
  envelope, not the verdict, and **loop.mjs stays untouched** (isolation test unaffected).

The loop therefore: realize → render → diagnose → route → log dispatch → `done` → render witness. This is a
faithful "creation loop runs on diagnose→route, replacing the fused action path": the action path is now the
ROUTER (which emits a dispatch plan), and the plan is logged for S-166 to score routing correctness — the
metric the falsifiable claim actually measures.

**Rejected — auto-translate the worst dispatch to a `spray-paint` action so the loop climbs.** Would need a
department→pack-role→block resolution to pick `toBlock`; that glue is judgment-laden and likely wrong, and a
wrong recolor is exactly the "cosmetic" failure the claim warns against. It also conflates the router's job
(pick the idiom) with construction (apply it). Honest deferral beats a fragile climb.

**Rejected — extend `loop.mjs` to record a `dispatch` field.** Touches the pure loop + its isolation test
for a logging concern the runner can own. Carry the trace in the exchange's return envelope instead.

## Decision 4 — `--split` flag on `workshop.mjs` (AC2); `route:smoke` witness (AC3)

- **`--split`** swaps the `exchange` closure for a `splitExchange` (diagnose→route). Fused
  (`CritiqueWorkshopRound`) stays the DEFAULT — "fused path retained behind a flag, do not delete." The
  split closure: `bamlRender(DiagnoseBuild)` → `runAsyncReplyPolicy(parse = bamlParse+assert-non-empty)` →
  `bamlRender(RouteCritique)` → `runAsyncReplyPolicy(parse = bamlParse+resolveDispatch)` →
  `dispatchToVerdict`. Accumulates each round's dispatch into a closure array; the runner writes
  `dispatch-trace.json` after the loop. Async parse ⇒ `runAsyncReplyPolicy` (the bridge parse is async),
  not the sync `runReplyPolicy` the fused path uses.
- **`route:smoke`** (`benchmarks/sculpture/route-smoke.mjs`, mirrors diagnose-smoke): barn, ONE call per
  layer (no re-ask — spend caution), resolve + log the dispatch, **render beside concept** via
  `renderBesideConcept`, write evidence to the work dir. This is AC3's judge-free witness.

**Why two entry points:** AC2 wants the *loop* wired (`--split` on the real runner, pin-guarded/metered);
AC3 wants a *cheap rendered witness*. The workshop live run renders 4-azimuth frames, not beside-concept,
and is heavy; the smoke is the precedented (T-164-01) lightweight beside-concept witness. Both share the one
pure core (`src/workshop/route.mjs`).

## Decision 5 — fixtures & guards

- **Route fixtures** `src/baml/fixtures/route/{inputs.json, prompt.golden.txt, reply.txt, expected.json}`:
  `inputs.json` from `routeRenderArgs` over the committed barn `Critique` (the diagnose `expected.json`);
  `prompt.golden.txt` minted offline through the bridge (render mode, no model); `reply.txt` +
  `expected.json` hand-authored (a 3-item dispatch routing the barn's ROOF/WALL/OPENING items to real
  idioms), like critique-contract's authored fixtures. Render needs no images.
- **fixtures.test.mjs**: append `RouteCritique` ops at `R[18]–R[20]` (render golden + parse round-trip +
  bad-idiom/empty rejects). Stable indices.
- **route.test.mjs**: pure unit pins for `routeRenderArgs` (content/determinism/single-source),
  `resolveDispatch` (membership throw, empty throw), `dispatchToVerdict` (shape, done, trace).
- **transport-guard**: add `route.baml` to TG5's list (no judge vocabulary). TG3 importer set UNCHANGED.

## What this delivers vs the falsifiable claim

The claim is refereed by S-166, not here. This ticket ships the *router that can be scored*: a dispatch that
resolves to real idioms (or throws), wired into the loop and logged. If the router echoes Layer A's
department with no resolution value, the trace shows it (S-166 collapses the split); if it routes to an
idiom that can't fix the item, `resolveDispatch` already throws and the gap is a named generator finding.
