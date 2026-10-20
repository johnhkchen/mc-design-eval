// Builds the whole site (argv[2] = output .nbt): the grid, the ground, then the six parts in plan.md's order.
// Parts write plot-local coordinates (plan.md); the views here move them into the grid (margin; plot 1 by PLOT1_X).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { GRID, PLOT0, PLOT1, ANDESITE, groundTop, onFootprint, onPlot1, withMargin } from "./vocab/base.mjs";

// plan.md's PARTS, in build order: [name, module, plot] (plot "both" writes its own plots' coordinates).
const PARTS = [
  ["Nan Shan tower shell", "parts/nanshan-shell.mjs", 0],
  ["Breeze podium", "parts/breeze-podium.mjs", 0],
  ["Sky Tower shell", "parts/sky-shell.mjs", 1],
  ["Nan Shan crown", "parts/nanshan-crown.mjs", 0],
  ["Sky Tower crown", "parts/sky-crown.mjs", 1],
  ["Lights and grounds", "parts/lights-grounds.mjs", "both"],
];

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// A part whose module isn't written yet (another copy is still working) is left empty, not an error.
async function loadPart(module) {
  const path = fileURLToPath(new URL(module, import.meta.url));
  if (!existsSync(path)) { console.warn(`${module}: not written yet, part left empty`); return () => {}; }
  const mod = await import(path);
  return typeof mod.build === "function" ? mod.build : () => {};
}

// The ground: each footprint cell is solid polished andesite from y 0 up to its ground top (plinth to ground).
function layGround(g) {
  for (const plot of [PLOT0, PLOT1]) {
    const v = plot.id === 1 ? onPlot1(withMargin(g)) : withMargin(g);
    for (let z = 0; z < plot.d; z++) for (let x = 0; x < plot.w; x++) {
      const top = groundTop(plot.id, x, z);
      if (top == null || !onFootprint(plot.id, x, z)) continue;
      for (let y = 0; y <= top; y++) v.set(x, y, z, ANDESITE);
    }
  }
}

const g = new Grid(GRID, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, module, plot] of PARTS) {
  const build = await loadPart(module);
  // plot 1 parts get onPlot1 on top of the margin: their plot-local x is site x minus PLOT1_X
  list.push([name, plot === 1 ? (view) => build(onPlot1(withMargin(view))) : (view) => build(withMargin(view))]);
}
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
