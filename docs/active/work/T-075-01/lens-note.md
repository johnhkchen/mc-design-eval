# Lens note — scale-64 gatehouse, before vs after (T-075-01)

**Subject:** `benchmarks/sculpture/building/scale-64/artifact.json` (57,202 placements), rendered
at `BUILDING_VIEW_3Q`. **The build is unchanged** — identical `placements`; only the render lens
changed.

- `before.png` — the committed lens (copy of `.../scale-64/render-3q.png`).
- `after.png` — the fixed lens (supersample = 3), re-rendered via `_render-after.mjs`.

**What aliased.** At scale 64 the building spans ~64 voxels framed into ~400 px of the 512×512
image → **~6 px per block**, while each Minecraft block texture is **16×16**. The viewer's atlas is
minified with `minFilter = THREE.NearestFilter` and **no mipmaps**
(`prismarine-viewer/.../worldrenderer.js:91-92`), and the renderer had **no antialiasing**. Point-
sampling a busy 16 px texture down into 6 px picks one unstable texel per fragment → minification
aliasing → the "grey static" seen across the roof and walls. The build is *clean* by every block
metric (`speckle 0.001`, `distinct 4`, `offPalette 0`, 2.0% surface neighbour-disagreement), which
is exactly why the defect had to be the lens, not the materials.

**What the fix changed.** `render/src/render.mjs` now renders the scene into an internal
**1536×1536** framebuffer (3× the contract) where each block draws at ~18 px ≥ the 16 px texture
(so GL does **no** minification), then **box-averages** every 3×3 block of samples back down to the
**512×512** contract (`src/render-supersample.mjs::boxDownscale`). Averaging N² samples per output
pixel is what minification *should* do; it removes the high-frequency static. The fix is in owned
code only — **no `node_modules` edit**. Output size, camera, and framing are unchanged, so renders
stay deterministic and comparable (E-02).

**Quantified.** High-frequency energy (mean squared 4-neighbour RGB delta — a "how much static"
proxy) on the two 512² renders:

| render | size | HF energy |
|--------|------|-----------|
| before (nearest, no AA) | 512×512 | 690.9 |
| after (SSAA ×3 box-down) | 512×512 | 197.5 |

→ **71.4% reduction** in high-frequency static, same build, same framing. (Residual HF is real
block-edge structure, not noise — visible as clean stone/plank surfaces in `after.png`.)

**Resolution floor honored (E-22 Rule 3 / AC #5).** The static was removed **at scale 64** — the
high-res ceiling. The scale was **not** lowered to hide the aliasing; `artifact.json` and its 57,202
placements are untouched. The fix is a property of the lens and applies identically to every build.

**Reproduce:** `node docs/active/work/T-075-01/_render-after.mjs` (re-renders `after.png` from the
committed artifact and re-prints the HF comparison).
