// Notre-Dame de Paris (plan.md): lays the ground under the plot, runs the six parts in plan.md's order, saves.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file, then moves it to build.nbt)
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, groundAt } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");
process.chdir(fileURLToPath(new URL(".", import.meta.url)));   // palette.json / roof.json / parts-report.json live here

// The parts in build order; a module not written yet is skipped (never a failure), so make.sh works in any copy.
const PARTS = [
  ["P1 Masonry shell", "./parts/shell.mjs"],
  ["P2 Lead roofs", "./parts/roofs.mjs"],
  ["P3 West front and towers", "./parts/westfront.mjs"],
  ["P4 Flanks, transept faces and chevet relief", "./parts/relief.mjs"],
  ["P5 Spire and apostles", "./parts/spire.mjs"],
  ["P6 Glass, light and ground", "./parts/finish.mjs"],
];

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

// The ground (brief GROUND map): the value is the walking level, so solid earth fills y 0..ground-1 (grass on top);
// at the west (3) the plinth tops out flush, at the chevet (1) it shows 1-2 courses.
for (let x = 0; x < SITE_SIZE[0]; x++) for (let z = 0; z < SITE_SIZE[2]; z++) {
  const top = groundAt(x, z);
  for (let y = 0; y < top; y++) g.set(x, y, z, y === top - 1 ? "grass_block" : "dirt");
}

const list = [];
for (const [name, file] of PARTS) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${name}: ${file} not written yet, skipped`); continue; }
  const mod = await import(pathToFileURL(path).href);
  list.push([name, mod.build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
