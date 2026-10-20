// The US Capitol (plot 0): the grid at the site size, the ground, then the six parts in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file and moves the result into place)
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, G } from "./vocab/base.mjs";

const PARTS = [
  ["Masonry shell", "parts/shell.mjs"],
  ["Colonnades, porticoes, pediments, balustrades, cupolas", "parts/colonnades.mjs"],
  ["Dome lower", "parts/dome-lower.mjs"],
  ["Dome upper", "parts/dome-upper.mjs"],
  ["Facade fittings", "parts/fittings.mjs"],
  ["Lighting and terrace edges", "parts/lighting.mjs"],
];

// A part whose file or build() is not written yet builds nothing, so the others can still be built and checked.
async function partBuild(file) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${file}: not written yet, builds nothing`); return () => {}; }
  const mod = await import(path);
  return mod.build ?? (() => {});
}

// Ground: each column is dirt up to g-1 with grass on top, so the first built course is g (plan.md SITE).
function layGround(g) {
  for (let x = 0; x < SITE.x; x++) for (let z = 0; z < SITE.z; z++) {
    const top = G(x, z);
    for (let y = 0; y < top - 1; y++) g.set(x, y, z, "dirt");
    if (top > 0) g.set(x, top - 1, z, "grass_block");
  }
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
