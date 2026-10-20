// Builds the whole Pike Place Main Arcade and North Arcade (plot 0): the ground, then every part in order, into the path given as argv[2].
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, FOOTPRINT, groundY, COBBLED_DEEPSLATE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the parts in plan.md's order; the roof (roof.json) is laid right after the first one
const PARTS = [
  ["South shell: Down Under, main building, corner block", "parts/shell-south.mjs"],
  ["North shell, shed frame, arcade floor", "parts/shell-north.mjs"],
  ["Roofs and chimneys", "parts/roofs.mjs"],
  ["Facades: windows, doors, trim, awnings, lamps", "parts/facades.mjs"],
  ["Corner landmarks: neon sign, clocks, board, fish market", "parts/landmarks.mjs"],
  ["Stalls, craft tables, flower buckets, dusk props", "parts/stalls.mjs"],
];
// a part whose file is not there yet builds nothing, so the build never fails on a missing part
const load = async (file) => (existsSync(file) ? import(`./${file}`) : { build() {} });
const mods = await Promise.all(PARTS.map(([, file]) => load(file)));

// the server is 1.21.1 (DataVersion 3955): every id in the palette is a 1.21.1 block
const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
// the ground: each footprint column solid up to its ground y (groundY is a placeholder until the GROUND map arrives)
for (const [z0, z1, x0, x1] of FOOTPRINT)
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.fill([x, 0, z], [x, groundY(x, z), z], COBBLED_DEEPSLATE);

runParts(g, PARTS.map(([name], i) => [name, mods[i].build]), { palette: "palette.json", roof: "roof.json" });
g.save(out);
