# T-045-01 — Research: deterministic-revision-loop

Descriptive map of what exists and where, for wiring the **first real revision loop** that consumes
the E-11 diagnosis and hill-climbs the E-15 form metric. No solutions here — only the terrain.

## The gap this ticket closes

E-11 built the two halves and never joined them:

- `src/sculptor/staged-loop.mjs` runs **one forward pass** (`massing → material → relief`) and a
  single `reviewBuildState` critic call. `runStagedLoop` returns `diagnosis` but **nothing consumes
  it** — there is no second pass, no accept-gate, no iteration. The name "loop" is aspirational.
- `src/sculptor/review.mjs` is the **diagnose-and-route critic** (the P14 cure): it emits
  `{defect, where, route}` and names the stage to re-run — it **routes, never re-emits a build**. Its
  pure core is `routeDefect`/`routeDiagnosis` over a frozen `ROUTING_TABLE`
  (`flat→[material,relief] · ringing→[curve] · under-detailed-focal→[detail] · proportion→[massing]`),
  with `ROUTE_TARGETS` the derived target set. The live render/diagnose leaves are lazy + injectable.

E-15's two dependencies supply the missing pieces:

- **T-043-01 — `src/form/form-fidelity.mjs`**: the FORM number. `formFidelity(renderImg, conceptImg,
  opts)` → silhouette **IoU** (whole-object) + optional **`regionIoU`** over a normalized `[0,1]`
  sub-rect. Pure/GL-free/RNG-free over decoded RGBA; `formFidelityFromPair(renderPath, conceptPath)`
  is the only decode caller. Baseline mean IoU **0.479** over 13 E-13 subjects
  (`benchmarks/sculpture/form-baseline.json`). The metric is **relative**: its worth is the Δ between
  revisions, not the absolute value (single 3/4 view, camera mismatch — documented honesty ledger).
- **T-044-01 — `src/revise/region.mjs`**: region addressing + the **region-lock** over a
  `DesignArtifact`. `selectRegion(artifact, spec)` → frozen `R = {schema, spec, subBounds:{min,max},
  placements, indices, fraction}` (spec = bbox | `{part}` | `where` string | raw `{min,max}`).
  `applyRegionEdit(artifact, R, edit)` replaces R's **in-region placements** (full-containment
  membership) and **freezes everything outside `subBounds`**, throwing `RegionEditOutOfBoundsError`
  on any edited voxel that escapes R. `observeRegion(artifact, R)` is the **one live GL leaf** (lazy
  `import()` of `render/src/world.mjs` + `render.mjs`), framing the camera on `subBoundsOf(R)`.

So the raw materials for the loop already exist: a **region selector + lock** (where to edit, and the
guarantee edits stay put) and a **form score** (whether an edit helped). This ticket adds only the
**control flow** between them — and one deterministic tweak primitive to drive it.

## The procedural passes the loop will scope

The AC says the only tweak is a **scoped procedural pass** — "E-11's `relief`/`material` bounded to
the region." Both E-11 passes exist but operate on a **`BuildState`** (the 2-D facade intermediate),
not on a `DesignArtifact`:

- `src/sculptor/relief.mjs` — `relief(state, intent)` writes a per-cell integer `relief ∈ {-1,0,+1}`
  (the Z move: recess −1, pop +1) over the locked material skin. The compile (`compile.mjs`) emits
  exactly **one `voxel` placement per occupied cell at `[x, y, relief]`** — relief is "carve by
  exclusion," never a buried block. Deterministic (a discrete classification; no per-cell hash).
- `src/sculptor/material.mjs` — assigns each occupied cell a `material` (block id) over the locked
  occupancy. Geometry-preserving (it only sets the block, never moves a cell).

**Key boundary mismatch:** E-11's passes live at the *build-state* level; the revision loop lives at
the *compiled `DesignArtifact`* level (3-D placements, where the region module operates). The loop
cannot call `relief(state)` directly — there is no `BuildState` at hand, only an artifact and an `R`.
What carries over is the **idea** of each pass, expressed as a placement transform bounded to `R`:
relief = a **Z (depth) move** of in-region voxels; material = a **block swap** of in-region voxels
(positions unchanged). `applyRegionEdit`'s `edit` already accepts a function
`(inRegionPlacements) => newPlacements`, which is exactly the seam such a placement-level pass needs.

## The artifact shape the loop edits

`DesignArtifact` (validated by `src/artifact.mjs`, AJV): `{schema_version, metadata, style,
palette:{manifest,…}, placements[]}`. Placements are `op ∈ {voxel, line, box, fill}`; voxel carries
`pos:[x,y,z]`, the rest `from`/`to` (schema does **not** require `from ≤ to`). `src/expand.mjs`
expands placements to voxels: `expandPlacement(p)` → `[{pos, block}]`, `expandArtifact(artifact)`,
`voxelKey(pos)`. The region module already reuses `expandPlacement` to enforce the lock cell-by-cell.
Committed sculptures live under `benchmarks/sculpture/runs/NNN-vConcept-*/` — each has `artifact.json`
+ a matched `concept.png` (black bg) / `render-3q.png` (sky bg) pair (13 runs, used as form fixtures).

## Test & boundary conventions (what the suite expects)

- `npm test` = artifact self-test + `node --test "src/**/*.test.mjs"`. **Pure unit tests live under
  `src/`**; a test that needs GL goes under `render/test/` (run separately) and is GL-gated. The
  region suite (`src/revise/region.test.mjs`) is the template: it **never** calls `observeRegion`, and
  a **static import scan** (`Group E`) asserts the pure module's top-level imports match no
  `render|world|prismarine|gl|camera|viewer` — the live stack must be reached by `await import()`.
- The **review-seam idiom** (E-11): a module's pure core is unit-tested; its live leaf (GL / model)
  is a lazy `import()` and is **injectable** so the suite drives the pipeline with stubs. `review.mjs`
  (`render`/`diagnose` injectable) and `region.mjs` (`observeRegion` lazy) both follow it.
- Determinism is a first-class property here: `form-fidelity` rounds all floats "because a hill-climb
  cannot tolerate jitter," and `relief` is explicitly hash-free. The loop must inherit this — **same
  input → same trace**.

## Constraints & assumptions surfaced

1. **No model in this loop.** The diagnosis step names "E-11 critic," but the live critic
   (`defaultDiagnose`) is a metered BAML/`claude -p` call. To keep the loop deterministic (AC #3), the
   default diagnosis must be **model-free** (a geometric stand-in); the model critic is the NEXT
   ticket's concern (S-046/T-046-01, "LLM form-edit route"). The model is referenced, not invoked.
2. **The score needs a render.** `formFidelity` compares two images; producing the render's image is a
   GL operation. So **re-scoring is a live render seam** — it must be isolated/injectable exactly like
   `observeRegion`, so pure tests inject a synthetic deterministic score and load no GL.
3. **The region-lock already proves "no out-of-region bleed"** (T-044-01's byte-identity invariant).
   The loop's spatial-lock obligation adds one thing on top: an **accepted region is never re-edited**
   — i.e. the loop must track locked regions and refuse to re-enter them.
4. **`regionIoU` needs a 2-D rect; `R.subBounds` is a 3-D box.** Projecting a 3-D sub-box to the
   render's 2-D normalized rect is a camera projection, not in scope. The simplest honest live score
   is **whole-object IoU** (did this local edit improve the global silhouette?); a caller may pass an
   explicit 2-D region for `regionIoU`. Either way the score is an **injected seam**, not loop logic.
5. **Convergence must be structural, not hoped-for.** A bounded region list × a per-region attempt
   budget × a global iteration cap guarantees termination regardless of whether any tweak ever helps.
6. **`material` (block swap) does not move the silhouette.** Under a form (IoU) score it is a no-op →
   the accept-gate will roll it back. That is the gate working, not a defect — and it makes a clean
   negative test (a constructed non-improving tweak is rolled back, the artifact unchanged).
