# T-043-01 · Structure — form-fidelity-metric

The blueprint: files, public interface, internal organization, ordering. Not code.

## File change set

| Action | Path | Purpose |
|--------|------|---------|
| **create** | `src/form/form-fidelity.mjs` | The metric module (pure core + isolated decode shell). |
| **create** | `src/form/form-fidelity.test.mjs` | Synthetic unit tests (A–G) + committed-fixture tests (H). |
| **create** | `benchmarks/sculpture/form-baseline.mjs` | Generator: per-subject baseline → json + md. |
| **create** | `benchmarks/sculpture/form-baseline.json` | Committed baseline data (generator output). |
| **create** | `benchmarks/sculpture/form-baseline.md` | Committed baseline table + reading. |

No edits to existing files. No deletions. `src/form/` is a new directory.

## `src/form/form-fidelity.mjs` — public interface

Long module header first (mirror `value-gate.mjs`): what it measures, what it reuses (zero new core math —
`isBackground`/`decodeImage` from `palette-extract.mjs`), the purity contract, and the honesty ledger
(5 limits from `design.md`).

```
export const FORM_FIDELITY_SCHEMA = "form-fidelity/v1";

export const FORM_DEFAULTS = Object.freeze({
  grid: 128,            // common normalization grid (G×G)
  fit: "aspect",        // "aspect" (letterbox, keep proportion) | "stretch"
  coverageThreshold: 0.5,
});

// segmentation presets (measured in research.md)
export const RENDER_BG  = Object.freeze({ dropColor:[173,216,230], dropTolerance:24, alphaThreshold:128 });
export const CONCEPT_BG = Object.freeze({ dropColor:[0,0,0],        dropTolerance:40, alphaThreshold:128 });

// --- pure core (synthetic-testable; no I/O) ---
export function extractSilhouette(img, bgOpts) -> { w, h, data:Uint8Array, fgCount, bbox|null }
export function normalizeSilhouette(mask, { grid?, fit?, coverageThreshold? }) -> { w:G, h:G, data:Uint8Array, fgCount }
export function iou(a, b) -> number                       // identical dims; throws on mismatch
export function regionIoU(a, b, region) -> number         // region = {x0,y0,x1,y1} in [0,1]
export function formFidelity(renderImg, conceptImg, opts?) -> ResultObject

// --- isolated decode shell (async; only place decodeImage is used) ---
export async function formFidelityFromPair(renderPath, conceptPath, opts?) -> ResultObject
```

### Internal (non-exported) helpers

- `bboxOf(data, w, h)` — scan mask → `{x0,y0,x1,y1}` half-open, or `null` if empty.
- `cropResampleAspect(mask, bbox, G, fit, covThresh)` — the alignment engine: crop to bbox, then either
  letterbox (aspect) or stretch into `G×G` via per-cell coverage aggregation (echoes `image-grid`'s
  `aggregateCells` → coverage ≥ threshold). Returns a `G×G` Uint8Array.
- `round2`/`round3` — local rounding (no shared util), as in `value-gate.mjs`.

### `ResultObject` shape (formFidelity / formFidelityFromPair)

```
{
  schema: "form-fidelity/v1",
  grid: 128, fit: "aspect",
  iou: <number 0..1>,
  regionIoU?: <number 0..1>,        // present iff opts.region supplied
  region?: {x0,y0,x1,y1},           // echoed back when given
  render:  { fgCount, coverage, bbox, aspect },   // coverage = fgCount/(w·h); aspect = bboxW/bboxH
  concept: { fgCount, coverage, bbox, aspect }
}
```

### Behavioral contracts (the test oracle)

- `iou`: identical → 1; disjoint non-empty → 0; both-empty → 1 (documented); dim mismatch → throw.
- `regionIoU`: counts only cells whose **center** lies in the normalized rect; restricting to a box that
  contains all overlap == whole `iou`; a box over a disjoint corner → 0; degenerate (zero-area) → 0.
- `extractSilhouette`: foreground count matches hand-computed for a synthetic buffer; both presets segment
  their background (black / sky); `bbox` tight; empty mask → `bbox:null`, `fgCount:0`.
- `normalizeSilhouette`: output is exactly `G×G`; a centered square stays roughly centered; aspect-fit of a
  tall mask leaves horizontal padding (cols at edges empty), stretch-fit fills.
- `formFidelity`: deterministic (deep-equal on repeat); inputs not mutated; all floats rounded; `iou∈[0,1]`.

## `src/form/form-fidelity.test.mjs` — groups

Pure/synthetic (no fixtures), mirroring `value-gate.test.mjs`'s discipline:

- **A `extractSilhouette`** — fg count on a hand-built RGBA buffer; black-bg vs sky-bg presets; empty→null
  bbox; tight bbox on an off-center blob.
- **B `normalizeSilhouette`** — output dims = G×G; aspect-fit letterboxes a tall blob (edge padding);
  stretch-fit fills; full mask normalizes to full.
- **C `iou`** — identity=1; disjoint=0; partial overlap = known fraction (e.g. 2 of 3 → 0.5…); both-empty=1.
- **D `iou` guards** — dim-mismatch throws.
- **E `regionIoU`** — restricts to box; box-around-all-overlap == whole iou; disjoint-corner box = 0;
  degenerate region = 0.
- **F `formFidelity`** — deterministic deep-equal repeat; inputs not mutated; `iou∈[0,1]`; region echoed.
- **G knobs** — `fit:'stretch'` differs from `'aspect'` on a non-square subject; custom `grid`.

Committed-fixture (the ticket's explicit requirement):

- **H E-13 pairs** — resolve `benchmarks/sculpture/runs/*/` relative to `import.meta.url`. For each of a few
  representative runs (moai 001, koi 009, heart 006): `formFidelityFromPair` → assert `iou∈[0,1]`, both
  `render.fgCount>0` and `concept.fgCount>0` (proves both backgrounds segmented), `render.coverage` in a
  sane band. Loop over all discoverable pairs asserting the invariant (skip-with-message only if a fixture
  is unexpectedly absent — they are committed, so it runs).

## `benchmarks/sculpture/form-baseline.mjs` — organization

Node ESM script, run with `node benchmarks/sculpture/form-baseline.mjs`. Mirrors `codesign-ab.mjs`:

1. Discover run dirs under `runs/` having both `render-3q.png` + `concept.png`; sort by name (deterministic).
2. Derive `subject` from `summary.json` (`.term`) with dir-name fallback.
3. `formFidelityFromPair` each → collect rows.
4. Write `form-baseline.json` (schema, grid, fit, `generatedFrom:"benchmarks/sculpture/runs/*"`, sorted
   `subjects[]`) and `form-baseline.md` (table + a short "what's low and why" reading).
5. No clock/RNG in committed output.

## Ordering of work (feeds `plan.md`)

1. Pure core (`extractSilhouette` → `bboxOf` → `normalizeSilhouette`/`cropResample` → `iou` → `regionIoU`
   → `formFidelity`) — each with its synthetic tests; commit when green.
2. Decode shell (`formFidelityFromPair`) + fixture group H — commit.
3. Baseline generator + run it + commit json/md.
4. Full-suite green + review.

## Reuse boundary (what is NOT re-implemented)

- Background test: `isBackground` (palette-extract) — imported, not copied.
- Decode: `decodeImage` (palette-extract) — imported in the shell only.
- Cell-aggregation idea: patterned on `image-grid`'s `aggregateCells`, re-expressed for binary masks (the
  source is RGB-color aggregation; ours is occupancy) — a parallel, not a literal reuse.
- No new color/Lab math, no GL, no network, no server.
