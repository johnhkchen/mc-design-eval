// Lumber Hall: the scaffold. Lays the podium, then runs every part in plan order (runParts locks what each part built).
// Usage: node build.mjs <out.nbt>   (make.sh calls it with a temp file)
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, COBBLESTONE } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as frame from "./parts/frame.mjs";
import * as roof from "./parts/roof.mjs";
import * as shops from "./parts/shops.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as grounds from "./parts/grounds.mjs";
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
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

const g = new Grid(SITE.size);
// the podium: solid ground y 0..4 over the whole plot (sockets' boxes and pits are dug out by runParts)
g.fill([SITE.x0, 0, SITE.z0], [SITE.x1, 4, SITE.z1], COBBLESTONE);

runParts(g, [
  ["Shell and floors", shell.build],
  ["Stairs and ladders", stairs.build, { carve: true }],
  ["Timber frame", frame.build],
  ["Slate roof", roof.build],
  ["Shopfronts", shops.build],
  ["Windows, doors and fittings", fittings.build],
  ["Grounds and lights", grounds.build],
  ["room: Lobby", room1.build],
  ["room: Stair hall", room2.build],
  ["room: Counting room", room3.build],
  ["room: Pocket A1", room4.build],
  ["room: Pocket A2", room5.build],
  ["room: Pocket A3", room6.build],
  ["room: Pocket B1", room7.build],
  ["room: Pocket B2", room8.build],
  ["room: Pocket B3", room9.build],
  ["room: Cart passage", room10.build],
  ["room: North store", room11.build],
  ["room: Keepers' gallery", room12.build],
  ["room: South store", room13.build],
  ["room: Loft", room14.build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
