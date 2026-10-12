// Builds the McMansion from its parts, in plan order. Usage: node build.mjs <out.nbt>   (make.sh runs it for you)
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SIZE, DATA_VERSION } from "./vocab.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as front from "./parts/front.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as rear from "./parts/rear.mjs";
import * as stair from "./parts/stair.mjs";
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
import * as room15 from "./parts/room-15.mjs";
import * as room16 from "./parts/room-16.mjs";
import * as room17 from "./parts/room-17.mjs";
import * as room18 from "./parts/room-18.mjs";
import * as room19 from "./parts/room-19.mjs";
import * as room20 from "./parts/room-20.mjs";
import * as room21 from "./parts/room-21.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

const g = new Grid(SIZE, { dataVersion: DATA_VERSION });
g.fill([0, 0, 0], [SIZE[0] - 1, 0, SIZE[2] - 1], "grass_block");   // the bare ground: lawn at y0 everywhere

runParts(g, [
  ["McMansion shell", shell.build],
  ["Roofs", roofs.build],
  ["Front elevation", front.build],
  ["Grounds", grounds.build],
  ["Sides, rear and deck", rear.build],
  ["Foyer stair and chandelier", stair.build],
  ["room: Foyer (double height)", room1.build],
  ["room: Foyer hall", room2.build],
  ["room: Home office", room3.build],
  ["room: Formal dining room", room4.build],
  ["room: Dining bay (turret)", room5.build],
  ["room: Kitchen (open plan)", room6.build],
  ["room: Family room", room7.build],
  ["room: Mudroom", room8.build],
  ["room: Garage (3 cars)", room9.build],
  ["room: Upper hall / gallery", room10.build],
  ["room: Bedroom 2", room11.build],
  ["room: Bedroom 3", room12.build],
  ["room: Bedroom 3 bay (turret)", room13.build],
  ["room: Corridor W", room14.build],
  ["room: Corridor E", room15.build],
  ["room: Bedroom 4", room16.build],
  ["room: Hall bathroom", room17.build],
  ["room: Bonus room (over the garage)", room18.build],
  ["room: Primary bedroom", room19.build],
  ["room: Walk-in closet", room20.build],
  ["room: Primary bath", room21.build],
], { palette: "palette.json" });

g.save(out);
console.log(`saved ${out}`);
