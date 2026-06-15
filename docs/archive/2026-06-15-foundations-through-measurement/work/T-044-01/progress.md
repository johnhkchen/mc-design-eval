# T-044-01 — Progress

Tracks execution against `plan.md`. All steps complete; two commits landed.

## Completed

- **Step 1 — pure region core.** `src/revise/region.mjs`: `REGION_SCHEMA`, `DEFAULT_FRACTION`,
  `PART_NAMES`; bounds helpers (`placementBounds`, `artifactBounds`, `coordInBounds`,
  `boundsContain`, `clampBounds`, `subBoundsOf`); resolution (`resolveNamedRegion`,
  `resolveWhereRegion`, `selectRegion`). Smoke-tested on the koi artifact.
- **Step 2 — the lock.** `RegionEditOutOfBoundsError` (named, `.code`, `.index`, `.coord`,
  `.subBounds`) + `applyRegionEdit` (array/fn edit, voxel bound-check via `expandPlacement`,
  out-of-R carried through, manifest rebuilt, empty-guard). Top-level import of `expandPlacement`
  from `../expand.mjs` (the only top-level import — keeps the pure graph GL-free).
- **Step 3 — pure suite.** `src/revise/region.test.mjs`, 16 tests across Groups A–E. One initial
  failure: a two-keyword `where` test asserted an intersection; corrected to the **union** semantics
  the design specifies (union of orthogonal slabs is conservative, not the corner intersection).
  **Commit 1** `562b74e`.
- **Step 4 — observe leaf.** `observeRegion` added to `region.mjs` — `async`, lazy-imports
  `world.mjs` + `render.mjs`, builds the full world, frames on `subBoundsOf(R)` via
  `renderWorldToPng(..., {bounds})`. The pure suite still loads no GL (Group E static scan confirms
  the render imports are dynamic only).
- **Step 5 — live proof.** `render/test/observe-region.test.mjs`, 2 GL-gated tests on the committed
  koi: a head-end crop renders to a correct PNG (signature + non-trivial bytes + framed on R), and
  the crop's framing sphere is strictly smaller than the whole-build sphere (it is a true crop).
  Visually verified: the crop shows the koi head close-up (white body, black eye, orange patches,
  blue base). **Commit 2** `e315fc5`.
- **Step 6 — verification.** `npm test` → **415/415** pure (no GL). `render/` `node --test` →
  **38/38** (incl. the 2 new live tests, GL present here).

## Deviations from plan

- **`where` union vs intersection (test only).** The plan/design specified union; the first draft of
  one test assumed intersection. The *implementation* always matched the design (union); only the
  test expectation was corrected. No code change.
- **No top-level GL re-export.** As anticipated in `structure.md`, `region.mjs` does **not** re-export
  `GL_AVAILABLE`/`GL_LOAD_ERROR` (that would couple the pure graph to GL). The live test imports the
  gate directly from `render/src/render-tool.mjs`, exactly as the existing render tests do.
- **R1 fallback not needed.** `renderWorldToPng`'s `opts.bounds` path framed the crop correctly on
  the first try; the documented "render an R-only sub-artifact" fallback was not required.

## Concurrency note

The parallel root ticket **T-043-01** (form-fidelity metric) committed `review.md` (`4a59dd9`)
between my two commits. No collision: T-044-01 touches only `src/revise/region.mjs`,
`src/revise/region.test.mjs`, and `render/test/observe-region.test.mjs` — disjoint from T-043-01's
files, as the DAG models (independent roots).

## Artifacts produced

- `src/revise/region.mjs` (new) — region addressing + lock + observe leaf.
- `src/revise/region.test.mjs` (new) — 16 pure unit tests.
- `render/test/observe-region.test.mjs` (new) — 2 GL-gated live crop renders.
- `render/out/observe-koi-head.png`, `observe-koi-top.png` (render outputs, not committed).
