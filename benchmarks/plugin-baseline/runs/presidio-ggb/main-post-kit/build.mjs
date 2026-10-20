// Main Post build: makes the site grid, runs the six parts in plan.md order, saves the .nbt given as argv[2].
// Run from this directory (make.sh does): palette.json and roof.json are read from the working directory.
// The y0 ground is laid by the parts (plan.md SITE: groundCourse per plot), so the grid starts as air.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// the parts, in the order the plan builds them; a part whose file is not written yet is skipped with a note
const here = dirname(fileURLToPath(import.meta.url));
const PARTS = [
  ["Brick shells and pavilion", "parts/shells.mjs"],
  ["Officers' Club shell", "parts/club.mjs"],
  ["Roofs, dormers, chimneys", "parts/roofs.mjs"],
  ["Porches, ramps, banners", "parts/porches.mjs"],
  ["Glazing, doors, signs, cannons, flag", "parts/fittings.mjs"],
  ["Grounds and light", "parts/grounds.mjs"],
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

// the roof is fitted to the shell's walls (above y0), so it is laid only once the first part builds some; a stub
// shell (or a copy without one) has no walls to fit and the roof waits, instead of failing the build
const probe = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
if (list.length) list[0][1](probe);
const roof = [...probe].some((c) => c.pos[1] >= 1) ? "roof.json" : undefined;

// the full site grid (1.21.1 data version: the server's)
const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

runParts(g, list, { palette: "palette.json", roof });
g.save(out);
console.log(`saved ${out}`);
