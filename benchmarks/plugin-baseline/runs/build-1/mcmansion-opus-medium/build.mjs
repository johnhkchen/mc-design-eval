// Builds the McMansion from the bare ground: lay the lawn, run every part in plan order, save to the path in argv[2].
// Run through make.sh (which also runs the roof step); `node build.mjs <out.nbt>` alone skips the roof step.
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as entry from "./parts/entry.mjs";
import * as windows from "./parts/windows.mjs";
import * as site from "./parts/site.mjs";
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
import * as room15 from "./parts/room-15.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Site x0..43, y0..17, z0..31 (plan.md SITE). Grid version 26.3: the palette's ids (iron_chain) are 26.x names.
const g = new Grid([44, 18, 32], { dataVersion: DATA_VERSIONS["26.3"] });
g.fill([0, 0, 0], [43, 0, 31], "grass_block");

runParts(g, [
  ["shell", shell.build],
  ["roofs", roofs.build],
  ["entry and garage front", entry.build],
  ["windows and shutters", windows.build],
  ["site and deck", site.build],
  ["doors and finish", finish.build],
  ["room: foyer", room1.build],
  ["room: office", room2.build],
  ["room: dining room", room3.build],
  ["room: family room", room4.build],
  ["room: kitchen", room5.build],
  ["room: mudroom", room6.build],
  ["room: garage", room7.build],
  ["room: upper hall and gallery", room8.build],
  ["room: bedroom 2", room9.build],
  ["room: bedroom 3", room10.build],
  ["room: primary bedroom", room11.build],
  ["room: walk-in closet", room12.build],
  ["room: primary bathroom", room13.build],
  ["room: bedroom 4", room14.build],
  ["room: bonus room", room15.build],
], { palette: "palette.json" });

g.save(out);
console.log(`saved ${out}`);
