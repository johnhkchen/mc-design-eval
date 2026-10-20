// Builds the Golden Gate south kit (Fort Point and the bridge's south end) from its parts, in plan order. Each part
// writes plan.md's local coordinates; plot 0 (Fort Point) is shifted into the grid by PLOT0_ORIGIN. runParts lets each
// part only ADD into air (writes into an earlier part's cells are refused and reported) and reports off-palette blocks.
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, PLOT0, PLOT0_ORIGIN, PLOT1_ORIGIN, SMOOTH_STONE } from "./vocab/base.mjs";
import * as fortShell from "./parts/fort-shell.mjs";
import * as fortTop from "./parts/fort-top.mjs";
import * as concrete from "./parts/concrete.mjs";
import * as deck from "./parts/deck.mjs";
import * as arch from "./parts/arch.mjs";
import * as approach from "./parts/approach.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// A part's view of one plot: its local (x, y, z) are shifted by the plot's grid origin before they reach the grid.
function plotView(g, [ox, oy, oz]) {
  const at = (x, y, z) => [x + ox, y + oy, z + oz];
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, ...rest) => { target.set(...at(x, y, z), ...rest); return view; };
      if (prop === "unset") return (x, y, z) => { target.unset(...at(x, y, z)); return view; };
      if (prop === "get" || prop === "blockAt" || prop === "isAir" || prop === "inBounds") return (x, y, z) => target[prop](...at(x, y, z));
      if (prop === "fill") return (a, b, block, state) => { target.fill(at(...a), at(...b), block, state); return view; };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

// one grid for the whole site: no water, no ground outside plot 0; y 0 of plot 0 is the ground course
const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
for (let x = PLOT0.x[0]; x <= PLOT0.x[1]; x++) for (let z = PLOT0.z[0]; z <= PLOT0.z[1]; z++) g.set(x + PLOT0_ORIGIN[0], PLOT0.y[0] + PLOT0_ORIGIN[1], z + PLOT0_ORIGIN[2], SMOOTH_STONE);

runParts(
  g,
  [
    ["fort shell", (v) => fortShell.build(plotView(v, PLOT0_ORIGIN))],
    ["fort towers and grounds", (v) => fortTop.build(plotView(v, PLOT0_ORIGIN))],
    ["pylons and anchorage", (v) => concrete.build(plotView(v, PLOT1_ORIGIN))],
    ["deck and truss", (v) => deck.build(plotView(v, PLOT1_ORIGIN))],
    ["arch and cables", (v) => arch.build(plotView(v, PLOT1_ORIGIN))],
    ["approach and lighting", (v) => approach.build(plotView(v, PLOT1_ORIGIN))],
  ],
  { palette: "palette.json", roof: "roof.json" },
);

g.save(out);
console.log(`saved ${out}`);
