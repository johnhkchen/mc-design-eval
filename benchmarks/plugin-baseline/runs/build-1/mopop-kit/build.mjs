// MoPOP kit: the site grid, the ground, then every part in the order the plan gives. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, GROUND, GROUND_Y } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order (plan.md PARTS). Overlap order matters: the shells come first, so later parts only add.
const PARTS = [
  ["North shells", "parts/north.mjs"],
  ["Middle shells", "parts/middle.mjs"],
  ["South shells", "parts/south.mjs"],
  ["Monorail", "parts/monorail.mjs"],
  ["Lobbies, doors, floors", "parts/lobbies.mjs"],
  ["Plaza and grounds", "parts/grounds.mjs"],
];

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build]);
}

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, GROUND_Y, 0], [SITE[0] - 1, GROUND_Y, SITE[2] - 1], GROUND);   // the ground course over the whole plot
// runParts lays roof.json (none for this plan: the roof is each shell's own crown) and skips it while the file is absent
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
