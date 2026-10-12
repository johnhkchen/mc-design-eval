// room: Home office (plan ROOMS, box [13,2,9,18,4,14]): quiet, studious, warm dark oak. Built only inside the box.
// Layout: a bookshelf wall on the west (x13) and a short east run (x18, z14); a desk under the north window (x14..16,
// z10) with a lectern (the focal piece) and a leather chair (dark_oak_stairs) at z11 facing north; a brown rug in front
// of the desk; a floor lamp in the NE corner; hanging lanterns for light. The French-door lane x18,z12..13 stays clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BOOKSHELF, BROWN_CARPET, LECTERN, BARREL } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const block = (name) => [name, {}];

// French doors from the foyer: two open birch doors in the x19 wall (z12 and z13), lower and upper halves. Moved from
// z10..11: the foyer stair flight (x20..22) sits on the foyer side of those rows, so the doors had no landing there.
// Local helper: vocab's frenchDoor() is for a south-facing pair along x, and this pair runs along z.
function frenchDoors(g) {
  for (const [z, hinge] of [[12, "left"], [13, "right"]])
    for (const half of ["lower", "upper"]) {
      const y = half === "lower" ? 2 : 3;
      put(g, 19, y, z, ["birch_door", { facing: "west", half, hinge, open: "true", powered: "false" }]);
    }
}

export function build(g) {
  frenchDoors(g);
  // bookshelf wall: west side, full height (plan: a wall of bookshelves)
  for (let z = 9; z <= 14; z++) for (let y = 2; y <= 4; y++) put(g, 13, y, z, block(BOOKSHELF));
  // short east run, south of the French-door lane (the lane x18,z12..13 stays clear)
  for (let y = 2; y <= 3; y++) put(g, 18, y, 14, block(BOOKSHELF));

  // desk facing the north window: fence legs under a dark oak slab top at y3, lectern centred on it
  for (let x = 14; x <= 16; x++) put(g, x, 2, 10, B.fence("dark_oak"));
  for (const x of [14, 16]) put(g, x, 3, 10, B.slab("dark_oak", "bottom"));
  put(g, 15, 3, 10, [LECTERN, { facing: "south", has_book: "false", powered: "false" }]);

  // leather chair (dark oak stairs) behind the desk, back to the south, facing the window
  put(g, 15, 2, 11, B.stairs("dark_oak", "south", "bottom"));

  // small rug in front of the desk
  for (let x = 14; x <= 16; x++) for (let z = 12; z <= 13; z++) put(g, x, 2, z, block(BROWN_CARPET));

  // hanging lanterns: one over the desk, one over the room's south-east corner
  put(g, 14, 4, 10, B.lantern(true));
  put(g, 17, 4, 13, B.lantern(true));

  // floor lamp: a lantern standing on a fence post in the NE corner (kept off the window strip x14..16,z9, which
  // stays reachable through x17,z9)
  put(g, 18, 2, 9, B.fence("dark_oak"));
  put(g, 18, 3, 9, B.lantern(false));

  // storage barrel in the SE corner
  put(g, 17, 2, 14, [BARREL, { facing: "up", open: "false" }]);
}
