// GLB → colored, renderable build — E-16 Arm B, the color + compile half (T-051-01).
//
// T-050-01 turned a GLB into an OCCUPANCY grid (form, no color). This module adds COLOR and compiles a
// standard DesignArtifact — the GLB-voxel build that goes head-to-head against text→JSON. The whole arm
// in one line: a real 3-D mesh keeps the LINE a text→JSON build loses (the koi S-curve, the heart's
// aortic arch), and here each occupied cell is colored VALUE-TRUE by the same E-10 engine that killed
// the moai value drift — `nearestLab` over the 305-block Lab table — using the GLB's own surface color.
//
// PURITY (the load-bearing split). The TRELLIS GLBs carry color in a WebP baseColor texture, sampled by
// UV (they have NO vertex colors). WebP decode needs a host codec, which must stay OUT of `src/` and CI.
// So this module is split:
//   - colorVoxelsToArtifact / sampleSurfaceColors / blockPaletteFromTable — PURE (no GL, no WebP, no
//     GLB, no network). sampleSurfaceColors takes an ALREADY-DECODED texture; the color/compile core
//     takes ALREADY-SAMPLED rgb. These are unit-tested offline on synthetic data (AC #2).
//   - glbVoxelBuild — ties parse + voxelize + sample + compile, IMPURE only through an INJECTED
//     `decodeTexture` (WebP bytes → RGBA). The on-demand runner supplies a `dwebp`-backed decoder.
// Same discipline as src/color/value-build.mjs (pure arithmetic; the runner owns the pngjs decode).
//
// The core does NOT validate — the AJV gate (src/artifact.mjs) is a consumer-side assert, exactly the
// round-trip pattern sculptor/compile.mjs established.

import { nearestLab, srgbToLab } from "../color/cielab.mjs";
import { loadBlockTable } from "../color/block-table.mjs";
import { augmentPalette } from "./palette-augment.mjs";
import { voxelizeGlb, occupiedCells } from "./glb-voxelize.mjs";
import { parseGlbColoredSurface } from "./glb-mesh.mjs";
import { SCALE_MIN, SCALE_MAX, DEFAULT_SCALE } from "../sculpture.mjs";
import { PHASE1_MODEL_ID, GLB_VOXEL_METHOD_ID } from "../config.mjs";

/** Compile-time defaults for the non-geometry artifact wrapper. Mirrors sculptor/compile.mjs. */
export const GLB_VOXEL_DEFAULTS = Object.freeze({
  schemaVersion: "1.0.0",
  metadata: Object.freeze({
    trial_id: "glb-voxel-build",
    prompting_method_id: GLB_VOXEL_METHOD_ID,
    model_id: PHASE1_MODEL_ID, // no model is invoked; recorded for join-key parity (see config.mjs)
    seed: 0,
    server_state_id: "in-memory",
  }),
  style: Object.freeze({
    name: "glb-voxel",
    rationale: "Voxelized from a 3-D GLB mesh; each cell colored value-true from the GLB surface texture.",
  }),
});

/**
 * Adapt the committed block→Lab table into a `nearestLab` palette. The full 305-block, value-true
 * vocabulary E-14 used — every cell snaps to the real full-cube block nearest its surface color in Lab.
 * @param {{blocks:{block:string,lab:number[]}[]}} [table] defaults to the committed table
 * @returns {{key:string, lab:number[]}[]}
 */
export function blockPaletteFromTable(table = loadBlockTable()) {
  if (!table || !Array.isArray(table.blocks) || table.blocks.length === 0) {
    throw new Error("blockPaletteFromTable: table.blocks must be a non-empty array");
  }
  return table.blocks.map((b) => ({ key: b.block, lab: b.lab }));
}

/**
 * THE DESIGN-DOC PALETTE as a `nearestLab` candidate set — the fix for palette bloat / speckle (the
 * picker was snapping over the full 305-block universe instead of the few blocks the design doc chose).
 * Restrict the snap candidates to exactly the original build's `palette.manifest` (the model's deliberate
 * dominant/supporting/accent set), looked up in the block→Lab table. Namespace-tolerant (`minecraft:` is
 * stripped to match bare table keys). A manifest block absent from the value-true table (e.g. a non-full-
 * cube like stairs) is dropped — it cannot be a voxel anyway. Throws if nothing resolves.
 * @param {string[]} manifest  the original artifact's `palette.manifest`
 * @param {{blocks:{block:string,lab:number[]}[]}} [table]
 * @returns {{key:string, lab:number[]}[]}
 */
export function paletteFromManifest(manifest, table = loadBlockTable()) {
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error("paletteFromManifest: manifest must be a non-empty array of block names");
  }
  const want = new Set(manifest.map((b) => String(b).replace(/^minecraft:/, "")));
  const palette = table.blocks.filter((b) => want.has(b.block)).map((b) => ({ key: b.block, lab: b.lab }));
  if (palette.length === 0) {
    throw new Error(
      `paletteFromManifest: no manifest block resolved in the block-Lab table (manifest: ${manifest.join(", ")})`,
    );
  }
  return palette;
}

/**
 * THE PALETTE-DISCIPLINE GUARD (E-18 T-058-02). Fail LOUDLY if a built artifact's manifest contains a block
 * outside its AUGMENTED design-doc palette — so a future regression to a full-table / texture-median-cut snap
 * cannot slip back in, while the gated secondary (T-058-03) is permitted. The consumer-side assert twin of
 * `assertArtifact` (schema): runners call it right after building, before writing. PURE; no I/O, no GL.
 *
 * `palette` is the augmented set to check against — `augmentPalette(paletteFromManifest(manifest), texture)`
 * (or the bare design-doc palette when no augmentation is used). Namespace-tolerant: placement keys are
 * `minecraft:`-stripped to match the bare table keys in `palette`.
 *
 * @param {{palette:{manifest:string[]}}} artifact  a built DesignArtifact (manifest = unique placed blocks)
 * @param {{key:string}[]} palette  the augmented design-doc palette to confine to
 * @param {{cap?:number}} [opts]  optional distinct-block ceiling (e.g. design-doc size + K secondary)
 * @returns {object} the artifact (chainable) on success
 * @throws if any manifest block is outside `palette`, or distinct count exceeds `cap`
 */
export function assertPaletteDiscipline(artifact, palette, { cap } = {}) {
  if (!artifact?.palette?.manifest || !Array.isArray(artifact.palette.manifest)) {
    throw new Error("assertPaletteDiscipline: artifact.palette.manifest must be an array of block names");
  }
  if (!Array.isArray(palette) || palette.length === 0) {
    throw new Error("assertPaletteDiscipline: palette must be a non-empty array of {key}");
  }
  const allowed = new Set(palette.map((e) => String(e.key).replace(/^minecraft:/, "")));
  const manifest = artifact.palette.manifest;
  const off = manifest.filter((b) => !allowed.has(String(b).replace(/^minecraft:/, "")));
  if (off.length > 0) {
    throw new Error(
      `assertPaletteDiscipline: ${off.length} block(s) outside the augmented design-doc palette ` +
        `(size ${palette.length}): ${off.join(", ")}`,
    );
  }
  if (Number.isFinite(cap) && manifest.length > cap) {
    throw new Error(`assertPaletteDiscipline: distinct-block count ${manifest.length} exceeds cap ${cap}`);
  }
  return artifact;
}

/** Clamp `v` to `[0, n-1]` (texel index safety after a UV→pixel map). */
function clampIdx(v, n) {
  return v < 0 ? 0 : v >= n ? n - 1 : v;
}

/**
 * Sample one surface color per occupied cell: nearest mesh vertex → its UV → nearest texel of an
 * already-decoded RGBA texture. PURE. (Nearest-vertex, not barycentric: TRELLIS meshes are dense
 * relative to a ≤64³ grid and block quantization dwarfs sub-texel UV precision — see design.md.)
 * @param {{ occupancy: {voxelSize:number, bounds:{min:number[]}, occupied:Int32Array, count:number},
 *           surface: {vertices:Float64Array, uvs:Float64Array},
 *           texture: {width:number, height:number, data:Uint8Array|Buffer} }} args
 * @returns {Uint8Array} flat rgb, 3 bytes per occupied cell (in occupiedCells order)
 */
export function sampleSurfaceColors({ occupancy, surface, texture }) {
  const { voxelSize, bounds, count } = occupancy;
  const { vertices, uvs } = surface;
  const { width, height, data } = texture;
  const vCount = vertices.length / 3;
  if (vCount === 0) throw new Error("sampleSurfaceColors: surface has no vertices");
  if (!(width > 0 && height > 0) || !data) throw new Error("sampleSurfaceColors: texture is empty");
  const channels = data.length / (width * height); // 4 (RGBA) or 3 (RGB)

  const out = new Uint8Array(3 * count);
  let n = 0;
  for (const [i, j, k] of occupiedCells(occupancy)) {
    const cx = bounds.min[0] + (i + 0.5) * voxelSize;
    const cy = bounds.min[1] + (j + 0.5) * voxelSize;
    const cz = bounds.min[2] + (k + 0.5) * voxelSize;
    // nearest vertex (squared distance argmin)
    let best = 0;
    let bestD = Infinity;
    for (let v = 0; v < vCount; v++) {
      const dx = vertices[v * 3] - cx;
      const dy = vertices[v * 3 + 1] - cy;
      const dz = vertices[v * 3 + 2] - cz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    // UV → texel (v flipped: glTF UV origin is top-left). wrap into [0,1) then to pixel.
    let u = uvs[best * 2];
    let vv = uvs[best * 2 + 1];
    u -= Math.floor(u);
    vv -= Math.floor(vv);
    const px = clampIdx(Math.floor(u * width), width);
    const py = clampIdx(Math.floor((1 - vv) * height), height);
    const o = (py * width + px) * channels;
    out[n * 3] = data[o];
    out[n * 3 + 1] = data[o + 1];
    out[n * 3 + 2] = data[o + 2];
    n++;
  }
  return out;
}

/**
 * Compile occupancy + per-cell colors into a schema-valid DesignArtifact, each cell a value-true block.
 * PURE; does NOT validate (callers run it through src/artifact.mjs — the round-trip pattern). Each
 * occupied cell → one `{op:"voxel", pos, block}`; the manifest is the unique placed blocks (sorted).
 *
 * Coordinate map (design.md Decision 5): i→x, j→y (up; ground at y=0), k→z, with x/z centered on the
 * origin (x = i − ⌊nx/2⌋, z = k − ⌊nz/2⌋) — parity with the text→JSON sculpture lineage.
 *
 * @param {{dims:number[], voxelSize:number, bounds:object, occupied:Int32Array, count:number, scale?:number}} occupancy
 * @param {Uint8Array|number[]} colors flat rgb, 3 per occupied cell (occupiedCells order)
 * @param {{ palette?:{key:string,lab:number[]}[], scale?:number,
 *           metadata?:object, style?:{name:string,rationale:string},
 *           schemaVersion?:string, paletteId?:string }} [opts]
 * @returns {import("../artifact.mjs").DesignArtifact}
 */
export function colorVoxelsToArtifact(occupancy, colors, opts = {}) {
  const { count } = occupancy;
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("colorVoxelsToArtifact: occupancy has no cells (artifact requires ≥1 placement)");
  }
  if (!colors || colors.length !== count * 3) {
    throw new Error(`colorVoxelsToArtifact: colors must have 3·count (${count * 3}) entries, got ${colors?.length}`);
  }
  const palette = opts.palette ?? blockPaletteFromTable();
  const keys = new Array(count);
  let n = 0;
  for (const _ of occupiedCells(occupancy)) {
    const rgb = [colors[n * 3], colors[n * 3 + 1], colors[n * 3 + 2]];
    keys[n] = nearestLab(srgbToLab(rgb), palette).key;
    n++;
  }
  return keysToArtifact(occupancy, keys, opts);
}

/**
 * Compile occupancy + per-cell BLOCK KEYS into a schema-valid DesignArtifact. PURE; does NOT validate.
 * The shared coordinate/manifest/wrapper build behind {@link colorVoxelsToArtifact} (which snaps colors →
 * keys first) and the R2 material-clean pass (which produces keys via a palette snap + spatial denoise, so
 * it has no colors to snap). Single source of truth for the i/j/k → pos centering and the manifest.
 *
 * Coordinate map (design.md Decision 5): i→x, j→y (up; ground at y=0), k→z, x/z centered on the origin
 * (x = i − ⌊nx/2⌋, z = k − ⌊nz/2⌋) — parity with the text→JSON sculpture lineage.
 *
 * @param {{dims:number[], occupied:Int32Array, count:number}} occupancy
 * @param {string[]} keys bare block keys (no namespace), length === count, in occupiedCells order
 * @param {{ metadata?:object, style?:{name:string,rationale:string}, schemaVersion?:string,
 *           paletteId?:string }} [opts]
 * @returns {import("../artifact.mjs").DesignArtifact}
 */
export function keysToArtifact(occupancy, keys, opts = {}) {
  const { count, dims } = occupancy;
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("keysToArtifact: occupancy has no cells (artifact requires ≥1 placement)");
  }
  if (!keys || keys.length !== count) {
    throw new Error(`keysToArtifact: keys must have count (${count}) entries, got ${keys?.length}`);
  }
  const ox = Math.floor(dims[0] / 2);
  const oz = Math.floor(dims[2] / 2);

  const placements = new Array(count);
  let n = 0;
  for (const [i, j, k] of occupiedCells(occupancy)) {
    placements[n] = { op: "voxel", pos: [i - ox, j, k - oz], block: `minecraft:${keys[n]}` };
    n++;
  }
  const manifest = [...new Set(placements.map((p) => p.block))].sort();

  const metadata = { ...GLB_VOXEL_DEFAULTS.metadata, ...(opts.metadata ?? {}) };
  const paletteObj = opts.paletteId ? { palette_id: opts.paletteId, manifest } : { manifest };

  return {
    schema_version: opts.schemaVersion ?? GLB_VOXEL_DEFAULTS.schemaVersion,
    metadata,
    style: opts.style ?? { ...GLB_VOXEL_DEFAULTS.style },
    palette: paletteObj,
    placements,
  };
}

function assertScale(scale) {
  if (!Number.isInteger(scale) || scale < SCALE_MIN || scale > SCALE_MAX) {
    throw new Error(`glbVoxelBuild: scale must be an integer in [${SCALE_MIN}, ${SCALE_MAX}] (got ${scale})`);
  }
}

/**
 * Build a colored DesignArtifact from raw .glb bytes. Voxelize (T-050-01) → parse color surface →
 * decode the baseColor texture (INJECTED `decodeTexture`, the only impurity) → sample per-cell surface
 * colors → compile value-true placements. Async because the texture decode is.
 *
 * @param {Uint8Array|ArrayBuffer|Buffer} glb
 * `augment` (E-18 T-058-03, opt-in): when truthy AND a design-doc `palette` is supplied, the candidate
 * palette is the GATED secondary augmentation (design-doc palette ∪ ≤K super-great-fit table blocks) of
 * the decoded texture — `true` for defaults, or an options object `{table?, driftThreshold?, …, K?}`.
 * @param {{ scale?:number,
 *           decodeTexture:(img:{data:Uint8Array,mimeType:string})=>Promise<{width:number,height:number,data:Uint8Array}>,
 *           palette?:{key:string,lab:number[]}[], augment?:boolean|object, metadata?:object, style?:object }} opts
 * @returns {Promise<import("../artifact.mjs").DesignArtifact>}
 */
export async function glbVoxelBuild(glb, { scale = DEFAULT_SCALE, decodeTexture, palette, augment, metadata, style } = {}) {
  assertScale(scale);
  if (typeof decodeTexture !== "function") {
    throw new Error("glbVoxelBuild: a decodeTexture(img) function is required (WebP decode stays out of src/CI)");
  }
  const occupancy = voxelizeGlb(glb, { scale });
  const surface = parseGlbColoredSurface(glb);
  if (!surface.baseColor) {
    throw new Error("glbVoxelBuild: GLB has no baseColor texture (no surface color to sample)");
  }
  const texture = await decodeTexture(surface.baseColor);
  let pal = palette;
  if (augment && pal) {
    const a = augment === true ? {} : augment;
    pal = augmentPalette(pal, texture, a.table, a);
  }
  const colors = sampleSurfaceColors({ occupancy, surface, texture });
  return colorVoxelsToArtifact(occupancy, colors, { palette: pal, scale, metadata, style });
}
