// Interior designer for "Pavilion D shops" (room 15): a bright shop floor. The north door's sight line ends on a
// glass-and-sea-lantern focal counter with benches in front of it; display plinths run along both side walls; floor
// lamps stand at the corners. The stair flight at x140..141 z99..105 and the door lane x170..173 stay clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// room box x 138..205, y 1..6, z 98..117: local dx = x - 138, dz = z - 98
const X0 = 138, Y0 = 1, Z0 = 98, W = 68, D = 20;

const LEGEND = {
  W: "white_concrete",
  Q: "smooth_quartz",
  S: B.stairs("smooth_quartz", "south"),
  F: "oak_fence",
  g: "glass",
  L: "sea_lantern",
  n: B.lantern(false),
};

// a (W x D) layer as rows, from [dx, dz, char] cells; later cells overwrite earlier ones, the rest is left as air
function grid(cells) {
  const rows = Array.from({ length: D }, () => Array(W).fill(" "));
  for (const [dx, dz, ch] of cells) rows[dz][dx] = ch;
  return rows.map((r) => r.join(""));
}

// the cells of a dx0..dx1 x dz0..dz1 rectangle, filled with ch
function rect(dx0, dx1, dz0, dz1, ch) {
  const out = [];
  for (let dz = dz0; dz <= dz1; dz++) for (let dx = dx0; dx <= dx1; dx++) out.push([dx, dz, ch]);
  return out;
}

// floor lamps: oak fence posts at y1..2 with a lantern on top at y3
const LAMP_POSTS = [[12, 3], [55, 3], [12, 17], [55, 17]];

// y1: the plinths, the focal counter, the benches and the lamp posts
const LAYER_1 = [
  ...rect(5, 6, 4, 16, "W"),          // west display plinths
  ...rect(61, 62, 4, 16, "W"),        // east display plinths
  ...rect(26, 41, 13, 14, "Q"),       // focal counter base
  ...rect(26, 29, 16, 16, "S"),       // benches facing the counter
  ...rect(38, 41, 16, 16, "S"),
  ...LAMP_POSTS.map(([dx, dz]) => [dx, dz, "F"]),
];

// y2: the glass tops of the plinths and counter, the sea lanterns that light them, the post fence tops
const LAYER_2 = [
  ...rect(5, 6, 4, 16, "g"),
  ...Array.from({ length: 13 }, (_, i) => [5, 4 + i, i % 4 === 0 ? "L" : "g"]),
  ...Array.from({ length: 13 }, (_, i) => [6, 4 + i, i % 4 === 0 ? "L" : "g"]),
  ...Array.from({ length: 13 }, (_, i) => [61, 4 + i, i % 4 === 2 ? "n" : "g"]),
  ...Array.from({ length: 13 }, (_, i) => [62, 4 + i, i % 4 === 2 ? "n" : "g"]),
  ...rect(26, 41, 13, 13, "g"),
  ...Array.from({ length: 16 }, (_, i) => [26 + i, 14, i % 2 === 0 ? "L" : "g"]),
  ...LAMP_POSTS.map(([dx, dz]) => [dx, dz, "F"]),
];

// y3: the lamp heads on the posts
const LAYER_3 = LAMP_POSTS.map(([dx, dz]) => [dx, dz, "n"]);

export function build(g) {
  layers(g, [X0, Y0, Z0], LEGEND, grid(LAYER_1));
  layers(g, [X0, Y0 + 1, Z0], LEGEND, grid(LAYER_2));
  layers(g, [X0, Y0 + 2, Z0], LEGEND, grid(LAYER_3));
}
