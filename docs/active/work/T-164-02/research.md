# T-164-02 — Research

Layer B — the unified **router** `RouteCritique(Critique) → [{department, idiom, why}]` — plus wiring
**diagnose→route** into the creation loop, replacing the fused action path behind a flag. Descriptive map
of what exists and how it connects. No solutions here.

## The contract this binds to (T-163-01, landed)

- **`src/pack/departments.mjs`** — the authority. `DEPARTMENTS` (frozen, sorted:
  `["CHIMNEY","OPENING","ROOF","ROOM","WALL"]`), `departmentOf(name)` (predicate partition, throws on a
  two-department idiom), and the **seam this ticket consumes**: `departmentToIdioms(dept)` → sorted idiom
  names whose `departmentOf === dept`; `departmentPartition()` → `{[dept]: idiom[]}`. Pure, keyed on idiom
  names. `assertDepartment` throws on an unknown department.
- **`src/pack/idiom-registry.mjs`** — `idiomNames()` (sorted), `getIdiom(name)` (throws on unknown). 28
  idioms across the 5 departments (the T-163-01 design table: ROOF 7, OPENING 3, CHIMNEY 1, ROOM 2,
  WALL 15). This is the registry an idiom dispatch must resolve into.
- **`baml_src/department.baml`** — `enum Department` (mirrors DEPARTMENTS, pinned by DPT3), and the typed
  classes **`CritiqueItem{department, expected, present, missing, severity}`** + **`Critique{items[]}`**
  (the frozen contract — do not edit). Also holds `DiagnoseBuild(...) → Critique` (Layer A, T-164-01).

## Layer A — diagnose (T-164-01, landed)

- **`baml_src/department.baml :: DiagnoseBuild`** — `(style, image_list, program_block, palette_block,
  departments, max_items, concept: image, renders: image[]) → Critique`. Grounded on concept + recognized
  program; per-department `expected/present/missing` + severity.
- **`src/workshop/diagnose.mjs`** — pure serializer `diagnoseRenderArgs({program, pack, azimuths, maxItems})`
  → the typed string inputs; `programBlock`, `paletteBlock` (imported from critique.mjs), `DEPARTMENTS`
  joined for the `departments` line. Tags: `DIAGNOSIS_SCHEMA = "critique/v1"`, `MAX_DIAGNOSIS_ITEMS = 6`.
- **`benchmarks/sculpture/diagnose-smoke.mjs`** + `diagnose:smoke` — the live witness pattern: render
  through the bridge, ONE tiered call (no re-ask, spend caution), `bamlParse`, print + write evidence,
  flag vacuous. This is the template for a route witness.
- **Reply-gate leniency (the carried-forward warning, T-164-01 review §Open concern 1 / FX-DB2 / CC2):**
  `Critique` is an all-array class. A bad-enum item silently DROPS, yielding `{items:[]}`; bare prose
  REJECTS (ok:false). **A reply gate must classify an emptied list as malformed — `b.parse` alone will
  not.** The router's `Dispatch` will be the same all-array shape, so the same gate is needed twice.

## The fused path being replaced (E-31/E-32)

- **`baml_src/critique.baml :: CritiqueWorkshopRound`** → `WorkshopReply{critique, decision, action,
  rationale}` — ONE call does both "what's wrong" and "what to do." `action` is one of
  `WorkshopAdjustParams | WorkshopSprayPaint | WorkshopReRecognize`.
- **`src/workshop/critique.mjs`** — `critiqueRenderArgs(ctx)` (the fused serializer) + `parseWorkshopReply`
  (strict, throws → re-ask) + `liveActionNames`. Exports `ANGLE_DESCRIPTIONS`, `paletteBlock` (shared).
- **`src/workshop/actions.mjs`** — `ACTION_NAMES = ["adjust-params","spray-paint","re-recognize"]`,
  `parseAction`, `DEFAULT_APPLIERS` (adjust-params, spray-paint; re-recognize injected by the runner),
  `applyAction`. **These appliers are GEOMETRY + RECOLOR levers — none of them construct a registry idiom**
  (roof.gable, surface.clinker, pilaster…). Applying an idiom dispatch is not a wired capability.

## The creation loop (where the wiring lands)

- **`src/workshop/loop.mjs :: runWorkshopLoop({program, pack, source, seams:{exchange, render, conform},
  appliers, meta, seedArtifact})`** — pure control flow over injected seams. Per round: realize → render →
  **`exchange(ctx)` returns `{verdict, replies, askCount}`** → if `verdict.decision === "done"` record +
  stop; if `"revise"` apply `verdict.action`, gate (conformance no-regress), roll back or accept. The
  ledger spreads only `{critique, decision, rationale, action}` from the verdict onto the round — **no
  arbitrary verdict field is recorded** (a dispatch trace must be carried out-of-band or via these
  fields). `decision:"done"` records a round with `critique` and stops; it does NOT require an action.
- **`benchmarks/sculpture/workshop.mjs`** — the impure runner. Builds the `exchange` closure:
  `bamlRender({fn:"CritiqueWorkshopRound", args: critiqueRenderArgs(ctx), images})` → `runReplyPolicy(ask,
  {parse: parseWorkshopReply})`. CLI flags via `argOf`/`includes`: `--subject`, `--pack`, `--seed-artifact`
  (artifact-base), `--replay`, `--offline`, `--rotate-pins`. Live mode is pin-guarded (`preflightPins`
  before any spend) and metered (`runTieredOp`, TIER="strong"). Renders each round to `round-N/`; writes
  before/after frames to `pr/assets/frames/`. **This is where a `--split` flag swaps the exchange seam.**
- **`src/workshop/isolation.test.mjs`** — pins the ABSENCE of judge seams in workshop.mjs source. Anything
  added to the runner must carry no gate vocabulary.

## Transport / bridge / fixtures

- **`src/baml/bridge.mts`** — the ONE render+parse bridge (never transport). `FNS` map: a function needs a
  `request` (→ `b.request.Fn(...)`) + `parse` (→ `b.parse.Fn(...)`) row. Adding `RouteCritique` here adds
  NO new `baml_client` importer (bridge.mts is already the pinned importer) — **TG3 unchanged**. Render-only
  dummy-key guard; the metered key never enters.
- **`src/baml/bridge.mjs`** — `bamlBatch`, `bamlRender({fn,args,images})`, `bamlParse({fn,text})` (the
  .mjs seam; one tsx spawn per batch).
- **`src/baml/reply-policy.mjs :: runAsyncReplyPolicy({ask, parse, maxAttempts})`** — bounded same-prompt
  re-ask with **async** parse (the bridge's `bamlParse` is async). Returns `{accepted, expected, replies,
  rawTexts, askCount}`. T-114 semantics; pure of I/O. This is the right driver for a split exchange whose
  parse goes through the bridge. (The fused path uses the sync `runReplyPolicy` because `parseWorkshopReply`
  is sync .mjs.)
- **`src/baml/fixtures.test.mjs`** — batch `R[i]` pins (render golden sha/bytes + parse round-trip +
  malformed-rejects). DiagnoseBuild lives at `R[15]–R[17]`; appends are stable. `dropNulls` normalizes
  optional-absent vs optional-null. `DIAG = "src/baml/fixtures/diagnose"`.
- **`src/baml/critique-contract.test.mjs`** — CC1/CC2/CC3 pin the SAP edges over `DiagnoseBuild`. Same
  pattern (hand-authored reply.txt + expected.json) is the template for route parse fixtures (RouteCritique
  takes no images, so an authored reply + expected suffices; the render golden is offline through the
  bridge).
- **`src/baml/transport-guard.test.mjs`** — TG1–TG5. **TG3** = exact baml_client importer set (don't add
  one). **TG5** = listed `.baml` files carry no judge vocabulary (`JudgeFacade`, `same object|drifted|
  different object`); `route.baml` should be added to its list for hygiene.

## Witness machinery

- **`src/view/render-beside.mjs :: renderBesideConcept(artifact, conceptPath, outPath, opts)`** — judge-free
  textured render at the 4 gate azimuths composed beside the concept panel. `assertGlAvailable()` throws a
  named error if GL is absent. GL is available in this environment.
- **`benchmarks/sculpture/seed.mjs`** — `workshopSubjectsFrom(REGISTRY, {relDir, packRel})`,
  `recognitionRels(subject, pack)`, `DEFAULT_PACK_REL`. The barn recognized program lives at
  `recognitionRels("barn", pack).program`; committed barn renders under `builds/barn/round-N/`.

## Constraints / assumptions surfaced

- **Idiom dispatch ≠ loop action.** The router names construction idioms; the loop's appliers are
  geometry/recolor. There is no wired path that applies a routed idiom as a climbing action. (The ticket's
  falsifiable claim names exactly this: "routes to an idiom that can't fix the item — the registry lacks the
  tool — that gap is a generator-epic finding.")
- **The split is style-agnostic** (the ticket Note): a roof item routes to ROOF regardless of style; only
  Layer A (T-165) is per-style. So RouteCritique takes no `style`.
- **Two all-array reply gates** (Critique, Dispatch) both need the emptied-list-is-malformed classification.
- **The frozen instrument + transport-guard are untouched** (AC4). Everything here is creation-loop.
- **Spend caution** (memory: zero-token notice replies burn the re-ask budget): the live witness does ONE
  call per layer, no re-ask, mirroring diagnose-smoke.
