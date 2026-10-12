// build.mjs: the suburban McMansion. Lays the lot, then runs every part in plan order (each part may only add into air).
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SIZE } from "./vocab.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as facade from "./parts/facade.mjs";
import * as entry from "./parts/entry-garage.mjs";
import * as site from "./parts/site.mjs";
import * as details from "./parts/details.mjs";
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

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

const g = new Grid(SIZE, { dataVersion: 5023 });   // 26.3 data version; x 0..43, y 0..14, z 0..31

// The ground: lawn top at y0 over the whole lot. Parts may replace it (driveway, garage floor, plinth).
g.fill([0, 0, 0], [43, 0, 31], "grass_block");

runParts(g, [
  ["Shell and massing", shell.build],
  ["Roofs", roofs.build],
  ["Facade", facade.build],
  ["Entry, garage doors and bay", entry.build],
  ["Site", site.build],
  ["Chimney, dormers and details", details.build],
  ["room: Foyer", room1.build],
  ["room: Under-gallery hall", room2.build],
  ["room: Home office", room3.build],
  ["room: Mudroom", room4.build],
  ["room: Pantry and laundry", room5.build],
  ["room: Formal dining room", room6.build],
  ["room: Great room: kitchen and family room", room7.build],
  ["room: Three-car garage", room8.build],
  ["room: Upper hall and gallery", room9.build],
  ["room: Bedroom 3", room10.build],
  ["room: Bedroom 4", room11.build],
  ["room: Bedroom 2", room12.build],
  ["room: Primary bedroom", room13.build],
  ["room: Walk-in closet", room14.build],
  ["room: Primary bathroom", room15.build],
  ["room: Bonus room over the garage", room16.build],
], { palette: new URL("./palette.json", import.meta.url).pathname, report: new URL("./parts-report.json", import.meta.url).pathname });

g.save(out);
console.log(`saved ${out}: ${g.solids().length} blocks`);
