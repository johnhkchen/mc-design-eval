# CIE-Lab block matching — research (for the next epic)

How to decide, for a given target color (a voxel from a 3D model, or a pixel from a concept image),
**which real Minecraft block** best represents it — perceptually, and constrained to a real, obtainable
palette. This is the technique Falcraft uses for its voxel→block step, and the standard approach in
image→Minecraft "map art" / pixel-art tools.

## Why we need it (the problem it solves)

The Nano Banana concept stage produces decent images but (observed) **invents imaginary blocks/textures
and pushes detail past the block resolution.** Both are fixed by the same move: **quantize every
target color to the nearest block in a constrained REAL survival palette.**

- **Imaginary blocks → real blocks.** The match is taken over a *whitelist of real, survival-obtainable
  1.20.1 blocks* (our palette manifest, §6). Whatever fanciful color/texture the image shows, the output
  is always an actual block. This is also our differentiation from a raw Falcraft toy: palette discipline
  is enforced, not optional.
- **Over-resolution → capped.** Detail is bounded by the **grid resolution** (the voxel grid / the
  pixel-downsample). Sub-block filigree simply cannot be expressed once you sample to N cells.

The matcher is the grounding layer that turns an aspirational image into a real, buildable, palette-
disciplined design — and it is the **same color engine** whether the input is a concept *image* (2D, pre-
TRELLIS) or a voxel *grid* (3D, post-TRELLIS).

## Why CIE-Lab, not RGB

RGB Euclidean distance is **not perceptually uniform** — a fixed numeric step means different perceived
differences in different channels/regions (the eye is far more sensitive to green than blue). CIE L\*a\*b\*
is designed so equal numeric distance ≈ equal perceived difference, so "nearest block" actually looks
nearest. Every serious image→block tool (e.g. the Joshua Dobson map-art generator) matches in Lab, not
RGB.

## The conversion: sRGB → linear → XYZ → L\*a\*b\*

Per-channel sRGB (0–1) **inverse gamma** to linear:
```
C_lin = C/12.92                     if C ≤ 0.04045
C_lin = ((C + 0.055)/1.055)^2.4     otherwise
```
Linear RGB → **XYZ** (D65):
```
X = 0.4124564 R + 0.3575761 G + 0.1804375 B
Y = 0.2126729 R + 0.7151522 G + 0.0721750 B
Z = 0.0193339 R + 0.1191920 G + 0.9503041 B
```
Normalize by D65 white **Xn=95.0489, Yn=100, Zn=108.8840** (scale XYZ to 0–100 first), then **XYZ → Lab**:
```
f(t) = t^(1/3)                      if t > δ³        (δ = 6/29 ≈ 0.206897)
f(t) = t/(3δ²) + 4/29               otherwise
L* = 116 f(Y/Yn) − 16
a* = 500 (f(X/Xn) − f(Y/Yn))
b* = 200 (f(Y/Yn) − f(Z/Zn))
```

## The distance: ΔE

- **CIE76** — plain Euclidean in Lab: `ΔE = √(ΔL² + Δa² + Δb²)`. Simple, fast, **sufficient for nearest-
  block matching** (the use case here). This is what most map-art tools use.
- **CIE94 / CIEDE2000** — re-weight lightness/chroma/hue (CIEDE2000 adds a blue-region rotation). More
  accurate for *small* differences, much more complex. Worth trying only if CIE76 matches look wrong in
  saturated regions; not needed to start.

**Recommendation:** implement CIE76 first; keep the distance function pluggable so CIEDE2000 can be
swapped in if a build's color reads off.

## The Minecraft-specific part: the block → Lab table

For each candidate block we need one representative color, converted to Lab once and cached. Build it
from **`minecraft-assets`** (1.20.1) block textures. Nuances (the gotchas that make or break accuracy):

- **Representative color** = the **mean of opaque texture pixels** (average is the standard choice;
  dominant-color is an alternative for high-variance textures). Convert that to Lab.
- **Directional textures** (logs, sandstone, etc. with different top/side) — pick the **side** face
  (what a facade shows) or average faces; record which, since it affects the match.
- **Biome-tinted blocks** (grass_block, leaves, vines, water) — textures ship **greyscale** and are
  tinted at *runtime* by biome. Either apply a fixed representative tint or **exclude** them from the
  palette. Easiest: exclude, or whitelist with a pinned tint.
- **Transparency / alpha** (glass, leaves) — average **only opaque pixels**; consider excluding
  partially-transparent blocks from a solid-voxel palette.
- **Non-full-cube blocks** (stairs, slabs, fences, torches, panes) — **exclude from solid-voxel
  matching.** A voxel cell is a full cube; stairs/slabs are a *later* surface-detail refinement, out of
  scope for the first pass.
- **Animated textures** (sea_lantern, magma, prismarine) — use the **first frame**.
- **The palette is the LLM's, not "all blocks."** Match only against the design's **palette manifest**
  whitelist → enforces §6 palette discipline and guarantees obtainable blocks. The palette-vs-fidelity
  tradeoff (fewer blocks = larger color error, more discipline) is itself a measurable design lever.

⚠️ Known gotcha (memory): `minecraft-assets` has had a **CJS `require` problem** in this repo — import it
as ESM or read its `data/<version>/` texture files directly. It's also **not currently installed**
(deps are baml/ajv/tsx only), so adding it + extracting the table is real setup work for the epic.

## Matching + performance

For each target color: sRGB → Lab, then **argmin ΔE** over the palette's Lab set. A survival palette is
small (≈5–30 blocks) so a linear scan is trivial; for a large block set, build a **k-d tree on Lab**.
Cache the block→Lab table; convert target colors on the fly.

## Dithering (optional, probably skip for architecture)

Map-art tools add **Floyd–Steinberg** error diffusion to hide banding when the palette is sparse. For
*architectural* builds we usually want **clean, flat color fields**, not dithered speckle — dithering
would fight the "bold block-color-blocking" aesthetic and hurt buildability. Note it as available, default
off; revisit only if large gradient fields band badly.

## Two application points (same engine)

1. **Concept image → real-block grid (pre-TRELLIS).** Downsample the concept to an N-wide grid and match
   each cell to the palette → a 2D "facade in real blocks at resolution." This **directly addresses the
   imaginary-block + over-resolution problem without any 3D work** — a fast validation/forcing function,
   and arguably a useful artifact in its own right.
2. **Voxel grid → blocks (post-TRELLIS).** The canonical Falcraft step: each occupied voxel's surface
   color → palette match → a `DesignArtifact` placement. Same matcher, 3D input.

## How this maps to E-09 + the next epic

- The **color engine** (sRGB→Lab, ΔE, nearest-match) is **project-agnostic** — it belongs in the portable
  voxelizer core (zero Minecraft deps): `(targetColor, palette[{key,lab}]) → key`.
- The **block→Lab table** is the **Minecraft adapter** input (the E-09 "block→LAB color table" story).
- Applying it to the **concept image** (point 1) is the cheap, pre-image-to-model way to enforce real-
  blocks + resolution — which is exactly what the user wants the next epic to do *before* TRELLIS work.

## Sources

- [Joshua Dobson — Minecraft Map Art Generator (CIELAB + Floyd–Steinberg)](https://joshuadobson.github.io/minecraft-tools/mapart/)
- [Create Minecraft block palettes with CIELAB (YouTube)](https://www.youtube.com/watch?v=o-JL0AEL0rc)
- [CIELAB color space — Wikipedia (conversion math + ΔE)](https://en.wikipedia.org/wiki/CIELAB_color_space)
- [Color Distance and Delta E — ColorAide docs (CIE76 / CIE94 / CIEDE2000)](https://facelessuser.github.io/coloraide/distance/)
