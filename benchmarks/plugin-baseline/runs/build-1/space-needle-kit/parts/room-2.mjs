// room: SkyLine, interior designer's room (low hexagonal event hall, gray glass, banquet tables and a bar).
// Inner air is the box [18,43,20,46,47,44]; the hall is the hexagon of apothem 12 inside it (the glass wall at 13).
// Focal piece: the bar on the north side, where the core doorway (x31..33 z29) looks. Banquet tables with chairs
// (stairs) either side, a lattice of sea lanterns hidden under the roof at y47 for light. Writes only the cells drawn
// below (layers() skips ' ' and the walls, the legs and the core are never touched).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const [X0, Z0, X1, Z1] = [18, 20, 46, 44];
const Y_FLOOR = 43;   // first air layer (SkyLine floor is y42)
const A = 12;         // hall apothem

// Cells of the hexagon (plan.md SkyLine convention: |dz|<=a, |0.866dx-0.5dz|<=a, |0.866dx+0.5dz|<=a)
const inHex = (x, z) => {
  const dx = x - 32, dz = z - 32;
  return Math.abs(dz) <= A && Math.abs(0.866 * dx - 0.5 * dz) <= A && Math.abs(0.866 * dx + 0.5 * dz) <= A;
};
// The core and its elevator shafts (x29..35, z27..35) and the lane from the core doorway north (x31..33, z22..28)
const reserved = (x, z) =>
  (x >= 29 && x <= 35 && z >= 27 && z <= 35) || (x >= 31 && x <= 33 && z >= 22 && z <= 28);

// Work grid: one character per cell, rows along +z, columns along +x, from (X0, Z0)
const W = X1 - X0 + 1, H = Z1 - Z0 + 1;
const grid43 = Array.from({ length: H }, () => Array(W).fill(" "));
const grid44 = Array.from({ length: H }, () => Array(W).fill(" "));
const grid47 = Array.from({ length: H }, () => Array(W).fill(" "));
const put = (grid, x, z, ch) => { grid[z - Z0][x - X0] = ch; };

// Chair character by the way its back faces: the stairs' facing is the side of the full back, away from the table.
const CHAIR = { north: "n", south: "s", east: "e", west: "w" };
const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// Banquet tables (post centres); chairs go on the four sides when the cell is floor, free and not reserved.
const tables = [[23, 25], [23, 31], [41, 25], [41, 31], [24, 39], [40, 39], [32, 40]];
const tableCells = new Set(tables.map(([x, z]) => `${x},${z}`));
for (const [tx, tz] of tables) {
  put(grid43, tx, tz, "T");        // white_concrete post
  put(grid44, tx, tz, "Q");        // smooth_quartz_slab (bottom) top
  for (const [dir, [dx, dz]] of Object.entries(STEP)) {
    const cx = tx + dx, cz = tz + dz;
    if (!inHex(cx, cz) || reserved(cx, cz) || tableCells.has(`${cx},${cz}`)) continue;
    put(grid43, cx, cz, CHAIR[dir]);
  }
}

// The bar, against the north glass: back row z20 (two high), counter z21 (post + slab), stools on z22 either side
// of the lane, so the lane x31..33 stays open up to the counter.
for (let x = 28; x <= 36; x++) {
  put(grid43, x, 20, "T");
  put(grid44, x, 20, "T");
  put(grid43, x, 21, "T");
  put(grid44, x, 21, "Q");
}
for (const x of [28, 29, 30, 34, 35, 36]) put(grid43, x, 22, "s");  // stools face the bar, backs to the room

// Hidden light: sea lanterns in the air under the roof (y47), clear of the core and lane. Trimmed by the lamplighter
// from the two offset lattices (45 lamps) to 35: a diagonal lattice of 21 (each floor cell within 3 blocks of one, so
// the floor 4 below it reads 8+), and 14 under the roof's eave just outside the glass (apothem 13..14), which light the
// rim the room box counts. Checked with `mcd light` (see the lamplighter's note in the room report).
const LAMPS = [
  [18, 35], [21, 31], [22, 38], [23, 20], [24, 27], [25, 34], [26, 41], [27, 23], [28, 30], [29, 37], [30, 44],
  [33, 40], [34, 22], [36, 36], [37, 43], [38, 25], [39, 32], [40, 39], [41, 21], [42, 28], [43, 35],
  [42, 42], [20, 25], [44, 25], [22, 42], [36, 28], [44, 38], [29, 23], [20, 39], [18, 29], [45, 28], [21, 24],
  [44, 35], [28, 28], [42, 41],
];
for (const [x, z] of LAMPS) {
  if (reserved(x, z)) continue;
  put(grid47, x, z, "L");
}

const legend = {
  T: "white_concrete",
  Q: ["smooth_quartz_slab", { type: "bottom" }],
  n: ["smooth_quartz_stairs", { facing: "north", half: "bottom" }],
  s: ["smooth_quartz_stairs", { facing: "south", half: "bottom" }],
  e: ["smooth_quartz_stairs", { facing: "east", half: "bottom" }],
  w: ["smooth_quartz_stairs", { facing: "west", half: "bottom" }],
  L: "sea_lantern",
};
const rows = (grid) => grid.map((r) => r.join(""));

export function build(g) {
  // y43 and y44 hold the furniture; y45..46 stay clear headroom; y47 holds the lamps under the roof
  const layersOut = [rows(grid43), rows(grid44), null, null, rows(grid47)];
  const origin = [X0, Y_FLOOR, Z0];
  for (let i = 0; i < layersOut.length; i++) {
    if (!layersOut[i]) continue;
    layers(g, [origin[0], origin[1] + i, origin[2]], legend, [layersOut[i]]);
  }
}
