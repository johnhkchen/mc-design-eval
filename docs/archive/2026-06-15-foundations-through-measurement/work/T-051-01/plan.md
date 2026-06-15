# T-051-01 — Plan: ordered, committable steps

Four atomic steps, each independently verifiable. Steps 1–3 are pure (covered by `npm test`); step 4 is
the on-demand metered/GL/host-tool run. Testing strategy follows the codebase rule: pure logic under
`src/**/*.test.mjs` (CI), GL/metered work in `benchmarks/**` (manual).

## Step 1 — method id in config
- Add `export const GLB_VOXEL_METHOD_ID = "glb-voxel.v1";` to `src/config.mjs` beside the vConcept ids.
- **Verify:** `node -e "import('./src/config.mjs').then(m=>console.log(m.GLB_VOXEL_METHOD_ID))"`.
- **Commit:** `feat(E-16 T-051-01): glb-voxel method id (config)`

## Step 2 — color-aware GLB surface parse
- `src/form/glb-mesh.mjs`: add `parseGlbColoredSurface(glb)` returning `{vertices, uvs, bounds,
  baseColor}` (Decision 3 / structure). Reuse private helpers; leave `parseGlbMesh` untouched.
- `src/form/glb-mesh.test.mjs`: extend the in-memory `buildBoxGlb` fixture (or add a builder) to carry
  `TEXCOORD_0` + a 1-image `image/webp`-tagged baseColor bufferView (the bytes can be a stub — the
  parser only slices + reports them; it does not decode). Assert:
  - `vertices.length === 3·vertexCount`, `uvs.length === 2·vertexCount`, bounds match `parseGlbMesh`.
  - `baseColor.mimeType === "image/webp"` and `baseColor.data` is the expected slice.
  - A GLB with no material/texture → `baseColor === null`.
- **Verify:** `npm test` (the two new assertions pass; suite stays green).
- **Commit:** `feat(E-16 T-051-01): parseGlbColoredSurface (UVs + baseColor image)`

## Step 3 — the pure color/compile core + tests (AC #1, #2, #4)
- `src/form/glb-voxel-build.mjs`: `blockPaletteFromTable`, `sampleSurfaceColors`,
  `colorVoxelsToArtifact`, `glbVoxelBuild` (structure.md signatures).
- `src/form/glb-voxel-build.test.mjs`: the cases in structure.md —
  - `colorVoxelsToArtifact` synthetic occupancy + 2-color synthetic colors + tiny palette →
    **`assertArtifact` passes** (round-trip AC), 4 placements, sorted-unique 2-block manifest, centered
    positions; empty-occupancy throw; colors-length-mismatch throw; real-table gray-maps-gray sanity.
  - `sampleSurfaceColors` 2-vertex / 2×2-texture corner test.
  - `blockPaletteFromTable` shape + non-empty.
- **Verify:** `npm test` green (this is the AC-bearing step: pure logic unit-tested, artifact passes the
  real AJV gate, suite green).
- **Commit:** `feat(E-16 T-051-01): glb-voxel color+compile core (value-true blocks → DesignArtifact)`

## Step 4 — real koi/heart builds, rendered + judged (AC #3)
- `benchmarks/sculpture/glb-voxel-run.mjs` (structure.md): `dwebp`-backed `decodeTexture`; per subject
  build → `assertArtifact` → render at `SCULPTURE_VIEW_3Q` → silhouette IoU vs the GLB's own silhouette
  → save `benchmarks/sculpture/glb-voxel/<subj>/{artifact.json,render-3q.png,summary.json}` +
  `glb-voxel/summary.md`.
- `.gitignore`: exclude the heavy renders under `benchmarks/sculpture/glb-voxel/**/*.png` (match
  existing GLB/render ignores); keep `artifact.json` + `summary.md`.
- **Verify (manual, not CI):** `node benchmarks/sculpture/glb-voxel-run.mjs` → both subjects produce a
  schema-valid artifact, a non-empty render, and a finite IoU; eyeball renders for plausible
  form + color (koi long body + two-tone, heart chambered + red). Record numbers in `progress.md`.
- **Commit:** `feat(E-16 T-051-01): real koi/heart glb-voxel builds (render + silhouette IoU)`

## Testing strategy summary
| Concern | Where | Kind |
|---|---|---|
| color→block→placement→artifact (round-trip AJV) | `glb-voxel-build.test.mjs` | unit, exact |
| centering / pos mapping | same | unit, exact |
| empty / mismatched input guards | same | unit, throw |
| UV→texel sampling | same (synthetic texture) | unit, exact |
| color-aware GLB parse (UVs + baseColor slice) | `glb-mesh.test.mjs` | unit, exact (in-mem fixture) |
| real koi/heart build + render + IoU | `glb-voxel-run.mjs` | on-demand, recorded (not asserted) |

## Risks & mitigations
- **WebP decode portability** → confined to the runner via `dwebp` (already installed); never in CI.
- **Perf (O(cells×verts) sampling)** → one-shot offline; flag a spatial-index seam in review.
- **Orientation (Y-up assumption)** → validated by T-050-01's recorded dims (koi long-in-x, short-in-y);
  the render at `SCULPTURE_VIEW_3Q` is the visual check in step 4.
- **IoU low if voxelization is sparse** (koi 17% fill) → IoU is recorded, not gated; it's the
  head-to-head number, and a low value is a finding, not a failure.

## Definition of done
AC #1–#4 met: `glbVoxelBuild` returns an AJV-valid value-true artifact; pure core unit-tested offline;
real koi+heart builds rendered at `SCULPTURE_VIEW_3Q` + judged (IoU) with artifacts/renders saved under
`benchmarks/sculpture/glb-voxel/`; `npm test` green.
