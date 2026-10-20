// Crissy West build: lays the site ground, runs the six parts in plan.md order, saves the .nbt given as argv[2].
// Run from this directory (make.sh does): palette.json and roof.json are read from the working directory.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// the parts, in the order the plan builds them; a part whose file is not written yet is skipped with a note
const here = dirname(fileURLToPath(import.meta.url));
const PARTS = [
  ["shells plots 0-3", "parts/shell-a.mjs"],
  ["shells plots 4-9", "parts/shell-b.mjs"],
  ["roofs plots 0-3", "parts/roofs-a.mjs"],
  ["roofs plots 4-9 and cupola", "parts/roofs-b.mjs"],
  ["facade fittings", "parts/fittings.mjs"],
  ["grounds and light", "parts/grounds.mjs"],
];
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(join(here, module))) {
    console.log(`part ${name}: ${module} not written yet, skipped`);
    continue;
  }
  const part = await import(join(here, module));
  list.push([name, part.build]);
}

// the full site grid (1.21.1 data version: the server's), with the plot ground laid at y0
const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], SMOOTH_STONE);

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
