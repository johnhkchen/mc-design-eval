// Dining room (E23): dark wood, candlelit. Inner air x4..9, y5..7, z19..24. Ways in: parlour opening (5..7,5..6,18) on the
// north, hall door (10,5..6,21) on the east, kitchen door (7,5..6,25) on the south; lightwell windows (3,5..7,20),(3,5..7,22).
// Layout: table x5..6 z21..23 centred under a hanging lantern, six dark_oak_stairs chairs (three each side), a two-high
// dark oak sideboard on the east wall south of the hall door, a bookshelf in the north-east corner. The walkway runs x8
// (and z20 / z24 across the ends of the table), so every seat and the sideboard are reachable from both doors.
import {
  BOOKSHELF, DARK_OAK_FENCE, DARK_OAK_PLANKS, DARK_OAK_STAIRS, LANTERN, POTTED_FERN, POTTED_RED_TULIP, hangLamp,
} from "../vocab.mjs";

// Add into air only: another part's cell is never overwritten.
function place(g, x, y, z, block, state = {}) {
  if (!["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z))) return;
  g.set(x, y, z, block, state);
}

export function build(g) {
  // Table: dark oak fence legs at y5 under a dark oak plank top at y6, x5..6 z21..23.
  for (let x = 5; x <= 6; x++) for (let z = 21; z <= 23; z++) {
    place(g, x, 5, z, DARK_OAK_FENCE);
    place(g, x, 6, z, DARK_OAK_PLANKS);
  }

  // Chairs: stairs with the high back to the wall, facing the table (west side faces east, east side faces west).
  for (let z = 21; z <= 23; z++) {
    place(g, 4, 5, z, DARK_OAK_STAIRS, { facing: "east", half: "bottom" });
    place(g, 7, 5, z, DARK_OAK_STAIRS, { facing: "west", half: "bottom" });
  }

  // Chandelier: one hanging lantern over the table centre (ceiling is the second-floor slab at y8).
  hangLamp(g, 6, 7, 22, { drop: 1 });

  // Sideboard: a two-high dark oak cabinet on the east wall x9 z22..24 (hall door cell (9,5..6,21) stays clear),
  // with a potted tulip, a standing lantern and a potted fern on top.
  for (let z = 22; z <= 24; z++) for (let y = 5; y <= 6; y++) place(g, 9, y, z, DARK_OAK_PLANKS);
  place(g, 9, 7, 22, POTTED_RED_TULIP);
  place(g, 9, 7, 23, LANTERN, { hanging: "false" });
  place(g, 9, 7, 24, POTTED_FERN);

  // North-east corner: a two-high bookshelf, and a standing lantern on the north-west and north-east floor cells.
  place(g, 9, 5, 19, BOOKSHELF);
  place(g, 9, 6, 19, BOOKSHELF);
  place(g, 4, 5, 19, LANTERN, { hanging: "false" });
  place(g, 8, 5, 19, LANTERN, { hanging: "false" });
}
