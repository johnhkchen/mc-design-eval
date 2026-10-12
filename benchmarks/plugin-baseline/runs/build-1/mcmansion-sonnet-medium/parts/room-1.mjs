// Room: Foyer (interior designer). Inner air [24,1,12,29,8,16]; the oak stair (x24..25, z12..16) and its planks are P1's.
// Usable floor is x26..29 z12..16 at y=1. Lane x26..27 stays open from the entry (z=11) south to the great room (z=17);
// the east edge (28..29, z=14) stays open so the dining door (30,1..2,14) can be reached.
// Layout: console table on the north wall beside the entry, a pair of stair-seat benches on the east wall, a flowering
// shrub in the south-east corner, standing lanterns in the west corners, and a three-chain chandelier over (27,*,14).
import { B, ROOMS } from "../vocab.mjs";

const BOX = ROOMS.find((r) => r.name === "Foyer").box;
const [x0, y0, z0, x1, y1, z1] = BOX;

// Place a block only into air: earlier parts own everything else, so a non-air cell is left alone.
const put = (g, x, y, z, pair) => {
  if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) throw new Error(`Foyer write outside box: ${x},${y},${z}`);
  if (g.blockAt(x, y, z) === "minecraft:air") g.set(x, y, z, ...pair);
};

export function build(g) {
  // Console table: smooth_quartz slabs (top half) along the north wall, flanking the entry opening (x25..28 at z=11).
  // Sits at y=1 on the floor; a lantern and a flower pot stand on the slab tops at y=2.
  put(g, 28, 1, 12, B.slab("smooth_quartz", "top"));
  put(g, 29, 1, 12, B.slab("smooth_quartz", "top"));
  put(g, 28, 2, 12, B.lantern(false));
  put(g, 29, 2, 12, B.block("flower_pot"));

  // Chandelier over (27,*,14): iron chain from the ceiling hook (y=9) down, a hanging lantern at the bottom.
  put(g, 27, 8, 14, B.chain("y"));
  put(g, 27, 7, 14, B.chain("y"));
  put(g, 27, 6, 14, B.lantern(true));
  // Ring of four lanterns on chains from the same hook, around the centre lantern.
  for (const [x, z] of [[26, 13], [28, 13], [26, 15], [28, 15]]) {
    put(g, x, 8, z, B.chain("y"));
    put(g, x, 7, z, B.chain("y"));
    put(g, x, 6, z, B.lantern(true));
  }

  // Seating: two oak stairs as benches on the east wall, facing west toward the lane (stair facing = seat direction).
  put(g, 29, 1, 15, B.stairs("oak", "west", "bottom"));
  put(g, 29, 1, 16, B.stairs("oak", "west", "bottom"));

  // Planter in the south-east corner and a standing lantern in the south-west corner.
  put(g, 28, 1, 16, ["flowering_azalea_leaves", { persistent: "true" }]);
  put(g, 26, 1, 16, B.lantern(false));

  // North-west corner lantern beside the entry lane.
  put(g, 26, 1, 12, B.lantern(false));
}
