// Room 2, KOMO E atrium lobby (interior designer). Inner air x 26..58, y 1..6, z 8..45 (rooms.json box 26,1,8,58,6,45).
// Focal piece: the reception desk on the north-south axis, with the TV wall behind it (south). Benches face the desk from
// the north; two lounge groups (table with two chairs) stand on the west and east sides. Hanging lanterns on a 8-block
// grid light the floor from the ceiling (y 7, the shell's floor). Nothing stands in a doorway's first cell.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Reception desk (focal) and the TV wall behind it, with a lit band across the top of the screen.
  // Desk: solid block at y 1 (a counter) with desk lamps standing on it.
  // TV wall: black screen 4 high at z 20, lit strip at y 5.
  g.fill([37, 1, 20], [47, 4, 20], "black_concrete");
  g.fill([37, 5, 20], [47, 5, 20], "sea_lantern");

  // Floor-level furniture drawn as text. Origin [30, 1, 10]: rows run along +x (x 30..48), successive rows along +z (z 10..27).
  // b = bench (smooth_quartz_stairs, back to the north, seat faces the desk); d = desk / table block;
  // w = chair with its back west (seat faces east); e = chair with its back east (seat faces west).
  const legend = {
    b: ["smooth_quartz_stairs", { facing: "north" }],
    d: "smooth_quartz",
    w: ["smooth_quartz_stairs", { facing: "west" }],
    e: ["smooth_quartz_stairs", { facing: "east" }],
  };
  const rows = [
    "...................", // z10
    "...................", // z11
    "...................", // z12
    "........b.b.b.b.b..", // z13 benches x 38,40,42,44,46
    "...................", // z14
    "...................", // z15
    ".......ddddddddddd.", // z16 reception desk x 37..47
    "...................", // z17
    "...................", // z18
    "...................", // z19
    "...................", // z20 (TV wall is filled above)
    "...................", // z21
    "...................", // z22
    "...................", // z23
    "...................", // z24
    "...................", // z25
    "...................", // z26
    "wde................", // z27 west lounge: chair x30, table x31, chair x32
  ];
  layers(g, [30, 1, 10], legend, rows);

  // Desk lamps standing on the reception desk (lanterns on a block: hanging false).
  for (const x of [38, 42, 46]) g.set(x, 2, 16, ...B.lantern(false));

  // Lounge table lamps and the east lounge (table at x 52, z 27, chairs either side).
  g.set(31, 2, 27, ...B.lantern(false));
  g.set(52, 1, 27, "smooth_quartz");
  g.set(52, 2, 27, ...B.lantern(false));
  g.set(51, 1, 27, ...B.stairs("smooth_quartz", "west"));
  g.set(53, 1, 27, ...B.stairs("smooth_quartz", "east"));

  // Hanging lanterns on an 8-block grid under the ceiling (y 7), light level 8+ across the floor.
  for (const x of [30, 38, 46, 54]) {
    for (const z of [10, 18, 26, 34, 42]) g.set(x, 6, z, ...B.lantern(true));
  }
  return g;
}
