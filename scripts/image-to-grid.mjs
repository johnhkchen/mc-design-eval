#!/usr/bin/env node
// Sample a facade concept image to an N×M real-block grid and write a swatch visualization
// (T-022-01, epic E-10 / story S-022).
//
// Usage:
//   npm run grid:build -- <image> [options]
//   node scripts/image-to-grid.mjs benchmarks/temple-facade/concepts/taj-C-flash.png
//
// Options:
//   --n <int>          grid width in cells (default 48; the held-constant concept-series resolution)
//   --coverage <0..1>  min foreground fraction for a cell to be filled, else air (default 0.5)
//   --drop <#hex|none> background color to remove (default #000000; "none" disables removal)
//   --tol <n>          background match radius, Euclidean RGB (default 24)
//   --whitelist <arg>  comma-separated block ids, OR a path to a palettes/*.json (reads .blocks);
//                      switches from discover mode (all blocks) to validate mode (the subset)
//   --cell <px>        swatch pixels per grid cell (default 12)
//   --out <png>        visualization output path (default "<image>.grid.png"; gitignored beside input)
//   --json             print the full result object (grid included) as JSON; still writes the PNG
//
// Decodes JPEG or PNG (sniffed by magic bytes), area-downsamples to the grid, matches each cell to
// the nearest real survival block (S-019 table via the S-020 engine). Dithering OFF. See
// src/color/image-grid.mjs for the pipeline and the near-black-background caveat.

import { readFileSync, writeFileSync } from "node:fs";
import { gridFromImage, renderGridSwatch } from "../src/color/image-grid.mjs";

function parseHex(h) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(h);
  if (!m) throw new Error(`--drop expects a #rrggbb hex (or "none"), got ${h}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function resolveWhitelist(arg) {
  if (!arg) return undefined;
  if (arg.endsWith(".json")) {
    const data = JSON.parse(readFileSync(arg, "utf8"));
    if (!Array.isArray(data.blocks)) throw new Error(`${arg} has no "blocks" array`);
    return data.blocks;
  }
  return arg.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseArgs(argv) {
  const opts = { n: 48 };
  let image, out, cell, json;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--n") opts.n = Number(argv[++i]);
    else if (a === "--coverage") opts.coverageThreshold = Number(argv[++i]);
    else if (a === "--drop") {
      const v = argv[++i];
      opts.dropColor = v === "none" ? null : parseHex(v);
    } else if (a === "--tol") opts.dropTolerance = Number(argv[++i]);
    else if (a === "--whitelist") opts.whitelist = resolveWhitelist(argv[++i]);
    else if (a === "--cell") cell = Number(argv[++i]);
    else if (a === "--out") out = argv[++i];
    else if (a === "--json") json = true;
    else if (!a.startsWith("--") && !image) image = a;
    else throw new Error(`unknown or misplaced argument: ${a}`);
  }
  if (!image) {
    throw new Error(
      "usage: image-to-grid <image> [--n int] [--coverage 0..1] [--drop #hex|none] [--tol n] " +
        "[--whitelist ids|file] [--cell px] [--out png] [--json]",
    );
  }
  return { image, opts, out: out || `${image}.grid.png`, cell: cell ?? 12, json };
}

const { image, opts, out, cell, json } = parseArgs(process.argv.slice(2));
const result = await gridFromImage(image, opts);

// Encode + write the swatch visualization (lazy pngjs — devDep, off the core path).
const swatch = renderGridSwatch(result, { cell });
const { PNG } = await import("pngjs");
const png = new PNG({ width: swatch.width, height: swatch.height });
png.data = Buffer.from(swatch.data.buffer, swatch.data.byteOffset, swatch.data.byteLength);
writeFileSync(out, PNG.sync.write(png));

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(result.description + `  [${result.paletteMode}]`);
  console.log(
    `  ${result.width}×${result.height}px → ${result.n}×${result.m} grid · ` +
      `${result.filledCells} filled / ${result.airCells} air · outOfPalette ${result.outOfPalette}`,
  );
  console.log(`\n  cover  block                          cells  color` +
    `\n  -----  -----------------------------  -----  -------`);
  for (const e of result.legend.slice(0, 20)) {
    const cov = `${e.pct.toFixed(1)}%`.padStart(6);
    const block = e.block.padEnd(29);
    const cells = String(e.cells).padStart(5);
    console.log(`  ${cov}  ${block}  ${cells}  ${e.hex}`);
  }
  if (result.legend.length > 20) console.log(`  … ${result.legend.length - 20} more blocks`);
  if (result.missing.length) console.log(`\n  whitelist ids not in the block table: ${result.missing.join(", ")}`);
  console.log(`\n  wrote ${out} (${swatch.width}×${swatch.height}px swatch)`);
}
