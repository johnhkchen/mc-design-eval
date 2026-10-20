// The three museums on the north Mall (plan.md): the site grid, the ground, then every part in order.
//   node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, NMNH_PLOT, NMAH_PLOT, NMAAHC_PLOT, GRASS_BLOCK, SMOOTH_STONE } from "./vocab/base.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// The parts in build order (plan.md PARTS). A part whose file isn't written yet is skipped, not an error: the parts are
// built at the same time in separate copies, where the others are still stubs.
const PARTS = [
  ["NMNH shell", "parts/nmnh-shell.mjs"],
  ["NMAH shell and facade", "parts/nmah.mjs"],
  ["Roofs, dome and Corona", "parts/roofs-corona.mjs"],
  ["NMNH facade order", "parts/nmnh-facade.mjs"],
  ["Glazing, doors, lighting", "parts/glaze-light.mjs"],
  ["Grounds and steps", "parts/grounds.mjs"],
];

// Ground value g of a cell (plan.md SITE): the first building course sits at y = g, so the grass top is at g - 1.
// Plot 0 is 1, and 2 under the centre; plot 1 is 0 (nothing laid under it); plot 2 is a mound, 0 at the north edge
// rising to 3 at the south edge.
function groundValue(plot, x, z) {
  if (plot === NMNH_PLOT) return x >= 47 && x <= 67 && z >= 12 && z <= 42 ? 2 : 1;
  if (plot === NMAH_PLOT) return 0;
  return Math.min(3, Math.round((3 * z) / 26));
}

// Lay the ground before the parts: grass on top at the grade, stone under it down to y 0 (the footings start there).
// Only inside the three plots: the gaps between them stay air.
function layGround(g) {
  for (const plot of [NMNH_PLOT, NMAH_PLOT, NMAAHC_PLOT]) {
    for (let x = plot.x0; x <= plot.x1; x++) {
      for (let z = plot.z0; z <= plot.z1; z++) {
        const top = groundValue(plot, x, z) - 1;
        for (let y = 0; y < top; y++) g.set(x, y, z, SMOOTH_STONE);
        if (top >= 0) g.set(x, top, z, GRASS_BLOCK);
      }
    }
  }
}

const list = [];
for (const [name, module] of PARTS) {
  const file = join(here, module);
  const part = existsSync(file) ? await import(pathToFileURL(file).href) : null;
  if (typeof part?.build === "function") list.push([name, part.build]);
  else {
    console.log(`part ${name}: ${module} not written yet, skipped`);
    list.push([name, () => {}]);
  }
}

function buildWith(roof) {
  const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  layGround(g);
  runParts(g, list, { palette: join(here, "palette.json"), roof });
  return g;
}

// The roof finds the eave from the walls the shell has built. While the shell is still a stub there are none: build
// without the roof then (it is laid once the shell has walls); any other failure is a real one and stops the build.
let g;
try {
  g = buildWith(join(here, "roof.json"));
} catch (e) {
  if (!/detectEave: no walls found/.test(e.message)) throw e;
  console.log("roof: the shell has no walls yet, so the roof is not laid this time");
  g = buildWith(undefined);
}
g.save(out);
console.log(`saved ${out}`);
