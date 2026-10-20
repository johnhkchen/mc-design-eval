import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 31 x 8 footprint, roof about 7 blocks above lowest ground.
// Read as a single commercial storey with a 3-block shopfront, a floor band at y=4,
// and an upper-floor band of glass in a white-concrete frame, capped by a quartz
// cornice at y=6 (roof surface at y=7). Reads as a 1960s-80s Taipei shophouse
// frontage: white tiled concrete, grey granite base, aluminium-look glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw1341337592.cells.json`, "utf8"));

const W = 31, H = 19, D = 8;
const ROOF = 7;        // roof surface sits at y=7 (top solid layer y=6)
const FLOOR = 4;       // floor slab / storey band
const SHOP_TOP = 3;    // shopfront lintel row
const DOOR_X = 14;

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

for (const [x, z, gr] of cells) {
  // Foundation up to the cell's ground so nothing floats on the slope.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");
  if (gr >= ROOF) continue;

  const edge =
    x === 0 || x === W - 1 || z === 0 || z === D - 1 ||
    !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Storey structure: solid perimeter shell, floor slab at FLOOR, roof slab at ROOF-1.
  for (let y = gr; y <= ROOF - 1; y++) {
    let id = null;
    if (y === FLOOR) id = "light_gray_concrete";
    else if (y === ROOF - 1) id = "smooth_quartz";
    else if (edge) id = "white_concrete";
    if (id) S(x, y, z, id);
  }

  // Front facade (z = 0).
  if (z === 0) {
    const pillar = x % 4 === 0 || x === W - 1;
    for (let y = gr; y <= 5; y++) {
      if (y === FLOOR) continue;
      if (y < SHOP_TOP) {
        // Shopfront: granite base course, white pilasters, glass between.
        if (y === gr) S(x, y, z, pillar ? "white_concrete" : "polished_granite");
        else S(x, y, z, pillar ? "white_concrete" : "glass");
      } else if (y === SHOP_TOP) {
        S(x, y, z, "white_concrete"); // lintel
      } else if (y === 5) {
        // Upper windows in a white frame.
        S(x, y, z, pillar ? "white_concrete" : "glass");
      }
    }
  }

  // Back face (z = D-1): plainer, with a window row.
  if (z === D - 1 && edge) {
    if (x % 4 !== 0 && x !== W - 1 && x !== 0) {
      for (let y = gr; y <= 5; y++) {
        if (y === FLOOR || y === ROOF - 1) continue;
        if (y === 5) S(x, y, z, "glass");
      }
    }
  }
}

// Entrance door and canopy, after the facade pass.
for (const [x, z, gr] of cells) {
  if (z !== 0 || x !== DOOR_X || gr > 1) continue;
  S(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}
for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) {
  for (const z of [1, 2]) {
    if (!has(x, z) || gnd(x, z) >= SHOP_TOP) continue;
    S(x, SHOP_TOP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights behind glass, with an air gap at z = 1.
for (const [x, z, gr] of cells) {
  if (z !== 2) continue;
  if (x % 8 === 2 && gr + 1 < SHOP_TOP && has(x, 0)) S(x, gr + 1, z, "glowstone");
  if (x % 8 === 6 && has(x, 0) && gnd(x, 0) < 5) S(x, 5, z, "shroomlight");
}

// Rooftop plant: two condenser blocks standing on the roof.
for (const [x0, x1, z0, z1] of [[6, 9, 2, 3], [20, 23, 4, 5]]) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z) && gnd(x, z) < ROOF) S(x, ROOF, z, "light_gray_concrete");
}

g.save(`${DIR}/OSMw1341337592.nbt`);
