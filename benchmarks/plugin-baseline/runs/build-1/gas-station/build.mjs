// Builds build.nbt from scratch: the lot's ground, then every part in plan order (runParts locks each part's blocks).
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as canopy from "./parts/canopy.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as forecourt from "./parts/forecourt.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(1);
}

const PARTS = [
  ["Store shell", shell.build],
  ["Roofs", roofs.build],
  ["Fuel canopy and pumps", canopy.build],
  ["Openings and signs", fittings.build],
  ["Site and grounds", grounds.build],
  ["Forecourt fittings", forecourt.build],
  ["room: Sales floor", room1.build],
  ["room: Restroom A", room2.build],
  ["room: Restroom B", room3.build],
  ["room: Hall", room4.build],
  ["room: Stock room", room5.build],
];

function buildWith(roof) {
  const g = new Grid(SITE_SIZE);
  g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], "grass_block");
  runParts(g, PARTS, { palette: "palette.json", roof });
  return g;
}

// The roof is laid on the shell's walls. Until the shell has walls (the stubs), there is nothing to roof: build without it.
let g;
try {
  g = buildWith("roof.json");
} catch (e) {
  if (!/no walls found/.test(e.message)) throw e;
  console.log(`roof: skipped, ${e.message} (the shell has no walls yet)`);
  g = buildWith(undefined);
}

g.save(out);
console.log(`saved ${out}`);
