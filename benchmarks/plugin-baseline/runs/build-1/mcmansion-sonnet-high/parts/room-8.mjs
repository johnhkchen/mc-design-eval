// room: Mudroom (plan: [13,2,16,18,4,22]): a practical drop zone off the garage. Inner air x13..18, y2..4, z16..22.
// Doors: garage (12,2..3,18) on the west, kitchen (19,2..3,19) on the east. Windows: S (14..16,3..4,23), W (12,3..4,21..22).
// Keep the door-side cells and window-side cells clear so the path from each way in crosses the room.
import { LANTERN, OAK_STAIRS, OAK_FENCE, BARREL, CHEST, CAULDRON, POTTED_FERN, BROWN_CARPET } from "../vocab.mjs";

const put = (g, x, y, z, name, state = {}) => g.set(x, y, z, name, state);

export function build(g) {
  // NORTH wall (z16): the bench with coat hooks above it is the focal piece, lit by a hanging lantern.
  // Stairs as seats: three oak stairs facing south, back to the north wall.
  for (const x of [14, 15, 16]) put(g, x, 2, 16, OAK_STAIRS, { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
  // coat hooks: fence posts at shoulder height either side of the bench centre
  put(g, 14, 3, 16, OAK_FENCE, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(g, 16, 3, 16, OAK_FENCE, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(g, 15, 4, 16, LANTERN, { hanging: "true", waterlogged: "false" });

  // NE corner: a chest for the cubby stack, a potted fern on it, a barrel beside it
  put(g, 17, 2, 16, CHEST, { facing: "south", type: "single", waterlogged: "false" });
  put(g, 17, 3, 16, POTTED_FERN);
  put(g, 18, 2, 16, BARREL, { facing: "up", open: "false" });

  // EAST wall (x18): storage cubbies beside the kitchen door (kitchen door cells (18,2..3,19) stay clear)
  put(g, 18, 2, 21, CHEST, { facing: "west", type: "single", waterlogged: "false" });
  put(g, 18, 2, 22, BARREL, { facing: "up", open: "false" });
  put(g, 18, 2, 20, BARREL, { facing: "up", open: "false" });

  // SW corner: laundry, a cauldron with a barrel, below the W window (cells (13,3..4,21..22) stay air)
  put(g, 13, 2, 21, CAULDRON, { level: "0" });
  put(g, 13, 2, 22, BARREL, { facing: "up", open: "false" });

  // Floor rug in the middle, walkable, between the garage door and the kitchen door
  for (const x of [15, 16]) for (const z of [19, 20]) put(g, x, 2, z, BROWN_CARPET);

  // Ceiling lantern over the centre so the room is lit at night; a second over the rug
  put(g, 16, 4, 20, LANTERN, { hanging: "true", waterlogged: "false" });
  put(g, 14, 4, 18, LANTERN, { hanging: "true", waterlogged: "false" });
}
