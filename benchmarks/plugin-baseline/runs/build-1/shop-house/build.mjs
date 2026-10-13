// SPDX-License-Identifier: AGPL-3.0-or-later
// The shop house: the full lot, the bare ground, then every part in order. Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, LOT, DIRT, STONE, ANDESITE, POLISHED_ANDESITE, SMOOTH_STONE, GRASS } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as roof from "./parts/roof.mjs";
import * as joinery from "./parts/joinery.mjs";
import * as shopfront from "./parts/shopfront.mjs";
import * as hearth from "./parts/hearth.mjs";
import * as garden from "./parts/garden.mjs";
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
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(1); }

/** The bare site (plan.md SITE): stone and dirt fill, the road, kerb, pavement and lot surface. Sockets are dug out later. */
function layGround(g) {
  const { x0, x1, z0, z1 } = LOT;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      // road (z 0..2): andesite at y 4 on dirt; lot (z 3..38): dirt fill to y 4
      for (let y = 0; y <= 2; y++) g.set(x, y, z, STONE);
      if (z <= 2) { g.set(x, 3, z, DIRT); g.set(x, 4, z, ANDESITE); }
      else { g.set(x, 3, z, DIRT); g.set(x, 4, z, DIRT); }
    }
    g.set(x, 5, 3, POLISHED_ANDESITE);                                   // kerb
    for (let z = 4; z <= 5; z++) g.set(x, 5, z, SMOOTH_STONE);           // pavement
    for (let z = 6; z <= z1; z++) g.set(x, 5, z, GRASS);                 // lot surface
  }
}

const g = new Grid(SITE_SIZE);
layGround(g);

runParts(g, [
  ["Masonry shell", shell.build],
  ["Roofs", roof.build],
  ["Stairs, glazing and doors", joinery.build, { carve: true }],
  ["Shopfront", shopfront.build],
  ["Chimneys, hearths and lights", hearth.build],
  ["Grounds and garden", garden.build],
  ["room: Lobby stair hall", room1.build],
  ["room: Keeper's aisle", room2.build],
  ["room: Wing kitchen and scullery", room3.build],
  ["room: First-floor stair hall", room4.build],
  ["room: Living room", room5.build],
  ["room: Dining room", room6.build],
  ["room: Wing sitting room", room7.build],
  ["room: Second-floor hall", room8.build],
  ["room: Parents' bedroom", room9.build],
  ["room: Upper corridor", room10.build],
  ["room: Child's room A", room11.build],
  ["room: Child's room B", room12.build],
  ["room: Bathroom", room13.build],
  ["room: Loft", room14.build],
], { palette: "palette.json", roof: "roof.json" });

roof.finish(g);                                                          // gable trim to the ridge, no stair on a bottom slab
g.save(out);
console.log(`saved ${out}`);
