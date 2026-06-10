// Survival block-vocabulary builder (T-096-01, story S-096, epic E-26).
//
// Produces the committed `src/form/block-vocab.json` the kit extractor validates against: every
// block ID that EXISTS for the pinned Minecraft version (minecraft-data) AND is survival-placeable
// — the FULL vocabulary (trapdoors, fences, doors, lanterns…), unlike the block→Lab table, which
// is full-cube-only by construction. E-21's validator used the Lab table as its membership gate
// and silently discarded recognized fixtures ("unknown-block"); this vocabulary is the fix's
// ground truth.
//
// Boundary (the block-table.mjs precedent): `minecraft-data` is a BUILD-TIME-ONLY dependency,
// resolved through the `palettes/` workspace that declares it (palettes/validate.mjs precedent);
// the runtime path (src/form/kit.mjs) loads only the committed JSON — zero Minecraft deps.
//
//   node scripts/build-block-vocab.mjs        # rewrites src/form/block-vocab.json (byte-stable)

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const OUT = join(REPO, "src", "form", "block-vocab.json");

/** The artifact-contract version pin (palettes/*.json minecraftVersion). */
const MINECRAFT_VERSION = "1.20.1";

// Blocks that EXIST in minecraft-data but a survival player cannot obtain or place legally
// (spec §6). Copied verbatim from palettes/validate.mjs (a process-exiting CLI that exports
// nothing) — cross-palette policy, single denylist semantics in both places.
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

// Resolve minecraft-data through the palettes workspace, where it is a declared dependency.
const requireFromPalettes = createRequire(join(REPO, "palettes", "package.json"));
const mcData = requireFromPalettes("minecraft-data");

const data = mcData(MINECRAFT_VERSION);
if (!data) {
  console.error(`minecraft-data has no data for version "${MINECRAFT_VERSION}"`);
  process.exit(1);
}

const blocks = data.blocksArray
  .map((b) => b.name)
  .filter((n) => !NON_SURVIVAL.has(n))
  .sort();

const record = {
  schema: "block-vocab/v1",
  source: "minecraft-data",
  minecraftVersion: MINECRAFT_VERSION,
  count: blocks.length,
  blocks,
};

writeFileSync(OUT, JSON.stringify(record, null, 2) + "\n");
console.error(`✓ block-vocab: ${blocks.length} survival-placeable blocks for ${MINECRAFT_VERSION} → ${OUT}`);
