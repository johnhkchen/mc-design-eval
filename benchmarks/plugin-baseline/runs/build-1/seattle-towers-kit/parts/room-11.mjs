// Room 11, Hyatt lobby and breakfast room (interior designer). Inner air x 154..182, y 1..6, z 66..90; doors on the north
// wall at x 172..175 (the court). Furnished as a hotel lobby: a front desk on the axis of the doors (the focal piece),
// a breakfast buffet along the west wall with four two-seat tables, and two lounge groups on the east side. Every
// furniture block is a palette block (quartz stairs as chairs, top quartz slabs as table tops, light grey posts as legs,
// sandstone counters, lanterns). Lanterns hang from the ceiling at y 6 (the shell's slab at y 7) and stand on the desk
// and tables. Lanes: 2 wide from the doors straight south to the desk, 1 wide between the buffet and the tables.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 154, X1 = 182, Z0 = 66, Z1 = 90;
const W = X1 - X0 + 1, D = Z1 - Z0 + 1;
const Y0 = 1, NY = 6;                                    // interior layers y 1..6

// One character grid per layer (y 1..6); '.' = left alone.
const grid = () => Array.from({ length: NY }, () => Array.from({ length: D }, () => Array(W).fill(".")));
const cells = grid();
const put = (y, x, z, ch) => { cells[y - Y0][z - Z0][x - X0] = ch; };

// Breakfast buffet: sandstone counter on the west wall (x 155), z 68..82, top slab on it.
for (let z = 68; z <= 82; z++) { put(1, 155, z, "S"); put(2, 155, z, "T"); }

// Breakfast tables at x 159, with a chair on each side (west chair faces west, east chair faces east: backs outward).
for (const z of [69, 73, 77, 81]) {
  put(1, 159, z, "L"); put(2, 159, z, "T");
  put(1, 158, z, "w"); put(1, 160, z, "e");
}
// Standing lanterns on two of the breakfast tables give the light at seat height.
put(3, 159, 73, "l"); put(3, 159, 81, "l");

// Front desk, the focal piece: sandstone counter x 168..177 at z 86 with a top slab, staff side to the south.
for (let x = 168; x <= 177; x++) { put(1, x, 86, "S"); put(2, x, 86, "T"); }
put(3, 169, 86, "l"); put(3, 176, 86, "l");

// Lounge groups on the east side: table at x 179 with chairs west (x 178) and east (x 180).
for (const z of [71, 76]) {
  put(1, 179, z, "L"); put(2, 179, z, "T");
  put(1, 178, z, "w"); put(1, 180, z, "e");
}
put(3, 179, 76, "l");

// Hanging lanterns from the ceiling (y 6): a grid clear of the door lane (x 172..175) and of the walk lines.
for (const z of [68, 74, 80, 88]) for (const x of [157, 163, 169, 181]) put(6, x, z, "h");
put(6, 172, 84, "h");

const legend = {
  L: "light_gray_concrete",
  S: "smooth_sandstone",
  T: ["smooth_quartz_slab", { type: "top" }],
  w: ["quartz_stairs", { facing: "west", half: "bottom" }],
  e: ["quartz_stairs", { facing: "east", half: "bottom" }],
  l: ["lantern", { hanging: "false" }],
  h: ["lantern", { hanging: "true" }],
};

export function build(g) {
  layers(g, [X0, Y0, Z0], legend, cells.map((layer) => layer.map((row) => row.join(""))));
}
