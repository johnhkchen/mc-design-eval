# T-051-01 — Design: GLB Voxel Build

Decide how to turn T-050-01 occupancy + the GLB's WebP surface color into a schema-valid
`DesignArtifact`, value-true per cell, with a pure testable core and an on-demand real-build runner.
Grounded in research.md.

## The shape of the problem

Three sub-problems, with very different purity profiles:
1. **Surface color per occupied cell** — needs mesh UVs + a *decoded* WebP texture. Decode is impure
   (host CLI). Sampling math is pure.
2. **Color → value-true block → placement → artifact** — pure E-10 arithmetic + compile. **This is the
   AC's "pure color/compile logic", and the unit-tested heart.**
3. **The real koi/heart run** — parse + voxelize + decode + sample + compile + render + judge. Impure;
   the on-demand runner.

The cut that makes everything else fall out: **the testable core never sees a GLB or a WebP.** It takes
occupancy + an array of already-sampled RGB (one per occupied cell) + a palette, and returns an
artifact. WebP/UV stays on the runner side, exactly as `value-build.mjs` keeps pngjs on the runner side.

## Decision 1 — Layering: a 3-stage seam (sample · color/compile · tie-together)

```
glb ─parse─▶ surface{verts,uvs,bounds}  ─┐
glb ─voxelize(T-050)─▶ occupancy          ├─▶ sampleSurfaceColors ─▶ Uint8 RGB[per cell]
baseColor WebP ─decode(runner)─▶ RGBA ───┘                                  │
                                                                            ▼
                                          colorVoxelsToArtifact(occupancy, colors, palette) ─▶ DesignArtifact
```

- **`colorVoxelsToArtifact(occupancy, colors, { palette, scale, metadata, style })`** — PURE. Per cell:
  `nearestLab(srgbToLab(rgb), palette)` → block; emit `{op:"voxel", pos:[x,y,z], block}`; manifest =
  unique placed blocks (sorted). Mirrors `sculptor/compile.mjs`. **Does not validate** (caller asserts).
  *This is AC #1 + AC #2.*
- **`sampleSurfaceColors({ occupancy, surface, texture })`** — PURE given a decoded texture. For each
  occupied cell center (world coords from `min + (idx+0.5)·voxelSize`), find the nearest mesh vertex,
  read its UV, sample the texture (nearest-texel) → `[r,g,b]`. Returns a flat `Uint8Array(3·count)`.
- **`glbVoxelBuild(glb, { scale, decodeTexture, palette })`** — IMPURE only through the injected
  `decodeTexture` (WebP bytes → `{width,height,data}`). Ties the three together and returns the
  artifact. Satisfies the AC signature `glbVoxelBuild(glb, { scale }) → DesignArtifact` (async).

### Why this cut (vs alternatives)

- **Rejected: one function does everything.** Couples WebP decode (host CLI) into the unit-testable
  path → either CI needs `dwebp` (fragile) or the function can't be tested offline. AC #2 forbids
  testing on a real GLB; the core must accept synthetic color. Layering is mandatory, not stylistic.
- **Rejected: bake per-vertex colors first, then nearest-vertex.** Same O(cells×verts) cost as sampling
  at the matched vertex, but forces decoding the whole texture into a vertex array up front and loses
  the clean "sampler is pure given a texture" boundary. Sampling lazily at the matched vertex's UV is
  simpler and just as cheap; keep it.

## Decision 2 — Surface color = nearest **vertex** UV (not nearest-triangle barycentric)

Two ways to get a UV for a cell center:
- **(A) Nearest vertex**, sample texture at that vertex's UV. O(cells × verts), trivial, robust.
- **(B) Nearest point on nearest triangle**, barycentric-interpolate UV, sample. More "correct" for
  coarse meshes, but O(cells × tris) with point-in-triangle projection per tri — heavier, more code,
  more edge cases (degenerate tris, seams).

**Choose (A).** TRELLIS meshes are dense (~75k verts at 150k-tri decimation) relative to a ≤64³ voxel
grid, so a cell center is always near many vertices — the interpolation (B) buys almost nothing at this
ratio. Block quantization (305 Lab buckets) and a ~scale-coarse grid dwarf sub-texel UV precision: the
nearest-vertex texel and the barycentric texel almost always land in the same block bucket. (A) is
cheaper, simpler, and easier to test. A spatial index / barycentric upgrade is a documented future seam.

## Decision 3 — Extend `glb-mesh.mjs`, don't fork a parser

The story owns `glb-mesh.mjs`; add a sibling **`parseGlbColoredSurface(glb)`** there reusing the
existing private helpers (`splitChunks`, `readAccessor`, `transformPoint`, `mat4*`). Returns:
```
{ vertices: Float64Array (3/vert, world space), uvs: Float64Array (2/vert), bounds, baseColor: {data:Uint8Array, mimeType} | null }
```
- **`parseGlbMesh` is left untouched** — T-050-01's voxelizer depends on its exact contract.
- baseColor image: follow `materials[*].pbrMetallicRoughness.baseColorTexture.index → textures →
  images[*].bufferView` and slice the bytes; report `mimeType` so the runner picks a decoder. If absent,
  `baseColor:null` (the runner errors clearly; the core can still run on injected colors).
- **Rejected**: extending `parseGlbMesh`'s return — would change a contract two consumers already pin,
  and the triangle-soup shape (9 floats/tri, indices expanded) is wrong for per-vertex UV lookup anyway.
  A vertex-indexed surface is the natural shape for color; a separate function is the honest split.
- *Note*: this does **not** resolve the duplicate-parser concern (T-048-01's inline `parseGlb`); that's
  still T-053-01's job. We add one well-scoped function to the canonical parser, no new third parser.

## Decision 4 — WebP decode lives in the runner via `dwebp` (host CLI), injected

`decodeTexture` is a parameter of `glbVoxelBuild`. The runner supplies one that: writes the WebP bytes
to a temp file, runs `dwebp <tmp.webp> -o <tmp.png>`, decodes the PNG with the existing
`decodeImage`/pngjs, cleans up. **No new dependency; not in CI.**
- **Rejected: add a JS/WASM WebP decoder dep** (`@jsquash/webp`, `sharp`) — violates the lean-toolchain
  rule for a path that only the on-demand runner exercises; `dwebp` is already installed.
- **Rejected: re-request PNG textures from TRELLIS** — needs the Modal endpoint + a re-gen; the GLBs we
  have are the artifacts under test. Out of scope.
- Injection keeps `glbVoxelBuild` testable with a fake `decodeTexture` if we ever feed it a synthetic
  textured GLB (we won't in CI, but the seam stays clean).

## Decision 5 — Coordinate mapping (grid index → artifact pos)

`i → x`, `j → y` (up; ground at `y=0`), `k → z`. Translate the min corner to the origin so the object
sits on `y=0`, and **center x and z** (`x = i − ⌊nx/2⌋`, `z = k − ⌊nz/2⌋`) to honor the sculpture
lineage's "local origin x=0,z=0, ground at y=0". The renderer frames bounds either way, but centering
keeps parity with text→JSON sculptures and the turntable rig. Pure integer math in the core.

## Decision 6 — Palette default = the full 305-block table

Core accepts `palette` as injected `[{key,lab}]`; default = `loadBlockTable().blocks.map(b =>
({key:b.block, lab:b.lab}))`. This is E-14's value-true vocabulary — every cell snaps to the real
full-cube block nearest its surface color in Lab, so values are honest by construction (no name-by-hue
drift). Tests inject a tiny 2–3 entry palette so assertions are exact and offline.

## Decision 7 — "Judged" = deterministic silhouette IoU vs the GLB's own silhouette

No sculpture LLM judge exists; the epic's currency is form. The runner renders at `SCULPTURE_VIEW_3Q`,
extracts the build render's silhouette (`form-fidelity.extractSilhouette`), rasterizes the **GLB's**
silhouette at the same camera (T-048-01 `rasterizeSilhouette`), normalizes both
(`normalizeSilhouette`), and reports `iou`. This is the head-to-head metric ("score it identically to a
text→JSON build") and reuses two finished E-16 deliverables. An LLM aesthetic judge is explicitly out
of scope (no sculpture prompt; would add metered surface area for no AC benefit).

## Metadata / method identity

Add `GLB_VOXEL_METHOD_ID = "glb-voxel.v1"` to `config.mjs` (single-sourced, like the vConcept ids) and
pin it on `metadata.prompting_method_id`. `model_id` = `PHASE1_MODEL_ID` (the build used **no** model —
it's a pure geometry+color compile — but the artifact schema requires the field; we record the pinned
id for join-key parity, and the method id makes the provenance unambiguous: this build came from a GLB,
not an LLM). `trial_id` embeds the subject. No `metadata.target` (enum mismatch).

## What this explicitly does not do

- No revision loop (S-052/T-052-01). No consolidation of the duplicate parser (T-053-01). No
  shell/triangle-barycentric sampling. No new runtime dependency. No CI-path WebP.
