// Part: room: guest bath. A 3 x 7 bath, inner air x35..37 z54..60, floor row y4, lit from above.
// Focal piece: a three-cell water tub along the far (south) wall, in view from the door at z53 x36.
// Vanity on the east wall at the near end: a planks cabinet (two cells) with a basin cauldron and a flower pot on top.
// A barrel for linen by the west wall at the near end.
// Lane: x36 z54..59 stays clear from the door to the tub and the vanity; x35 z55..57 stays clear for the west doorways.
//
// Not built: the mansion shell carves every room's air and runParts locks it, so every write into this room is refused
// (10 of 10 here). The layout is kept below, as drawn, until the shell leaves room air unlocked.
// rows run along +x (x35, x36, x37), successive rows along +z (z54 .. z60)
// legend: B barrel, C dark_oak_planks, S cauldron, F flower_pot, W water_cauldron (level 3), L lantern hanging, M lantern standing
// y4:  z54 "B C" / z55 "  C" / z60 "WWW"
// y5:  z54 "M S" / z55 "  F"
// hanging lantern (36,9,59) "L"
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // lamplighter: three hanging lanterns from the ceiling down the centre line (x36 z55, z57, z59): every floor cell at 8+
  // (a standing lantern at 35,4,55 also reaches 8+ but takes the floor on the west lane)
  g.set(36, 9, 55, ...B.lantern(true));
  g.set(36, 9, 57, ...B.lantern(true));
  g.set(36, 9, 59, ...B.lantern(true));
}
