// Room 11: Bedroom 4, interior designer. Inner air x19..25, y7..9, z17..27; door (22, y7..8, z16) from the upper hall;
// west window (18, y7..9, z23..25). Palette has no bed, carpet, barrel or flower pot, so the room is a reading and
// work room: a window desk with a chair, a reading corner, a wardrobe of open trapdoors, a shelf run and lanterns.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SPRUCE_FENCE = "spruce_fence";
const SPRUCE_SLAB = "spruce_slab";
const LANTERN = "lantern";

export function build(g) {
  // Workstation under the west window: fence legs at y7, slab top at y8 (the desk), chair on the room side.
  for (let z = 23; z <= 25; z++) {
    g.set(19, 7, z, SPRUCE_FENCE);
    g.set(19, 8, z, ...B.slab("spruce", "top"));
  }
  g.set(19, 9, 24, LANTERN, { hanging: "false", waterlogged: "false" });   // desk lamp on the slab top
  g.set(20, 7, 24, ...B.stairs("spruce", "east", "bottom"));              // desk chair: back east, seat faces the desk

  // Wardrobe: two open spruce trapdoor panels, two high, on the east wall (x26), facing into the room.
  for (let z = 18; z <= 19; z++) for (let y = 7; y <= 8; y++) g.set(25, y, z, ...B.trapdoor("spruce", "west", "bottom", true));

  // Shelf run on the north wall (z16): slabs at y8 beside the door, clear of the doorway.
  for (let x = 19; x <= 21; x++) g.set(x, 8, 17, ...B.slab("spruce", "bottom"));

  // Reading corner in the south-east: side table with a lamp, two stair seats either side of it.
  g.set(23, 7, 26, SPRUCE_FENCE);
  g.set(23, 8, 26, ...B.slab("spruce", "top"));
  g.set(23, 9, 26, LANTERN, { hanging: "false", waterlogged: "false" });
  g.set(22, 7, 26, ...B.stairs("spruce", "west", "bottom"));              // seat faces east toward the table
  g.set(24, 7, 26, ...B.stairs("spruce", "east", "bottom"));              // seat faces west toward the table

  // Floor lamps: fence post with a standing lantern, one in each back corner.
  g.set(19, 7, 20, SPRUCE_FENCE);
  g.set(19, 8, 20, LANTERN, { hanging: "false", waterlogged: "false" });
  g.set(25, 7, 22, SPRUCE_FENCE);
  g.set(25, 8, 22, LANTERN, { hanging: "false", waterlogged: "false" });

  // Ceiling lantern on a chain over the middle of the room.
  g.set(22, 9, 22, ...B.chain("y"));
  g.set(22, 8, 22, LANTERN, { hanging: "true", waterlogged: "false" });
}
