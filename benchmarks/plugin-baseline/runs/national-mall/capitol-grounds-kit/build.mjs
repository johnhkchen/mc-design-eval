// The Capitol grounds: the grid at the site size, a stone sub-floor, then the six parts in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file and moves the result into place)
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE } from "./vocab/base.mjs";

const PARTS = [
  ["Ground and pool", "parts/ground.mjs"],
  ["Walks", "parts/walks.mjs"],
  ["Olmsted terrace", "parts/terrace.mjs"],
  ["Grant Memorial and statues", "parts/grant.mjs"],
  ["Trees and planting", "parts/trees.mjs"],
  ["Lamps and lighting", "parts/lamps.mjs"],
];

// A part whose file or build() is not written yet builds nothing, so the others can still be built and checked.
async function partBuild(file) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${file}: not written yet, builds nothing`); return () => {}; }
  const mod = await import(path);
  if (typeof mod.build === "function") return mod.build;
  console.log(`part ${file}: no build() yet, builds nothing`);
  return () => {};
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid(SITE_SIZE, { dataVersion: 3955 });                        // 1.21.1, the server's version
// the sub-floor: stone under the whole box at y 0; the ground part lays each column from y 1 up to its height
g.fill([0, 0, 0], [SITE_SIZE[0] - 1, 0, SITE_SIZE[2] - 1], "stone");

const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });            // no roof preset: roof.json is skipped
g.save(out);
console.log(`saved ${out}`);
