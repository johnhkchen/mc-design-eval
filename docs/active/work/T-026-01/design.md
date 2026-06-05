# T-026-01 Design — review-bookend (diagnostic critic)

Decisions for the diagnostic critic, grounded in `research.md`. The critic = **render → BAML
categorical diagnosis → route-to-stage**, pure routing separated from the live model/GL seam.

## D1 — Where the code lives: `src/sculptor/review.mjs` (+ a BAML function + a tsx stage)

The critic is E-11 framework, so it belongs in the spine directory alongside `compile.mjs`,
not in `benchmarks/`. The spine README already names "the review critic" as the downstream
ticket that plugs in. Files:

- `src/sculptor/review.mjs` — pure routing + the live orchestrator (lazy heavy imports).
- `src/sculptor/review.test.mjs` — pure unit tests.
- `baml_src/review.baml` — the `DiagnoseFacade` BAML function (the categorical pattern).
- `src/sculptor/baml-review.mts` — the live, metered tsx stage (the `.mjs↔.mts` bridge).
- regenerate `baml_client/` via `npm run baml:gen`.

**Rejected:** putting it under `benchmarks/temple-facade/` (it is framework, not a benchmark)
and folding it into `compile.mjs` (compile is pure; the critic crosses the render/SDK
boundary). Keeping them separate preserves the spine's pure core.

## D2 — Follow the BAML categorical pattern literally (a real `DiagnoseFacade` function)

The ticket says "use the categorical-judge BAML pattern." `baml-cli 0.222.0` is installed and
`npm run baml:gen` works, so we author a **real BAML function** mirroring `JudgeFacade`, not a
hand-rolled prompt that merely resembles it:

```baml
enum Defect { Flat Ringing UnderDetailedFocal Proportion }
class FacadeDefect { defect Defect  where string }
class FacadeDiagnosis { defects FacadeDefect[] }
function DiagnoseFacade(brief: string, render: image) -> FacadeDiagnosis
```

`defects` is a **list** (zero or more) so a clean facade returns `{defects: []}` — the
"no defects" case falls straight out of the enum-constrained schema. `where` is a free-text
region (the model judges the image; see research). The prompt embeds `{{ render }}`,
`{{ brief }}`, per-defect anchors, and `{{ ctx.output_format }}`, exactly like `JudgeFacade`.

**Rejected:** (a) reusing `requestDesignArtifactWithImage` (schema-forces a *DesignArtifact* —
that *is* the P14 re-emit the ticket forbids); (b) a free-text judge we regex — the whole
point of the BAML pattern is enum constraint, which makes the defect vocabulary explicit *in
the type system* (AC#1: "the defect vocabulary … [is] explicit").

## D3 — Defect vocabulary and routing table are explicit, frozen data in JS

The routing table (AC#1: "routing table [is] explicit") lives in `review.mjs` as a frozen map
from the JS-side defect vocabulary to **candidate stage(s)**:

```js
export const DEFECTS = ["flat","ringing","under-detailed-focal","proportion"];
export const ROUTING_TABLE = Object.freeze({
  flat:                  ["material", "relief"], // a flat field: add material variety or depth
  ringing:               ["curve"],              // banding on a curve → curve idiom
  "under-detailed-focal":["detail"],             // weak focal point → detail pass
  proportion:            ["massing"],            // bad rhythm/massing → re-run massing
});
```

Route targets are **stage names** (`massing`, `material`, `relief`, `curve`, `detail`) — the
E-11 craft passes — matching the ticket's table verbatim (flat→relief/material, ringing→curve
idiom, under-detailed-focal→detail, proportion→massing). The BAML `Defect` enum
(`UnderDetailedFocal`, …) is mapped to this kebab vocabulary in the tsx stage, so JS never
sees PascalCase.

## D4 — `flat`'s two routes are disambiguated *by the build state* (AC#3 made concrete)

`flat` is the only defect with two candidates. Resolving it is what makes the critic a genuine
**stage-agnostic consumer of the build state** rather than a lookup table: read the state, not
the passes.

```
routeDefect(state, {defect, where}):
  flat → (any occupied cell has material === null) ? "material" : "relief"
  else → ROUTING_TABLE[defect][0]
```

Rationale: an *un-textured* flat field is fixed by giving it material; a flat field that is
*already textured* needs relief depth. The fixture (a flat **untextured** wall) therefore
routes `flat → material`, satisfying AC#2's "flat → relief/material" (the route is one of the
pair, chosen from the state). This reads only `occupied`/`material` via `occupiedCells` — no
knowledge of how any pass works. `where` is **not** parsed (it is free text); it is carried
through verbatim for the human/loop to read.

**Rejected:** always routing `flat → relief` (ignores the untextured case the fixture
exercises) and emitting both routes (the typedef is a single `route`).

## D5 — Split pure routing from the live render+diagnose seam, with injection

Mirror the layering of `iterative-multimodal.mjs`. Three units:

- `routeDefect(state, raw)` / `routeDiagnosis(state, raws)` — **pure**, the heart of AC#1–#3.
  `routeDiagnosis` maps each raw `{defect, where}` (validated against `DEFECTS`) to
  `{defect, where, route}`. Unknown defect → throws (loud, like the palette gate).
- `defaultDiagnose(imageBuffer, brief)` — **live/metered**, spawns `npx tsx baml-review.mts`
  (the BAML bridge), returns `{defect, where}[]`. Lazy — not loaded by pure tests.
- `reviewBuildState(state, { brief, render, diagnose })` — the orchestrator: compile → render
  → diagnose → route. `render` and `diagnose` are **injectable** (default to the live
  GL/BAML implementations). Lazy-imports `renderArtifact` and `toDesignArtifact` only when
  using the default render.

This is the seam that makes the ticket testable: the unit test calls `reviewBuildState` with a
**stub render** (returns a dummy buffer, no GL) and a **stub diagnose** (returns canned raw
defects for the flat fixture, `[]` for the clean fixture), exercising the *entire* pipeline
except the two un-unit-testable leaves — exactly "the model call may be stubbed … routing
logic tested directly" (AC#4). The live BAML/GL path is demonstrated in S-029 (ticket note).

**Rejected:** a single monolithic live function (untestable without GL+metering) and global
module-level deps (can't stub without mocks). Injection is already the codebase idiom for the
metered seam.

## D6 — The diagnosis is the output; the critic never returns an artifact

`reviewBuildState` returns `{ diagnosis: {defect,where,route}[], render: RenderReport|null }`.
The render report is handy provenance (path/bounds) but the **diagnosis is the product**, and
it references *stages to re-run*, never a new build. This is the type-level encoding of "routes
never re-emits" (AC#2) and the P14 cure: the consolidation loop (S-029) takes the routes and
re-runs those stages over the *locked* state, so improvement stays additive.

## Test fixtures (AC#2/#4)

- **flat-wall fixture:** a small rectangle of occupied cells, all `material: null`, `relief:
  0` — a flat, untextured wall. Stub diagnose returns `[{defect:"flat", where:"the wall"}]`.
  Expect `[{defect:"flat", where:"the wall", route:"material"}]`.
- **textured-flat fixture:** same but `material` set, `relief: 0` → `flat` routes to
  `"relief"` (proves D4's state-driven disambiguation).
- **clean fixture:** any valid facade; stub diagnose returns `[]` → diagnosis `[]`.
- Direct `routeDiagnosis` tests over each defect → its table route; unknown defect throws.
</content>
