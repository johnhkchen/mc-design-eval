// Part "room: S wing halls": the interior of the south wing's ground halls, a classroom and workshop display.
// Inner air x 1..130, z 164..170, y 1..9. Doorways on the north wall (z 163) at x 14..15, 30..31, 46..47.
// Layout: a clear north lane (z 164..166) and a clear south lane (z 170) run the length of the room; a demonstration
// counter with a row of sea lanterns sits in the doorway sightline (x 26..35, z 168); a row of classroom desks with
// stair chairs fills x 49..127 along z 167..169; lamp posts (quartz pillar + standing lantern) run along z 167 every
// 7 cells, so every floor cell is lit at 8 or more.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 1, X1 = 130, Z0 = 164, Z1 = 170, Y_TOP = 5;
const W = X1 - X0 + 1, D = Z1 - Z0 + 1;

const legend = {
  Q: ["quartz_pillar", { axis: "y" }],                                        // desk and counter legs, lamp posts
  T: ["smooth_quartz_slab", { type: "top" }],                                 // desk and counter tops
  n: ["smooth_quartz_stairs", { facing: "north", half: "bottom", shape: "straight" }], // chair, back to the north
  s: ["smooth_quartz_stairs", { facing: "south", half: "bottom", shape: "straight" }], // chair, back to the south
  L: ["lantern", { hanging: "false" }],                                       // standing lamp on a post
  S: "sea_lantern",                                                           // the counter's glowing display
};

// Cell grid: cells[y][z][x], x and z as offsets from X0 and Z0, y from 1.
const cells = Array.from({ length: Y_TOP }, () => Array.from({ length: D }, () => Array(W).fill(".")));
const put = (x, y, z, ch) => { cells[y - 1][z - Z0][x - X0] = ch; };

// Lamp posts: a quartz pillar at y 1 with a standing lantern on top, every 7 cells along z 167.
for (let x = 4; x <= X1; x += 7) {
  if (x >= 26 && x <= 36) continue;   // the counter's lights stand on the counter instead
  put(x, 1, 167, "Q");
  put(x, 2, 167, "L");
}

// The one lantern the room check asked for: a standing lantern on the ground at the counter's west end.
put(33, 1, 167, "L");

// Demonstration counter in the doorway sightline: plinth y 1..3, top slab y 4, sea lanterns on top.
for (let x = 26; x <= 35; x++) {
  for (let y = 1; y <= 3; y++) put(x, y, 168, "Q");
  put(x, 4, 168, "T");
}
for (const x of [27, 30, 33]) put(x, 5, 168, "S");

// Classroom desks: two cells wide along x, one row at z 168, a stair chair on each side.
for (let x = 49; x <= 126; x += 7) {
  for (const dx of [0, 1]) {
    for (let y = 1; y <= 3; y++) put(x + dx, y, 168, "Q");
    put(x + dx, 4, 168, "T");
    put(x + dx, 1, 167, "n");
    put(x + dx, 1, 169, "s");
  }
}

// The layers, bottom up; each is D rows of W characters (rows along +x, successive rows along +z).
const layersOut = cells.map((rows) => rows.map((r) => r.join("")));

export function build(g) {
  layers(g, [X0, 1, Z0], legend, layersOut);
}
