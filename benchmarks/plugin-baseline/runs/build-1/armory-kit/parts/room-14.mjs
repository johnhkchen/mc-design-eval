// Interior designer for "East aisle 4F" (room 14): the top-floor walkway east of the atrium. Inner air x88..101, y22..26,
// z36..131. Doorway from the north at x94..95 (the lane runs south from it, x92..97 kept clear). Two rows of reading
// nooks sit against the west (x89..91) and east (x98..100) walls, each a fence table with a top slab and a lantern on
// it, with a seat of stairs on each side. The focal nook sits just west of the doorway's sight line. Floor lanterns
// stand on the y21 floor at the wall cells every 8 z so the aisle reads as lit from the floor up.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FENCE = "oak_fence";
const TOP_SLAB = "smooth_quartz_slab";
const SEAT = "polished_andesite";

// one reading nook: a fence table at (tx, zb) with a top slab and a lantern on it, and a seat of stairs on each side
function nook(g, tx, zb, seatFacingA, seatFacingB, seatXa, seatXb) {
  g.set(tx, 22, zb, FENCE);
  g.set(tx, 23, zb, ...B.slab("smooth_quartz", "top"));
  g.set(tx, 24, zb, ...B.lantern(false));
  g.set(seatXa, 22, zb, ...B.stairs(SEAT, seatFacingA, "bottom", "straight"));
  g.set(seatXb, 22, zb, ...B.stairs(SEAT, seatFacingB, "bottom", "straight"));
}

export function build(g) {
  // the focal nook: a four-seat table on the west side, west of the doorway's sight line (table at x90, z44)
  const fz = 44;
  g.set(90, 22, fz, FENCE);
  g.set(90, 23, fz, ...B.slab("smooth_quartz", "top"));
  g.set(90, 24, fz, ...B.lantern(false));
  g.set(89, 22, fz, ...B.stairs(SEAT, "west", "bottom", "straight"));
  g.set(91, 22, fz, ...B.stairs(SEAT, "east", "bottom", "straight"));
  g.set(90, 22, fz - 1, ...B.stairs(SEAT, "north", "bottom", "straight"));
  g.set(90, 22, fz + 1, ...B.stairs(SEAT, "south", "bottom", "straight"));

  // west-wall nooks: table at x90, seats at x89 (back west) and x91 (back east)
  for (const zb of [56, 70, 84, 100, 114, 126]) {
    nook(g, 90, zb, "west", "east", 89, 91);
  }
  // east-wall nooks: table at x99, seats at x98 (back west) and x100 (back east)
  for (const zb of [62, 76, 90, 106, 120]) {
    nook(g, 99, zb, "west", "east", 98, 100);
  }

  // floor lanterns standing on the y21 floor at the wall cells, every 8 z, so every cell is inside 7 of a lamp
  for (let z = 38; z <= 130; z += 8) {
    g.set(88, 22, z, ...B.lantern(false));
    g.set(101, 22, z, ...B.lantern(false));
  }
}
