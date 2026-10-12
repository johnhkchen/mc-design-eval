// Chimneys and hearths (P5): the east house stack with the kitchen firebox, and the workshop rendering-hearth stack with
// its signal fire and firebox. Order matters: each firebox goes in first (its campfires and mouth-to-stack air), then the
// stack fills the rest of its 2x2 column (chimneyStack writes only into air, so it skips the campfires), then the cells
// the firebox keeps air (its back row between floor and lintel) are cleared again and the floor is laid as stone.
import { chimneyStack, firebox, STONE_BRICKS } from "../vocab.mjs";

export function build(g) {
  // East stack: the house hearth, x 18..19, z 11..12, rising through the roof's keep box to y=19.
  firebox(g, 17, 2, 11, "x");                      // mouth x=17 in the east wall, back row x=18, lintel y=4
  chimneyStack(g, 18, 11, 18, 16);                 // bricks y1..18, deepslate band y=16, slab cap y=19, campfire (19,19,12)
  for (const z of [11, 12]) {
    g.set(18, 3, z, "air", {});                    // the firebox keeps its back cells air between floor and lintel
    g.set(18, 1, z, ...STONE_BRICKS_BLOCK());      // the stone floor of the firebox
  }

  // Workshop stack: the rendering hearth, x 8..9, z 28..29, through the workshop roof's keep box to a signal fire.
  firebox(g, 8, 2, 27, "z");                       // mouth z=27 in the south gable, back row z=28, lintel y=4
  chimneyStack(g, 8, 28, 12, 11, { hay: true, corner: [8, 29] });  // band y=11, hay (8,12,29), campfire (8,13,29)
  g.set(8, 13, 29, "campfire", { facing: "north", lit: "true", signal_fire: "true" });
  for (const x of [8, 9]) {
    g.set(x, 3, 28, "air", {});
    g.set(x, 1, 28, ...STONE_BRICKS_BLOCK());
  }
}

// The stone floor block as a [block, state] pair for g.set (the stone_bricks id from the palette).
function STONE_BRICKS_BLOCK() {
  return [STONE_BRICKS, {}];
}
