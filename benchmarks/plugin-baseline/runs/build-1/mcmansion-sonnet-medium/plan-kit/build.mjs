// Assembles the McMansion: ground, then every part in plan order (shell, garage, roofs, facade, site, deck, rooms).
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, DATA_VERSION } from "./vocab.mjs";
import * as mainShell from "./parts/main-shell.mjs";
import * as garageShell from "./parts/garage-shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as facade from "./parts/facade.mjs";
import * as frontSite from "./parts/front-site.mjs";
import * as backYard from "./parts/back-yard.mjs";
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

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSION });
g.fill([0, 0, 0], [43, 0, 31], "grass_block");

runParts(g, [
  ["main shell", mainShell.build],
  ["garage shell", garageShell.build],
  ["roofs and chimney", roofs.build],
  ["facade", facade.build],
  ["front site", frontSite.build],
  ["back deck and yard", backYard.build],
  ["room: Foyer", room1.build],
  ["room: Home office", room2.build],
  ["room: Formal dining room", room3.build],
  ["room: Kitchen and great room", room4.build],
  ["room: Family room", room5.build],
  ["room: Bay nook", room6.build],
  ["room: Mudroom and laundry", room7.build],
  ["room: Garage", room8.build],
  ["room: Gallery landing", room9.build],
  ["room: West passage", room10.build],
  ["room: East passage", room11.build],
  ["room: Bedroom 2", room12.build],
  ["room: Bedroom 3", room13.build],
  ["room: Bedroom 4", room14.build],
  ["room: Primary bedroom", room15.build],
  ["room: Primary sitting nook", room16.build],
  ["room: Primary bath", room17.build],
  ["room: Walk-in closet", room18.build],
  ["room: Bonus room", room19.build],
], { palette: "palette.json" });

g.save(out);
console.log(`saved ${out}`);
