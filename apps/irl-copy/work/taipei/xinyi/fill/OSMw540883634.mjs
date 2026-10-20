import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883634";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (blocks above y=0)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Storey lines (1950s-80s Taipei concrete commercial block, 2 storeys):
// y 0..4 ground storey (shopfront, awning at 4), slab 5, y 6..9 upper storey, roof slab 10, parapet 11.
const WALL = "light_gray_concrete";
const BAND = "white_concrete";
const FLOOR = "light_gray_concrete";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";

// 1. Foundations and bodies
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  // foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  if (isEdge(x, z)) {
    // perimeter walls up to parapet
    for (let y = Math.max(gr, 0); y <= 9; y++) put(x, y, z, WALL);
    put(x, 10, z, BAND);   // roof edge band
    put(x, 11, z, BAND);   // parapet
  } else {
    // interior: air, with floor slabs per storey and roof slab
    if (gr <= 5) put(x, 5, z, FLOOR);
    put(x, 10, z, FLOOR);
  }
}

// Base course on the street-level perimeter
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z) && gr <= 1) put(x, 1, z, BASE);
}

// 2. Front facade (z=0, faces north): shopfront, awning, upper windows
for (let x = 1; x <= 8; x++) {
  // striped awning on the ground storey top
  put(x, 4, 0, x % 2 ? "red_concrete" : BAND);
}
for (const x of [1, 2, 3, 5, 6, 7, 8]) {
  put(x, 2, 0, "glass_pane");
  put(x, 3, 0, "glass_pane");
}
// entrance door centred on x=4
put(4, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(4, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(4, 3, 0, "glass_pane"); // transom
// upper windows with white sills; pillars at x=3 and x=6
for (const x of [1, 2, 4, 5, 7, 8]) {
  put(x, 6, 0, BAND);
  put(x, 7, 0, "glass_pane");
  put(x, 8, 0, "glass_pane");
}

// 3. Back facade (z=4): plain shopfront band and upper windows
for (const x of [2, 3, 6, 7]) {
  put(x, 2, 4, "glass_pane");
  put(x, 3, 4, "glass_pane");
}
for (const x of [1, 2, 4, 5, 7, 8]) {
  put(x, 6, 4, BAND);
  put(x, 7, 4, "glass_pane");
  put(x, 8, 4, "glass_pane");
}

// 4. Side walls (x=0 west, x=9 east): upper window strip, one ground window
for (const x of [0, 9]) {
  for (const z of [1, 2, 3]) {
    put(x, 6, z, BAND);
    put(x, 7, z, "glass_pane");
    put(x, 8, z, "glass_pane");
  }
  put(x, 2, 2, "glass_pane");
  put(x, 3, 2, "glass_pane");
}

// 5. Warm lights behind glass (interior air cells)
put(4, 3, 1, "glowstone");
put(2, 2, 1, "shroomlight");
put(7, 8, 1, "shroomlight");
put(1, 7, 3, "shroomlight");

// 6. Roof: water tank, condenser units, lightning rod
for (let y = 11; y <= 13; y++) {
  put(7, y, 2, "iron_block");
  put(8, y, 2, "iron_block");
  put(7, y, 3, "iron_block");
  put(8, y, 3, "iron_block");
}
put(1, 11, 2, "light_gray_concrete");
put(2, 11, 2, "light_gray_concrete");
put(2, 11, 3, "light_gray_concrete");
put(5, 14, 2, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
