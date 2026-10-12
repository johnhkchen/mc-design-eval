// Room 3: Home office, interior designer. Air box [19,2,8,25,5,12]; door (26,y2..3,z11) on the east wall; north window
// centred xc=22 (x21..23, y3..5) on the z7 wall. Layout: desk and chair under the window (focal piece), a bookcase wall
// along the west wall (x19), a reading chair and a standing lamp in the north-east corner, a side table, and two
// hanging lanterns. Palette-only: no bookshelf, barrel or carpet in palette.json, so the bookcase is a spruce plank
// wall with closed trapdoor "shelf fronts", and the desk is slabs on fence legs.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SPRUCE_FENCE = "spruce_fence";
const SPRUCE_PLANKS = "spruce_planks";

export function build(g) {
  // Bookcase wall, west side: plank backing x19 z8..10, closed trapdoor fronts on the room face (x20) at y3 and y5.
  g.fill([19, 2, 8], [19, 5, 10], SPRUCE_PLANKS);
  for (let z = 8; z <= 10; z++) {
    g.set(20, 3, z, ...B.trapdoor("spruce", "east", "bottom", false));
    g.set(20, 5, z, ...B.trapdoor("spruce", "east", "bottom", false));
  }

  // Desk under the north window: slab top at y3 across x21..23 z9, fence legs at the ends and the middle.
  for (const x of [21, 22, 23]) g.set(x, 3, 9, ...B.slab("spruce", "top"));
  for (const x of [21, 23]) g.set(x, 2, 9, SPRUCE_FENCE);
  g.set(22, 2, 9, SPRUCE_FENCE);

  // Desk lantern stands on the desk top: the focal light.
  g.set(22, 4, 9, ...B.lantern(false));

  // Desk chair: stair seat at (22,2,10), tall back to the south so it faces north at the desk.
  g.set(22, 2, 10, ...B.stairs("spruce", "south", "bottom"));

  // Reading chair in the north-east corner, back to the east, facing west toward the bookcase.
  g.set(24, 2, 9, ...B.stairs("spruce", "east", "bottom"));

  // Standing reading lamp: fence post with a lantern on top, beside the reading chair.
  g.set(25, 2, 8, SPRUCE_FENCE);
  g.set(25, 3, 8, ...B.lantern(false));

  // Side table by the reading chair: fence leg and slab top.
  g.set(24, 2, 11, SPRUCE_FENCE);
  g.set(24, 3, 11, ...B.slab("spruce", "top"));

  // Hanging lanterns from the y6 ceiling: over the reading corner and over the room centre.
  g.set(24, 5, 12, ...B.lantern(true));
  g.set(21, 5, 11, ...B.lantern(true));
}
