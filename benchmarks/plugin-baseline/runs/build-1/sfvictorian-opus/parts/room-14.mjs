// Interior designer's room: attic bedroom, box [2,13,26,13,15,29] (birch floor at y12, open to the roof, no ceiling).
// Guest room under the back gable: single bed (focal, NW against the party wall), washstand beside its head, trunk at the
// foot under a lantern, a white rug, a potted fern under the south window. Entry from the north at (12,13..14,25): the
// row z26 stays clear from x12 to x3, and the bed is reached from x3. Three standing lanterns light it at night.
import { WHITE_BED, BARREL, WATER_CAULDRON, LANTERN, WHITE_CARPET, POTTED_FERN } from "../vocab.mjs";

// Add into air only: a cell an earlier part owns is skipped, never overwritten.
const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
const put = (g, x, y, z, block, state) => {
  if (isAir(g, x, y, z)) g.set(x, y, z, block, state);
};

export function build(g) {
  // Sleeping group, NW corner: the bed runs north-south along the party wall x1. Foot at (2,13,28), head at (2,13,27);
  // a bed's head is the cell its `facing` points to from the foot, so facing=north.
  put(g, 2, 13, 28, WHITE_BED, { facing: "north", part: "foot", occupied: "false" });
  put(g, 2, 13, 27, WHITE_BED, { facing: "north", part: "head", occupied: "false" });

  // Washstand beside the pillow: a cabinet barrel with the basin (water cauldron) on top.
  put(g, 2, 13, 26, BARREL, { facing: "up", open: "false" });
  put(g, 2, 14, 26, WATER_CAULDRON, { level: "3" });

  // Trunk at the foot of the bed, with a lantern standing on its lid (the room's brightest light, beside the bed).
  put(g, 2, 13, 29, BARREL, { facing: "up", open: "false" });
  put(g, 2, 14, 29, LANTERN, { hanging: "false", waterlogged: "false" });

  // Rug between the bed and the middle of the room (carpet is walkable; the bed's side x3 stays bare).
  for (let x = 4; x <= 7; x++) for (let z = 27; z <= 28; z++) put(g, x, 13, z, WHITE_CARPET, {});

  // Standing lanterns on the floor: by the east wall (lights the entry corner) and on the south row (lights the middle
  // of the north row, which was the one dim cell at 7 with only the two lanterns above).
  put(g, 13, 13, 27, LANTERN, { hanging: "false", waterlogged: "false" });
  put(g, 6, 13, 29, LANTERN, { hanging: "false", waterlogged: "false" });

  // Potted fern under the south window (inside, not over it).
  put(g, 9, 13, 29, POTTED_FERN, {});
}
