// Part: Chimneys, stacks and fires (plan.md item 4, 5, 17, 18, 19; elements.md). The cook fieldstone stack (x=19..20,
// z=12..13) with its mess hearth in the bunkhouse east wall, the red-brick boiler stack (x=36..37, z=17..18) over its
// firebox, and the saw-filing bench in the mill. Each stack's cap is laid over the whole top of its shaft, not just the
// ring around it: the shaft's top course is solid under the cap, so nothing hangs in the air.
import { fieldstoneStack, hearthMouth, brickStack, boilerFirebox, filingBench } from "../vocab.mjs";

const COBBLE_SLAB = { type: "bottom", waterlogged: "false" };
const BRICK_SLAB = { type: "bottom", waterlogged: "false" };

/** Caps the air cells of the box x0..x1 by z0..z1 at height y with `block` slabs, except the flue cells in `keep`. */
function capSlabs(g, block, state, x0, z0, x1, z1, y, keep = []) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (keep.some(([kx, kz]) => kx === x && kz === z)) continue;
    if (g.isAir(x, y, z)) { g.set(x, y, z, block, state); n++; }
  }
  return n;
}

export function build(g) {
  // Cook stack: 2x2 fieldstone shaft to y=16, stone band at y=15, lit campfire at (20,16,13), cap ring at y=17.
  fieldstoneStack(g, 19, 12, 16, 15);
  // The helper's ring leaves the shaft top (19..20, 12..13) open, so the cap there rests on nothing. Cap the
  // three stack cells over solid top course; the flue cell (20,17,13) stays air over the campfire.
  capSlabs(g, "cobblestone_slab", COBBLE_SLAB, 18, 11, 21, 14, 17, [[20, 13]]);

  // Mess hearth: firebox in the east wall (18,2..3,12..13), lit campfire and smoker, stone lintel at y=4.
  hearthMouth(g, 18, 2, 12, "west");

  // Boiler firebox first, so the shaft starts at y=1 only in the other cells (the brick helper writes air only).
  boilerFirebox(g, 36, 17);
  // Red-brick boiler stack: 2x2 bricks to y=18, band at y=17 with the hay cell, signal campfire at (37,18,18).
  brickStack(g, 36, 17, 18, 17);
  // Cap ring at y=19 plus the shaft top, except the flue cell (37,19,18) over the signal fire.
  capSlabs(g, "brick_slab", BRICK_SLAB, 35, 16, 38, 19, 19, [[37, 18]]);

  // Saw-filing bench in the mill's east bay: barrel (33,1,17), grindstone (34,1,18), chest (33,1,19).
  filingBench(g, 33, 17);
}
