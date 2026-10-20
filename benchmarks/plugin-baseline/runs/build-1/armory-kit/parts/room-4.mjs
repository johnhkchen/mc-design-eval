// Interior designer for "Armory theatre and studios 4F" (room 4): a rehearsal theatre with a 1-high stage behind a red
// proscenium arch, four raked tiers of stair seats facing it, and a west studio with two rehearsal tables and chairs.
// Light: lanterns hang under the proscenium lintel, standing lanterns on fence lamp posts down the room.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one fence lamp post: three fence posts and a standing lantern on top (y22..25)
function lampPost(g, x, z) {
  for (const y of [22, 23, 24]) g.set(x, y, z, "oak_fence");
  g.set(x, 25, z, ...B.lantern(false));
}

// a rehearsal table: fence leg at y22, top slab on it at y23, a lit lantern on the top at y24, four chairs round it
function table(g, x, z) {
  g.set(x, 22, z, "oak_fence");
  g.set(x, 23, z, ...B.slab("smooth_stone", "top"));
  g.set(x, 24, z, ...B.lantern(false));
  g.set(x - 1, 22, z, ...B.stairs("smooth_sandstone", "west"));
  g.set(x + 1, 22, z, ...B.stairs("smooth_sandstone", "east"));
  g.set(x, 22, z - 1, ...B.stairs("smooth_sandstone", "north"));
  g.set(x, 22, z + 1, ...B.stairs("smooth_sandstone", "south"));
}

export function build(g) {
  // stage: a 1-high deck (y22) inside the proscenium, which the audience faces from the south
  g.fill([37, 22, 7], [68, 22, 10], "polished_andesite");

  // proscenium: red posts at x36 and x69 on the stage's front line (z11), red lintel at y26
  g.fill([36, 22, 11], [36, 25, 11], "red_concrete");
  g.fill([69, 22, 11], [69, 25, 11], "red_concrete");
  g.fill([36, 26, 11], [69, 26, 11], "red_concrete");
  // lanterns hang from the lintel, lit over the stage
  g.set(44, 25, 11, ...B.lantern(true));
  g.set(61, 25, 11, ...B.lantern(true));

  // raked seating, four tiers facing north to the stage, two blocks of seats with a centre aisle (x52..53)
  for (const [x0, x1] of [[37, 51], [54, 68]]) {
    for (let x = x0; x <= x1; x++) {
      g.set(x, 22, 13, ...B.stairs("smooth_sandstone", "south"));              // tier 0: seats on the floor
      g.set(x, 22, 14, "polished_andesite");                                    // tier 1 riser
      g.set(x, 23, 14, ...B.stairs("smooth_sandstone", "south"));
      g.set(x, 22, 15, "polished_andesite");                                    // tier 2 riser
      g.set(x, 23, 15, "polished_andesite");
      g.set(x, 24, 15, ...B.stairs("smooth_sandstone", "south"));
      g.set(x, 22, 16, "polished_andesite");                                    // tier 3 riser
      g.set(x, 23, 16, "polished_andesite");
      g.set(x, 24, 16, "polished_andesite");
      g.set(x, 25, 16, ...B.stairs("smooth_sandstone", "south"));
    }
  }

  // west studio: two rehearsal tables with chairs
  table(g, 10, 20);
  table(g, 10, 27);
  table(g, 24, 20);

  // lamp posts: along the west studio, behind the seats, down the east side and at the north corners
  for (const [x, z] of [[5, 10], [5, 28], [18, 10], [32, 27], [46, 27], [60, 27], [74, 27], [88, 27], [100, 27],
    [34, 20], [48, 20], [62, 20], [76, 20], [90, 20], [100, 10], [88, 10], [74, 10]]) lampPost(g, x, z);
}
