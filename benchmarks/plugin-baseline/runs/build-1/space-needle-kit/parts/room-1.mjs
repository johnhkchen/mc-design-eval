// room: Pavilion, interior designer's room (ticket hall and gift shop).
// Inner air: disc r<=13.5 about (32,32), minus the core (x29..35 z29..35), the elevator shafts (x29..30 and 34..35,
// z27..28) and the entry lane (x31..33, z19..28, kept clear from the main door to the core doorway).
// Palette only (palette.json): counters are full smooth_quartz blocks, the ticket desk and benches are stairs and
// slabs (tops on full blocks), light is sea_lantern (on counter tops and under the roof).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const CX = 32, CZ = 32;
const X0 = 19, Z0 = 19, X1 = 45, Z1 = 45;   // the room's box
const LAYERS = [2, 3, 4, 5, 6, 7];          // room air y2..7

// Cells a player may use: inside the wall ring, outside the core and the shafts, and not in the entry lane.
function inside(x, z) {
  if (Math.hypot(x - CX, z - CZ) > 13.5) return false;
  if (x >= 29 && x <= 35 && z >= 27 && z <= 35) return false;   // core and shafts
  if (x >= 31 && x <= 33 && z >= 19 && z <= 28) return false;   // entry lane
  return true;
}

// Furniture as text: one map per y level, '.' = nothing. The legend gives each character its block.
// Ticket desk (focal, west of the lane, faces the door): counter of full blocks with lamps on top.
const furn = {};   // "x,y,z" -> char
function put(x, y, z, ch) {
  if (!inside(x, z)) throw new Error(`room-1: ${x},${y},${z} is not interior air`);
  furn[`${x},${y},${z}`] = ch;
}
function run(x0, x1, z, y, ch) { for (let x = x0; x <= x1; x++) put(x, y, z, ch); }
function mirror(x) { return 64 - x; }

// Ticket desk (west) and its mirror, the gift counter (east).
for (const [a, b] of [[24, 27], [mirror(27), mirror(24)]]) {
  run(a, b, 22, 2, "Q");                    // counter block, y2
  put(a, 3, 22, "W");                       // white posts at the ends of the top
  put(b, 3, 22, "W");
  put(a + 1, 3, 22, "S");                   // two lamps on the middle of the top
  put(a + 2, 3, 22, "S");
}
// Waiting benches: stairs with the back to the wall (west bench faces east, east bench faces west).
for (const z of [29, 30, 31]) {
  put(23, 2, z, "B");                       // west bench, facing: west (back on the west side)
  put(mirror(23), 2, z, "E");               // east bench, facing: east
}
// Gift-shop display islands: full blocks with an accent block on top.
for (const z of [28, 30]) {
  run(38, 39, z, 2, "Q");
  put(38, 3, z, "A");
}
// Lamp posts along the glass: a white post on the floor with a sea lantern on top (lifts the room's corners).
for (const [x, z] of [[23, 23], [41, 23], [23, 32], [41, 32], [23, 41], [41, 41], [28, 44], [36, 44]]) {
  put(x, 2, z, "P");
  put(x, 3, z, "G");
}
// Ceiling lights, hung under the roof disc (y8): sea lanterns at y7.
for (const [x, z] of [[27, 25], [37, 25], [25, 33], [39, 33], [32, 40], [32, 21]]) {
  if (inside(x, z)) put(x, 7, z, "L");
}

const legend = {
  Q: "smooth_quartz",
  S: "sea_lantern",
  W: "white_concrete",
  A: "gold_block",
  P: "white_concrete",
  G: "sea_lantern",
  L: "sea_lantern",
  B: ["smooth_quartz_stairs", { facing: "west", half: "bottom", shape: "straight" }],
  E: ["smooth_quartz_stairs", { facing: "east", half: "bottom", shape: "straight" }],
};

// One text layer per room y level; each row is z, columns x (X0..X1).
function rowsAt(y) {
  const rows = [];
  for (let z = Z0; z <= Z1; z++) {
    let row = "";
    for (let x = X0; x <= X1; x++) row += furn[`${x},${y},${z}`] ?? ".";
    rows.push(row);
  }
  return rows;
}

export function build(g) {
  layers(g, [X0, LAYERS[0], Z0], legend, LAYERS.map(rowsAt));
}
