// MarketFront and the Hillclimb Landing: one grid in site coordinates (see vocab/base.mjs), the ground under each plot's
// footprint, then every part in plan.md order. Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file)
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import {
  SITE_SIZE, PLOT0, PLOT1, PLOT0_SIZE, PLOT1_SIZE, onFootprint, groundAt, GRASS_BLOCK,
} from "./vocab/base.mjs";

// the terrain under the buildings: not a palette block (no part builds with it), so it is not checked against palette.json
const DIRT = "dirt";

const PARTS = [
  ["Shell and massing", "parts/shell0.mjs"],
  ["Hillclimb landing", "parts/plot1.mjs"],
  ["Towers and stairs", "parts/towers.mjs"],
  ["Facades and fittings", "parts/facades.mjs"],
  ["Plaza and grounds", "parts/plaza.mjs"],
  ["Dusk lighting and signs", "parts/dusk.mjs"],
];

// The ground: under each footprint cell with ground above y 0, solid dirt up to a grass surface at the ground height.
// Laid before the parts, so no part is locked out of it; each part footings down to it and fills its own plinth.
function layGround(g) {
  let cells = 0;
  for (const [plot, origin, size] of [[0, PLOT0, PLOT0_SIZE], [1, PLOT1, PLOT1_SIZE]]) {
    for (let lx = 0; lx < size.x; lx++) for (let lz = 0; lz < size.z; lz++) {
      if (!onFootprint(plot, lx, lz)) continue;
      const h = groundAt(plot, lx, lz), x = origin[0] + lx, z = origin[2] + lz;
      for (let y = 0; y < h; y++) { g.set(x, y, z, y === h - 1 ? GRASS_BLOCK : DIRT); cells++; }
    }
  }
  return cells;
}

// A part that does not load (its file is missing, or it imports a helper not written yet) is left out, not fatal:
// the stub stands in and the report says so. A part that loads and throws while building still fails the run.
async function loadPart(name, file, log) {
  try {
    const mod = await import(new URL(file, import.meta.url));
    if (typeof mod.build === "function") return mod.build;
    log(`part ${name}: SKIPPED (${file} exports no build())`);
  } catch (e) {
    log(`part ${name}: SKIPPED (${file} did not load: ${String(e.message).split("\n")[0]})`);
  }
  return () => {};
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const list = [];
for (const [name, file] of PARTS) list.push([name, await loadPart(name, file, console.log)]);

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
console.log(`ground: ${layGround(g)} cells under the footprints`);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} blocks in a ${SITE_SIZE.join(" x ")} grid`);
