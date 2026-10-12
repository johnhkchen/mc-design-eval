// room: Hall bathroom: clean white family bath in the inner air x27..32, y6..8, z19..22 (plan ROOMS). The door sits in
// the north wall at (29,6..7,18); the window is in the south wall at (29..30,7..8,23) (both outside this box, left alone).
// Layout (y6 is the floor-standing layer): tub on the west wall (focal piece, lantern over it), vanity on the east wall
// (cauldron sink, dark-oak slab counter, mirror panes above), linen barrel and a potted fern in the corners, towels
// stacked by the vanity, a bath mat in front of the tub. Path: z19 row and x29..31 stay clear from the door.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { WHITE_CARPET, CAULDRON, WATER_CAULDRON, WHITE_WOOL, LIGHT_GRAY_WOOL, BARREL, POTTED_FERN, GLASS_PANE } from "../vocab.mjs";

const FLOOR_Y = 6;

export function build(g) {
  // tub: water cauldron against the west wall, quartz slab rim on the open sides
  g.set(27, FLOOR_Y, 21, WATER_CAULDRON, { level: "3" });
  for (const [x, z] of [[27, 20], [27, 22], [28, 20], [28, 21], [28, 22]]) g.set(x, FLOOR_Y, z, ...B.slab("quartz"));
  g.set(28, 8, 21, ...B.lantern(true));                         // the focal light, hung over the tub

  // vanity on the east wall: dark-oak slab counter with a cauldron sink, mirror panes above it
  g.set(32, FLOOR_Y, 20, ...B.slab("dark_oak"));
  g.set(32, FLOOR_Y, 21, CAULDRON, {});
  g.set(32, FLOOR_Y, 22, ...B.slab("dark_oak"));
  for (const z of [20, 21, 22]) {
    const state = { north: String(z > 20), south: String(z < 22), east: "true", west: "false", waterlogged: "false" };
    g.set(32, 7, z, GLASS_PANE, state);
    g.set(32, 8, z, GLASS_PANE, state);
  }
  g.set(31, 8, 21, ...B.lantern(true));                         // vanity light

  // towels stacked by the vanity, a bath mat at the tub, linen barrel and plant in the corners
  g.set(31, FLOOR_Y, 22, WHITE_WOOL, {});
  g.set(31, 7, 22, LIGHT_GRAY_WOOL, {});
  g.set(29, FLOOR_Y, 21, WHITE_CARPET, {});
  g.set(27, FLOOR_Y, 19, BARREL, { facing: "up", open: "false" });
  g.set(32, FLOOR_Y, 19, POTTED_FERN, {});
  g.set(30, 8, 19, ...B.lantern(true));                         // door-end light
}
