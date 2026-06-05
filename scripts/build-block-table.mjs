#!/usr/bin/env node
// Regenerate the committed block → CIE-Lab color table (T-019-01, epic E-10).
//
// Usage:
//   npm run build:block-table
//   node scripts/build-block-table.mjs [--version 1.20.1] [--out <path>]
//
// Reads minecraft-assets textures (build-time devDep), computes each full-cube survival
// block's representative color (mean opaque pixels, side face, first animation frame) and its
// CIE L*a*b*, and writes the result as pretty JSON. The committed table is the runtime input
// for the S-020 color engine and S-021 palette extractor — those import data, not this script.

import { writeFileSync } from "node:fs";
import { buildBlockTable, TABLE_PATH } from "../src/color/block-table.mjs";

function parseArgs(argv) {
  const opts = { version: "1.20.1", out: TABLE_PATH };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--version") opts.version = argv[++i];
    else if (argv[i] === "--out") opts.out = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return opts;
}

const { version, out } = parseArgs(process.argv.slice(2));
const table = await buildBlockTable({ version });
writeFileSync(out, JSON.stringify(table, null, 2) + "\n");
console.log(
  `block-lab-table: ${table.blocks.length} blocks, ${table.excluded.length} excluded ` +
    `(version ${table.version}, from ${table.generatedFrom}) → ${out}`,
);
