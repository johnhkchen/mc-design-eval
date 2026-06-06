# T-044-01 — Research: region-lock-and-observe

Descriptive map of the codebase territory this ticket touches. No solutions here — only
what exists, where, and how it connects.

## What the ticket asks for (restated)

Two primitives on the compiled `DesignArtifact`, no control flow yet:

1. **Region addressing + region-lock.** `selectRegion(artifact, spec) → R` (spec = bbox |
   named part | critic `where` string). R carries the in-region placement set + its integer
   sub-bounds. `applyRegionEdit(artifact, R, edit)` mutates only in-R placements and **rejects**
   any edit that adds/removes/moves a placement outside R. Result still passes the AJV gate.
2. **Observe a section.** `observeRegion(artifact, R) → png`, a tight crop render via
   `framedCamera(subBoundsOf(R))`.

This is the spatial generalization of E-11's per-**field** lock to a per-**region** lock, moved
from the facade build-state up to the artifact level so the loop reaches 3-D sculptures.

## The DesignArtifact — the object we operate on

- **Schema:** `schema/design-artifact.schema.json` (the single source of truth). An artifact has
  `schema_version`, `metadata`, `style`, `palette {manifest}`, and `placements` (≥1).
- **Placements union (discriminated by `op`):**
  - `voxel` — `{op, pos:[x,y,z], block, state?}` (one block at `pos`).
  - `line` — `{op, from, to, block, state?}` axis-aligned or uniform diagonal only.
  - `box` — hollow shell spanning `from..to` inclusive.
  - `fill` — solid cuboid spanning `from..to` inclusive.
  - `from <= to` is **not** required by the schema; corners are normalized downstream.
- **`palette.manifest`** — declared block ids, `minItems:1`, `uniqueItems:true`, must match
  `^[a-z0-9_.-]+:[a-z0-9_]+$`.
- **Coordinates** are integers, negatives allowed (builds use a local origin).
- **Application order = array order**; on overlap, **last-writer-wins** (documented in the schema
  and enforced by `expandArtifact`).

A real committed example: `benchmarks/sculpture/runs/009-vConcept-a-koi-fish/artifact.json` —
60 placements (mix of fill/line/voxel), overall integer bounds **min [-15,0,-7] max [16,15,7]**
(longest axis is x, ~32 blocks nose→tail). This is the live-render subject named in AC #4.

## The AJV gate — `src/artifact.mjs`

- `parseArtifact(input) → {ok, artifact}|{ok:false,code,errors}` and `assertArtifact(input)`
  (throws). Validation is a **value, not an exception** in the parse form; the assert form throws
  the joined located lines. On success the artifact is **frozen**.
- Compiled with `Ajv2020({allErrors,strict,discriminator})` against the canonical schema
  (memoized validator). `SCHEMA_PATH` is exported.
- Pure: no SDK, no network. This is the gate the edited artifact must still pass (AC #2). It is a
  **consumer-side** check used in tests — it is not imported by the producers (compile.mjs), so
  this ticket's tests will follow the same idiom: build → assert through `assertArtifact`.

## Placement → voxel expansion — `src/expand.mjs`

- `expandPlacement(placement) → Voxel[]` and `expandArtifact(artifact) → Voxel[]` (deduped,
  canonical y→z→x order, last-writer-wins). Pure integer geometry, **no deps**.
- `bounds(from,to)` normalizes corners to `{lo,hi}` per axis. `voxelKey(pos) → "x,y,z"`.
- `line` adds the one guard the schema can't: equal-magnitude nonzero axis deltas, else it throws
  a located Error. So any region containment test that goes through expansion inherits this guard.
- This is the canonical way to turn a placement into the cells it occupies — the natural tool for
  "is this placement inside R?" and for the lock invariant "cells outside R are unchanged."

## The camera — `render/src/camera.mjs` (pure, no GL)

- `boxOf(bounds) → {lo,hi}` — world-space box of integer voxel bounds (`max+1` on the high side,
  because a voxel at `p` occupies `[p,p+1]`).
- `boundingSphere(bounds) → {center, radius}` — rotation-independent fit basis.
- `framedCamera(bounds, view?) → {eye,target,up,fov,distance,radius}` — THE primitive: fixed
  angle (azimuth 45°, elevation 35°), distance derived so the sphere fits the frustum on both
  axes. **This already frames an arbitrary integer voxel bounds**, so "observe R" is
  `framedCamera(subBoundsOf(R))` — no new camera math (the ticket says so explicitly).
- `viewDistanceFor(distance, radius, min)` — chunk-streaming radius so far voxels are meshed.
- `DEFAULT_VIEW` — `{width:512,height:512,fov:75,azimuthDeg:45,elevationDeg:35,margin:1.18}`.
- Unit-tested **without** a GPU (`render/test/view.test.mjs`); this is the comparability invariant
  kept testable off-GPU. Our `subBoundsOf` math should live here in spirit (pure, GL-free).

## The render seam — `render/src/render.mjs`, `render-tool.mjs`, `world.mjs`

- `render/src/world.mjs` `buildWorldFromArtifact(artifact, {strict?}) → {world, center, bounds,
  placed, unmapped}` — builds a fresh in-memory prismarine world by **consuming `src/expand.mjs`**
  (`expandArtifact`), never reimplementing expansion. `bounds` is the whole-build extent (or null
  if all-unmapped). Construction is total (unmapped blocks recorded, not thrown).
- `render/src/render.mjs` `renderWorldToPng(world, center, opts)` — headless PNG. Crucially,
  **`opts.bounds` triggers `framedCamera(opts.bounds, opts.view)`** and the constant-offset path is
  the fallback. So a tight crop on R = render the full world but pass `bounds: subBounds`.
  `renderBuild(build, opts)` frames on `build.bounds` (the whole build) — there is **no existing
  param to frame on an arbitrary sub-bounds while still rendering the full world** except by calling
  `renderWorldToPng` with `bounds` directly.
- `render/src/render-tool.mjs` `renderArtifact(artifact, {outPath,view,strict}) → RenderReport` —
  the one place an artifact becomes a PNG; frames on the whole build's bounds.
- **GL gate:** `GL_AVAILABLE` / `GL_LOAD_ERROR` are exported from `render.mjs`/`render-tool.mjs`.
  In this environment GL **is** available (verified). The `render/` package has its own
  `node --test` over `render/test/*.test.mjs`, all **GL-gated** (skip with the captured reason when
  GL is absent). `render/` imports up into `../../src/` (e.g. `world.mjs` imports `src/expand.mjs`).

## E-11's lock — the conceptual template — `src/sculptor/`

- `build-state.mjs` — sparse facade grid; per-**field** LOCK (`FIELDS = occupied|material|relief`).
  `draftState(state) → Draft`; `Draft.set(x,y,patch)` throws `LockViolationError` when a stage tries
  to **change** a LOCKED field; **re-writing the same value is a permitted no-op** ("only add within
  bounds"). `commit()` freezes a fresh state carrying locked/lockLog unchanged. `lockFields(state,
  stage, fields)` unions locks. **Named error with `.code`, thrown at the write site** — the pattern
  to mirror per-region.
- `review.mjs` — the **seam isolation** precedent: a PURE core (defect vocabulary + routing,
  unit-tested under the glob) plus **LIVE leaves** (`defaultRender`, `defaultDiagnose`) that
  **lazy-`import()`** GL/BAML so importing the module for pure tests loads neither. `where` is
  **free text, passed through verbatim, never parsed** in E-11 (T-044 begins to parse it into a
  region). `render`/`diagnose` are **injectable** so the pipeline is unit-tested with stubs.
- `compile.mjs` `toDesignArtifact(state, opts)` — build-state → artifact; derives `manifest` from
  placed blocks; **does not validate** (tests run it through `src/artifact.mjs`). Pattern for
  rebuilding a valid artifact after an edit: derive the manifest from the placements actually used.
- `reuse-boundary.test.mjs` — **static import-scan** test idiom: assert a module's import specifiers
  avoid a denylist. The analog here: assert the pure region module statically imports **no GL**.

## "Named part" — what exists, what does not

- There is **no part registry** anywhere in `src/` or the artifact — placements carry no part
  labels, and the design-doc's parts ("head/body/tail" for the koi) are prose, not machine data.
- The critic's `where` is **free text** from the image judge (`review.mjs`), historically unparsed.
- So "named part" has **no existing semantic source**; any mapping from a name to a sub-box must be
  defined fresh and must be **geometric/deterministic** (orientation of "head" vs "tail" is not
  recoverable from the artifact — koi eyes sit at min-x, so a "front = max end" guess would be
  wrong). This is a key constraint surfaced for the Design phase, not resolved here.

## Test & tooling conventions

- ESM `.mjs`, Node ≥20, `node --test`. Top-level `npm test` runs the schema self-tests then
  `node --test "src/**/*.test.mjs"` (**pure**, no GL). `render/` has a **separate** GL-gated
  `node --test`. Deps available: `ajv`, `ajv-formats`, `pngjs`, `vec3` (via render), prismarine-*.
- Module headers in this repo are long, boundary-declaring comments (what it owns, what it must not
  import). Tests assert **properties** (purity, determinism, schema-validity, rejection) and pin a
  few concrete values. Named errors carry a `.code`.

## Constraints & assumptions surfaced

- The edited artifact must stay **schema-valid** (manifest unique/non-empty, ≥1 placement, coords
  integer). An edit that empties R or the build would violate `minItems:1`.
- **Partial overlap:** a fill straddling R's boundary occupies cells both inside and outside R —
  Design must decide whether such a placement is "in R" (and how the lock treats the cells it shares
  with R). The lock's real guarantee is about **cells**, not placements.
- The pure region math must be **GL-free**; only the live crop render crosses into GL, isolated like
  E-11's review seam so `src/**/*.test.mjs` loads no GL and the live proof is GL-gated.
- The koi run (`009-*-koi-fish`) is the committed live subject; its bounds/placements above are the
  concrete fixture for the observe proof and for any real-artifact region test.
