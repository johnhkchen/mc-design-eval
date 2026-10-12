// Upper landing (2nd floor, box [11,9,15,13,11,23]): the stair-head passage. The up-stair (P2) fills x12..13 z17..19,
// so the walking line is the x11 column from the bedroom door (z15) to the study door (z20) and on to the bathroom
// door (x12 z24). Furniture: a runner down the passage, a dark_oak console against the party wall (x13 z21..22) as the
// focal piece, a standing lantern and a potted fern on it, and hanging lanterns along the passage ceiling.
// Builds only into air: the stair, doors and partitions are earlier parts and stay locked.
import { desk, POTTED_FERN, RED_CARPET } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Writes one block only where the cell is still air (an earlier part's cell is never overwritten).
function put(g, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) return;
  g.set(x, y, z, block, state);
}

export function build(g) {
  // Runner: carpet down the passage (x11, z16..23) and along the bathroom approach (x12, z20..23). Carpets are walkable.
  for (let z = 16; z <= 23; z++) put(g, 11, 9, z, RED_CARPET);
  for (let z = 20; z <= 23; z++) put(g, 12, 9, z, RED_CARPET);

  // Console table against the party wall: dark_oak fence legs at z21 and z22, dark_oak_slab top at y10.
  if (g.isAir(13, 9, 21) && g.isAir(13, 9, 22) && g.isAir(13, 10, 21) && g.isAir(13, 10, 22)) {
    desk(g, 13, 9, 21, 2, "z");
  }
  // On the console: a standing lantern (the brightest light, the focal point) and a potted fern.
  put(g, 13, 11, 21, ...B.lantern(false));
  put(g, 13, 11, 22, POTTED_FERN);

  // Hanging lanterns along the passage ceiling (the top floor's floor at y12 is the hook). Light the path end to end.
  put(g, 11, 11, 16, ...B.lantern(true));
  put(g, 11, 11, 19, ...B.lantern(true));
  put(g, 11, 11, 22, ...B.lantern(true));
  // A second hanging lantern over the floor beside the console: the brightest floor cell sits by the focal piece.
  put(g, 12, 11, 21, ...B.lantern(true));
}
