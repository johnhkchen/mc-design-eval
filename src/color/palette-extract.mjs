// Canonical palette extraction (T-021-01, epic E-10 / story S-021) — the headline deliverable.
//
// Given a facade concept image, produce the CANONICAL BLOCK PALETTE it uses: decode the image →
// drop the (near-black) background → cluster the foreground colors in CIE-Lab (deterministic
// median-cut) → match each cluster centroid to the nearest real, survival-obtainable Minecraft
// block (S-019 block→Lab table, via the S-020 engine's `nearestLab`) → merge centroids that map
// to the same block (summing coverage) → sort by coverage → emit an ordered
// `{ block, repColor, coveragePct }[]` plus a one-line human-readable description.
//
// Two modes, one pipeline (they differ only in the candidate palette):
//   • discover — match against the full 305-block survival full-cube set (find the palette).
//   • validate — match against a provided `whitelist` of block ids (check a declared manifest).
//
// BOUNDARIES (mirrors block-table.mjs):
//   • The pixel core (`extractPaletteFromPixels`, helpers) is pure: no I/O, no decode dep. It is
//     fully unit-testable on synthetic RGBA buffers — no binary image fixture is committed.
//   • Decode is isolated to `extractPaletteFromImage`, which LAZILY imports jpeg-js / pngjs by
//     sniffing the file's magic bytes, so those deps never touch the test/runtime core path.
//   • Matching reuses the portable engine (cielab.mjs `nearestLab`/`deltaE`); the block colors
//     come from the committed table (block-table.mjs `loadBlockTable`). Zero new color math here.
//
// CAVEAT (documented, intentional): background removal drops pixels near `dropColor` (default
// near-black #000000), so near-black *foreground* is collateral. Acceptable for the locked stage-1
// concept images, whose prompt bans dark backgrounds and mandates bright silhouettes. Pass
// `dropColor: null` to disable background removal entirely for non-black-bg inputs.

import { readFileSync } from "node:fs";
import { srgbToLab, deltaE, nearestLab } from "./cielab.mjs";
import { loadBlockTable } from "./block-table.mjs";

/** The committed block→Lab table, loaded once (runtime path; zero asset deps). */
const TABLE = loadBlockTable();

/** @typedef {[number, number, number]} RGB */
/** @typedef {[number, number, number]} Lab */

export const DEFAULTS = Object.freeze({
  k: 8, // target cluster count (ticket guidance: 6–12)
  dropColor: [0, 0, 0], // background color to remove; null disables removal
  dropTolerance: 24, // Euclidean-RGB radius around dropColor counted as background
  alphaThreshold: 128, // pixels with alpha below this are dropped
});

// --- pure helpers ----------------------------------------------------------

/** [r,g,b] (0–255) → "#rrggbb". */
export function rgbToHex([r, g, b]) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Decide whether a pixel is background (to be dropped). True if alpha is below threshold, or
 * (when `dropColor` is non-null) the RGB lies within `dropTolerance` Euclidean of `dropColor`.
 */
export function isBackground(r, g, b, a, { dropColor, dropTolerance, alphaThreshold }) {
  if (a < alphaThreshold) return true;
  if (!dropColor) return false;
  const dr = r - dropColor[0];
  const dg = g - dropColor[1];
  const db = b - dropColor[2];
  return Math.sqrt(dr * dr + dg * dg + db * db) <= dropTolerance;
}

/**
 * Walk an RGBA buffer, dropping background pixels, and tally the survivors into unique-color
 * points (each color converted to Lab exactly once). Collapses ~1M pixels to the unique-color set.
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} img
 * @returns {{points:{rgb:RGB,lab:Lab,count:number}[], foregroundPx:number, droppedPx:number}}
 */
export function aggregateForeground({ width, height, data }, opts) {
  const counts = new Map(); // packed rgb int → count
  let foregroundPx = 0;
  let droppedPx = 0;
  for (let p = 0; p < width * height; p++) {
    const i = p << 2;
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (isBackground(r, g, b, a, opts)) {
      droppedPx++;
      continue;
    }
    foregroundPx++;
    const key = (r << 16) | (g << 8) | b;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const points = [];
  for (const [key, count] of counts) {
    const rgb = /** @type {RGB} */ ([(key >> 16) & 255, (key >> 8) & 255, key & 255]);
    points.push({ rgb, lab: srgbToLab(rgb), count });
  }
  return { points, foregroundPx, droppedPx };
}

/** Weighted bounding-box stats for a set of points: per-axis Lab range + count-weighted mean Lab/rgb. */
function boxStats(points) {
  let count = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const sumLab = [0, 0, 0];
  const sumRgb = [0, 0, 0];
  let distinct = new Set();
  for (const pt of points) {
    count += pt.count;
    for (let d = 0; d < 3; d++) {
      if (pt.lab[d] < min[d]) min[d] = pt.lab[d];
      if (pt.lab[d] > max[d]) max[d] = pt.lab[d];
      sumLab[d] += pt.lab[d] * pt.count;
      sumRgb[d] += pt.rgb[d] * pt.count;
    }
    distinct.add((pt.rgb[0] << 16) | (pt.rgb[1] << 8) | pt.rgb[2]);
  }
  const range = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const lab = /** @type {Lab} */ (sumLab.map((s) => s / count));
  const rgb = /** @type {RGB} */ (sumRgb.map((s) => Math.round(s / count)));
  return { count, range, lab, rgb, distinct: distinct.size };
}

/**
 * Deterministic weighted median-cut in Lab space. Repeatedly splits the box with the largest
 * pixel count (tie → largest single-axis Lab range) along its longest Lab axis at the
 * population-weighted median, until `k` boxes exist or no box is splittable (≥2 distinct colors).
 * @param {{rgb:RGB,lab:Lab,count:number}[]} points
 * @param {number} k
 * @returns {{points:any[],count:number,lab:Lab,rgb:RGB}[]}  clusters with weighted-mean centroids
 */
export function medianCutLab(points, k) {
  if (points.length === 0) return [];
  let boxes = [{ points, stats: boxStats(points) }];
  while (boxes.length < k) {
    // Pick the splittable box with the largest count × color-spread. Weighting by spread (not
    // count alone) leaves a large FLAT color field intact as one high-coverage cluster while
    // subdividing heterogeneous regions — so post-merge coverage reflects real dominance instead
    // of the uniform populations that pure population-median-cut produces. Zero-volume boxes
    // (a single color) have range 0 and are skipped via the distinct<2 guard.
    let target = -1;
    let bestScore = -1;
    for (let i = 0; i < boxes.length; i++) {
      const s = boxes[i].stats;
      if (s.distinct < 2) continue; // zero-volume: a single color, cannot split
      const maxRange = Math.max(s.range[0], s.range[1], s.range[2]);
      const score = s.count * maxRange;
      if (score > bestScore) {
        bestScore = score;
        target = i;
      }
    }
    if (target === -1) break; // nothing splittable → fewer than k clusters
    const box = boxes[target];
    const axis = box.stats.range.indexOf(Math.max(...box.stats.range));
    const sorted = [...box.points].sort((p, q) => p.lab[axis] - q.lab[axis]);
    // population-weighted median: split where cumulative count first passes half.
    const half = box.stats.count / 2;
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < sorted.length; i++) {
      acc += sorted[i].count;
      if (acc >= half) {
        cut = Math.min(Math.max(i + 1, 1), sorted.length - 1);
        break;
      }
    }
    const left = sorted.slice(0, cut);
    const right = sorted.slice(cut);
    boxes.splice(target, 1, { points: left, stats: boxStats(left) }, { points: right, stats: boxStats(right) });
  }
  return boxes.map((b) => ({ points: b.points, count: b.stats.count, lab: b.stats.lab, rgb: b.stats.rgb }));
}

/** Resolve the candidate palette (table entries as {key,lab,rgb}); apply an optional whitelist. */
export function resolvePalette(whitelist) {
  if (!whitelist) {
    return { palette: TABLE.blocks.map((b) => ({ key: b.block, lab: b.lab, rgb: b.rgb })), missing: [] };
  }
  const byName = new Map(TABLE.blocks.map((b) => [b.block, b]));
  const palette = [];
  const missing = [];
  for (const name of whitelist) {
    const e = byName.get(name);
    if (e) palette.push({ key: e.block, lab: e.lab, rgb: e.rgb });
    else missing.push(name);
  }
  if (palette.length === 0) {
    throw new Error(
      `extractPalette: whitelist matched no blocks in the table (missing: ${missing.join(", ") || "none"})`,
    );
  }
  return { palette, missing };
}

/** Match each cluster to the nearest candidate block (in Lab). */
function matchClusters(clusters, palette) {
  return clusters.map((c) => {
    const { key, deltaE: dE, lab } = nearestLab(c.lab, palette);
    return { cluster: c, key, blockLab: lab, deltaE: dE };
  });
}

/** Merge matches by block id: sum coverage, count-weighted-mean repColor, recompute ΔE, sort. */
function mergeByBlock(matched, totalFg) {
  const byBlock = new Map();
  for (const m of matched) {
    let g = byBlock.get(m.key);
    if (!g) {
      g = { block: m.key, count: 0, sumLab: [0, 0, 0], sumRgb: [0, 0, 0], blockLab: m.blockLab };
      byBlock.set(m.key, g);
    }
    g.count += m.cluster.count;
    for (let d = 0; d < 3; d++) {
      g.sumLab[d] += m.cluster.lab[d] * m.cluster.count;
      g.sumRgb[d] += m.cluster.rgb[d] * m.cluster.count;
    }
  }
  const entries = [];
  for (const g of byBlock.values()) {
    const repLab = /** @type {Lab} */ (g.sumLab.map((s) => s / g.count));
    const repRgb = /** @type {RGB} */ (g.sumRgb.map((s) => Math.round(s / g.count)));
    const blockEntry = TABLE.blocks.find((b) => b.block === g.block);
    entries.push({
      block: g.block,
      repColor: { hex: rgbToHex(repRgb), rgb: repRgb, lab: repLab.map((n) => round3(n)) },
      coveragePct: round1((100 * g.count) / totalFg),
      deltaE: round2(deltaE(repLab, g.blockLab)),
      blockColor: blockEntry
        ? { hex: rgbToHex(blockEntry.rgb), rgb: blockEntry.rgb, lab: blockEntry.lab }
        : null,
    });
  }
  entries.sort((a, b) => b.coveragePct - a.coveragePct || (a.block < b.block ? -1 : 1));
  return entries;
}

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Extract the canonical block palette from a decoded RGBA image. Pure — no I/O, no decode dep.
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} img
 * @param {{k?:number, dropColor?:RGB|null, dropTolerance?:number, alphaThreshold?:number,
 *          whitelist?:string[]}} [opts]
 * @returns {{palette:object[], description:string, k:number, effectiveClusters:number,
 *           foregroundPx:number, droppedPx:number, totalPx:number, missing:string[]}}
 */
export function extractPaletteFromPixels(img, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const { palette: candidates, missing } = resolvePalette(o.whitelist);
  const { points, foregroundPx, droppedPx } = aggregateForeground(img, o);
  if (foregroundPx === 0) {
    throw new Error("extractPalette: no foreground pixels survived background removal");
  }
  const clusters = medianCutLab(points, o.k);
  const matched = matchClusters(clusters, candidates);
  const paletteEntries = mergeByBlock(matched, foregroundPx);
  const result = {
    palette: paletteEntries,
    k: o.k,
    effectiveClusters: clusters.length,
    foregroundPx,
    droppedPx,
    totalPx: img.width * img.height,
    missing,
    description: "",
  };
  result.description = describePalette(result);
  return result;
}

/** One-line human-readable summary: "blocks in this facade". Pure, deterministic. */
export function describePalette(result) {
  const { palette, foregroundPx, totalPx } = result;
  const fgPct = totalPx ? Math.round((100 * foregroundPx) / totalPx) : 0;
  const meanDE =
    palette.length > 0 ? round1(palette.reduce((s, e) => s + e.deltaE, 0) / palette.length) : 0;
  const list = palette.map((e) => `${e.block} ${Math.round(e.coveragePct)}%`).join(", ");
  return `${palette.length} blocks over ${fgPct}% of frame: ${list} (mean ΔE ${meanDE})`;
}

// --- decode shell (lazy, isolated) -----------------------------------------

const JPEG_MAGIC = [0xff, 0xd8];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

function matchesMagic(buf, magic) {
  return magic.every((byte, i) => buf[i] === byte);
}

/**
 * Decode an image file (JPEG or PNG — sniffed by magic bytes) to a `{width,height,data}` RGBA8
 * image. The ONLY place jpeg-js / pngjs are touched; both are lazy-imported so they stay off the
 * core path. Shared by the palette extractor and the S-022 block-grid sampler (image-grid.mjs).
 * @param {string} path
 * @returns {Promise<{width:number,height:number,data:Uint8Array|Buffer}>}
 */
export async function decodeImage(path) {
  const buf = readFileSync(path);
  if (matchesMagic(buf, JPEG_MAGIC)) {
    const jpeg = await import("jpeg-js");
    const d = (jpeg.default || jpeg).decode(buf, { useTArray: true });
    return { width: d.width, height: d.height, data: d.data };
  }
  if (matchesMagic(buf, PNG_MAGIC)) {
    const { PNG } = await import("pngjs");
    const d = PNG.sync.read(buf);
    return { width: d.width, height: d.height, data: d.data };
  }
  throw new Error(
    `decodeImage: unrecognized image format for ${path} ` +
      `(expected JPEG or PNG magic bytes, got ${buf.slice(0, 4).toString("hex")})`,
  );
}

/**
 * Decode an image file (JPEG or PNG — sniffed by magic bytes) and extract its canonical palette.
 * @param {string} path
 * @param {object} [opts]  forwarded to {@link extractPaletteFromPixels}
 */
export async function extractPaletteFromImage(path, opts = {}) {
  const img = await decodeImage(path);
  return extractPaletteFromPixels(img, opts);
}
