# T-075-01 Plan — ordered, verifiable steps

Each step is independently verifiable and commits atomically. Testing strategy folded in.

## Step 1 — Pure downscale math + its unit test (the GL-free core)
**Do:** Create `src/render-supersample.mjs` with `boxDownscale`, `nearestDownscale`,
`highFreqEnergy` (signatures per structure.md). Create `src/render-supersample.test.mjs` with the
five cases (shape/exactness, integer-factor guard, identity, **box < nearest HF energy on a
synthetic high-frequency image**, determinism).
**Verify:** `npm test` (root) green; the new cases pass; total count rises from the 785 baseline.
**Why first:** zero dependency on GL or render wiring; locks the AC #3 deliverable and the math the
lens fix relies on, in isolation.
**Commit:** `feat(E-22 T-075-01): pure box-downscale supersample math + GL-free test`

## Step 2 — Render-package wiring (headless-canvas helpers + render.mjs SSAA)
**Do:**
- `render/src/headless-canvas.mjs`: add `readCanvasRgba(canvas)` and
  `encodeRgbaToPng(rgba, w, h)` exports (node-canvas isolated here).
- `render/src/render.mjs`: add `DEFAULTS.supersample = 3`; import the two helpers +
  `boxDownscale`; size canvas/renderer to `ssW×ssH`; keep camera aspect at `width/height`; branch
  the encode (ss===1 legacy `getBufferFromStream`, ss>1 read→box→encode at 512²).
**Verify:**
- `npm test` (root) still green (pure suite unaffected).
- `cd render && node --test test/scaffold.test.mjs test/view.test.mjs test/render-tool.test.mjs`
  — the GL-gated render tests run here (GL present) and pass: valid PNG signature,
  `bytes > 2000`, output **512×512**, footprint `0.02 < f < 0.95`, scale-ratio `< 1.8`. These
  prove the contract size + framing are preserved through supersampling.
  (Skip `*.live.test.mjs` — they bill the model.)
**Why second:** depends on Step 1's `boxDownscale`; co-dependent files commit together.
**Commit:** `feat(E-22 T-075-01): supersample render lens (SSAA 3×, box-down to 512²) in owned code`

## Step 3 — Live before/after proof on the scale-64 gatehouse (impure)
**Do:**
- Capture **before**: copy the committed aliased
  `benchmarks/sculpture/building/scale-64/render-3q.png` → `docs/active/work/T-075-01/before.png`.
- Capture **after**: re-render the **same** `benchmarks/sculpture/building/scale-64/artifact.json`
  with the fixed lens via `renderArtifact(artifact, { outPath: .../after.png, view: BUILDING_VIEW_3Q })`
  (a tiny throwaway node invocation, or reuse `building-build.mjs --offline` path if it re-renders;
  simplest is a direct one-shot import). Build is unchanged — same `placements`.
- Sanity-check **after.png** is 512×512 and visibly NOT static (lower neighbour-disagreement than
  before; spot-check by eye + a quick HF-energy diff if cheap).
- Write `docs/active/work/T-075-01/lens-note.md`: one paragraph — *what aliased* (16px textures
  minified to ~6 px/block, point-sampled, no mipmaps, no AA), *what the fix changed* (internal 3×
  supersample → box-average to 512²), both PNG paths, and the explicit statement that **scale was
  not lowered** (proven at scale 64 — Rule 3 / AC #5).
**Verify:** both PNGs exist, 512², after.png reads clean; note cites both paths.
**Why third:** needs Step 2's code; produces the AC #2/#5/#6 proof. GL is available in this env.
**Commit:** `docs(E-22 T-075-01): before/after proof on scale-64 gatehouse + lens note`

## Step 4 — Review artifact
**Do:** Write `review.md` — files changed, test coverage + gaps, open concerns (mipmap option
deferred; SSAA cost; render-package GL tests not in root suite), handoff notes.
**Verify:** `npm test` green one final time; recap AC checklist.
**Commit:** part of the docs commit or its own `docs(E-22 T-075-01): review`.

## Testing strategy summary
- **Unit (root `npm test`, GL-free, runs in lisa CI):** `src/render-supersample.test.mjs` — the
  downscale math + the box-beats-nearest HF-energy property (AC #3). This is the durable regression
  guard.
- **Integration (render package, GL-gated, runs only where GL exists):** existing
  scaffold/view/render-tool tests confirm the 512² contract + framing survive supersampling.
- **Impure proof (manual, this env):** before/after render of the real scale-64 artifact (AC #2).
- **Not added:** a pixel-exact golden-image test (non-deterministic across GL drivers; the contract
  tests + the pure math test cover the regression surface). Noted in review as a known gap.

## Risks & mitigations
- **SSAA render cost (9× fragments at N=3) on a 57k-block build.** Meshing dominates and is
  unchanged; a single proof render is fine. If too slow, N is a one-line default; not auto-varied.
- **`readCanvasRgba` Y-orientation.** `blitGlToCanvas` already flips; `getImageData` returns
  top-left origin → matches the legacy PNG. Verified by the GL render tests' footprint assertions.
- **Atlas mipmap temptation.** Explicitly deferred (vendored-code race + atlas bleed); SSAA alone
  clears the diagnosed minification at N=3.
- **Root vs render test scoping.** The pure test lives in `src/` so it's in `npm test`; render
  tests stay in their own suite (they contain model-billing live tests). Documented.

## Definition of done (AC mapping)
- AC#1 lens fixed in `render.mjs` via supersample → Step 2.
- AC#2 before/after on same scale-64 artifact, build unchanged → Step 3.
- AC#3 deterministic GL-free downscale-math unit test → Step 1.
- AC#4 deterministic, comparable, 512² contract, no per-build tuning → Steps 1+2.
- AC#5 resolution floor honored (works at ≥48, scale not lowered) → Step 3 note.
- AC#6 `npm test` green + before/after PNGs + note in work dir → all steps.
