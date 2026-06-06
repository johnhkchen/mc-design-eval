// Block → CIE-Lab color table builder (T-019-01, epic E-10 / story S-019).
//
// Produces the cached `block-lab-table.json` that the portable color engine (S-020,
// src/color/cielab.mjs) and the palette extractor (S-021) consume: for every full-cube,
// survival-obtainable 1.20.1 block, a representative color (mean of opaque texture pixels,
// side face for directional blocks, first frame for animated) converted to CIE L*a*b*.
// See docs/knowledge/cielab-block-matching.md for the governing technique.
//
// Boundary: the BUILD path (resolveAssets / buildBlockTable) reads `minecraft-assets` and
// decodes PNGs with `pngjs` — both BUILD-TIME-ONLY devDependencies, imported lazily so they
// never leak onto the RUNTIME path. The runtime path (loadBlockTable + the committed JSON)
// pulls zero Minecraft/asset deps, preserving S-020's "portable, zero-Minecraft-deps" goal.
//
// Version note: minecraft-assets@1.17 ships no 1.20.1 dataset; passing "1.20.1" resolves to
// the last-of-major 1.20.2 (block textures identical for our purposes). We record the
// effective `version` (1.20.2) and the `requestedVersion` (1.20.1) for honest provenance.
//
// CONSOLIDATION NOTE (S-023, T-023-01): the sRGB→Lab conversion is now OWNED by S-020's
// portable engine (src/color/cielab.mjs) and imported here — the former intentional duplicate
// (kept while T-019-01/T-020-01 ran as parallel `depends_on: []` tickets) has been removed.
// `srgbToLab` below is a thin delegator that re-applies `round3` to keep this table's 3-decimal
// contract; its output is byte-identical to the pre-S-023 copy (verified over 4096 RGB triples,
// max abs diff 0), so the committed block-lab-table.json is unchanged. Downstream code must
// depend on cielab.mjs for conversion, never re-implement it.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { srgbToLab as srgbToLabRaw } from "./cielab.mjs";

const here = dirname(fileURLToPath(import.meta.url));

/** Default location of the committed output table. */
export const TABLE_PATH = resolve(here, "block-lab-table.json");

// --- sRGB → CIE-Lab (D65) -------------------------------------------------
// The conversion math lives in the portable engine (cielab.mjs); here we only re-apply the
// table's rounding contract. See docs/knowledge/cielab-block-matching.md for the technique.

const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Convert an sRGB color (integer channels 0–255) to CIE L*a*b* (D65), rounded to 3 decimals.
 * Delegates the conversion to the S-020 engine ({@link srgbToLabRaw}) and re-applies `round3`
 * so the committed table keeps its 3-decimal contract. Output is byte-identical to the former
 * inlined copy (verified over 4096 RGB triples, max abs diff 0).
 * @param {[number, number, number]} rgb
 * @returns {[number, number, number]} [L*, a*, b*], rounded to 3 decimals
 */
export function srgbToLab(rgb) {
  const [L, a, b] = srgbToLabRaw(rgb);
  return [round3(L), round3(a), round3(b)];
}

// --- texture pixels -------------------------------------------------------

/**
 * Mean of opaque pixels of a decoded PNG (pngjs shape: {width,height,data} RGBA8).
 * Uses only the FIRST FRAME (top width×width rows) for vertical animation strips
 * (height > width and a whole multiple). Averages channels of pixels with alpha ≥ threshold;
 * if none qualify, falls back to any alpha > 0; returns null if the texture is fully
 * transparent.
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} png
 * @param {number} [alphaThreshold=128]
 * @returns {[number, number, number] | null}
 */
export function meanOpaqueRgb(png, alphaThreshold = 128) {
  const { width, height, data } = png;
  const frameH =
    height > width && height % width === 0 ? width : height; // first animation frame
  for (const minA of [alphaThreshold, 1]) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < frameH; y++) {
      for (let x = 0; x < width; x++) {
        const i = (width * y + x) << 2;
        if (data[i + 3] < minA) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    }
    if (n > 0) return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  }
  return null;
}

/**
 * Summed per-channel VARIANCE of the same opaque pixels {@link meanOpaqueRgb} averages — a scalar
 * texture "busy-ness" (RGB² units). Same first-frame + alpha-fallback selection so the variance is
 * measured over exactly the pixel set the recorded mean came from. A flat block (concrete, terracotta,
 * wool) scores near 0; a high-variance block (coral, ore, mycelium) scores high. Used (T-064-01) to make
 * busy blocks lose to flat blocks of comparable mean ΔE. Returns 0 when fewer than 2 opaque pixels exist
 * (variance undefined). Pure.
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} png
 * @param {number} [alphaThreshold=128]
 * @returns {number} summed channel variance, rounded; 0 if <2 opaque pixels
 */
export function varianceOpaque(png, alphaThreshold = 128) {
  const { width, height, data } = png;
  const frameH = height > width && height % width === 0 ? width : height; // first animation frame
  for (const minA of [alphaThreshold, 1]) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < frameH; y++) {
      for (let x = 0; x < width; x++) {
        const i = (width * y + x) << 2;
        if (data[i + 3] < minA) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    }
    if (n === 0) continue; // try the looser alpha pass
    if (n < 2) return 0; // single pixel: variance undefined
    const mr = r / n, mg = g / n, mb = b / n;
    let vr = 0, vg = 0, vb = 0;
    for (let y = 0; y < frameH; y++) {
      for (let x = 0; x < width; x++) {
        const i = (width * y + x) << 2;
        if (data[i + 3] < minA) continue;
        vr += (data[i] - mr) ** 2;
        vg += (data[i + 1] - mg) ** 2;
        vb += (data[i + 2] - mb) ** 2;
      }
    }
    return Math.round((vr + vg + vb) / n);
  }
  return 0;
}

// --- block classification -------------------------------------------------

/** Strip a texture/model ref like "minecraft:block/oak_log" or "block/dirt" → "oak_log". */
function textureStem(ref) {
  if (typeof ref !== "string") return null;
  return ref.replace(/^minecraft:/, "").replace(/^block\//, "").replace(/^blocks\//, "");
}

/** True iff the (stripped) model parent is one of the full-cube templates. */
export function isFullCubeParent(parent) {
  const p = (parent || "").replace(/^minecraft:/, "");
  return p.startsWith("block/cube");
}

// Full-cube blocks that are NOT survival-obtainable or are greyscale/tinted impostors.
// Most technical blocks already fall out via the non-cube parent filter; these are the
// full-cube stragglers, listed explicitly so the exclusion is documented intent, not luck.
export const EXCLUDE_BLOCKS = Object.freeze(
  new Set([
    "spawner", // transparent cage cube_all; not survival-obtainable
    "infested_stone",
    "infested_cobblestone",
    "infested_stone_bricks",
    "infested_mossy_stone_bricks",
    "infested_cracked_stone_bricks",
    "infested_chiseled_stone_bricks",
    "infested_deepslate", // cube_all clones of stone textures — misleading duplicates
    "jigsaw",
    "command_block",
    "chain_command_block",
    "repeating_command_block",
    "structure_block",
  ]),
);

/**
 * Decide whether a block belongs in the table, given its model entry.
 * Real-block-ness (presence in blocks_textures) is checked by the builder, not here.
 * @returns {{ include: boolean, reason?: string }}
 */
export function classifyBlock(name, model) {
  if (!model) return { include: false, reason: "no model" };
  if (!isFullCubeParent(model.parent)) {
    return { include: false, reason: `non-full-cube (parent ${model.parent || "none"})` };
  }
  if (JSON.stringify(model).includes("tintindex")) {
    return { include: false, reason: "biome-tinted (tintindex)" };
  }
  if (EXCLUDE_BLOCKS.has(name)) {
    return { include: false, reason: "denylisted (non-survival / impostor)" };
  }
  return { include: true };
}

/**
 * Choose the representative face texture stem for a full-cube model.
 * cube_all / *_mirrored_all → `all`; column / bottom_top → `side`; generic `cube` →
 * side → north → first non-vertical face → all. Returns null if no usable face texture.
 * @returns {string | null} the PNG stem (no extension)
 */
export function pickFace(model) {
  const t = (model && model.textures) || {};
  const cand = (key) => (t[key] ? textureStem(t[key]) : null);
  const order = [
    "side",
    "all",
    "north",
    "east",
    "south",
    "west",
  ];
  for (const key of order) {
    const stem = cand(key);
    if (stem) return stem;
  }
  // last resort: any face that is not a top/bottom/end/particle reference
  for (const [key, ref] of Object.entries(t)) {
    if (/^(top|bottom|up|down|end|particle)$/.test(key)) continue;
    const stem = textureStem(ref);
    if (stem) return stem;
  }
  return null;
}

// --- asset I/O + build ----------------------------------------------------

/**
 * Resolve the minecraft-assets data directory and read its block indexes.
 * The ONLY place `minecraft-assets` is touched. Reads JSON by path (avoids the CJS gotcha).
 * @param {string} [version="1.20.1"]
 * @returns {Promise<{directory:string, version:string, models:object, textureNames:Set<string>}>}
 */
export async function resolveAssets(version = "1.20.1") {
  const { default: mcAssets } = await import("minecraft-assets");
  const a = mcAssets(version);
  if (!a) throw new Error(`minecraft-assets has no dataset resolvable from "${version}"`);
  const directory = a.directory;
  const models = JSON.parse(readFileSync(join(directory, "blocks_models.json"), "utf8"));
  const textures = JSON.parse(readFileSync(join(directory, "blocks_textures.json"), "utf8"));
  const textureNames = new Set(textures.map((t) => t.name));
  return { directory, version: a.version, models, textureNames };
}

/**
 * Build the full block → Lab table. Deterministic (sorted by block name).
 * @param {{version?: string}} [opts]
 * @returns {Promise<{version:string, requestedVersion:string, generatedFrom:string,
 *   blocks:{block:string,texture:string,rgb:number[],lab:number[]}[],
 *   excluded:{block:string,reason:string}[]}>}
 */
export async function buildBlockTable({ version = "1.20.1" } = {}) {
  const { PNG } = await import("pngjs");
  const { directory, version: effective, models, textureNames } = await resolveAssets(version);

  const blocks = [];
  const excluded = [];

  for (const name of Object.keys(models)) {
    if (!textureNames.has(name)) continue; // model template, not a real block
    const model = models[name];
    const verdict = classifyBlock(name, model);
    if (!verdict.include) {
      excluded.push({ block: name, reason: verdict.reason });
      continue;
    }
    const stem = pickFace(model);
    if (!stem) {
      excluded.push({ block: name, reason: "no usable face texture" });
      continue;
    }
    let png;
    try {
      png = PNG.sync.read(readFileSync(join(directory, "blocks", `${stem}.png`)));
    } catch (err) {
      excluded.push({ block: name, reason: `texture read failed (${stem}.png)` });
      continue;
    }
    const rgb = meanOpaqueRgb(png);
    if (!rgb) {
      excluded.push({ block: name, reason: "no opaque pixels" });
      continue;
    }
    blocks.push({ block: name, texture: stem, rgb, lab: srgbToLab(rgb), var: varianceOpaque(png) });
  }

  blocks.sort((x, y) => (x.block < y.block ? -1 : x.block > y.block ? 1 : 0));
  excluded.sort((x, y) => (x.block < y.block ? -1 : x.block > y.block ? 1 : 0));

  let pkgVersion = "unknown";
  try {
    pkgVersion = JSON.parse(
      readFileSync(
        new URL("../../node_modules/minecraft-assets/package.json", import.meta.url),
      ),
    ).version;
  } catch {
    /* provenance is best-effort */
  }

  return {
    version: effective,
    requestedVersion: version,
    generatedFrom: `minecraft-assets@${pkgVersion}`,
    blocks,
    excluded,
  };
}

/**
 * Load the committed block→Lab table (runtime path; no asset deps).
 * @param {string} [path=TABLE_PATH]
 */
export function loadBlockTable(path = TABLE_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}
