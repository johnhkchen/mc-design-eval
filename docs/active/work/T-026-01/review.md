# T-026-01 Review — review-bookend (diagnostic critic)

Handoff for a human reviewer. The diagnostic review critic (E-11 bookend 2) is implemented,
committed (`bfda4ed`), and `npm test` is green at **254/254**.

## What changed

**Created**
- `baml_src/review.baml` — the `DiagnoseFacade` BAML function: `enum Defect {Flat, Ringing,
  UnderDetailedFocal, Proportion}`, `class FacadeDefect {defect, where}`, `class
  FacadeDiagnosis {defects[]}`, image-in → enum-constrained list out. A direct analogue of the
  existing `judge.baml` (`JudgeFacade`) — the "categorical-judge BAML pattern" the ticket asks
  for, applied to diagnosis instead of scoring.
- `src/sculptor/review.mjs` (~190 lines) — the critic. **Pure core:** `DEFECTS`,
  `ROUTING_TABLE` (frozen), `ROUTE_TARGETS`, `DefectVocabularyError`, `assertDefect`,
  `routeDefect`, `routeDiagnosis`. **Live leaves (lazy, not unit-tested):** `defaultRender`
  (compile → headless GL render), `defaultDiagnose` (spawns the tsx BAML bridge). **Injectable
  orchestrator:** `reviewBuildState(state, {brief, render, diagnose})`.
- `src/sculptor/review.test.mjs` — 10 pure unit tests (no GL/SDK/BAML loaded).
- `src/sculptor/baml-review.mts` — the live `.mjs ↔ .mts` BAML bridge (analogue of
  `baml-judge.mts`); transpiles clean, runs only on the live path.

**Modified**
- `src/sculptor/index.mjs` — barrel now re-exports the review surface (appended after the
  concurrently-landed massing block).
- `src/sculptor/README.md` — added the `review.mjs` piece + a boundary note.
- `baml_client/**` regenerated via `npm run baml:gen` — **gitignored**, so not in the commit;
  it is regenerated from `baml_src/review.baml` on demand (existing repo convention).

## How it satisfies the ACs

- **AC#1 (structured diagnosis, explicit vocab + table):** `routeDiagnosis` returns
  `{defect, where, route}[]`, never prose. `DEFECTS` and `ROUTING_TABLE` are the explicit,
  frozen vocabulary and routing map; the BAML `Defect` enum mirrors them.
- **AC#2 (routes, never re-emits):** every `route` is a *stage name*
  (`massing|material|relief|curve|detail`), never an artifact. Tested: a flat **untextured**
  fixture → `[{flat, "the wall", material}]`; a clean fixture (diagnose returns `[]`) → `[]`.
- **AC#3 (stage-agnostic build-state consumer):** `review.mjs` imports only `occupiedCells`
  from `build-state.mjs` and reads only the `occupied`/`material` cell fields — no pass
  internals. The `flat` route is disambiguated *from the state* (untextured→material,
  textured-flat→relief), which is the cleanest demonstration that the critic reads state, not
  passes.
- **AC#4 (`npm test` green, model stubbable, routing tested directly):** 254/254;
  `reviewBuildState` injects `render`/`diagnose` so the tests stub the model call and exercise
  the full pipeline; pure routing is also tested in isolation.

## Test coverage

Strong on the pure core (the ticket's center of gravity): vocabulary/table invariants,
per-defect routing, both branches of the `flat` disambiguation, the vocabulary guard
(`DefectVocabularyError`), list order-preservation/empty, and the orchestrator end-to-end with
stubs (flat → routed, clean → empty, brief forwarding, report pass-through).

**Untested by design** (spec §4 — metered + headless GL), and the main coverage gap a reviewer
should be aware of:
- `defaultRender` — the compile→GL render path. Reuses `toDesignArtifact` (round-trip-tested
  in T-024-01) and `renderArtifact` (E-02), but their composition here is unexercised.
- `defaultDiagnose` + `baml-review.mts` — the live BAML call, prompt quality, and the
  PascalCase→kebab enum mapping. Verified only by transpile + structural analogy to the
  working `baml-judge.mts`.
The ticket explicitly defers the live loop to consolidation (S-029); these are the right
things to smoke-test there.

## Open concerns / flags for a human reviewer

1. **`flat`'s state-driven route is a global, not per-region, decision.** `routeDefect` checks
   whether *any* occupied cell is un-textured to pick material-vs-relief, because `where` is
   free text from an image judge and can't be mapped to cells. On a partly-textured facade a
   `flat` defect localized to an *already-textured* region would still route to `material` if
   some *other* region is bare. Acceptable for the fixture-level scope here; if the
   consolidation loop wants per-region precision it will need cell-addressable `where`
   (a future massing/render upgrade), noted for S-029.
2. **No `samples`/median aggregation** (unlike the judge). Diagnosis is a single categorical
   pass — a list of defects, not a scored dimension — so median-of-N didn't obviously apply.
   If diagnosis proves noisy in S-029, adding a union/intersection-over-samples policy is a
   localized change in `baml-review.mts` + `defaultDiagnose`.
3. **`baml_client` is gitignored**, so a fresh checkout must run `npm run baml:gen` before the
   live path works. The pure tests and `npm test` do not need it. Worth confirming this matches
   the team's expectation (it matches the existing judge setup).
4. **Concurrency:** developed alongside T-025-01 (massing) on the same branch; `index.mjs` and
   `README.md` were edited by both. The merge is clean (append-only, disjoint sections), but a
   reviewer glancing at those two files will see both bookends' changes.

## Suggested review path

`baml_src/review.baml` (the vocabulary/prompt) → `review.mjs` `ROUTING_TABLE` + `routeDefect`
(the load-bearing 20 lines) → `review.test.mjs` (the contract) → skim `baml-review.mts` against
`baml-judge.mts` for parity.
</content>
