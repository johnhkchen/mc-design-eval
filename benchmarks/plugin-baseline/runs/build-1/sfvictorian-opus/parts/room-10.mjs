// Bathroom (interior designer): box [4,9,19,9,11,24], white and brass. Entry from the upper hall at (10,9..10,21);
// lightwell window at (3,10..11,21) with a fern on the sill below it. Everything is placed into air inside the box.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, POTTED_FERN, LIGHTNING_ROD, WATER_CAULDRON, WHITE_WOOL } from "../vocab.mjs";

const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
// Add into air only: a cell another part already owns is skipped, never overwritten.
function put(g, x, y, z, block, state = {}) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}
// Chain at y and a hanging lantern at y-1 under the ceiling at y+1 (the room's top-floor floor at y12).
function hang(g, x, y, z) {
  put(g, x, y, z, ...B.chain("y"));
  put(g, x, y - 1, z, ...B.lantern(true));
}

export function build(g) {
  // Clawfoot tub: two water cauldrons end to end along the south wall (the focal piece, under the brightest lamp),
  // with a lightning-rod tap at its east end.
  put(g, 6, 9, 24, WATER_CAULDRON, { level: "3" });
  put(g, 7, 9, 24, WATER_CAULDRON, { level: "3" });
  put(g, 8, 9, 24, LIGHTNING_ROD, { facing: "up", powered: "false", waterlogged: "false" });

  // Pedestal sink: a water cauldron at level 1 in the north-west corner, an iron-trapdoor mirror hung above it.
  put(g, 4, 9, 19, WATER_CAULDRON, { level: "1" });
  put(g, 4, 11, 19, ...B.trapdoor("iron", "south", "top", false));

  // Toilet: a quartz stair bowl against the east partition, its lid an open iron trapdoor on the same wall.
  put(g, 9, 9, 19, ...B.stairs("quartz", "west", "bottom"));
  put(g, 9, 10, 19, ...B.trapdoor("iron", "west", "top", true));

  // Towel rack: a birch fence post with a white wool towel over it.
  put(g, 8, 9, 19, ...B.fence("birch"));
  put(g, 8, 10, 19, WHITE_WOOL, {});

  // Linen barrel against the west wall, and a potted fern at the lightwell window.
  put(g, 4, 9, 23, BARREL, { facing: "up" });
  put(g, 4, 9, 21, POTTED_FERN, {});

  // Lamps: one over the tub, one over the barrel. Both hang from the ceiling above the 2-high path.
  hang(g, 7, 11, 24);
  hang(g, 5, 11, 23);
}
