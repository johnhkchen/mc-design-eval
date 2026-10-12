// Room: Front parlour (interior designer). Inner air box [1,5,7,8,8,15]: x1..8, y5..8, z7..15 (floor oak_planks at y4).
// Ways in: the bay opening on the north side (x3..6, z7), the doorway east to the hall (9,5..6,12), and the doorway
// south to the dining room (4..5,5..6,16). Layout: the fireplace breast on the west party wall (x1, z11..13) is the
// focal piece; a crimson settee of stairs faces it across a red rug; a coffee table and a lectern sit in the room's
// middle; bookshelves line the east wall; spruce lamp posts with lanterns light the corners. The walkway from every
// door runs down the x4 column and across the z8..14 rows, so nothing blocks a 2-high path.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const RUG = "red_carpet";
const WOOD = "crimson";
const POST = "spruce_fence";

export function build(g) {
  // rug in front of the fire (carpets sit on the oak floor at y5); the hearth cells stay stone
  for (let x = 2; x <= 5; x++) for (let z = 9; z <= 14; z++) {
    if (x === 2 && z >= 11 && z <= 13) continue;
    g.set(x, 5, z, RUG);
  }

  // fireplace on the west party wall: breast x1 z11..13 (y5..7), quartz mantel at y8, stone hearth fender at x2
  for (let z = 11; z <= 13; z++) {
    for (let y = 5; y <= 7; y++) g.set(1, y, z, "stone_bricks");
    g.set(1, 8, z, ...B.slab("smooth_quartz", "bottom"));
    g.set(2, 5, z, ...B.slab("stone_brick", "bottom"));
  }
  g.set(2, 6, 12, ...B.lantern(false));

  // settee of stairs: three crimson stairs facing the fire (the high back is east, the seats face west)
  for (let z = 10; z <= 12; z++) g.set(3, 5, z, ...B.stairs(WOOD, "east", "bottom"));

  // coffee table between the settee and the middle of the room: dark oak fence post under a slab top
  g.set(5, 5, 11, ...B.fence("dark_oak"));
  g.set(5, 6, 11, ...B.slab("crimson", "bottom"));

  // lectern by the hall door (the reading desk); it faces west into the room
  g.set(7, 5, 13, "lectern", { facing: "west", has_book: "true", powered: "false" });

  // bookshelves on the east wall, north of the hall doorway (x9 z12 stays clear: x8 z12 left as the way through)
  for (const y of [5, 6]) { g.set(8, y, 8, "bookshelf"); g.set(8, y, 9, "bookshelf"); }
  g.set(8, 5, 14, "bookshelf");
  g.set(8, 6, 14, "bookshelf");

  // lamp posts: a spruce fence with a standing lantern on top, at the north-east, west and south-east corners
  const lamps = [[7, 8], [2, 9], [8, 15]];
  for (const [x, z] of lamps) {
    g.set(x, 5, z, POST);
    g.set(x, 6, z, ...B.lantern(false));
  }
}
