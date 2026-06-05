#!/usr/bin/env node
// Extract the canonical block palette from a facade concept image (T-021-01, epic E-10 / S-021).
//
// Usage:
//   npm run palette:extract -- <image> [options]
//   node scripts/extract-palette.mjs benchmarks/temple-facade/concepts/taj-C-flash.png
//
// Options:
//   --k <n>            target cluster count (default 8; ticket guidance 6–12)
//   --drop <#hex|none> background color to remove (default #000000; "none" disables removal)
//   --tol <n>          background match radius, Euclidean RGB (default 24)
//   --whitelist <arg>  comma-separated block ids, OR a path to a palettes/*.json (reads .blocks);
//                      switches from discover mode (all blocks) to validate mode (the subset)
//   --json             print the full result object as JSON instead of the human table
//
// Decodes JPEG or PNG (sniffed by magic bytes), clusters the foreground in CIE-Lab, and matches
// each cluster to the nearest real survival block (S-019 table via the S-020 engine). See
// src/color/palette-extract.mjs for the pipeline and the near-black-background caveat.

import { readFileSync } from "node:fs";
import { extractPaletteFromImage } from "../src/color/palette-extract.mjs";

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
  const opts = { k: 8 };
  let image;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--k") opts.k = Number(argv[++i]);
    else if (a === "--drop") {
      const v = argv[++i];
      opts.dropColor = v === "none" ? null : parseHex(v);
    } else if (a === "--tol") opts.dropTolerance = Number(argv[++i]);
    else if (a === "--whitelist") opts.whitelist = resolveWhitelist(argv[++i]);
    else if (a === "--json") opts.json = true;
    else if (!a.startsWith("--") && !image) image = a;
    else throw new Error(`unknown or misplaced argument: ${a}`);
  }
  if (!image) throw new Error("usage: extract-palette <image> [--k n] [--drop #hex|none] [--tol n] [--whitelist ids|file] [--json]");
  return { image, opts };
}

const { image, opts } = parseArgs(process.argv.slice(2));
const { json, ...extractOpts } = opts;
const result = await extractPaletteFromImage(image, extractOpts);

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(result.description);
  console.log(
    `\n  cover  block                          ΔE     repColor   blockColor` +
      `\n  -----  -----------------------------  -----  ---------  ----------`,
  );
  for (const e of result.palette) {
    const cov = `${result.palette.length && e.coveragePct.toFixed(1)}%`.padStart(6);
    const block = e.block.padEnd(29);
    const de = String(e.deltaE).padStart(5);
    const rep = e.repColor.hex.padEnd(9);
    const blk = e.blockColor ? e.blockColor.hex : "—";
    console.log(`  ${cov}  ${block}  ${de}  ${rep}  ${blk}`);
  }
  if (result.missing.length) console.log(`\n  whitelist ids not in the block table: ${result.missing.join(", ")}`);
  console.log(
    `\n  ${result.foregroundPx} fg / ${result.droppedPx} dropped / ${result.totalPx} total px · ` +
      `${result.effectiveClusters}/${result.k} clusters`,
  );
}
