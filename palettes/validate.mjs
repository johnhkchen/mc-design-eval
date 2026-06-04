#!/usr/bin/env node
// Style-palette validator (T-001-04).
//
// Two layers, one entrypoint:
//   Layer A — structural: the palette matches palette.schema.json (Ajv, draft 2020-12).
//   Layer B — semantic: every block ID exists for the declared minecraftVersion
//             (minecraft-data) AND is survival-obtainable (not in NON_SURVIVAL).
// Plus the groups-subset invariant: every block named in `groups` is in `blocks`.
//
// Usage:  node validate.mjs <path-to-palette.json>
// Exit 0 on pass; exit 1 with a printed reason on any failure.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import Ajv2020 from "ajv/dist/2020.js";

const require = createRequire(import.meta.url);
const mcData = require("minecraft-data");
const HERE = dirname(fileURLToPath(import.meta.url));

// Blocks that EXIST in minecraft-data but a survival player cannot obtain or place
// legally (spec §6: "nothing may require creative-only placement"). This is
// cross-palette policy, so it lives in the validator, not in any one palette file.
// Conservative on purpose: only unambiguous creative/technical blocks are listed.
const NON_SURVIVAL = new Set([
  // technical "air" blocks — not placeable
  "air", "cave_air", "void_air",
  // admin / creative-only
  "barrier", "light", "structure_void", "structure_block", "jigsaw",
  "command_block", "chain_command_block", "repeating_command_block",
  "bedrock", "spawner",
  // dynamic / portal / state-only blocks — produced by the world, not placed
  "end_portal", "end_gateway", "end_portal_frame", "nether_portal",
  "moving_piston", "piston_head", "fire", "soul_fire",
  "bubble_column", "redstone_wire",
  // fluids are world-state, not whitelist materials
  "water", "lava",
]);

function fail(msg, details) {
  console.error(`✗ ${msg}`);
  if (details && details.length) for (const d of details) console.error(`    - ${d}`);
  process.exit(1);
}

const target = process.argv[2];
if (!target) fail("usage: node validate.mjs <path-to-palette.json>");

// --- Load palette + schema --------------------------------------------------
let palette;
try {
  palette = JSON.parse(readFileSync(resolve(target), "utf8"));
} catch (e) {
  fail(`cannot read/parse palette "${target}": ${e.message}`);
}
const schema = JSON.parse(readFileSync(resolve(HERE, "palette.schema.json"), "utf8"));

// --- Layer A: structural (JSON Schema) -------------------------------------
const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);
if (!validate(palette)) {
  fail(
    `${target} does not match palette.schema.json`,
    validate.errors.map((e) => `${e.instancePath || "(root)"} ${e.message}`)
  );
}

// --- Layer B: semantic (Minecraft reality) ---------------------------------
const data = mcData(palette.minecraftVersion);
if (!data) {
  fail(`minecraft-data has no data for version "${palette.minecraftVersion}"`);
}
const valid = new Set(data.blocksArray.map((b) => b.name));
const strip = (id) => id.replace(/^minecraft:/, "");

const unknown = [];
const creativeOnly = [];
for (const raw of palette.blocks) {
  const id = strip(raw);
  if (!valid.has(id)) unknown.push(raw);
  else if (NON_SURVIVAL.has(id)) creativeOnly.push(raw);
}
if (unknown.length || creativeOnly.length) {
  const details = [
    ...unknown.map((b) => `${b} — unknown block ID for Minecraft ${palette.minecraftVersion}`),
    ...creativeOnly.map((b) => `${b} — not survival-obtainable (creative/technical only)`),
  ];
  fail(`palette contains blocks that are not valid survival materials`, details);
}

// --- Invariant: groups ⊆ blocks --------------------------------------------
if (palette.groups) {
  const inBlocks = new Set(palette.blocks.map(strip));
  const orphans = [];
  for (const [group, members] of Object.entries(palette.groups)) {
    for (const m of members) {
      if (!inBlocks.has(strip(m))) orphans.push(`${group}: ${m}`);
    }
  }
  if (orphans.length) {
    fail(`groups reference blocks absent from \`blocks\` (groups must be a subset)`, orphans);
  }
}

// --- Pass -------------------------------------------------------------------
console.log(
  `✓ ${palette.id}: ${palette.blocks.length} blocks valid & survival-obtainable for Minecraft ${palette.minecraftVersion}`
);
