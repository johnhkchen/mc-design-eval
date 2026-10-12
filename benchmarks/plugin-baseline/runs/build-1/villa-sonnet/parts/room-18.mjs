// Room 18: the peristyle colonnade (covered walkway), inner air x7..28, y2..5, z32..44 (plan.md ROOMS row).
// P5 owns the columns, architrave, hang lamps, statues and the N/S benches (COLONNADE_BENCHES); P6 owns FINISH_POTS.
// This designer adds the side-strip furniture so each walk has a seat, a table and a plant, mirrored x' = 35 - x:
// one seat (stairs, low side facing the court), one table and one potted fern per strip. The x7..8 and x27..28 lanes
// stay clear, so the doorways (6,35), (6,41), (29,35), (29,41) and the kitchen and triclinium openings reach every piece.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DARK_OAK_FENCE, POTTED_FERN, STONE_BRICKS } from "../vocab.mjs";

const AIR = "minecraft:air";

/** Write only into air: a cell an earlier part filled is left as it is. */
function put(g, x, y, z, ...spec) {
  if (g.blockAt(x, y, z) === AIR) g.set(x, y, z, ...spec);
}

/** A bench: one smooth quartz stair at (x, 2, z), its low side facing `facing` (the way the sitter looks). */
function seat(g, x, z, facing) {
  put(g, x, 2, z, ...B.stairs("smooth_quartz", facing, "bottom"));
}

/** A small table: a dark oak fence post at y2 and a dark oak slab top (type top) at y3 on one cell. */
function smallTable(g, x, z) {
  put(g, x, 2, z, DARK_OAK_FENCE);
  put(g, x, 3, z, ...B.slab("dark_oak", "top"));
}

/** A potted fern on a stone_bricks pedestal: pedestal at y2, pot at y3. */
function potFern(g, x, z) {
  put(g, x, 2, z, STONE_BRICKS);
  put(g, x, 3, z, POTTED_FERN);
}

export function build(g) {
  // West strip, furniture on x9 (x7..8 stay a two-wide lane): seat facing east, table, potted fern.
  seat(g, 9, 37, "east");
  smallTable(g, 9, 34);
  potFern(g, 9, 40);

  // East strip, mirrored (x' = 35 - x): seat facing west, table, potted fern.
  seat(g, 26, 37, "west");
  smallTable(g, 26, 34);
  potFern(g, 26, 40);
}
