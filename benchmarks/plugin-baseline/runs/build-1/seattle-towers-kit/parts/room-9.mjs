// Room 9, KOMO W office floor (interior designer): an open-plan office floor under the bow. Inner air x112..142, z16..49,
// walking surface y 8, ceiling y 12. The stair flight from the core (x126..130, z41, rising west) is locked: nothing is
// placed in the core zone x123..132, z38..44. Focal piece: the conference table (x119..133, z23..24) that the core
// doorway looks at, with its chairs and hanging lanterns above. Desk pods run along the west and east sides.
// Tables and desks are solid smooth_quartz (a counter reads as a counter; no bottom slab under decor); chairs are
// smooth_quartz_stairs facing their back; light is hanging lanterns on a 6-block grid, 3 blocks below the ceiling.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 112, X1 = 142, Z0 = 16, Z1 = 49;
const W = X1 - X0 + 1, D = Z1 - Z0 + 1;

const blank = () => Array.from({ length: D }, () => Array(W).fill("."));
const FLOOR = blank();   // y 8: desks, table, chairs
const DECK = blank();    // y 9: desk plants and table lamps (stand on the block below)
const HANG = blank();    // y 11: hanging lanterns under the ceiling y 12
const put = (layer, x, z, c) => { layer[z - Z0][x - X0] = c; };

// Core zone (the locked stair and its foot and head): nothing placed there.
const inCore = (x, z) => x >= 123 && x <= 132 && z >= 38 && z <= 44;

// Desk pods: a 3-wide counter along x on the west (x113..115) and east (x137..139) sides, one chair on its south
// side facing north, a plant on the west end; rows every 4 blocks leave a 2-deep lane between pods.
const DESK_Z = [18, 22, 26, 30, 34, 38, 42, 46];
for (const z of DESK_Z) {
  for (const x0 of [113, 137]) {
    for (let x = x0; x <= x0 + 2; x++) put(FLOOR, x, z, "Q");
    put(DECK, x0, z, "a");
    put(FLOOR, x0 + 1, z + 1, "s");   // chair back to the south: seat faces the desk
  }
}

// Focal piece: the conference table, two blocks deep, with five chairs on each long side and standing lamps on it.
for (let x = 119; x <= 133; x++) for (const z of [23, 24]) put(FLOOR, x, z, "Q");
for (const x of [120, 123, 126, 129, 132]) {
  put(FLOOR, x, 22, "n");   // north side: back to the north, seat faces the table
  put(FLOOR, x, 25, "s");   // south side: back to the south
}
for (const x of [121, 127, 133]) put(DECK, x, 23, "l");

// Hanging lanterns on a 6-block grid: by construction every floor cell is at least 6 (the worst cell is 3 + 3 blocks
// off a lantern 3 blocks up; see $MCD room for the measured levels). The lanterns over the table are the brightest.
for (const x of [115, 121, 127, 133, 139]) {
  for (const z of [18, 24, 30, 36, 42, 48]) {
    if (inCore(x, z)) continue;
    put(HANG, x, z, "L");
  }
}

const legend = {
  Q: "smooth_quartz",
  n: ["smooth_quartz_stairs", { facing: "north", half: "bottom" }],
  s: ["smooth_quartz_stairs", { facing: "south", half: "bottom" }],
  a: ["azalea_leaves", { persistent: "true" }],
  l: ["lantern", { hanging: "false" }],
  L: ["lantern", { hanging: "true" }],
};

const rowsOf = (layer) => layer.map((r) => r.join(""));
const EMPTY = rowsOf(blank());

export function build(g) {
  // y 8 floor, y 9 decor, y 10 empty, y 11 hanging lanterns
  layers(g, [X0, 8, Z0], legend, [rowsOf(FLOOR), rowsOf(DECK), EMPTY, rowsOf(HANG)]);
}
