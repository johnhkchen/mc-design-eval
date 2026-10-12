// Assembles the sfvictorian build: lot-sized grid, ground, then every part in plan order (runParts locks earlier parts).
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as shell from "./parts/shell.mjs";
import * as roof from "./parts/roof.mjs";
import * as facade from "./parts/facade.mjs";
import * as street from "./parts/street.mjs";
import * as back from "./parts/back.mjs";
import * as finish from "./parts/finish.mjs";
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

// Lot x0..15, y0..20, z0..49 (plan.md SITE); y0 is the ground surface, the stand is y1.
const g = new Grid([16, 21, 50]);
g.fill([0, 0, 0], [15, 0, 49], "minecraft:grass_block");

runParts(g, [
  ["shell", shell.build],
  ["roof", roof.build],
  ["front facade", facade.build],
  ["street front", street.build],
  ["back and garden", back.build],
  ["doors and lights", finish.build],
  ["room: garage", room1.build],
  ["room: laundry & workshop", room2.build],
  ["room: entry hall", room3.build],
  ["room: front parlour", room4.build],
  ["room: dining room", room5.build],
  ["room: kitchen", room6.build],
  ["room: front bedroom", room7.build],
  ["room: sewing room", room8.build],
  ["room: upper hall", room9.build],
  ["room: bathroom", room10.build],
  ["room: back bedroom", room11.build],
  ["room: top-floor studio", room12.build],
  ["room: top landing", room13.build],
  ["room: attic bedroom", room14.build],
], { palette: "palette.json" });

g.save(out);
console.log(`saved ${out}`);
