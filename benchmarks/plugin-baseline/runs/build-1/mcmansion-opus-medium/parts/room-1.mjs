// Room 1: the foyer (plan.md ROOMS, box [13,2,10,20,8,17]). Grand double-height entry: chandelier over the centre
// (E22), a console table on the north-west wall, a seating pair of stairs
// by the office door, floor lanterns and a hanging lamp so no floor cell is dark, and a white carpet runner between
// the front door and the kitchen opening. The sweeping stair (x18..20 z11..15) and its foot (x17..20 z10..11) stay clear.
// Only air is written: every opening (front door x16..17, office x12 z15, dining x21 z13..14, kitchen z18) stays open.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DARK_OAK_PLANKS, QUARTZ_PILLAR, WHITE_CARPET, POTTED_FERN } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  chandelier(g);
  consoleTable(g);
  entryUrns(g);
  seating(g);
  floorLamps(g);
  runner(g);
}

/** Chandelier (E22): iron chain from the y9 ceiling at (16..17,8,12), hanging lanterns at y7. */
function chandelier(g) {
  for (const x of [16, 17]) {
    put(g, x, 8, 12, B.chain("y"));
    put(g, x, 7, 12, B.lantern(true));
  }
}

/** Console table on the north-west wall: dark oak planks legs under a bottom dark oak slab top, with a lantern-free top. */
function consoleTable(g) {
  for (const x of [13, 14]) {
    put(g, x, 2, 10, B.block(DARK_OAK_PLANKS));
    put(g, x, 3, 10, B.slab("dark_oak", "bottom"));
  }
}

/** Urns by the entry: a quartz pillar pedestal topped by a potted fern, one either side of the path to the stair. */
function entryUrns(g) {
  put(g, 15, 2, 10, B.pillar(QUARTZ_PILLAR, "y"));
  put(g, 15, 3, 10, B.block(POTTED_FERN));
  put(g, 20, 2, 16, B.pillar(QUARTZ_PILLAR, "y"));
  put(g, 20, 3, 16, B.block(POTTED_FERN));
}

/** Seating by the office door: two birch stair seats on the west wall, facing east into the room. */
function seating(g) {
  put(g, 13, 2, 12, B.stairs("birch", "east", "bottom"));
  put(g, 13, 2, 13, B.stairs("birch", "east", "bottom"));
}

/** Light: floor lanterns on fence posts (SW and SE corners) and a hanging lamp over the kitchen side. */
function floorLamps(g) {
  for (const [x, z] of [[13, 16], [20, 17], [17, 13]]) {
    put(g, x, 2, z, B.fence("dark_oak"));
    put(g, x, 3, z, B.lantern(false));
  }
  put(g, 14, 8, 16, B.chain("y"));
  put(g, 14, 7, 16, B.lantern(true));
}

/** White carpet runner on the floor from the front door down the centre to the kitchen opening (walkable). */
function runner(g) {
  for (let z = 12; z <= 16; z++) for (const x of [15, 16]) put(g, x, 2, z, B.block(WHITE_CARPET));
}
