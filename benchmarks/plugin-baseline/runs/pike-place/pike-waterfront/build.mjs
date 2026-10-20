// The Pike Waterfront build: the site grid, its ground under the footprint, then every part in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh gives it a temp file)
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, groundAt } from "./vocab/base.mjs";

// the bluff and bed under each footprint cell, laid before the parts (so not in palette.json, never reported)
const GROUND = "stone";
// plan order: each part's worker builds its own module; a part whose file is not written yet is skipped, not fatal
const PARTS = [
  ["Pier, pilings and decks", "./parts/pier.mjs"],
  ["Pier shed shell and roof", "./parts/shed.mjs"],
  ["Pavilion, signs and murals", "./parts/pavilion.mjs"],
  ["Bay Wing", "./parts/baywing.mjs"],
  ["Landings shells", "./parts/landings.mjs"],
  ["Landings facades and dusk lighting", "./parts/landings-facade.mjs"],
];

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

const g = new Grid(SITE.size, { dataVersion: SITE.dataVersion });
for (let x = 0; x < SITE.size[0]; x++) for (let z = 0; z < SITE.size[2]; z++) {
  const ground = groundAt(x, z);
  if (ground === null) continue;
  for (let y = 0; y <= ground; y++) g.set(x, y, z, GROUND);
}

const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} not written yet, skipped`); continue; }
  const part = await import(file);
  list.push([name, part.build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
