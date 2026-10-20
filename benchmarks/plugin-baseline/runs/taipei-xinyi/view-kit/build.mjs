// Builds the Six Giant Rocks viewpoint: lays the ground, then runs every part in plan order. Usage: node build.mjs <out.nbt>
import { runParts, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { PLOT, STONE } from "./vocab/base.mjs";

const PARTS = [
  ["hillside terrain", "parts/terrain.mjs"],
  ["six giant rocks", "parts/rocks.mjs"],
  ["viewing platform", "parts/platform.mjs"],
  ["trails, sign and lamps", "parts/trails.mjs"],
  ["planting and trees", "parts/planting.mjs"],
  ["dusk light pass", "parts/dusk.mjs"],
];

// A part whose module is missing or fails to import is a no-op here, so a copy with unfinished parts still builds
async function loadPart([name, file]) {
  try {
    const { build } = await import(`./${file}`);
    return [name, build ?? (() => {})];
  } catch (e) {
    console.log(`part ${name}: not loaded (${e.code ?? e.message.split("\n")[0]}); skipped`);
    return [name, () => {}];
  }
}

// The ground laid before the parts: a stone floor at y 0 across the plot. The terrain part fills each column above it.
function layGround(g) {
  g.fill([0, 0, 0], [PLOT[0] - 1, 0, PLOT[2] - 1], STONE);
}

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(1);
}
const g = new Grid(PLOT, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const part of PARTS) list.push(await loadPart(part));
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} blocks`);
