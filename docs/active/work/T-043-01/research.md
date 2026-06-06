# T-043-01 · Research — form-fidelity-metric

Descriptive map of the codebase territory this ticket touches. No solutions here — see `design.md`.

## What the ticket needs

A pure, deterministic **form-fidelity** number for the E-15 surgical-revision loop. Color already has its
hill-climb number (E-14's `valueGate`); **form does not**. The signal: every `vConcept` build leaves a
matched 3/4 pair on disk — `render-3q.png` (the built voxels) and `concept.png` (the Nano-Banana
reference) — both background-segmentable. A **silhouette IoU** of the two binary masks is a real
form-fidelity number; the loop also needs a **per-region IoU** (over a sub-bounding-box) for a local accept
signal. Mirror the E-14 module shape: small, pure-where-possible, unit-tested, honest about blind spots.

## The E-14 precedent (the shape to mirror) — `src/color/value-gate.mjs`

This is the explicit template. Observed conventions worth copying:

- **A long module header** stating what the module measures, what it reuses (zero new core math), and its
  purity contract ("PURE, GL-FREE, NETWORK-FREE … runs under `src/**/*.test.mjs` with nothing mocked").
- **A schema tag** export (`VALUE_GATE_SCHEMA = "value-gate/v1"`) stamped on results so downstream can
  version-check; and a tunable `DEFAULT_*_THRESHOLD`.
- **Local `round1`/`round2` helpers** (no shared util) for stable, diff-friendly numbers.
- **Coercion helpers** (`toReferenceClusters`, `toRealized`) that accept either a ready array or the
  upstream extractor's verbatim output, throwing with precise messages on bad shape.
- **A self-critique** baked into comments: the render-side proxy is "segmentation-free" by the T-039 table
  invariant, and `recommendCorrectiveReplace` is "advisory, partly tautological". Honesty is a deliverable.
- **A scalar reducer** (`gapClosure`) producing a before/after { delta, pct, improved } for the A/B report.

Its test file (`value-gate.test.mjs`) is **purely synthetic** — no image fixtures, no GL — grouped A–G with
identity→0, far→flagged, max≥mean, weighting, passthrough, purity (deep-equal repeat + inputs-not-mutated),
and a threshold-knob boundary flip. That purity bar is the standard, **but** this ticket *additionally*
requires asserting on **committed binary fixtures** (the E-13 pairs), so the test design must straddle both.

## The image / segmentation primitives already in the repo

`src/color/palette-extract.mjs` owns the reusable pieces:

- `decodeImage(path)` — sniffs JPEG/PNG magic bytes, **lazy-imports** `jpeg-js` / `pngjs`, returns
  `{ width, height, data }` RGBA8. The *only* place decode deps are touched; isolated off the core path.
- `isBackground(r,g,b,a,{dropColor,dropTolerance,alphaThreshold})` — pure per-pixel background test:
  drop if `a < alphaThreshold`, else (if `dropColor` non-null) drop if RGB within `dropTolerance`
  **Euclidean** of `dropColor`. `dropColor:null` disables.
- `aggregateForeground(img, opts)` — single forward pass dropping background pixels.
- `DEFAULTS`: `dropColor:[0,0,0]`, `dropTolerance:24`, `alphaThreshold:128`.

`src/color/image-grid.mjs` (the spatial sibling) shows the **cell-aggregation** pattern this ticket will
echo for normalization: `gridDims(w,h,n)` → aspect-correct `m = round(n·H/W)`; `aggregateCells` buckets
each pixel into its grid cell counting `fgCount`/`bgCount` separately; a cell is "filled" when
`coverage = fgCount/(fg+bg) ≥ coverageThreshold` (default 0.5). `comparePalettes` is a set-partition util.
These are the existing idioms for "reduce a decoded RGBA image to an N×M occupancy grid".

**Boundary convention (consistent across both modules):** the *pixel core* is pure (operates on synthetic
RGBA buffers, no decode dep, fully unit-testable with no committed fixture); **decode is isolated** to a
thin async shell (`*FromImage`) that calls `decodeImage`. New form module should preserve this seam.

## The actual on-disk signal (measured, not assumed)

13 run dirs under `benchmarks/sculpture/runs/*/` are **git-tracked** (`git ls-files`: 13 `render-3q.png`,
13 `concept.png`). The sculpture `.gitignore` excludes only `transcript.jsonl` and `turntable/` — the
matched pair is committed provenance, exactly as the ticket assumes. Subjects: moai, dancing-man,
moai-statue, pineapple, bow-and-arrow, anatomical-heart, sword, mushroom, koi-fish (001–009), plus
scale-study duplicates of moai/pineapple (010–013).

Backgrounds, sampled directly (`decodeImage` + corner/column probes):

- **render-3q.png** — 512×512. Background is a **uniform flat sky `#ADD8E6` = (173,216,230)`**, all four
  corners identical. A center-column probe confirms **no separate floor plane** survives at the bottom
  rows (corners return to sky); the only gray near the base is the statue/plinth itself. Foreground (moai)
  ≈ **20.7%** of frame at sky-tolerance 24. So sky-segmentation yields a clean object silhouette.
- **concept.png** — 1408×768 (wide). Background near-black: corners (0,0,0)…(5,4,8). Matches the existing
  `dropColor:[0,0,0]` default; tolerance ~40 covers the slight JPEG-ish noise (concepts are sometimes
  JPEG-with-.png per a known E-14 finding) while bright subjects stay foreground.

**Consequence for alignment:** the two images differ in **resolution (512² vs 1408×768), aspect ratio, and
subject scale/position within frame**. Any IoU must normalize for translation + scale (and decide how to
treat aspect ratio) before comparing. There is no pixel correspondence to exploit.

## The view geometry

`src/sculpture.mjs:71` — `SCULPTURE_VIEW_3Q = { azimuthDeg:45, elevationDeg:30, fov:45 }`. The render is
taken at this fixed 3/4. The concept is *also* a 3/4-ish view but produced by Nano-Banana, so azimuth/
elevation are only approximately matched — a structural source of IoU loss the limits note must own.
`render/src/camera.mjs` already frames arbitrary voxel bounds (per E-15 epic notes), but **rendering is out
of scope here** — this ticket only consumes the PNGs already on disk.

## Test harness & artifact conventions

- `npm run test:unit` = `node --test "src/**/*.test.mjs"`. So the module **must live under `src/`** for its
  test to run (→ `src/form/…`). 34 test files today; full suite is green (369 tests per session memory).
- Fixture-backed tests run from repo root, so a test can resolve `benchmarks/sculpture/runs/...` relative to
  `import.meta.url` (`../../../benchmarks/...`).
- Baseline artifact siblings: `benchmarks/sculpture/codesign-ab.{md,json,mjs}`, `value-match-ab.{md,mjs}` —
  a generator `.mjs` that writes a committed `.md` + `.json`. The ticket asks for
  `benchmarks/sculpture/form-baseline.{md,json}` in this family.
- Commit prefix convention from `git log`: `feat(E-15 T-043-01): …`.

## Constraints & assumptions surfaced

- **Determinism is mandatory** (it gates a hill-climb): same inputs → byte-identical output. No RNG, no
  `Date.now()`. Round all floats.
- **No GL, no network, no server** (Phase-1 stack rule; mirrors E-14). Decode is the only I/O, isolated.
- A **single 3/4 view cannot see the back** — IoU is a partial, view-bounded fidelity proxy, not a 3-D
  reconstruction score. This is the same single-view limit E-13/E-14 already acknowledge.
- Concept vs render are **not the same renderer** at **not exactly the same camera** — absolute IoU will be
  modest; its *value is as a relative, monotone signal* for the loop (Δ between revisions), which is what
  E-15 actually consumes.
- `isBackground` drops near-`dropColor` **foreground** as collateral (documented E-10 caveat) — a dark
  subject on black, or a sky-blue subject on sky, would be partly eaten. Acceptable for these subjects;
  must be noted.
