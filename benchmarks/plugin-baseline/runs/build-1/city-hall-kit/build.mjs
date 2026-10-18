// San Francisco City Hall: the site grid, the ground, then every part in plan.md order. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOTS, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order: the two rooms last, as the walk-through spaces inside the finished monument.
const PARTS = [
  ["front shell", "parts/front-shell.mjs"],
  ["dome pavilion shell", "parts/pavilion-shell.mjs"],
  ["giant order", "parts/giant-order.mjs"],
  ["stone dressings", "parts/dressings.mjs"],
  ["portico front", "parts/portico.mjs"],
  ["drum", "parts/drum.mjs"],
  ["dome", "parts/dome.mjs"],
  ["lantern", "parts/lantern.mjs"],
  ["glazing", "parts/glazing.mjs"],
  ["lighting", "parts/lighting.mjs"],
  ["room: Rotunda", "parts/room-1.mjs"],
  ["room: Portico vestibule", "parts/room-2.mjs"],
];

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
for (const p of Object.values(PLOTS)) g.fill([p.x0, 0, p.z0], [p.x1, 0, p.z1], SMOOTH_STONE);

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
