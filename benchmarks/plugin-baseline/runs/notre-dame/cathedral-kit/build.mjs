// Notre-Dame cathedral: lays the rock under the plot, then runs the six parts in plan.md's order and saves the structure.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file, then moves it to build.nbt)
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, ROCK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Rock top (plan.md SITE): 3 under the west towers, 2 over the nave, transepts and choir, 1 along the south-east
// choir and the sacristy, 0 at the sacristy's east edge. The choir band (z 27..47) stays at 2 where the SE strip starts.
function groundY(x, z) {
  if (x <= 34) return 3;
  if (x >= 152 && z >= 70) return 0;
  if (z >= 48 && x >= 85 && x <= 170 && !(x >= 86 && x <= 104)) return 1;
  return 2;
}

// The parts in build order; a part whose module is not written yet is skipped (never a failure), so make.sh works
// while the parts are still stubs or missing.
const PARTS = [
  ["masonry shell", "./parts/shell.mjs"],
  ["lead roofs", "./parts/roofs.mjs"],
  ["west front", "./parts/west.mjs"],
  ["chevet, south side and flyers", "./parts/chevet.mjs"],
  ["spire", "./parts/spire.mjs"],
  ["glass, light and grounds", "./parts/finish.mjs"],
];

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

// the ground: rock from y 0 up to the rock top of each plot cell
for (let x = 0; x < SITE_SIZE[0]; x++) for (let z = 0; z < SITE_SIZE[2]; z++) {
  const top = groundY(x, z);
  for (let y = 0; y <= top; y++) g.set(x, y, z, ROCK);
}

const list = [];
for (const [name, file] of PARTS) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${name}: ${file} not written yet, skipped`); continue; }
  const mod = await import(pathToFileURL(path).href);
  list.push([name, mod.build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });

// v2 fix round (owner): the west towers' belfry faces, string courses, buttresses and parapet; may replace cells.
const { fix: towersV2 } = await import("./parts/towers-v2.mjs");
towersV2(g);

g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
