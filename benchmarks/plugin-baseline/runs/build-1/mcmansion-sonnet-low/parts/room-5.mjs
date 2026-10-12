// Room 5: Pantry and laundry, interior designer. Inner air x19..25, y2..5, z21..27; door (26,y2..3,z24) from the great
// room; west window (18,y3..5,z23..25). Layout: pantry shelving on the north wall (the focal piece, brightest light),
// utility sink and washer/dryer down the west wall, a folding counter on the south wall, an aisle along z24 to the door.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // pantry shelving, north wall: spruce base blocks at y2, spruce slab tops as shelves at y3
  g.fill([19, 2, 21], [22, 2, 21], "spruce_planks");
  for (let x = 19; x <= 22; x++) g.set(x, 3, 21, ...B.slab("spruce", "top"));

  // utility sink under the west window (window sits at y3..5, so the counter stays at y2)
  g.fill([19, 2, 23], [19, 2, 25], "polished_andesite");

  // washer and dryer, west wall, south of the sink
  g.fill([19, 2, 26], [19, 3, 26], "smooth_quartz");
  g.fill([19, 2, 27], [19, 3, 27], "white_concrete");

  // folding counter, south wall: spruce fence legs at y2, spruce slab top at y3
  g.set(22, 2, 27, "spruce_fence");
  g.set(24, 2, 27, "spruce_fence");
  for (let x = 22; x <= 24; x++) g.set(x, 3, 27, ...B.slab("spruce", "top"));

  // lamp post by the aisle, lanterns on the shelf and the sink
  g.fill([23, 2, 22], [23, 3, 22], "spruce_fence");
  g.set(23, 4, 22, ...B.lantern(false));
  g.set(20, 4, 21, ...B.lantern(false));
  g.set(22, 4, 21, ...B.lantern(false));
  g.set(19, 3, 25, ...B.lantern(false));
}
