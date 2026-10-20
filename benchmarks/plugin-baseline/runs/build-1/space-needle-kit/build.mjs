// The Space Needle: the site grid, the ground, then every part in plan.md order. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOT, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order (the stair joiner before any room; the rooms last, furnished around the finished tower).
const PARTS = [
  ["Legs and ties", "parts/legs.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs"],
  ["Core, elevators and Pavilion", "parts/core-pavilion.mjs"],
  ["SkyLine hexagon", "parts/skyline.mjs"],
  ["Saucer and halo", "parts/saucer.mjs"],
  ["Crown and spire", "parts/crown.mjs"],
  ["Lights and details", "parts/lights-details.mjs"],
  ["room: Pavilion", "parts/room-1.mjs"],
  ["room: SkyLine", "parts/room-2.mjs"],
  ["room: The Loupe", "parts/room-3.mjs"],
  ["room: Observation deck inner", "parts/room-4.mjs"],
  ["room: Outdoor deck", "parts/room-5.mjs"],
];

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([PLOT.x0, GROUND_Y, PLOT.z0], [PLOT.x1, GROUND_Y, PLOT.z1], SMOOTH_STONE);

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
