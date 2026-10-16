// Builds the whole row: ground, then every part in order, into the path given as the first argument.
// Usage: node build.mjs <out.nbt>   (make.sh runs this into a temp file, then moves it into place)
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { GRASS_BLOCK, SIZE, SITE } from "./vocab/base.mjs";

// Part order is the build order: later parts only add, and earlier parts' blocks are locked.
const PARTS = [
  ["Shell A plots 0-3", "parts/shell_a.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs"],
  ["Shell B plots 4-7", "parts/shell_b.mjs"],
  ["Roofs", "parts/roofs.mjs"],
  ["Windows, doors and porches", "parts/fittings.mjs"],
  ["Chimneys and hearths", "parts/chimneys.mjs"],
  ["Grounds and yards", "parts/grounds.mjs"],
  ["room: Dogtrot west pen", "parts/room-1.mjs"],
  ["room: Dogtrot east pen", "parts/room-2.mjs"],
  ["room: Dogtrot breezeway", "parts/room-3.mjs"],
  ["room: Dogtrot porch", "parts/room-4.mjs"],
  ["room: Camelback front room", "parts/room-5.mjs"],
  ["room: Camelback kitchen", "parts/room-6.mjs"],
  ["room: Camelback bedroom", "parts/room-7.mjs"],
  ["room: I-house west room", "parts/room-8.mjs"],
  ["room: I-house stair hall", "parts/room-9.mjs"],
  ["room: I-house east room", "parts/room-10.mjs"],
  ["room: I-house upper west bedroom", "parts/room-11.mjs"],
  ["room: I-house upper hall", "parts/room-12.mjs"],
  ["room: I-house upper east bedroom", "parts/room-13.mjs"],
  ["room: Pyramid NW parlour", "parts/room-14.mjs"],
  ["room: Pyramid NE kitchen", "parts/room-15.mjs"],
  ["room: Pyramid SW bedroom", "parts/room-16.mjs"],
  ["room: Pyramid SE bedroom", "parts/room-17.mjs"],
  ["room: Pyramid vestibule", "parts/room-18.mjs"],
  ["room: Pyramid back hall", "parts/room-19.mjs"],
  ["room: Boarding house kitchen-hall", "parts/room-20.mjs"],
  ["room: Boarding west bunk room", "parts/room-21.mjs"],
  ["room: Boarding east bunk room", "parts/room-22.mjs"],
  ["room: Boarding landing hall", "parts/room-23.mjs"],
  ["room: Smokehouse smoke room", "parts/room-24.mjs"],
  ["room: Bungalow living room", "parts/room-25.mjs"],
  ["room: Bungalow kitchen", "parts/room-26.mjs"],
  ["room: Bungalow bedroom", "parts/room-27.mjs"],
  ["room: Bungalow porch", "parts/room-28.mjs"],
];

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// A part whose file isn't written yet is skipped (its worker's copy may still be a stub or missing): make.sh must still produce a build.
const list = [];
for (const [name, file] of PARTS) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) {
    console.error(`skip: ${file} is missing, ${name} is not built`);
    list.push([name, () => {}]);
    continue;
  }
  const mod = await import(path);
  list.push([name, typeof mod.build === "function" ? mod.build : () => {}]);
}

const g = new Grid(SIZE);

// Ground: the surface row at y 0 (grass_block). Plan y -2..-1 (stone and dirt fill) is below the grid, which only holds y >= 0.
g.fill([0, SITE.SURFACE_Y, 0], [SITE.W - 1, SITE.SURFACE_Y, SITE.D - 1], GRASS_BLOCK);

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
