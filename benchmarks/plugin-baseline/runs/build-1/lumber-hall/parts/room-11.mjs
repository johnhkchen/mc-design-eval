// Room: North store (interior designer's part). A timber store: log racks two high along the west and east walls,
// plank pallets along the north wall between the windows and loading doors, and a tally desk on the lane from the
// gallery doorway (x20..21, z14). Hanging lanterns on chains from the loft floor light the room; the focal desk
// sits under its own lantern and candles. Everything stays inside the box x3..39, y13..17, z5..13.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const WOODS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak"];

// one lantern hung from a chain off the loft floor (y18): the chain at y17, the lantern at y16
function hangLantern(g, x, z) {
  g.set(x, 17, z, ...B.chain("y"));
  g.set(x, 16, z, ...B.lantern(true));
}

export function build(g) {
  // log racks: two logs high, laid along z, on the west (x3..4) and east (x38..39) walls, z5..11
  for (let z = 5; z <= 11; z++) {
    const w = WOODS[(z - 5) % WOODS.length];
    const e = WOODS[(z - 2) % WOODS.length];
    for (const y of [13, 14]) {
      for (const x of [3, 4]) g.set(x, y, z, ...B.log(w, "z"));
      for (const x of [38, 39]) g.set(x, y, z, ...B.log(e, "z"));
    }
  }

  // plank pallets along the north wall, clear of the window and loading-door fronts (x7, x11..12, x19, x23, x30..31, x35)
  const pallets = [[8, "spruce"], [14, "birch"], [26, "jungle"], [32, "acacia"]];
  for (const [x0, w] of pallets) {
    for (let x = x0; x <= x0 + 1; x++) {
      for (let z = 5; z <= 6; z++) {
        g.set(x, 13, z, `${w}_planks`, {});
        g.set(x, 14, z, `${w}_slab`, { type: "bottom", waterlogged: "false" });
      }
    }
  }

  // focal piece: the tally desk on the lane from the doorway. Fence legs at y13, slab tops at y14 (type top),
  // two chairs (stairs, back to the desk's far side) on the near side, a barrel either side, candles on the top.
  for (let x = 20; x <= 22; x++) {
    g.set(x, 13, 8, "dark_oak_fence", { waterlogged: "false", north: "false", south: "false", east: "false", west: "false" });
    g.set(x, 14, 8, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
  g.set(20, 13, 9, ...B.stairs("dark_oak", "south", "bottom"));
  g.set(22, 13, 9, ...B.stairs("dark_oak", "south", "bottom"));
  g.set(19, 13, 7, "barrel", { facing: "up", open: "false" });
  g.set(23, 13, 7, "barrel", { facing: "up", open: "false" });
  g.set(20, 15, 8, "candle", { candles: "2", lit: "true", waterlogged: "false" });
  g.set(22, 15, 8, "candle", { candles: "1", lit: "true", waterlogged: "false" });

  // lights: hanging lanterns on chains down the room's centre line, and the focal piece's own lantern
  for (const x of [6, 13, 27, 34]) hangLantern(g, x, 10);
  for (const [x, z] of [[15, 6], [32, 7], [22, 11], [9, 12], [37, 8], [10, 8], [19, 11]]) hangLantern(g, x, z);
  hangLantern(g, 21, 8);

  // the dim cells cluster at the two ends of the store: a standing lantern on the floor by the east end, one on the
  // north wall's lane, and one on top of the west rack (the rack's top log carries it)
  g.set(33, 13, 13, ...B.lantern(false));
  g.set(24, 13, 5, ...B.lantern(false));
  g.set(3, 15, 5, ...B.lantern(false));
  g.set(31, 13, 5, ...B.lantern(false));
  g.set(9, 13, 13, ...B.lantern(false));
}
