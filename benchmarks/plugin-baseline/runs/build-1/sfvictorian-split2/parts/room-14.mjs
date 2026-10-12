// Top room under the roof: one long attic studio, open to the ridge (air x2..13 y13..16 z8..31, bay alcove x2..5 z6).
// Zones: library wall on the west party wall (x2), reading corner by the bay (armchairs round a table), work corner
// at the front (cartography table, lectern easel), bed corner at the back-west, storage along the back-east.
// The stair well (x12..13 z17..20) stays clear; its open west rim is railed at x11 y13 z17..19.
// Light: standing lanterns on birch_fence posts (no ceiling, so nothing hangs), one per zone.
import {
  BIRCH_FENCE, CARTOGRAPHY_TABLE, LECTERN, POTTED_FERN, DARK_OAK_STAIRS, BARREL, CHEST,
  table, bookwall, lampPost, windowSeat, bed, nightstand, wardrobe, chair, rug,
} from "../vocab.mjs";

// A dark_oak_stairs armchair, its open side (facing) toward the table.
const armchair = (g, x, y, z, facing) => g.set(x, y, z, DARK_OAK_STAIRS, { facing, half: "bottom", shape: "straight" });

export function build(g) {
  // ---- library wall: bookshelves two high on the west, x2, z9..13 (the party wall at x1 is the shell) ----
  for (let z = 9; z <= 13; z++) bookwall(g, 2, 2, 13, z, 2);

  // ---- bay window seat: birch_slab bench across the alcove z6 under red carpet ----
  windowSeat(g, 2, 5, 13, 6);

  // ---- reading corner: a dark_oak table with four armchairs, lit by a post lantern beside it ----
  table(g, 4, 13, 12);
  armchair(g, 3, 13, 12, "east");
  armchair(g, 5, 13, 12, "west");
  armchair(g, 4, 13, 11, "south");
  armchair(g, 4, 13, 13, "north");
  lampPost(g, 3, 13, 15);

  // ---- work corner at the front: cartography table as the work table, a lectern as the easel ----
  g.set(10, 13, 10, CARTOGRAPHY_TABLE);
  g.set(10, 14, 10, POTTED_FERN);
  g.set(10, 13, 11, DARK_OAK_STAIRS, { facing: "north", half: "bottom", shape: "straight" });
  g.set(12, 13, 10, LECTERN, { facing: "south", has_book: "false" });
  lampPost(g, 9, 13, 14);

  // ---- bed corner, back-west: a red bed (foot at z29, head at z28), nightstand barrel beside it ----
  bed(g, 3, 13, 29, "red", "north");
  nightstand(g, 2, 13, 28);
  lampPost(g, 5, 13, 28);

  // ---- storage along the back-east: a wardrobe under the back wall, a chest and a barrel for the bays ----
  wardrobe(g, 10, 13, 31, "north");
  g.set(13, 13, 31, CHEST, { facing: "north", type: "single", waterlogged: "false" });
  g.set(12, 13, 31, BARREL);

  // ---- middle of the studio (was bare floor): a blue rug with a drafting table and a chair either side ----
  rug(g, 7, 9, 13, 14, 18, "blue");
  table(g, 8, 13, 16);
  chair(g, 7, 13, 16, "east");
  chair(g, 9, 13, 16, "west");

  // ---- more light for the middle and south of the room (lanterns, each on its own birch_fence post) ----
  lampPost(g, 8, 13, 9);
  lampPost(g, 6, 13, 21);
  lampPost(g, 10, 13, 25);
  lampPost(g, 4, 13, 30);

  // ---- stair well rail: birch_fence on the open west rim (x11), only where the cell is still air ----
  for (let z = 17; z <= 19; z++) if (g.isAir(11, 13, z)) g.set(11, 13, z, BIRCH_FENCE, {
    north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
  });
}
