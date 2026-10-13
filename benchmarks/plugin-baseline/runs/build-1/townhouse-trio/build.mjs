// Builds the townhouse trio: full-size grid, lot ground, then every part in plan order (each part locks what it writes).
// Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SIZE, LOT, GRASS_BLOCK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

// A part that is not written yet, or does not load, builds as an empty stub (warned), so make.sh still makes a build.
async function partBuild(file) {
  if (!existsSync(file)) { console.warn(`${file}: missing, built as an empty stub`); return () => {}; }
  try { return (await import(pathToFileURL(file).href)).build; }
  catch (e) { console.warn(`${file}: did not load (${e.message.split("\n")[0]}), built as an empty stub`); return () => {}; }
}

// The parts in plan order: shell, stairs, roofs, chimneys, front, grounds, then the twelve rooms.
const PARTS = [
  ["masonry shell", "parts/shell.mjs"],
  ["stairs", "parts/stairs.mjs"],
  ["roofs", "parts/roofs.mjs"],
  ["chimneys and hearths", "parts/chimneys.mjs"],
  ["fenestration and front", "parts/front.mjs"],
  ["grounds", "parts/grounds.mjs"],
  ["room: A ground", "parts/room-1.mjs"],
  ["room: A drawing room", "parts/room-2.mjs"],
  ["room: A bedrooms", "parts/room-3.mjs"],
  ["room: A attic", "parts/room-4.mjs"],
  ["room: B ground", "parts/room-5.mjs"],
  ["room: B drawing room", "parts/room-6.mjs"],
  ["room: B bedrooms", "parts/room-7.mjs"],
  ["room: B third floor", "parts/room-8.mjs"],
  ["room: C ground", "parts/room-9.mjs"],
  ["room: C drawing room", "parts/room-10.mjs"],
  ["room: C bedrooms", "parts/room-11.mjs"],
  ["room: C attic", "parts/room-12.mjs"],
];

const g = new Grid(SIZE);
// Lot ground: grass over the whole lot at y=0; the grounds part lays the road, pavement and patches over it.
g.fill([LOT[0], 0, LOT[2]], [LOT[3], 0, LOT[5]], GRASS_BLOCK);

const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file)]);
// roof.json is absent: the three roofs (A, B, C) have different footprints and runParts takes one roof spec, so the
// roofs part lays them. runParts skips the roof step while roof.json does not exist.
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`wrote ${out}`);
