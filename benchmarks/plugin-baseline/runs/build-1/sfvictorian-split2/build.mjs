// Builds the sfvictorian house from its parts: the ground first, then every part in plan.md's order.
// Usage: node build.mjs <out.nbt>   (make.sh runs this, then the roof step, then moves the result to build.nbt)
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { build as shell } from "./parts/shell.mjs";
import { build as stairs } from "./parts/stairs.mjs";
import { build as roof } from "./parts/roof.mjs";
import { build as facade } from "./parts/facade.mjs";
import { build as openings } from "./parts/openings.mjs";
import { build as site } from "./parts/site.mjs";
import { build as room1 } from "./parts/room-1.mjs";
import { build as room2 } from "./parts/room-2.mjs";
import { build as room3 } from "./parts/room-3.mjs";
import { build as room4 } from "./parts/room-4.mjs";
import { build as room5 } from "./parts/room-5.mjs";
import { build as room6 } from "./parts/room-6.mjs";
import { build as room7 } from "./parts/room-7.mjs";
import { build as room8 } from "./parts/room-8.mjs";
import { build as room9 } from "./parts/room-9.mjs";
import { build as room10 } from "./parts/room-10.mjs";
import { build as room11 } from "./parts/room-11.mjs";
import { build as room12 } from "./parts/room-12.mjs";
import { build as room13 } from "./parts/room-13.mjs";
import { build as room14 } from "./parts/room-14.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(1); }

// Lot x0..15, y0..20, z0..49 (plan.md SITE). The ground surface is y0; the parts stand on it.
const g = new Grid([16, 21, 50]);
g.fill([0, 0, 0], [15, 0, 49], "minecraft:coarse_dirt");

// Parts add into air in this order; runParts locks each part's cells against the ones after it.
runParts(g, [
  ["Shell and floors", shell],
  ["Stairs and partitions", stairs],
  ["Roof", roof],
  ["Front facade", facade],
  ["Openings", openings],
  ["Site", site],
  ["room: Garage", room1],
  ["room: Cellar workshop", room2],
  ["room: Laundry and store", room3],
  ["room: Front porch", room4],
  ["room: Entry hall", room5],
  ["room: Front parlour", room6],
  ["room: Dining room", room7],
  ["room: Kitchen", room8],
  ["room: Front bedroom", room9],
  ["room: Upper landing", room10],
  ["room: Study and nursery", room11],
  ["room: Back bedroom", room12],
  ["room: Bathroom", room13],
  ["room: Top room under the roof", room14],
], { palette: "palette.json" });

g.save(out);
console.log(`saved ${out}`);
