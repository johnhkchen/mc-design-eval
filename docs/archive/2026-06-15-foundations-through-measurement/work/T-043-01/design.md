# T-043-01 · Design — form-fidelity-metric

Decisions, with rejected alternatives. Grounded in `research.md`.

## Problem restated

Two background-segmentable 3/4 images of the same subject — `render-3q.png` (sky bg) and `concept.png`
(black bg) — at **different resolution, aspect, and subject scale/position**. Produce a deterministic
**silhouette IoU** (whole-object) and **IoU over an arbitrary region**, plus a committed per-subject
baseline. Mirror `value-gate.mjs`'s small-pure-honest shape.

## Decision 0 — placement & module seam

`src/form/form-fidelity.mjs` + `src/form/form-fidelity.test.mjs` (new `src/form/` dir; sibling of
`src/color/`). Lives under `src/` so `node --test "src/**/*.test.mjs"` runs it. Preserve the repo's
**pure-core / isolated-decode** seam (D5).

## Decision 1 — silhouette = background segmentation, reusing `isBackground`

A silhouette is the foreground binary mask. **Reuse `isBackground` from `palette-extract.mjs` verbatim** —
zero new segmentation math, exactly as `value-gate` reuses `nearestLab`/`comparePalettes`. Two committed
presets:

- `RENDER_BG = { dropColor:[173,216,230], dropTolerance:24, alphaThreshold:128 }` — the measured flat sky.
- `CONCEPT_BG = { dropColor:[0,0,0], dropTolerance:40, alphaThreshold:128 }` — near-black, tol widened to 40
  for the slight JPEG noise seen on concept corners while bright subjects stay foreground.

`extractSilhouette(img, bgOpts)` → `{ w, h, data:Uint8Array(0|1), fgCount, bbox }`. Pure on a decoded RGBA
buffer (synthetic-testable). `bbox` = tight foreground bounding box `{x0,y0,x1,y1}` (half-open), `null` if
empty.

*Rejected:* edge-detection / contour tracing — heavier, non-trivial to make deterministic, and overkill
when both backgrounds are flat and known. Alpha-channel masks — render/concept are opaque (a=255), no alpha
to exploit.

## Decision 2 — alignment: bbox-crop → aspect-preserving fit into a common grid

The core difficulty. The two masks share no pixel grid. Normalize each independently to a common `G×G`
occupancy grid (`G = 128` default), then IoU is well-defined cell-for-cell.

`normalizeSilhouette(mask, { grid:G, fit })`:
1. Crop to `bbox` (translation-invariant — where the subject sits in frame stops mattering).
2. Resample the cropped region to `G×G` by **cell aggregation** (echoing `image-grid`'s `aggregateCells`):
   each target cell averages the source pixels mapped into it; cell is foreground iff coverage ≥ 0.5.
3. **`fit:'aspect'` (default):** scale so the bbox's *longer* side fills `G`, center the shorter side,
   pad with background (letterbox). Preserves the subject's **proportion** — a koi elongated in the concept
   but stubby in the render correctly scores lower. Proportion *is* form.
   **`fit:'stretch'`:** scale both axes to fill `G²`, discarding aspect. Offered as an option (measures
   pure outline-shape after proportion-normalization) but not the default.

*Why aspect is the default:* E-13's measured failures are **proportion/line** failures (koi S-curve
flattens, aortic arch never loops). Stretch-fit would normalize away exactly the elongation we want to
penalize. Aspect-fit keeps it. Documented as a knob so the loop can experiment.

*Rejected:* centroid+second-moment (PCA) alignment — rotation/scale normalization is more invariant but
(a) non-deterministic edge cases at near-symmetric masks, (b) over-corrects: if the render is rotated wrong
that's a *real* form defect we'd erase. Bbox-fit is the minimal honest normalization. *Rejected:* no
normalization (raw-resize both to G²) — equivalent to stretch-fit but also tangles in framing/padding
differences; strictly worse than bbox-crop-first.

## Decision 3 — IoU primitives operate on aligned masks (so identity=1, disjoint=0 are clean)

Keep the **set-arithmetic IoU separate from alignment** so the acceptance tests are unambiguous:

- `iou(a, b)` — two masks of **identical dims**; `|a∩b| / |a∪b|`. Throws on dim mismatch.
  Identical masks → exactly 1. Disjoint non-empty → 0 (intersection 0, union > 0). **Both-empty → 1**
  (vacuously identical; documented) — never NaN.
- `regionIoU(a, b, region)` — `region = {x0,y0,x1,y1}` as **normalized [0,1] fractions** of the grid
  (resolution-independent, "arbitrary sub-bounding-box"). Count only cells whose center falls inside the
  rect. Out-of-range/empty-region rules documented; degenerate region → 0.

Because `iou`/`regionIoU` take *raw aligned masks*, the identity/disjoint/region-restriction acceptance
criteria are tested on tiny synthetic masks with **no normalization in the path** — clean and exact. The
fixture path (real pairs) only asserts `∈[0,1]` + both-backgrounds-segment, as the ticket specifies.

*Rejected:* folding alignment into `iou` — would make "disjoint = 0" untestable (bbox-fit re-centers both
masks so two solids always overlap). Separation is what makes the contract verifiable.

## Decision 4 — the orchestrator `formFidelity`

`formFidelity(renderImg, conceptImg, opts)` (pure, on two decoded RGBA images) →

```
{ schema:"form-fidelity/v1", grid, fit,
  iou,                       // whole-object, aligned
  regionIoU?,                // present iff opts.region given
  render:  { fgCount, coverage, bbox, aspect },
  concept: { fgCount, coverage, bbox, aspect } }
```

It segments render with `RENDER_BG`, concept with `CONCEPT_BG` (overridable), normalizes both with the same
`{grid,fit}`, computes whole IoU (+ region IoU if `opts.region`). `aspect = bboxW/bboxH` surfaces the raw
proportion gap that drives the score. All floats `round`-ed (round2/round3). `schema` tag mirrors
`VALUE_GATE_SCHEMA`.

Decode shell (isolated, lazy, async): `formFidelityFromPair(renderPath, conceptPath, opts)` →
`decodeImage` ×2 → `formFidelity`. Mirrors `extractPaletteFromImage`.

## Decision 5 — purity / decode seam (mirror E-14 exactly)

Pure core: `extractSilhouette`, `normalizeSilhouette`, `iou`, `regionIoU`, `formFidelity` — operate only on
buffers/masks, no I/O, no decode import, no RNG, no `Date`. Fully unit-testable on synthetic RGBA. Decode
isolated to `formFidelityFromPair` (the only async, the only `decodeImage` caller). This keeps the
synthetic test suite GL-free and network-free like `value-gate.test.mjs`, while still allowing the
fixture-backed test the ticket mandates.

## Decision 6 — baseline artifact + generator

`benchmarks/sculpture/form-baseline.mjs` (generator, sibling of `codesign-ab.mjs`) iterates the 13 tracked
run dirs that have both PNGs, runs `formFidelityFromPair`, writes:

- `form-baseline.json` — `{ schema, grid, fit, generatedFrom, subjects:[{ run, subject, iou,
  renderCoverage, conceptCoverage, renderAspect, conceptAspect }] }` (sorted by run id; deterministic).
- `form-baseline.md` — a readable table (run · subject · IoU · coverages · aspects) + a one-paragraph
  reading of what's low and why (the "before" E-15 improves on).

No timestamp in committed output (determinism); `generatedFrom` names the input glob, not a clock.

## Decision 7 — thresholds / knobs

No accept/reject threshold here (unlike `valueGate`'s ΔE flag) — **this ticket only *measures*; the
accept-gate lives in S-045**. Exposed knobs: `grid` (default 128), `fit` ('aspect'|'stretch'), per-side
`bg` overrides, `region`. Defaults frozen in a `FORM_DEFAULTS` object (echoing `GRID_DEFAULTS`).

## Honesty ledger (becomes the limits note in code + review)

1. **Single 3/4 view** — sees one side; the back is invisible. A view-bounded proxy, not a 3-D score.
2. **Camera mismatch** — render is exactly `azimuth45/elev30`; concept is only *approximately* 3/4
   (Nano-Banana). Absolute IoU is depressed by this; the metric's worth is the **relative Δ** the loop
   reads, not the absolute.
3. **Aspect-fit choice** — normalizes translation+scale but *keeps* proportion; rotation differences are
   NOT corrected (treated as real defects). `fit:'stretch'` flips the proportion treatment.
4. **Background collateral** — `isBackground` eats foreground within tolerance of bg color (dark-on-black,
   sky-blue-on-sky). Documented E-10 caveat, inherited.
5. **Silhouette ≠ form** — two different shapes can share a silhouette; IoU is necessary, not sufficient.
   It's the cheap honest number, paired (in the loop) with the color gate, not a complete form judge.
