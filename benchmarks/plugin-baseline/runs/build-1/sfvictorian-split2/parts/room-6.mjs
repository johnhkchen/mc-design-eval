// room: Front parlour (plan.md ROOMS: inner air x2..8, y5..7, z8..15; bay alcove x2..5 z6, mouth z7 open to the room).
// Focal piece: the west fireplace (firebox x1 z11..13, surround by P2). Seating faces it: a dark_oak stair sofa on the
// east partition, two stair armchairs on the fireplace side, a red rug between. A jukebox on the front wall, bookshelves
// on the east wall, a lamp post by the jukebox, and the bay alcove as a red window seat. Lanterns hang from the ceiling.
// Walkway: hall doorway (9,14..15) -> x5 column -> bay mouth; dining opening (4..5,16) -> row z15.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  windowSeat, sofa, table, lampPost, rug,
  LANTERN, BOOKSHELF, JUKEBOX,
} from "../vocab.mjs";

export function build(g) {
  // The west firebox (1,5..6,11..13) is NOT filled here: the shell owns those reserved air cells, so the
  // netherrack/fire writes are refused (see plan.md Notes). The fireplace stays an empty recess for now.
  // A standing lantern in the throat (2,6,12) lights the hearth pocket the surround closes off (it was dark).
  g.set(2, 6, 12, ...B.lantern(false));

  // Bay alcove: a red window seat under the three front lights.
  windowSeat(g, 2, 5, 5, 6);

  // Rug in the middle of the seating, between the armchairs and the sofa.
  rug(g, 5, 7, 5, 10, 13, "red");

  // Sofa on the east partition (back against x9), seat facing the fireplace.
  sofa(g, 8, 5, 11, 3, "east");

  // Two armchairs on the fireplace side of the rug, backs to the east, seats facing west.
  g.set(4, 5, 11, ...B.stairs("dark_oak", "east"));
  g.set(4, 5, 13, ...B.stairs("dark_oak", "east"));

  // Tea table between the front armchair and the front wall.
  table(g, 4, 5, 9);

  // Piano-like jukebox against the front wall, with a lamp post beside it.
  g.set(6, 5, 8, JUKEBOX, { has_record: "false" });
  lampPost(g, 7, 5, 8);

  // Bookshelves on the east wall, two high, kept off the front window's inside cell (8,*,8).
  for (let z = 9; z <= 10; z++)
    for (let y = 5; y <= 6; y++) g.set(8, y, z, BOOKSHELF);

  // Hanging lanterns: the bay, the centre of the seating, and the hall-side corner.
  for (const [x, z] of [[3, 6], [2, 9], [5, 12], [7, 11], [7, 14]]) g.set(x, 7, z, LANTERN, { hanging: "true", waterlogged: "false" });
}
