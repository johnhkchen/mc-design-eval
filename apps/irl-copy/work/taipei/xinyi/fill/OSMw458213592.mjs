import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw458213592";
const W = 41, H = 23, D = 90;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.floor(gr));

const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  g.set(x, y, z, id);
};

// Pane helper for glass
const GLASS = "light_blue_stained_glass_pane";
const FRAME = "white_concrete";
const WALL = "smooth_quartz";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const SLAB = "smooth_stone";
const ROOF = "light_gray_concrete";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(12, Math.floor(gr0)));
  const edge = isEdge(x, z);
  const i = x + z;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  if (!edge) {
    // Interior: ground-floor slab, storey-2 floor slab, roof slab; air between
    put(x, gr, z, SLAB);
    if (gr <= 5) put(x, 5, z, SLAB);
    if (gr <= 10) {
      put(x, 10, z, ROOF);
      // Rooftop plant units on a few interior cells
      if (x % 10 >= 3 && x % 10 <= 4 && z % 16 >= 5 && z % 16 <= 6) {
        put(x, 11, z, "iron_block");
      }
    }
    continue;
  }

  // Facade column, absolute storey bands
  for (let y = gr; y <= 11; y++) {
    let id;
    if (y === gr) id = BASE;
    else if (y === 11) id = FRAME;            // parapet
    else if (y === 10) id = WALL;             // cornice
    else if (y === 9) id = FRAME;             // spandrel
    else if (y === 8 || y === 7 || y === 6) {
      id = (i % 4 === 0 || i % 4 === 3) ? FRAME : GLASS; // piers and panes
    } else if (y === 5) id = FRAME;           // storey line
    else if (y === 4) id = WALL;              // lintel band
    else {
      // storey 1 (y gr+1..3)
      id = (i % 4 === 1 || i % 4 === 2) ? GLASS : WALL;
    }

    // Entrance on the front (z = 0) face
    if (z === 0 && x >= 18 && x <= 22 && y > gr && y <= gr + 3) {
      id = "glass";
    }
    // Red medical cross on the front face, upper storey
    if (z === 0 && y >= 6 && y <= 8) {
      if (x === 20 || (y === 7 && x >= 18 && x <= 22)) id = "red_concrete";
    }

    if (y >= 0) put(x, y, z, id);
  }

  // Warm light behind some upper-storey panes, standing on the storey-2 slab
  if (i % 4 === 1 || i % 4 === 2) {
    if ((x * 7 + z * 3) % 11 === 0 && 5 >= gr) {
      for (const [dx, dz] of DIRS) {
        const nx = x + dx, nz = z + dz;
        if (has(nx, nz) && !isEdge(nx, nz)) {
          put(nx, 6, nz, "glowstone");
          break;
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
