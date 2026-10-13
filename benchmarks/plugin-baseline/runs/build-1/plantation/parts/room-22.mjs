// Part: room: bedroom 5 (east rear bedroom). Interior air x55..60, z54..60, floor y11, air y11..16.
// Entered from the west wall (door x54 z57, lane kept clear at x55 z56..57); keep-clear cells for the other
// candidate doorways (north x56 z53, east x61 z56..57) stay free too. Bed on the west wall (head x55 z58), barrel
// nightstand with a lantern, a two-chest dresser on the north wall, a red rug in the middle, a barrel side table in
// the SE corner with a flower pot, and a hanging lantern from the plate.

import { B, layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { porchLantern } from "../vocab.mjs";

export function build(g) {
  layers(g, [55, 11, 54], { C: ["chest", { facing: "south" }], R: "red_carpet", K: "barrel" }, [[
    "..CC..", // z54: dresser chests on the north wall (x57, x58); x56 kept clear for the north doorway
    "..RRR.", // z55: red rug x57..59, z55..57
    "..RRR.", // z56
    "..RRR.", // z57: west lane (x55) and east doorway cells (x60) stay free
    "......", // z58: bed goes here
    "K.....", // z59: nightstand barrel at x55 (south of the bed head)
    ".....K", // z60: side table barrel at x60 (SE corner)
  ]]);
  layers(g, [55, 12, 54], { N: ["lantern", { hanging: "false" }], P: "flower_pot" }, [[
    "......", "......", "......", "......", "......",
    "N.....", // lantern standing on the bedside barrel
    ".....P", // flower pot on the side table
  ]]);
  bed(g, [56, 11, 58], "west", "red");          // foot x56, head x55 (pillow end on the west wall), z58
  porchLantern(g, 57, 16, 57);                   // iron_chain at y16 under the plate, lantern y15, over the rug
  porchLantern(g, 60, 16, 54);                   // second hanging lantern, north-east corner

  // Lamplighter: three lanterns hung low (lantern y13, iron_chain y14..16 up to the plate). Measured on a scratch copy
  // of the build with these forced in: `mcd light` gives min 8, dim 0, dark 0 (the two-lantern plan at y15 gives min 5).
  for (const [x, z] of [[56, 56], [59, 59], [58, 54]]) {
    for (let y = 14; y <= 16; y++) g.set(x, y, z, ...B.chain("y"));
    g.set(x, 13, z, ...B.lantern(true));
  }
}
