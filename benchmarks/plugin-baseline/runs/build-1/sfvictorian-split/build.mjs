// Site build: the full lot grid, the grade, then every part in plan order (each part only adds; see runParts).
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as shell from "./parts/shell.mjs";
import * as front from "./parts/front.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as openings from "./parts/openings.mjs";
import * as ornament from "./parts/ornament.mjs";
import * as site from "./parts/site.mjs";
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

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(1); }

// x 0..15 street to party walls, y 0..21 (chimney pots at y21), z 0..49 lot line to back fence
const g = new Grid([16, 22, 50]);

// the grade: one grass layer over the lot; parts may replace it (it is set before runParts)
g.fill([0, 0, 0], [15, 0, 49], "minecraft:grass_block");

runParts(g, [
  ["shell and floors", shell.build],
  ["plinth, bay, porch, stoop", front.build],
  ["roof deck and rooflines", roofs.build],
  ["glazing and window dressing", openings.build],
  ["ornament", ornament.build],
  ["site and gardens", site.build],
  ["room: Garage", room1.build],
  ["room: Laundry and workshop", room2.build],
  ["room: Cellar store", room3.build],
  ["room: Cellar stair", room4.build],
  ["room: Entry hall", room5.build],
  ["room: Front parlour", room6.build],
  ["room: Parlour bay", room7.build],
  ["room: Dining room", room8.build],
  ["room: Kitchen", room9.build],
  ["room: Front bedroom", room10.build],
  ["room: Bedroom bay", room11.build],
  ["room: Study", room12.build],
  ["room: Upstairs landing", room13.build],
  ["room: Bathroom", room14.build],
  ["room: Back bedroom", room15.build],
  ["room: Top room", room16.build],
  ["room: Top bay", room17.build],
  ["room: Box room", room18.build],
], { palette: "palette.json" });

console.log(`# saved ${g.save(out)}`);
