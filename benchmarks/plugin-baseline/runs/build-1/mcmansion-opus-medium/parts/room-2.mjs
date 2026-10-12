// Room 2: the office (plan.md ROOMS; inner air x3..11, y2..4, z12..17). Dark, bookish study: bookshelf walls on the
// south and east, a dark-oak executive desk facing the door (chair on the desk's west side, window behind it), a leather
// reading chair under the north window with a side table lamp, one hanging lantern over the middle. Floor oak_planks (P1).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLamp } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  // Bookshelf walls, three shelves high: south wall z17 x3..11, east wall x11 z12..14 and z16, west wall x3 z15..16.
  // (11,2..3,15) and (11,4,15) stay air: the doorway from the foyer is at (12,2..3,15).
  for (let x = 3; x <= 11; x++) for (let y = 2; y <= 4; y++) put(g, x, y, 17, B.block("bookshelf"));
  for (const z of [12, 13, 14, 16]) for (let y = 2; y <= 4; y++) put(g, 11, y, z, B.block("bookshelf"));
  for (const z of [15, 16]) for (let y = 2; y <= 4; y++) put(g, 3, y, z, B.block("bookshelf"));

  // Executive desk: dark oak body x5 z13..15, facing the door (east). A lantern stands on its north end as the desk lamp.
  for (let z = 13; z <= 15; z++) put(g, 5, 2, z, B.block("dark_oak_planks"));
  put(g, 5, 3, 13, B.lantern(false));

  // Leather chair on the desk's west side: dark oak stairs whose full back faces west, so the sitter faces the door.
  put(g, 4, 2, 14, B.stairs("dark_oak", "west", "bottom"));

  // Reading chair under the north window (glass at (8..9,2..3,11)): back to the room (south), facing the glass.
  put(g, 9, 2, 12, B.stairs("dark_oak", "south", "bottom"));
  // Side table with a reading lamp.
  put(g, 8, 2, 12, B.block("dark_oak_planks"));
  put(g, 8, 3, 12, B.lantern(false));

  // Hanging lantern over the middle of the room, chain from the ceiling.
  hangLamp(g, 7, 4, 14);
}
