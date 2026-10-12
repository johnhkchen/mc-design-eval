// Builds the bakery: lays the bare site ground, then runs every part in order (each part only adds to earlier ones).
//   node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as oven from "./parts/oven.mjs";
import * as facade from "./parts/facade.mjs";
import * as yard from "./parts/yard.mjs";
import * as sides from "./parts/sides.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import {
  SITE_SIZE, LOT, GROUND_Y, STREET_Z, KERB_Z, SIDEWALK_Z,
  GRASS_BLOCK, GRAVEL, COBBLED_DEEPSLATE, COBBLESTONE,
} from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the bare site: grass lot, gravel street, cobbled kerb, cobblestone sidewalk (all at ground y)
const g = new Grid(SITE_SIZE);
for (let x = LOT.x0; x <= LOT.x1; x++) for (let z = LOT.z0; z <= LOT.z1; z++) {
  const block = z <= STREET_Z[1] ? GRAVEL : z === KERB_Z ? COBBLED_DEEPSLATE : z <= SIDEWALK_Z[1] ? COBBLESTONE : GRASS_BLOCK;
  g.set(x, GROUND_Y, z, block);
}

runParts(g, [
  ["Massing and shell", shell.build],
  ["Roofs", roofs.build],
  ["Oven and chimney", oven.build],
  ["Front facade dressing", facade.build],
  ["Yard and street furniture", yard.build],
  ["Sides, back and wing details", sides.build],
  ["room: shop (Verkaufsraum)", room1.build],
  ["room: Backstube (prep and proofing room)", room2.build],
  ["room: bakehouse (Backhaus)", room3.build],
  ["room: Stube (living room)", room4.build],
  ["room: Schlafkammer (bedroom)", room5.build],
  ["room: Mehlboden (flour loft)", room6.build],
], { palette: "palette.json" });

g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
