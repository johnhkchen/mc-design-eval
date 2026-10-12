// Room 4, Stube (living room): the baker's sitting room over the street. Inner box [7,7,9,15,10,13]; floor cells at
// walk y=7. Focal piece: the tile stove (brick, lit furnace mouth on its west face) in the NE corner. Table set under the
// front windows, bench at the stove, bookshelf and lectern on the west wall, red rug, barrel and chest by the stairs.
// Lanterns stand on the floor for light (the attic ceiling is not in this room's reach to hang from). Lanes kept clear:
// from the stairs arrival (7..8,7,13) and the bedroom doorway (11..12,7,13) north across the room.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { tileStove, tableSet, shelfWall, benchRun } from "../vocab.mjs";

export function build(g) {
  // focal piece: tile stove, NE corner, mouth facing the room (west)
  tileStove(g, 14, 7, 9, "west");

  // bookshelf run and lectern on the west wall (x=7, z=9..10); lectern stands at (8,7,9)
  shelfWall(g, 7, 7, 9, "z", 2, 2);

  // table under the front windows, seats either side (9,7,9)/(11,7,9)... via the helper
  tableSet(g, 11, 7, 9);

  // bench in front of the stove, seat facing north toward it
  benchRun(g, 14, 15, 12, 7, "north");

  // floor furniture and light, drawn as text: rows along +z (z=9..13), columns along +x (x=7..15)
  layers(g, [7, 7, 9], {
    R: "red_carpet",
    b: ["barrel", { facing: "up" }],
    c: ["chest", { facing: "north" }],
    l: ["lantern", { hanging: "false" }],
  }, [
    ".........", // z=9
    "......l..", // z=10: lantern in the NE quarter
    "..lRRR..b", // z=11: lantern west of the rug, barrel by the east wall
    "b..RRR...", // z=12: barrel by the stairs
    "........c", // z=13: chest in the SE corner (lane to the bedroom doorway stays clear)
  ]);
}
