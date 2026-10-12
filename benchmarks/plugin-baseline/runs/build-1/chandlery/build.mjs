// The chandlery: the site ground, then every part in plan.md's order under runParts (locks, palette report, roof.json).
// Usage: node build.mjs <out.nbt>. A part whose file is not written yet builds nothing (said in the log), so make.sh
// stays green while the parts are written in parallel.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, GROUND_Y } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");
const here = (file) => fileURLToPath(new URL(file, import.meta.url));

// plan.md PARTS, in build order, then the seven rooms (each room is a part its interior designer fills)
const PARTS = [
  ["Masonry shell", "parts/shell.mjs"],
  ["Timber frame", "parts/frame.mjs"],
  ["Roofs", "parts/roofs.mjs"],
  ["Openings and fittings", "parts/fittings.mjs"],
  ["Chimneys and hearths", "parts/chimneys.mjs"],
  ["Grounds and lean-to", "parts/grounds.mjs"],
  ["room: Shop", "parts/room-1.mjs"],
  ["room: Family hall and kitchen", "parts/room-2.mjs"],
  ["room: Chandler's workshop", "parts/room-3.mjs"],
  ["room: Drying lean-to", "parts/room-4.mjs"],
  ["room: Parlour", "parts/room-5.mjs"],
  ["room: West bedchamber", "parts/room-6.mjs"],
  ["room: East bedchamber", "parts/room-7.mjs"],
];

// A part file that is missing, or fails to load, builds nothing and is said so: the others still build.
async function loadPart(name, file) {
  const path = here(file);
  if (!existsSync(path)) { console.log(`part ${name}: no ${file} yet, skipped`); return () => {}; }
  try {
    const { build } = await import(path);
    if (typeof build !== "function") { console.log(`part ${name}: ${file} exports no build(g), skipped`); return () => {}; }
    return build;
  } catch (e) {
    console.log(`part ${name}: ${file} failed to load (${e.message.split("\n")[0]}), skipped`);
    return () => {};
  }
}

// the site with its ground: the lot's ground (plan.md SITE); parts may replace it (paths, patches), runParts keeps it writable
function siteGrid() {
  const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["26.3"] });
  g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], "minecraft:grass_block");
  return g;
}

const list = [];
for (const [name, file] of PARTS) list.push([name, await loadPart(name, file)]);

// runParts lays the roof right after the first part, and the roof reads the walls for its eave: with no shell walls
// yet (the shell is still a stub) that throws. So the roof is laid only when the shell has placed walls; until then
// the parts build without it, as the library does with no roof.json.
const probe = siteGrid();
list[0][1](probe);
const shellHasWalls = [...probe].some((c) => c.pos[1] > GROUND_Y);
const roof = shellHasWalls && existsSync(here("roof.json")) ? here("roof.json") : undefined;
if (!roof) console.log("roof: waits for the shell's walls (no eave to read yet), skipped");

const g = siteGrid();
runParts(g, list, { palette: here("palette.json"), roof });
g.save(out);
console.log(`saved ${out}`);
