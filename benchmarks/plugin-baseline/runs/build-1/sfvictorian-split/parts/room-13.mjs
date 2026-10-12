// Room: Upstairs landing. Inner air x10..14, y10..12, z11..22 (floor slab y9, stand y10).
// The main stair arrives at (13..14,10,17) through the open slab over x13..14 z11..15: that hole is railed in dark oak.
// The upper stair (spruce, facing south = high back south, plan convention) climbs x13..14 z19..22 to the top floor.
// Furniture: a narrow red runner up x11, a console table with a lantern on the west wall (the focal piece), a hall seat
// against the west wall, and a chest and barrel for linen at the south-west corner. Lanterns hang from the ceiling.
// Every doorway approach stays clear: (10,10..11,12), (10,10..11,19), (11,10..11,11), (11,10..11,22).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // upper stair: stand y10 at z18 rising to y13 at z22 (plan: y = 10 + (z - 19))
  for (const z of [19, 20, 21, 22]) for (const x of [13, 14]) {
    g.set(x, 10 + (z - 19), z, ...B.stairs("spruce", "south", "bottom"));
  }

  // rail around the main stair hole: west edge x12 z11..15, north z11 at x13..14. No rail at z15: the main stair
  // climbs out of the well through (13..14,10,15) to its top step at (13..14,10,16), so a fence there cuts the path.
  for (const z of [11, 12, 13, 14, 15]) g.set(12, 10, z, ...B.fence("dark_oak"));
  for (const x of [13, 14]) g.set(x, 10, 11, ...B.fence("dark_oak"));

  // runner: red carpet up the middle of the room (x11), from the study door to the back-bedroom door
  for (let z = 11; z <= 22; z++) g.set(11, 10, z, "red_carpet");

  // console table on the west wall, z14..16: dark oak legs at the ends, a top-slab tabletop at y11, a lantern on it
  g.set(10, 10, 14, ...B.fence("dark_oak"));
  g.set(10, 10, 16, ...B.fence("dark_oak"));
  for (const z of [14, 15, 16]) g.set(10, 11, z, ...B.slab("dark_oak", "top"));
  g.set(10, 12, 15, ...B.lantern(false));

  // hall seat: a dark oak stair against the west wall at z18, facing the room (high back west)
  g.set(10, 10, 18, ...B.stairs("dark_oak", "west", "bottom"));

  // linen store at the south-west corner: a chest and a barrel, clear of the bathroom and back-bedroom approaches
  g.set(10, 10, 21, "chest", { facing: "east", type: "single", waterlogged: "false" });
  g.set(10, 10, 22, "barrel", { facing: "up", open: "false" });

  // light: lanterns hang from the ceiling slab over the path and the stair foot, clear of every doorway head
  g.set(11, 12, 14, ...B.lantern(true));
  g.set(12, 12, 18, ...B.lantern(true));
  g.set(11, 12, 21, ...B.lantern(true));
}
