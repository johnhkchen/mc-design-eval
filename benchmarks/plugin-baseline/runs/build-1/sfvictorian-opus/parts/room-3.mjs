// Room: entry hall (interior designer), inner air box [11,5,11,13,7,24].
// Grand but narrow: a red runner down the middle (x12) keeps x11..12 as the walking path. Furniture lives on the
// east strip x13: hall tree and lantern by the front door, a console with a mirror on the party wall (the focal
// piece, lit by the hall lamp at (12,6,22)), a lantern post and an umbrella stand at the kitchen end.
// plan.md: nothing on x13 z12..20 except the stair (E20), so the stair run and its well stay clear. Only air is written.
import { DARK_OAK_FENCE, RED_CARPET, SPRUCE_SLAB, GLASS_PANE, CAULDRON, LANTERN } from "../vocab.mjs";

const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
// Add into air only; a cell another part owns is skipped, never overwritten.
function put(g, x, y, z, block, state = {}) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

export function build(g) {
  // Red runner down the middle of the hall, from the front door to the kitchen door.
  for (let z = 11; z <= 24; z++) put(g, 12, 5, z, RED_CARPET);

  // Hall tree by the front door: a two-post coat stand with a lantern on top.
  put(g, 13, 5, 11, DARK_OAK_FENCE);
  put(g, 13, 6, 11, DARK_OAK_FENCE);
  put(g, 13, 7, 11, LANTERN, { hanging: "false" });

  // Focal piece: console with a mirror on the party wall. Posts at y5, spruce slab top at y6, glass mirror at y7.
  // Sits beside the hall lamp at (12,6,22), so it is the brightest spot in the hall.
  for (let z = 21; z <= 22; z++) {
    put(g, 13, 5, z, DARK_OAK_FENCE);
    put(g, 13, 6, z, SPRUCE_SLAB, { type: "bottom" });
    put(g, 13, 7, z, GLASS_PANE, {
      east: "true",
      west: "false",
      north: z > 21 ? "true" : "false",
      south: z < 22 ? "true" : "false",
    });
  }

  // Lantern post by the kitchen end of the hall.
  put(g, 13, 5, 23, DARK_OAK_FENCE);
  put(g, 13, 6, 23, LANTERN, { hanging: "false" });

  // Umbrella stand: a cauldron at the kitchen end.
  put(g, 13, 5, 24, CAULDRON);
}
