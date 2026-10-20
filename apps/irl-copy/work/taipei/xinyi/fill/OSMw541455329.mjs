import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455329.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455329.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 20, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: find the door cells (two-wide entrance on the south/street face, x 9 and 10)
const doorCells = new Set();
for (const [x, z] of cells) {
  if ((x === 9 || x === 10) && !has(x, z + 1)) doorCells.add(`${x},${z}`);
}
if (doorCells.size === 0) {
  // fallback: first available edge cell near the middle
  for (const [x, z] of cells) {
    if (!has(x, z + 1) || !has(x, z - 1) || !has(x + 1, z) || !has(x - 1, z)) {
      if (Math.abs(x - 10) <= 2) { doorCells.add(`${x},${z}`); break; }
    }
  }
}

// Pass 2: build
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

  // Floors and roof deck (every cell carries its slabs)
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");        // ground floor / base
  put(x, gr + 5, z, edge ? "light_gray_concrete" : "smooth_stone");  // storey 2 floor
  put(x, gr + 10, z, edge ? "smooth_stone" : "gray_concrete");       // roof deck / cornice

  if (!edge) {
    // Rooftop plant on interior cells, centred on the footprint
    if (x >= 7 && x <= 12 && z >= 7 && z <= 12) put(x, gr + 11, z, "light_gray_concrete");
    if (x >= 8 && x <= 11 && z >= 8 && z <= 11) put(x, gr + 12, z, "iron_bars");
    continue;
  }

  // Facade of edge cells
  const k = (((x + z) % 3) + 3) % 3;
  const pier = k === 0;
  const isDoor = doorCells.has(`${x},${z}`);
  const hinge = x === 9 ? "left" : "right";

  // Storey 1 (shopfront)
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (isDoor) {
      if (y === gr + 1) {
        put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
      } else if (y === gr + 2) {
        put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
      } else if (y === gr + 3) {
        put(x, y, z, "glass_pane"); // transom
      } else {
        put(x, y, z, "white_concrete");
      }
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane");
    }
  }

  // Storey line between floors
  put(x, gr + 5, z, "light_gray_concrete");

  // Storey 2 (office windows)
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (pier) {
      put(x, y, z, "white_concrete");
    } else if (y === gr + 6 || y === gr + 9) {
      put(x, y, z, "light_gray_concrete"); // sill and head frames
    } else {
      // warm light behind some glass
      if (y === gr + 7 && (x * 3 + z * 5) % 7 === 0) put(x, y, z, "glowstone");
      else put(x, y, z, "glass_pane");
    }
  }

  // Cornice and parapet
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");
}

g.save(OUT);
