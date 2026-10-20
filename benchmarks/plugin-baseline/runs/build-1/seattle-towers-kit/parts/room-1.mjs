// Room 1, KOMO E drum restaurant (interior designer): the drum's round restaurant, inside its box [6,1,13]..[20,6,27].
// Focal piece: the bar along the south wall, where the door's view ends. Four round tables (oak fence post, top
// quartz slab, quartz stairs as chairs) in the dining floor. A stair flight is already built along z 15 (x 8..14) by
// the stair joiner: the room keeps to its north and south of it and never touches its cells.
// Lanterns hang from the ceiling (y 7) at y 6: over each table, along the bar, and in the north strip.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [6, 1, 13]; // the room's floor corner (x 6, z 13); rows run along +x, one row per z from 13 to 27
const WIDTH = 15; // x 6..20
const DEPTH = 15; // z 13..27

// One layer as text: `cells` maps a z to a string of characters, where character i is x = 6 + i. Missing rows are air.
function layer(cells) {
  return Array.from({ length: DEPTH }, (_, r) => (cells[13 + r] ?? "").padEnd(WIDTH, "."));
}

export function build(g) {
  // Floor (y 1): table posts, chairs (a stair's back is the side named by its facing: a chair west of a table faces east,
  // back to the west), and the bar base. Each chair stands beside a table post.
  const floor = {
    f: "oak_fence",
    d: "polished_diorite",
    b: "birch_planks",
    N: ["quartz_stairs", { facing: "north", half: "bottom", shape: "straight" }],
    S: ["quartz_stairs", { facing: "south", half: "bottom", shape: "straight" }],
    W: ["quartz_stairs", { facing: "west", half: "bottom", shape: "straight" }],
    E: ["quartz_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  };
  layers(g, [ORIGIN[0], 1, ORIGIN[2]], floor, layer({
    17: "..N.....N",          // chairs north of T1 (8,18) and T2 (14,18)
    18: ".WfE...WfE",         // T1 at x 8, T2 at x 14
    19: "..S.....S",         // chairs south of T1 and T2
    21: "..N.....N",         // chairs north of T3 (8,22) and T4 (14,22)
    22: ".WfE...WfE",         // T3, T4
    23: "..S.....S",         // chairs south of T3 and T4
    26: "...ddddddddddd",    // bar base, x 9..19
    27: "...bbbbbbbbbbb",    // back bar, against the drum glass
  }));

  // y 2: table tops (top slabs on the posts, so they sit at the top of their cell) and the counter top (a bottom
  // slab on the bar base). Back bar continues to y 2.
  const top = {
    Q: ["smooth_quartz_slab", { type: "top" }],
    z: ["smooth_quartz_slab", { type: "bottom" }],
    b: "birch_planks",
  };
  layers(g, [ORIGIN[0], 2, ORIGIN[2]], top, layer({
    18: "..Q.....Q",
    22: "..Q.....Q",
    26: "...zzzzzzzzzzz",
    27: "...bbbbbbbbbbb",
  }));

  // y 6: hanging lanterns from the ceiling at y 7 (a hanging lantern hangs from the block above it).
  const lamps = { L: ["lantern", { hanging: "true" }] };
  layers(g, [ORIGIN[0], 6, ORIGIN[2]], lamps, layer({
    14: "......L.....L",     // north strip, x 12 and x 18
    18: "..L.....L",         // over T1 and T2
    22: "..L.....L",         // over T3 and T4
    25: "...L.....L",        // over the bar's customer lane, x 11 and x 16
  }));
}
