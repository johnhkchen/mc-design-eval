// Image → real-block grid (T-022-01, epic E-10 / story S-022) — the final E-10 application.
//
// Given a facade concept image, sample it to a fixed N-wide block grid and map EACH cell to a real,
// survival-obtainable Minecraft block: decode → area-downsample to N×M cells → per cell, average the
// FOREGROUND pixels (background dropped) → match the cell's mean color to the nearest real block in
// CIE-Lab (S-019 table via the S-020 engine's `nearestLab`). Cells that are mostly background become
// AIR (null) — a facade is a silhouette, not a solid rectangle. Dithering is OFF (one nearest match
// per cell → clean architectural color fields).
//
// This is the spatial sibling of palette-extract.mjs (S-021). The extractor answers "which blocks
// does this facade use?"; the grid answers "lay this facade out on a block grid". It reuses the
// extractor's background test, hex helper, palette resolver, and decode shell verbatim — the only new
// logic here is the spatial reduction (cell aggregation) and the grid-specific reporting.
//
// Two modes, one pipeline (they differ only in the candidate palette, via `whitelist`):
//   • discover — match against the full 305-block survival full-cube set (what blocks would it need?).
//   • validate — match against a provided manifest of block ids (palette adherence is then structural:
//     `nearestLab` can only return a manifest block, so out-of-palette placements are zero).
//
// BOUNDARIES (mirrors block-table.mjs / palette-extract.mjs):
//   • The pixel core (`gridFromPixels`, `comparePalettes`, `renderGridSwatch`, helpers) is pure: no
//     I/O, no decode dep. Fully unit-testable on synthetic RGBA buffers — no binary fixture committed.
//   • Decode is isolated to `gridFromImage`, which reuses palette-extract's lazy `decodeImage`.
//   • Matching reuses the portable engine (cielab.mjs); block colors come from the committed table
//     (block-table.mjs). Zero new color math here.
//
// CAVEAT (inherited, documented): background removal drops pixels near `dropColor` (default near-black
// #000000), so near-black FOREGROUND is collateral. Acceptable for the locked stage-1 concept images
// (bright silhouettes on dark fields). Pass `dropColor: null` to disable removal for other inputs.
//
// OPT-IN `cellMeans` (T-086-01, S-086): `gridFromPixels(img, { cellMeans: true })` additionally returns
// the per-cell FOREGROUND mean colors (`result.cellMeans`, m×n of [r,g,b]|null) that matching normally
// discards — the S-086 role-swatch sampler reads the true concept color behind each cell's assignment.
// Default off; the result shape is unchanged when the opt is absent.

import { srgbToLab, nearestLab, deltaE } from "./cielab.mjs";
import { loadBlockTable } from "./block-table.mjs";
import { isBackground, rgbToHex, resolvePalette, decodeImage } from "./palette-extract.mjs";

/** The committed block→Lab table, loaded once (runtime path; zero asset deps). */
const TABLE = loadBlockTable();
/** block id → table entry, for legend/visualization color lookup. */
const BY_BLOCK = new Map(TABLE.blocks.map((b) => [b.block, b]));

/** @typedef {[number, number, number]} RGB */

export const GRID_DEFAULTS = Object.freeze({
  n: 48, // grid width in cells — the held-constant concept-series resolution (the detail cap)
  coverageThreshold: 0.5, // min foreground fraction for a cell to be filled (else air)
  dropColor: [0, 0, 0], // background color to remove; null disables removal
  dropTolerance: 24, // Euclidean-RGB radius around dropColor counted as background
  alphaThreshold: 128, // pixels with alpha below this are dropped
});

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// --- pure helpers ----------------------------------------------------------

/**
 * Grid dimensions for an image: `n` columns (the parameter) and aspect-correct rows
 * `m = round(n · H / W)`, clamped to ≥1. A square image gives a square grid; a wide one stays wide.
 * @returns {{n:number, m:number}}
 */
export function gridDims(width, height, n) {
  if (!Number.isInteger(n) || n < 1) throw new Error(`gridDims: n must be a positive integer, got ${n}`);
  if (width < 1 || height < 1) throw new Error("gridDims: width and height must be ≥ 1");
  const m = Math.max(1, Math.round((n * height) / width));
  return { n, m };
}

/**
 * Single forward pass over the RGBA buffer, accumulating each pixel into its cell bucket. Foreground
 * and background pixels are tallied separately so a filled cell's mean averages ONLY its foreground
 * (an edge cell reports the facade color, not a black-muddied blend).
 * @returns {{sumR:number,sumG:number,sumB:number,fgCount:number,bgCount:number}[]}  length n·m
 */
function aggregateCells({ width, height, data }, n, m, bgOpts) {
  const cells = new Array(n * m);
  for (let i = 0; i < cells.length; i++) {
    cells[i] = { sumR: 0, sumG: 0, sumB: 0, fgCount: 0, bgCount: 0 };
  }
  for (let y = 0; y < height; y++) {
    const gy = Math.min(m - 1, Math.floor((y * m) / height));
    const rowBase = gy * n;
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) << 2;
      const r = data[p], g = data[p + 1], b = data[p + 2], a = data[p + 3];
      const gx = Math.min(n - 1, Math.floor((x * n) / width));
      const cell = cells[rowBase + gx];
      if (isBackground(r, g, b, a, bgOpts)) {
        cell.bgCount++;
      } else {
        cell.fgCount++;
        cell.sumR += r;
        cell.sumG += g;
        cell.sumB += b;
      }
    }
  }
  return cells;
}

/**
 * Sample a decoded RGBA image to an N×M block grid, matching each filled cell to a real block. Pure —
 * no I/O, no decode dep.
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} img
 * @param {{n?:number, coverageThreshold?:number, dropColor?:RGB|null, dropTolerance?:number,
 *          alphaThreshold?:number, whitelist?:string[], cellMeans?:boolean}} [opts]
 * @returns {object} GridResult — see module header / structure.md
 */
export function gridFromPixels(img, opts = {}) {
  const o = { ...GRID_DEFAULTS, ...opts };
  const { width, height } = img;
  const { palette: candidates, missing } = resolvePalette(o.whitelist);
  const candidateKeys = new Set(candidates.map((c) => c.key));
  const { n, m } = gridDims(width, height, o.n);
  const cells = aggregateCells(img, n, m, o);

  const grid = [];
  const cellMeans = o.cellMeans ? [] : null; // opt-in: per-cell foreground means (see header)
  const blockCounts = Object.create(null);
  let filledCells = 0;
  let deSum = 0;
  for (let gy = 0; gy < m; gy++) {
    const row = new Array(n);
    const meansRow = cellMeans ? new Array(n).fill(null) : null;
    for (let gx = 0; gx < n; gx++) {
      const c = cells[gy * n + gx];
      const total = c.fgCount + c.bgCount;
      const coverage = total > 0 ? c.fgCount / total : 0;
      if (c.fgCount > 0 && coverage >= o.coverageThreshold) {
        const meanRgb = [c.sumR / c.fgCount, c.sumG / c.fgCount, c.sumB / c.fgCount];
        const { key, deltaE: dE } = nearestLab(srgbToLab(meanRgb), candidates);
        row[gx] = key;
        if (meansRow) meansRow[gx] = meanRgb;
        blockCounts[key] = (blockCounts[key] || 0) + 1;
        filledCells++;
        deSum += dE;
      } else {
        row[gx] = null;
      }
    }
    grid.push(row);
    if (cellMeans) cellMeans.push(meansRow);
  }

  const totalCells = n * m;
  const airCells = totalCells - filledCells;
  // Adherence check, computed independently of how matching was done: any filled cell whose block is
  // not in the candidate palette. Zero by construction in validate mode — but measured, not assumed.
  let outOfPalette = 0;
  for (const row of grid) for (const k of row) if (k !== null && !candidateKeys.has(k)) outOfPalette++;

  const usedBlocks = Object.keys(blockCounts).sort(
    (a, b) => blockCounts[b] - blockCounts[a] || (a < b ? -1 : 1),
  );
  const legend = usedBlocks.map((block) => {
    const e = BY_BLOCK.get(block);
    const cellsCount = blockCounts[block];
    return {
      block,
      rgb: e ? e.rgb : [0, 0, 0],
      hex: e ? rgbToHex(e.rgb) : "#000000",
      cells: cellsCount,
      pct: filledCells ? round1((100 * cellsCount) / filledCells) : 0,
    };
  });

  const result = {
    grid,
    n,
    m,
    width,
    height,
    paletteMode: o.whitelist ? "validate" : "discover",
    missing,
    totalCells,
    filledCells,
    airCells,
    outOfPalette,
    blockCounts: Object.fromEntries(usedBlocks.map((k) => [k, blockCounts[k]])),
    usedBlocks,
    legend,
    meanDeltaE: filledCells ? round2(deSum / filledCells) : 0,
    description: "",
  };
  if (cellMeans) result.cellMeans = cellMeans;
  result.description = describeGrid(result);
  return result;
}

/** One-line human-readable summary of a grid result. Pure, deterministic. */
export function describeGrid(result) {
  const { n, m, filledCells, totalCells, usedBlocks, meanDeltaE } = result;
  return `${n}×${m} grid · ${filledCells}/${totalCells} cells filled · ${usedBlocks.length} blocks · mean ΔE ${meanDeltaE}`;
}

/**
 * Extracted-vs-declared comparison: partition a manifest against the blocks a grid actually used.
 *   • present — declared ids that appear in the grid (the doc asked, the image delivered),
 *   • missing — declared ids that never appear (asked, not delivered),
 *   • added   — grid ids not in the manifest (the image introduced; only possible in discover mode).
 * Order follows the inputs (declared order for present/missing, used order for added).
 * @param {string[]} usedBlocks  distinct block ids the grid placed
 * @param {string[]} declaredBlocks  the manifest's `.blocks`
 * @returns {{present:string[], missing:string[], added:string[]}}
 */
export function comparePalettes(usedBlocks, declaredBlocks) {
  const used = new Set(usedBlocks);
  const declared = new Set(declaredBlocks);
  return {
    present: declaredBlocks.filter((b) => used.has(b)),
    missing: declaredBlocks.filter((b) => !used.has(b)),
    added: usedBlocks.filter((b) => !declared.has(b)),
  };
}

/**
 * Render a grid result to a flat RGBA swatch buffer: each filled cell becomes a `cell×cell` block of
 * its MATCHED block's table color (so the image shows what was actually placed, not the source
 * pixels); air cells are transparent (alpha 0). Pure — no encode dep; the CLI encodes to PNG.
 * @param {object} result  a GridResult from {@link gridFromPixels}
 * @param {{cell?:number}} [opts]
 * @returns {{width:number, height:number, data:Uint8ClampedArray}}
 */
export function renderGridSwatch(result, { cell = 12 } = {}) {
  if (!Number.isInteger(cell) || cell < 1) throw new Error(`renderGridSwatch: cell must be a positive integer, got ${cell}`);
  const { grid, n, m } = result;
  const width = n * cell;
  const height = m * cell;
  const data = new Uint8ClampedArray(width * height * 4); // zero-filled → transparent air
  const colorOf = new Map(result.legend.map((l) => [l.block, l.rgb]));
  for (let gy = 0; gy < m; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const block = grid[gy][gx];
      if (block === null) continue; // air stays transparent
      const [r, g, b] = colorOf.get(block) || [0, 0, 0];
      for (let dy = 0; dy < cell; dy++) {
        const py = gy * cell + dy;
        let q = (py * width + gx * cell) << 2;
        for (let dx = 0; dx < cell; dx++) {
          data[q] = r;
          data[q + 1] = g;
          data[q + 2] = b;
          data[q + 3] = 255;
          q += 4;
        }
      }
    }
  }
  return { width, height, data };
}

// --- decode shell (lazy, isolated — reuses palette-extract's decodeImage) ---

/**
 * Decode an image file (JPEG or PNG — sniffed by magic bytes) and sample it to a block grid.
 * @param {string} path
 * @param {object} [opts]  forwarded to {@link gridFromPixels}
 */
export async function gridFromImage(path, opts = {}) {
  const img = await decodeImage(path);
  return gridFromPixels(img, opts);
}
