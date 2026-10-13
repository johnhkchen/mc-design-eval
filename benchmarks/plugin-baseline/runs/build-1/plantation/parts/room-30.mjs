// Part: room: rear porch. Interior of the one-storey back porch, box x37..58 z76..79, air y4..7.
// Two tables with rocking-chair groups (dark-oak stairs as seats, a fence post and top slab as the table), each
// lit by a standing lantern; a white rug under the west group; barrels in the back corners with flower pots on them.
// The door (x47..48, z75) and the steps (x45..50, z80) are joined by a clear lane x46..49. Columns at z79 x37/41/45/50/54/58
// belong to the colonnade: nothing is written there.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [37, 4, 76];

export function build(g) {
  const legend = {
    B: ["barrel", { facing: "up", open: "false" }],
    N: B.stairs("dark_oak", "north", "bottom"), // chair, back to the north: its seat faces south, the table
    W: B.stairs("dark_oak", "west", "bottom"), // chair west of its table, seat faces east
    E: B.stairs("dark_oak", "east", "bottom"), // chair east of its table, seat faces west
    F: B.fence("dark_oak"), // table leg
    T: B.slab("dark_oak", "top"), // table top, a top slab so the things on it stand on a top face
    C: "white_carpet",
    P: "flower_pot",
    L: B.lantern(false), // standing lantern on the table top
  };

  // x37..58 (rows along +x), z76..79 (successive rows along +z). Layer y4: furniture on the floor.
  // The columns at z79 (x37, 41, 45, 50, 54, 58) are not drawn here.
  const floor = [
    "B....N...............B", // z76: barrels in the corners, chair north of the west table
    "....WFE........WFE....", // z77: west table with chairs either side; east table likewise
    "....CCC........L......", // z78: white rug under the west group; a standing lantern on the floor by the east chairs
    "..F......F..F.........", // z79: lamp-post fences (x39 west, x46 and x49 either side of the lane to the steps)
  ];
  // Layer y5: table tops (top slabs) and the pot on the barrel.
  const tops = [
    "P....................P", // z76: flower pots on the barrels
    ".....T..........T.....", // z77: the two table tops
    "......................",
    "..F......F..F.........", // z79: second section of each lamp post
  ];
  // Layer y6: a standing lantern on each table and on each lamp post, the light for the room.
  const lamps = [
    "......................",
    ".....L..........L.....",
    "......................",
    "..L......L..L.........", // z79: lanterns on top of the lamp posts
  ];
  return layers(g, ORIGIN, legend, [floor, tops, lamps]);
}
