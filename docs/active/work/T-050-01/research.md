# T-050-01 — Research: GLB Voxelize Occupancy

Epic E-16, Arm B. This ticket builds the **geometry half** of the image→3D voxel pipeline:
turn a TRELLIS GLB **mesh** into an **occupancy voxel grid** at a target `scale`. Pure geometry —
no GL, no color (color is S-051/T-051-01). Descriptive map of what exists and the boundaries.

## The founding question (why this exists)

Text→JSON sculpture builds keep palette + parts but lose *form/line*: the koi S-curve flattens, the
heart's aortic arch never loops (E-15 finding; memory `form-revision-needs-3d-target`). Arm B asks
whether voxelizing a real 3-D mesh recovers the form that text loses. T-050-01 produces the occupancy
grid; T-051-01 colors it into a `DesignArtifact`; T-052-01 runs the surgical loop on it.

## Inputs that already exist

- **Real meshes:** `benchmarks/sculpture/glb/{koi,heart}.glb` — koi 95,147 verts / 143,664 tris
  (4.95 MB); heart 106,365 verts / 145,210 tris (5.42 MB). Both valid **binary glTF v2**, 1 mesh /
  1 primitive, 2 textures, 1 material. **Gitignored** (binary), regen via
  `benchmarks/sculpture/trellis-glb.mjs <concept.png> glb/<name>.glb`. Manifest in
  `benchmarks/sculpture/glb/README.md`.
- **GLB header validator only:** `benchmarks/sculpture/trellis-glb.mjs`
  - `generateGlb(pngBytes, opts)` — Modal client (not needed here).
  - `inspectGlb(buf)` (lines 44–51) — reads the 12-byte header: magic `0x46546c67` ("glTF",
    LE u32 @0), `version` (@4), `length` (@8). **Validates the header only — it does NOT parse
    meshes / vertices / triangles.** A real mesh parser does not yet exist anywhere in the repo.

## The scale convention (must match vConcept)

`src/sculpture.mjs`:
- `SCALE_MIN = 8` (line 58), `SCALE_MAX = 64` (59), `DEFAULT_SCALE = 32` (60). Comment: "Target
  longest-edge bounds (blocks)."
- `sculptureScaleCaps(scale)` (lines 114–119): validates `scale ∈ [8,64]` integer, returns cubic caps
  `{ maxW: scale, maxH: scale, maxD: scale }`. The build is told "~`scale` blocks along the LONGEST
  dimension" (line ~239). So **the mesh's longest edge ≈ `scale` voxels** is the comparability
  invariant: a voxelized build and a text→JSON build at the same `scale` occupy the same envelope.

## The sibling parser ticket (T-048-01) — NOT yet implemented

- `docs/active/work/T-048-01/` is **empty**; ticket phase is `design`, `depends_on: []`. It is a
  parallel root of E-16, same as T-050-01.
- T-048-01 AC: a pure `src/form/glb-silhouette.mjs` that loads a GLB's **vertices + triangle indices**,
  projects from `SCULPTURE_VIEW_3Q`, rasterizes a binary mask. It references "the glTF JSON/binary
  parse in `trellis-glb.mjs` `inspectGlb`" — but that only reads the header, so T-048-01 *also* needs a
  real mesh parser it does not have.
- **Both tickets need the same `GLB bytes → {positions, indices}` parser.** T-050-01 AC explicitly:
  "sharing the GLB mesh parse with T-048-01 (**no duplicate parser**)." Since neither exists yet, the
  canonical parser must be created as a standalone shared module that both import. This is the central
  architectural constraint of this ticket.

## The E-15 / E-16 seam (downstream, not touched here)

`src/form/form-target.mjs`:
- `glbFormTarget(opts)` (lines 89–96) — stub, throws `FormTargetNotImplementedError`; the documented
  adapter point for the **GLB-as-target** arm (S-049, not this ticket).
- `resolveFormTarget(cfg)` / `conceptFormTarget(...)` — the `scoreRender(renderPath, R)` interface the
  surgical loop (`src/revise/loop.mjs` `liveFormScore`) consults. T-050-01 is **upstream of all of
  this** — it is GLB-as-*source* (Arm B), producing occupancy, independent of the loop seam.

## Test infrastructure

- Runner: Node native `node --test`. Script `test:unit`: `node --test "src/**/*.test.mjs"`. Full
  `npm test` = artifact self-tests + `test:unit`. **Test files: `src/**/*.test.mjs`.**
- Style: `import { test } from "node:test"; import assert from "node:assert/strict";` then
  `test("name: desc", () => { ... })`. Reference: `src/sculpture.test.mjs`,
  `src/form/form-fidelity.test.mjs`. Tests must be **offline** — no 5 MB GLB in unit tests (build
  synthetic meshes in-memory).

## Dependencies / available math

- Production deps: only `@boundaryml/baml`. Dev: `ajv`, `ajv-formats`, `jpeg-js`, `minecraft-assets`,
  `pngjs`, `tsx`. **No glTF parser, no `three`, no `vec3` in the main `src/` package.** (The `render/`
  sub-package has `three` + `vec3`, but main `src/` must not depend on it.)
- Implication: parse GLB binary **manually** (DataView over the BIN chunk; accessors → bufferViews →
  typed-array reads) and do 3-D math with plain numbers. No new dependency needed or wanted.

## glTF binary facts relevant to the parse

- `.glb` = 12-byte header, then chunks. Chunk 0 = JSON (type `0x4E4F534A`), chunk 1 = BIN
  (`0x004E4942`). JSON describes `meshes[].primitives[]` with `.attributes.POSITION` (accessor idx) and
  `.indices` (accessor idx). Accessor → `bufferView` (byteOffset/byteLength/byteStride) → the BIN bytes.
- POSITION: `componentType 5126` (FLOAT), `type "VEC3"`. Indices: `5121` (U8) / `5123` (U16) / `5125`
  (U32). Nodes may carry a `matrix` or TRS (`translation`/`rotation`/`scale`); the sculpture GLBs are a
  single mesh but a correct parser should compose node transforms when present.

## Constraints / assumptions surfaced

- **Pure + deterministic + GL-free** is mandatory (AC + testability in headless lisa agents).
- TRELLIS meshes are **closed/watertight** surfaces → a ray-parity (even–odd) point-in-mesh test gives
  a **solid** occupancy; a triangle-vs-cell test gives a **hollow shell**. "Plausibly dense/hollow as
  expected" (AC) means we record counts, not assert them, for the real meshes.
- Determinism risk: ray-vs-triangle parity double-counts at shared triangle edges. A **half-open
  barycentric rule** (each triangle owns only its lower edges) makes shared edges counted exactly once —
  the standard fix, and it keeps the synthetic-cube count exact.
- Unit tests offline → synthetic cube mesh built in code; real koi/heart counts recorded by a separate
  (non-unit) sanity script that skips when the gitignored GLB is absent.
