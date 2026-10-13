// Builds the mill village row (plan.md) into the file named by argv[2]: lays the ground, then runs every part in order.
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_X, SITE_Z, Y_LOW, Y_HIGH, GROUND_Y, FILL_Y0, FILL_Y1, GRASS_BLOCK, COARSE_DIRT, ROOTED_DIRT, DIRT, STONE, rng } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as hearths from "./parts/hearths.mjs";
import * as yards from "./parts/yards.mjs";
import * as lane from "./parts/lane.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";

const out = process.argv[2] ?? "build.nbt";

// The grid takes plan.md's coordinates (y from Y_LOW, the well shaft, up to Y_HIGH); the toolkit's Grid refuses y < 0.
class SiteGrid extends Grid {
  inBounds(x, y, z) { return x >= 0 && x < SITE_X && y >= Y_LOW && y <= Y_HIGH && z >= 0 && z < SITE_Z; }
}
const g = new SiteGrid([SITE_X, Y_HIGH - Y_LOW + 1, SITE_Z]);

// Ground: solid fill (stone at y -2, dirt at y -1) and the surface at y 0 (grass 60%, coarse dirt 25%, rooted dirt 15%).
const pick = rng(96);
for (let x = 0; x < SITE_X; x++) for (let z = 0; z < SITE_Z; z++) {
  g.set(x, FILL_Y0, z, STONE);
  g.set(x, FILL_Y1, z, DIRT);
  const r = pick();
  g.set(x, GROUND_Y, z, r < 0.6 ? GRASS_BLOCK : r < 0.85 ? COARSE_DIRT : ROOTED_DIRT);
}

// Parts, in plan.md order. Rooms come last: each furnishes inside its own box.
runParts(g, [
  ["Shell", shell.build],
  ["Roofs", roofs.build],
  ["Fittings", fittings.build],
  ["Hearths", hearths.build],
  ["Yards", yards.build],
  ["Lane and lights", lane.build],
  ["room: P0 front room", room1.build],
  ["room: P0 back room", room2.build],
  ["room: P1 west flat", room3.build],
  ["room: P1 east flat", room4.build],
  ["room: P2 hall", room5.build],
  ["room: P2 parlour", room6.build],
  ["room: P3 front room", room7.build],
  ["room: P3 back room", room8.build],
  ["room: Coop nest room", room9.build],
  ["room: Store sales floor", room10.build],
  ["room: Store counter and stock", room11.build],
], { palette: "palette.json", roof: "roof.json" });

// The file stores y - Y_LOW, so every position is >= 0 (plan y 0 is file y 3). Same cells, shifted copy.
const file = new Grid([SITE_X, Y_HIGH - Y_LOW + 1, SITE_Z], { dataVersion: g.dataVersion });
for (const c of g) file.set(c.pos[0], c.pos[1] - Y_LOW, c.pos[2], c.block, c.state, c.nbt);
file.save(out);
console.log(JSON.stringify({ saved: out, yOffset: -Y_LOW }));
