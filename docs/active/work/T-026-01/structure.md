# T-026-01 Structure — review-bookend (diagnostic critic)

The file-level blueprint. Five touched paths; the pure core is `review.mjs`'s routing layer,
the live seam is one BAML function + one tsx stage.

## Files

| Path | Action | Purpose |
|------|--------|---------|
| `baml_src/review.baml` | **create** | `DiagnoseFacade` — the categorical BAML function |
| `baml_client/**` | **regenerate** | `npm run baml:gen` after the .baml is added |
| `src/sculptor/review.mjs` | **create** | pure routing + live orchestrator (lazy heavy imports) |
| `src/sculptor/baml-review.mts` | **create** | live, metered tsx bridge (BAML render → claude -p → parse) |
| `src/sculptor/review.test.mjs` | **create** | pure unit tests (stubbed render+diagnose) |
| `src/sculptor/index.mjs` | **modify** | export the review surface |
| `src/sculptor/README.md` | **modify** | document the critic piece + boundary note |

## `baml_src/review.baml` (create)

Mirrors `judge.baml`'s shape.

```baml
enum Defect {
  Flat                 // a flat, dead field — no relief or material variation
  Ringing              // banding/stair-step artifacts where a curve should read smooth
  UnderDetailedFocal   // the focal point (entrance/centerpiece) is under-articulated
  Proportion           // bay rhythm / massing / base→middle→crown is off
}
class FacadeDefect { defect Defect  where string }   // where = free-text region
class FacadeDiagnosis { defects FacadeDefect[] }     // empty list = clean facade
function DiagnoseFacade(brief: string, render: image) -> FacadeDiagnosis {
  client ClaudeStub
  prompt #" …critic persona, {{ render }}, {{ brief }}, per-defect anchors,
            "report ONLY real defects; an empty list is correct for a clean build",
            {{ ctx.output_format }} "#
}
```

Uses the existing `ClaudeStub` client (same as `JudgeFacade`) so the prompt is rendered by
BAML and executed via `claude -p` in the tsx stage.

## `src/sculptor/review.mjs` (create) — public surface

```js
// constants (frozen)
export const DEFECTS          // ["flat","ringing","under-detailed-focal","proportion"]
export const ROUTE_TARGETS    // ["massing","material","relief","curve","detail"]
export const ROUTING_TABLE    // frozen {defect: candidateStages[]} (D3)

// pure
export function routeDefect(state, { defect, where })   // → {defect, where, route}; throws on bad defect
export function routeDiagnosis(state, raws)             // → {defect, where, route}[]
export function assertDefect(defect)                    // throws DefectVocabularyError if ∉ DEFECTS

// errors
export class DefectVocabularyError extends Error       // .code = "unknown_defect"

// live seam (lazy)
export async function defaultRender(state)             // compile→renderArtifact; returns {image:Buffer, report}
export async function defaultDiagnose(image, brief)    // spawn tsx baml-review.mts → raw[]

// orchestrator (injectable)
export async function reviewBuildState(state, {
  brief,
  render  = defaultRender,    // (state) → {image, report}
  diagnose = defaultDiagnose, // (image, brief) → {defect, where}[]
} = {}) // → { diagnosis: {defect,where,route}[], render: RenderReport|null }
```

### Internal organization / contracts

- **`ROUTING_TABLE`** is the single source of the defect→stage mapping; `ROUTE_TARGETS` is
  derived-and-frozen for documentation/validation. `DEFECTS = Object.keys(ROUTING_TABLE)`.
- **`assertDefect`** guards every raw entry — an out-of-vocabulary defect throws
  `DefectVocabularyError` (loud, like `assertInPalette`), never silently dropped.
- **`routeDefect`** (D4):
  - `assertDefect(defect)`
  - `flat`: `occupiedCells(state).some(c => c.cell.material === null) ? "material" : "relief"`
  - else: `ROUTING_TABLE[defect][0]`
  - returns `{ defect, where, route }` (passes `where` through untouched).
- **`routeDiagnosis`** maps `routeDefect` over `raws` (defaults `[]`); pure, order-preserving.
- **`defaultRender`** lazy-imports `toDesignArtifact` (`./compile.mjs`) and `renderArtifact`
  (`../../render/src/render-tool.mjs`), renders to a temp path, reads the PNG into a Buffer,
  returns `{ image, report }`. Boundary-crossing isolated here.
- **`defaultDiagnose`** writes the image to a temp file (the tsx stage reads by path, like
  baml-judge), spawns `npx tsx <dir>/baml-review.mts` with `{imagePath, brief}` on stdin,
  JSON-parses stdout → `{defect, where}[]`. Lazy `node:child_process` import.
- **`reviewBuildState`** = `const {image, report} = await render(state); const raws = await
  diagnose(image, brief); return { diagnosis: routeDiagnosis(state, raws), render: report ??
  null }`. The orchestration is trivial *by design* — all logic is in the pure routing.

## `src/sculptor/baml-review.mts` (create)

Direct analogue of `benchmarks/temple-facade/baml-judge.mts`:
- read `{imagePath, brief}` from stdin; base64 the PNG; detect media type.
- `b.request.DiagnoseFacade(brief, Image.fromBase64(...))` → rendered prompt (with the dummy
  `ANTHROPIC_API_KEY` dance: set before render, delete before the subscription call).
- pipe through `requestTextWithImage({prompt, images, model: PHASE1_MODEL_ID})`.
- brace-slice the reply, `b.parse.DiagnoseFacade(cleaned)` → typed `{defects}`.
- map each `{defect, where}`: PascalCase enum → kebab vocabulary
  (`UnderDetailedFocal→"under-detailed-focal"`, else lowercase); write `{defects}` JSON to
  stdout. Single sample (diagnosis is categorical, not scored — no median needed).

## `src/sculptor/index.mjs` (modify)

Append:
```js
export {
  DEFECTS, ROUTE_TARGETS, ROUTING_TABLE,
  routeDefect, routeDiagnosis, assertDefect,
  DefectVocabularyError, reviewBuildState, defaultRender, defaultDiagnose,
} from "./review.mjs";
```

## `src/sculptor/README.md` (modify)

Add a bullet under "The pieces" for `review.mjs` (the diagnostic critic: render → categorical
BAML diagnosis → route-to-stage; routes, never re-emits) and a sentence under "Boundaries"
noting the critic is the one spine module that crosses the render/SDK boundary, via lazy
imports, and that its pure routing core is unit-tested while the BAML/GL leaves are not.

## Ordering of changes

1. `baml_src/review.baml` → `npm run baml:gen` (regenerate client; verify it builds).
2. `src/sculptor/review.mjs` (pure routing first, then the lazy live seams).
3. `src/sculptor/review.test.mjs` (drives the pure path + stubbed orchestrator).
4. `src/sculptor/baml-review.mts` (live bridge; not exercised by `npm test`).
5. `index.mjs` + `README.md`.
6. `npm test` green.

## Test surface (`review.test.mjs`)

Pure — imports only `review.mjs` + `build-state.mjs`; never loads GL, SDK, or BAML.
- routing table shape: `ROUTING_TABLE` keys === `DEFECTS`; every target ∈ `ROUTE_TARGETS`.
- `routeDefect` per defect → expected route (proportion→massing, under-detailed-focal→detail,
  ringing→curve).
- flat disambiguation: untextured fixture → `material`; textured-flat fixture → `relief`.
- `assertDefect`/`routeDefect` throw `DefectVocabularyError` on a bogus defect.
- `reviewBuildState` with stub render + stub diagnose: flat fixture → one `flat→material`
  routed entry; clean fixture (diagnose `[]`) → empty diagnosis; `render` report passed
  through.
- `routeDiagnosis([])` → `[]`; order preserved for multiple defects.
</content>
