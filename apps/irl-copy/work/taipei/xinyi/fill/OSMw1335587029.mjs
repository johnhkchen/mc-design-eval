import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1335587029";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 7, H = 19, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground levels relative to the lowest ground under the building.
const ground = new Map();
let base = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Number(gr));
  base = Math.min(base, Number(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const rel = (x, z) => ground.get(`${x},${z}`) - base;

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Exterior faces: a side is exterior when no footprint cell lies beyond it.
const exN = (x, z) => !has(x, z - 1); // front (street) side, north
const exS = (x, z) => !has(x, z + 1);
const exW = (x, z) => !has(x - 1, z);
const exE = (x, z) => !has(x + 1, z);

const doorX = 3;

for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const gY = rel(x, z);
  const isExt = exN(x, z) || exS(x, z) || exW(x, z) || exE(x, z);
  const front = exN(x, z);

  // Foundation: solid fill from y 0 up to the cell's ground.
  for (let y = 0; y < gY; y++) put(x, y, z, "gray_concrete");

  // Base course / ground floor slab.
  put(x, gY, z, isExt ? "polished_andesite" : "smooth_stone");

  // Ground storey (shopfront on the street side).
  for (let dy = 1; dy <= 2; dy++) {
    const y = gY + dy;
    if (!isExt) {
      // Interior air; warm light behind the shopfront glass.
      if (dy === 1 && x === 2 && z === 1) put(x, y, z, "glowstone");
      continue;
    }
    if (front) {
      if (x === doorX) {
        if (dy === 1) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
        } else {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
        }
      } else if (x === 0 || x === W - 1) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    } else {
      // Upper-style wall with a frame of piers and panes on the ground storey.
      const alongIndex = (exN(x, z) || exS(x, z)) ? x : z;
      if (alongIndex % 2 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // Storey line / floor slab between the two storeys.
  if (isExt) {
    put(x, gY + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  } else {
    put(x, gY + 3, z, "smooth_stone");
  }

  // Upper storey: window grid with frames, one warm light behind glass.
  for (let dy = 4; dy <= 5; dy++) {
    const y = gY + dy;
    if (!isExt) {
      if (dy === 4 && x === 3 && z === 1) put(x, y, z, "shroomlight");
      continue;
    }
    const alongIndex = (exN(x, z) || exS(x, z)) ? x : z;
    if (alongIndex % 2 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane");
  }

  // Roof slab and parapet cornice.
  if (isExt) {
    put(x, gY + 6, z, "stone_bricks");
  } else {
    put(x, gY + 6, z, "smooth_stone");
  }

  // Lintel over the entrance, inside the footprint.
  if (front && x === doorX) {
    put(x, gY + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant box on the interior of the roof, standing on the roof slab.
for (const [x, z] of [[2, 1], [3, 1], [2, 2], [3, 2]]) {
  if (has(x, z) && !(exN(x, z) || exS(x, z) || exW(x, z) || exE(x, z))) {
    const gY = rel(x, z);
    put(x, gY + 7, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
