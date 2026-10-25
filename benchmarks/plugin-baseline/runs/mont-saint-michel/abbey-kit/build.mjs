// Builds the whole abbey (argv[2] = output .nbt): the grid, the rock, then the six parts in plan.md's order.
// Parts write plot-local coordinates (plan.md), so they go straight into the grid with no offset.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { finish } from "./parts/finish.mjs";
import { GRID, STONE, groundTop, onFootprint } from "./vocab/base.mjs";

// plan.md's PARTS, in build order: [name, module]. Each module exports build(g) for its part's cells.
const PARTS = [
  ["Rock and granite shell", "parts/shell.mjs"],
  ["Slate roofs", "parts/roofs.mjs"],
  ["Spire and archangel", "parts/spire.mjs"],
  ["Flamboyant choir", "parts/choir.mjs"],
  ["Windows, doors, cloister", "parts/fittings.mjs"],
  ["Chimneys, lights, grounds", "parts/grounds.mjs"],
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

// The rock: each footprint cell is solid stone from y 0 up to its ground value g (rock fills y < g).
function layRock(g) {
  for (let z = 0; z < GRID[2]; z++) for (let x = 0; x < GRID[0]; x++) {
    if (!onFootprint(x, z)) continue;
    const top = groundTop(x, z) ?? 0;
    for (let y = 0; y < top; y++) g.set(x, y, z, STONE);
  }
}

const g = new Grid(GRID, { dataVersion: DATA_VERSIONS["1.21.1"] });
layRock(g);
const list = [];
for (const [name, module] of PARTS) list.push([name, await loadPart(module)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
finish(g); // the owner's v2 comment: granite mix, rock base, buttresses and Flamboyant details
g.save(out);
console.log(`saved ${out}`);
