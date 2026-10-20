// Interior designer for "Galleria hall" (room 19): a glazed arcade, shop bays along both walls, café tables on the south,
// a glass-blossom focal plinth on the north centre, moss planters, and a standing lantern on every counter and table.
// Box x106..169 z122..127 (y1..5). The promenade z124..125 stays clear end to end; every doorway's first cells are clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 106, Z0 = 122, W = 64, D = 6, YS = [1, 2, 3, 4, 5];
const L = {};
for (const y of YS) L[y] = Array.from({ length: D }, () => Array(W).fill(" "));

const put = (x, y, z, ch) => { L[y][z - Z0][x - X0] = ch; };
const fill = (x0, x1, z0, z1, y, ch) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(x, y, z, ch);
};

// North shop bay: smooth_quartz back at z122, polished_andesite counter at z123 with a top slab, lantern on the counter.
const northBay = (x0) => {
  fill(x0, x0 + 2, 122, 122, 1, "#");
  fill(x0, x0 + 2, 122, 122, 2, "#");
  fill(x0, x0 + 2, 122, 122, 3, "#");
  fill(x0, x0 + 2, 123, 123, 1, "p");
  fill(x0, x0 + 2, 123, 123, 2, "S");
  put(x0 + 1, 3, 123, "L");
};

// South shop bay: counter at z126; the back is the z127 glass wall the shell already holds (no write there).
const southBay = (x0) => {
  fill(x0, x0 + 2, 126, 126, 1, "p");
  fill(x0, x0 + 2, 126, 126, 2, "S");
  put(x0 + 1, 3, 126, "L");
};

// Café table at (x,126): fence post, sandstone top slab, a lantern on the top; two stair chairs (west, east). The south
// chair would sit in the z127 wall plane, so it is left out.
const table = (x) => {
  put(x, 1, 126, "f");
  put(x, 2, 126, "T");
  put(x, 3, 126, "L");
  put(x - 1, 1, 126, "w");
  put(x + 1, 1, 126, "e");
};

// Moss planter bed with flowering azaleas on top, two rows deep.
const planter = (x0, x1) => {
  fill(x0, x1, 122, 123, 1, "m");
  for (let x = x0; x <= x1; x++) for (let z = 122; z <= 123; z++) {
    put(x, 2, z, (x + z) % 2 ? "a" : "A");
  }
};

// North side: shop bays, planters, focal plinth, shop bays to the east end (lane x118..121 and x165..169 stay clear).
for (const x0 of [106, 109, 112, 115, 122, 125, 128, 140, 143, 146, 149, 156, 159, 162]) northBay(x0);
planter(131, 133);
planter(138, 139);
planter(152, 155);

// Focal piece: a sea-lantern plinth with a glass blossom of orange, red and yellow stained glass; end rods on top.
fill(134, 137, 122, 123, 1, "G");
const blossom = {
  2: [["o", "r", "o", "r"], ["r", "o", "r", "o"]],
  3: [["o", "y", "y", "o"], ["o", "y", "y", "o"]],
  4: [[" ", "r", "y", " "], [" ", "y", "r", " "]],
};
for (const y of [2, 3, 4]) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 4; dx++) {
  const ch = blossom[y][dz][dx];
  if (ch !== " ") put(134 + dx, y, 122 + dz, ch);
}
put(135, 5, 122, "R");
put(136, 5, 123, "R");

// South side: café tables west of the doors, shop bays east of them; x146..149 (the south doors) and x165..169 stay clear.
for (const x of [109, 114, 119, 124, 129]) table(x);
// Lamp post in the south-east corner (fence posts with a lantern on top), one cell in from the z127 wall: lights the
// east end, off the promenade.
put(168, 1, 126, "f");
put(168, 2, 126, "f");
put(168, 3, 126, "f");
put(168, 4, 126, "L");
for (const x0 of [131, 134, 137, 140, 143, 150, 153, 156, 159, 162]) southBay(x0);

const legend = {
  "#": "smooth_quartz",
  "S": ["smooth_quartz_slab", { type: "top" }],
  "p": "polished_andesite",
  "L": ["lantern", { hanging: "false" }],
  "T": ["smooth_sandstone_slab", { type: "top" }],
  "f": "oak_fence",
  "w": ["polished_andesite_stairs", { facing: "west", half: "bottom" }],
  "e": ["polished_andesite_stairs", { facing: "east", half: "bottom" }],
  "m": "moss_block",
  "a": "azalea",
  "A": "flowering_azalea",
  "G": "sea_lantern",
  "o": "orange_stained_glass",
  "r": "red_stained_glass",
  "y": "yellow_stained_glass",
  "R": "end_rod",
};

export function build(g) {
  for (const y of YS) {
    layers(g, [X0, y, Z0], legend, L[y].map((row) => row.join("")));
  }
}
