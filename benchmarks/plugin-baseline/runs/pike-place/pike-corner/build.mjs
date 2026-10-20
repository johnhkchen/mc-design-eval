// Pike Place south and east markets: the site grid, the ground from the footprint maps, then every part in plan order.
// usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file and moves the result to build.nbt)
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, groundAt } from "./vocab/base.mjs";

// the parts in plan order; each file exports build(g). A part not written yet is skipped, never an error.
const PARTS = [
  ["Economy shell and roof", "parts/economy.mjs"],
  ["Corner shell and roof", "parts/corner.mjs"],
  ["Sanitary and Garden shell and roof", "parts/sanitary-garden.mjs"],
  ["Economy and Corner facade fittings", "parts/economy-corner-facade.mjs"],
  ["Sanitary and Garden facade fittings", "parts/sanitary-garden-facade.mjs"],
  ["Stalls, lights and grounds", "parts/stalls-lights.mjs"],
];

// the ground under each footprint cell: stone up to its height, a stone brick street course on top (parts overwrite it)
function layGround(g) {
  let n = 0;
  for (let x = 0; x < SITE.x; x++) for (let z = 0; z < SITE.z; z++) {
    const h = groundAt(x, z);
    if (h === null) continue;
    for (let y = 0; y < h; y++) { g.set(x, y, z, "stone"); n++; }
    g.set(x, h, z, "stone_bricks"); n++;
  }
  console.log(`ground: ${n} blocks under the footprint`);
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${file}`)).build]);
}
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
