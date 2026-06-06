// Textured-GLB splat — the same-angle material target for sides/roof (T-079-01, story S-079, epic E-23).
//
// The concept image shows the FRONT; the sides and roof the concept never shows, so the textured GLB is
// the truth there (AC #2). The repo has NO textured-GLB→PNG renderer (the GLB is only silhouette-
// rasterized or voxel-colour-sampled — see research.md), so the GLB splat is done in VOXEL SPACE: snap
// the GLB's surface texture to per-voxel design-palette blocks (reusing the shipped
// `sampleSurfaceColors`/`colorVoxelsToArtifact`), then project THAT colour-true occupancy through the
// SAME Path-P ortho `dir` as the build face. Both faces are the identical orthographic projection, so the
// target is "same-angle, grid-quantized to the face cell-grid" BY CONSTRUCTION — no camera mismatch to
// quantize away. The per-cell target then feeds `paintFace` exactly like the concept splat.
//
// PURE core (`glbVoxelOccupancy`, `splatFromGlbOccupancy`) + one lazy IMPURE decode leaf
// (`loadGlbSplat`) — mirrors multi-angle.mjs's pure-table / impure-render split so the test glob stays
// GL- and decode-free.

import { occupancyFromCells, artifactOccupancy } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";

/**
 * Build a colour-true {@link import("./occupancy.mjs").Occupancy} from a GLB's voxelization + textured
 * surface: snap each occupied voxel's sampled texture colour to the nearest design-palette block, then
 * adapt to the view occupancy. Reuses glb-voxel-build's tested machinery — NO new colour math. PURE
 * (the GLB parse + texture decode are the caller's impure job; this consumes their results).
 * @param {{ occupancy:object, surface:object, texture:object, palette:{key:string,lab:number[]}[] }} inp
 *   `occupancy` = a voxelizeGlb result; `surface` = parseGlbColoredSurface; `texture` = decoded RGBA;
 *   `palette` = the design-doc palette (paletteFromManifest) to snap within.
 * @returns {Promise<import("./occupancy.mjs").Occupancy>}
 */
export async function glbVoxelOccupancy({ occupancy, surface, texture, palette }) {
  const { sampleSurfaceColors, colorVoxelsToArtifact } = await import("../form/glb-voxel-build.mjs");
  const colors = sampleSurfaceColors({ occupancy, surface, texture });
  const artifact = colorVoxelsToArtifact(occupancy, colors, { palette });
  return artifactOccupancy(artifact);
}

/**
 * Nearest-cell resample of a 2-D block grid (block id or null per cell) from its native `srcN×srcM` onto
 * a target `n×m`. The single alignment primitive shared by the GLB splat and the concept splat (whose
 * image-grid result has its own aspect-derived rows) — both are quantized to the build face's cell grid
 * so `paintFace` consumes them directly. A scale map, not interpolation (blocks are categorical). PURE.
 * @param {(string|null)[][]} srcGrid  srcM rows × srcN cols
 * @param {number} srcN
 * @param {number} srcM
 * @param {number} n  target cols (the build face's grid width)
 * @param {number} m  target rows (the build face's grid height)
 * @returns {{grid:(string|null)[][], n:number, m:number, sourceFilled:number}}
 */
export function resampleBlockGrid(srcGrid, srcN, srcM, n, m) {
  if (!Number.isInteger(n) || !Number.isInteger(m) || n < 1 || m < 1) {
    throw new Error("resampleBlockGrid: target n,m must be positive integers");
  }
  const grid = Array.from({ length: m }, () => new Array(n).fill(null));
  let sourceFilled = 0;
  if (srcN >= 1 && srcM >= 1) {
    for (let v = 0; v < m; v++) {
      const sv = Math.min(srcM - 1, Math.floor((v * srcM) / m));
      for (let u = 0; u < n; u++) {
        const su = Math.min(srcN - 1, Math.floor((u * srcN) / n));
        const cell = srcGrid[sv]?.[su] ?? null;
        if (cell != null) { grid[v][u] = cell; sourceFilled++; }
      }
    }
  }
  return { grid, n, m, sourceFilled };
}

/**
 * A per-cell material target for `faceGrid` (the BUILD face), drawn from a colour-true GLB occupancy
 * projected through the same `dir`. The GLB projection and the build face are both ortho/45° on the same
 * `dir`, so they line up; any (n,m) difference is a pure scale map resolved by nearest-cell resample. The
 * returned grid is sized to `faceGrid.(n,m)` so `paintFace` can consume it directly. PURE.
 * @param {import("./occupancy.mjs").Occupancy} glbOcc  colour-true GLB occupancy
 * @param {string|{name:string}} dir  the same dir the build face was projected along
 * @param {{n:number, m:number}} faceGrid  the build's SurfaceGrid (only n,m are read)
 * @returns {{grid:(string|null)[][], n:number, m:number, sourceFilled:number}}
 */
export function splatFromGlbOccupancy(glbOcc, dir, faceGrid) {
  const src = projectSurface(glbOcc, dir);
  const srcGrid = src.cells.map((row) => row.map((c) => (c ? c.block : null)));
  return resampleBlockGrid(srcGrid, src.n, src.m, faceGrid.n, faceGrid.m);
}

/**
 * Convenience for synthetic/colour-true cell lists (tests, or a pre-coloured occupancy): build the view
 * occupancy from `{pos,block}` cells, then splat. PURE.
 * @param {{pos:number[],block:string}[]} cells
 * @param {string|{name:string}} dir
 * @param {{n:number,m:number}} faceGrid
 */
export function splatFromCells(cells, dir, faceGrid) {
  return splatFromGlbOccupancy(occupancyFromCells(cells), dir, faceGrid);
}

/**
 * IMPURE leaf: load a GLB, voxelize + colour-sample it, and return the per-cell material target for the
 * build's `faceGrid` along `dir`. Lazy-imports the GLB parser + voxelizer. The baseColor texture decode
 * is INJECTED (`opts.decodeTexture`) — TRELLIS GLBs are WebP, and WebP decode needs a host codec that
 * (by the glb-voxel-build discipline) must stay OUT of `src/`/CI; the on-demand runner supplies a
 * `dwebp`-backed decoder. With no `decodeTexture`, only PNG/JPEG baseColor images decode (via the shared
 * image decoder). Returns `{ grid, n, m, sourceFilled }` (a target the paint tool consumes).
 * @param {string} glbPath
 * @param {{n:number,m:number}} faceGrid  the build's SurfaceGrid for `dir`
 * @param {string|{name:string}} dir
 * @param {{ palette:{key:string,lab:number[]}[], scale?:number,
 *           decodeTexture?:(img:{data:Uint8Array,mimeType:string})=>Promise<{width:number,height:number,data:Uint8Array}> }} opts
 * @returns {Promise<{grid:(string|null)[][], n:number, m:number, sourceFilled:number}>}
 */
export async function loadGlbSplat(glbPath, faceGrid, dir, opts = {}) {
  const { readFile } = await import("node:fs/promises");
  const { parseGlbColoredSurface } = await import("../form/glb-mesh.mjs");
  const { voxelizeGlb } = await import("../form/glb-voxelize.mjs");
  const bytes = await readFile(glbPath);
  const surface = parseGlbColoredSurface(bytes);
  if (!surface.baseColor) throw new Error(`loadGlbSplat: ${glbPath} has no baseColor texture (untextured GLB)`);
  const occupancy = voxelizeGlb(bytes, opts.scale ? { scale: opts.scale } : {});
  const texture = await decodeBaseColor(surface.baseColor, opts.decodeTexture);
  const glbOcc = await glbVoxelOccupancy({ occupancy, surface, texture, palette: opts.palette });
  return splatFromGlbOccupancy(glbOcc, dir, faceGrid);
}

/** Decode a baseColor image to RGBA: prefer the injected `decodeTexture` (host codec, e.g. WebP→dwebp);
 *  else PNG/JPEG via the shared image decoder (writes a temp file it can sniff). */
async function decodeBaseColor(baseColor, decodeTexture) {
  if (typeof decodeTexture === "function") return decodeTexture(baseColor);
  if (baseColor.mimeType?.includes("webp")) {
    throw new Error("loadGlbSplat: baseColor is WebP — inject opts.decodeTexture (a dwebp-backed decoder); src/ keeps no WebP codec");
  }
  const { writeFile, mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { decodeImage } = await import("../color/palette-extract.mjs");
  const tmp = await mkdtemp(join(tmpdir(), "glb-tex-"));
  const texPath = join(tmp, "tex.png");
  await writeFile(texPath, Buffer.from(baseColor.data));
  return decodeImage(texPath);
}
