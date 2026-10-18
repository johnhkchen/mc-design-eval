// Palace of Fine Arts: the site grid, the paving, then every part in plan.md order. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOTS, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order: the two rooms last, as the walk-through spaces inside the finished monument.
const PARTS = [
  ["Rotunda ring and ground", "parts/ring.mjs"],
  ["Rotunda columns and entablature", "parts/columns.mjs"],
  ["Attic and dome", "parts/dome.mjs"],
  ["Peristyle bay and end columns", "parts/peristyle.mjs"],
  ["Planters, figures, niches", "parts/planters.mjs"],
  ["Exhibition hall and lamps", "parts/hall.mjs"],
  ["room: Rotunda interior", "parts/room-1.mjs"],
  ["room: Peristyle walkway", "parts/room-2.mjs"],
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
