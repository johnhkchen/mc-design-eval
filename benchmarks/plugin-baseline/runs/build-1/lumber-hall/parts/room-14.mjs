// Room: Loft (interior designer's part). Plank and board store open to the roof: a focal work table on the centre
// line under a hung lantern, stacked boards as pallets, barrels and chests along the end walls, two benches, and
// tie beams at y 23 with lanterns hung from iron chains. Inner air x 3..39, z 4..33, y 19..23; floor y 18.
// The loading-door cells at both gables (x 10..13 and x 29..32, z 4..7 and z 30..33) and the stair 2 foot
// (x 3..6, z 22..31) stay clear. Draws the furniture as text rows (z 4..33, one char per x 3..39), then places it with layers().
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { beam } from "../vocab.mjs";

const X0 = 3, Z0 = 4, NX = 37, NZ = 30; // the box's x and z ranges (air x 3..39, z 4..33)

// a blank 37 x 30 floor plan; rows are z, columns are x (both from the box's corner)
function blank() {
  return Array.from({ length: NZ }, () => Array(NX).fill("."));
}

// paint a rectangle of absolute coordinates with one legend character
function put(rows, x0, x1, z0, z1, ch) {
  for (let z = z0; z <= z1; z++)
    for (let x = x0; x <= x1; x++) rows[z - Z0][x - X0] = ch;
}

const text = (rows) => rows.map((r) => r.join(""));

export function build(g) {
  const floor = blank(); // y 19: the things you walk around
  const top = blank(); // y 20: the table top

  // west end store: barrels along the wall x 5, planks stacked in pallets
  for (const z of [6, 7, 10, 11, 14, 15, 18, 19]) put(floor, 5, 5, z, z, "b");
  put(floor, 7, 8, 9, 10, "p");
  put(floor, 7, 8, 13, 14, "p");

  // east end store: chests and barrels on the wall x 38, pallets x 35..36
  put(floor, 38, 38, 6, 7, "k");
  for (const z of [10, 11, 14, 15, 18, 19]) put(floor, 38, 38, z, z, "b");
  put(floor, 35, 36, 9, 10, "p");
  put(floor, 35, 36, 26, 27, "p");

  // focal table: four legs and a slab top; the lantern hung over it is the room's brightest point
  put(floor, 19, 19, 15, 15, "f");
  put(floor, 23, 23, 15, 15, "f");
  put(floor, 19, 19, 17, 17, "f");
  put(floor, 23, 23, 17, 17, "f");
  put(top, 18, 24, 14, 18, "t");
  // benches either side of the table, backs to the walls of the table
  put(floor, 17, 17, 16, 16, "w");
  put(floor, 25, 25, 16, 16, "e");
  // pallets of boards either side of the table (one board high: a stacked top is a cell nobody can reach)
  put(floor, 14, 15, 14, 15, "p");
  put(floor, 27, 28, 14, 15, "p");

  // south store: chests facing the room, a pallet of boards by the south lane
  put(floor, 21, 22, 27, 27, "c");
  put(floor, 25, 26, 25, 26, "p");

  const legend = {
    b: ["barrel", { facing: "up" }],
    c: ["chest", { facing: "north" }], // south-wall chests, facing into the room
    k: ["chest", { facing: "west" }], // east-wall chests, facing into the room
    p: "dark_oak_planks",
    f: "dark_oak_fence",
    t: ["dark_oak_slab", { type: "bottom" }],
    w: ["dark_oak_stairs", { facing: "west", half: "bottom" }], // bench on the table's west side, back to the wall
    e: ["dark_oak_stairs", { facing: "east", half: "bottom" }], // bench on the table's east side
  };
  layers(g, [X0, 19, Z0], legend, [text(floor), text(top)]);

  // tie beams across the loft at y 23, and lanterns hung on iron chains beneath them
  for (const z of [8, 16, 25]) beam(g, 5, 37, 23, z, "x");
  const lanterns = [
    [8, 8], [16, 8], [24, 8], [32, 8],
    [21, 16],
    [8, 25], [20, 25], [32, 25],
  ];
  for (const [x, z] of lanterns) {
    g.set(x, 22, z, ...B.chain("y"));
    g.set(x, 21, z, ...B.lantern(true));
  }
  // a beam across the south end for the dark corners by the south loading doors
  beam(g, 5, 37, 23, 30, "x");
  for (const [x, z] of [[16, 30], [26, 30]]) {
    g.set(x, 22, z, ...B.chain("y"));
    g.set(x, 21, z, ...B.lantern(true));
  }
  // standing lanterns on the floor in the dark corners the light map reads (each stands on the loft floor)
  for (const [x, z] of [[14, 16], [28, 16], [37, 18], [5, 16], [35, 28], [36, 8], [23, 27], [4, 32]]) g.set(x, 19, z, ...B.lantern(false));
  // light map (mcd room): the dim north and south edges under the loading doors, and the mid-wall gap at x 11
  g.set(7, 19, 4, ...B.lantern(false));
  g.set(23, 19, 4, ...B.lantern(false));
  g.set(11, 22, 25, ...B.lantern(true)); // hangs from the z 25 tie beam at y 23
  g.set(14, 19, 33, ...B.lantern(false));
  g.set(16, 19, 16, ...B.lantern(false));
  g.set(33, 19, 33, ...B.lantern(false));
  g.set(5, 19, 20, ...B.lantern(false));
  g.set(6, 19, 11, ...B.lantern(false));
  g.set(26, 19, 15, ...B.lantern(false));
  g.set(19, 22, 8, ...B.lantern(true)); // hangs from the z 8 tie beam at y 23
}
