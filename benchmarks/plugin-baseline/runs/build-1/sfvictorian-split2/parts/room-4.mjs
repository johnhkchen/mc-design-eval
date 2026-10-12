// room: Front porch (plan.md ROOMS: inner air [10,5,7,13,7,9], floor y4 smooth_quartz from the shell).
// Layout: a bench on the west wall (dark_oak_stairs seat, sofa helper), a welcome mat (red_carpet) on the cells
// before the burgundy door at z10, two barrel planters with pots on the east wall, and one hanging lantern on the
// ceiling as the focal light over the mat. Columns (x10, x13 at z7), the mouth (x11..12 z7) and the door cells
// (x11..12 z10, y5..7) stay clear: the walk path runs x11..12 from the street mouth to the door.
import {
  sofa, BARREL, FLOWER_POT, POTTED_FERN, LANTERN, RED_CARPET,
} from "../vocab.mjs";

export function build(g) {
  // Bench: two dark_oak_stairs seats on the west wall, facing east into the room.
  sofa(g, 10, 5, 8, 2, "east");

  // Welcome mat: red carpet on the two cells in front of the door (z9), walkable.
  g.fill([11, 5, 9], [12, 5, 9], RED_CARPET);

  // Planters on the east wall: a barrel at each cell, a potted fern and an empty pot on top.
  for (const z of [8, 9]) {
    g.set(13, 5, z, BARREL, { facing: "up", open: "false" });
  }
  g.set(13, 6, 8, POTTED_FERN);
  g.set(13, 6, 9, FLOWER_POT);

  // Hanging lantern from the porch ceiling (y8), over the path just inside the mouth; the light source for the room.
  g.set(11, 7, 8, LANTERN, { hanging: "true" });
}
