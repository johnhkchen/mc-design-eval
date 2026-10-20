import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542602809";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 41, H = 23, D = 10;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height of that cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const glass = "light_blue_stained_glass";
const frame = "white_concrete";
const wall = "white_concrete";
const band = "light_gray_concrete";
const floor = "smooth_stone";
const base = "stone_bricks";
const awning = "red_concrete";
const doorX = new Set([2, 38]);

for (const [x, z, gr] of cells) {
  if (gr + 11 > H - 1) continue; // keep within the canvas
  const outer = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const front = z === 0;
  const back = z === D - 1;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, base);

  // Ground-floor slab / base course
  put(x, gr, z, outer ? base : floor);
  // First floor slab with a storey line on the walls
  put(x, gr + 5, z, outer ? band : floor);
  // Roof slab
  put(x, gr + 10, z, floor);

  if (!outer) {
    // Interior: air gap, with warm lights just behind the front-row glass
    if (x % 8 === 5) put(x, 1 + 0, z, "air"); // no-op safety on open floor
    if (z === 1 && x >= 1 && x <= W - 2) {
      if (x % 8 === 1) put(x, gr + 7, z, "glowstone");
      if (x % 8 === 5) put(x, gr + 2, z, "shroomlight");
    }
    // Rooftop unit on the roof
    if (x % 10 === 5 && z === 5) put(x, gr + 11, z, "iron_block");
    continue;
  }

  // Outer shell: walls on every storey, with a parapet on top
  for (let y = gr + 1; y <= gr + 10; y++) {
    if (y === gr + 5) continue;
    put(x, y, z, wall);
  }
  put(x, gr + 11, z, band); // parapet cap

  if (front) {
    // Street front: shopfront on the ground floor, windows above
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (doorX.has(x)) continue;
      put(x, y, z, x % 4 === 0 ? frame : glass);
    }
    put(x, gr + 4, z, awning);
    for (let y = gr + 6; y <= gr + 9; y++) {
      put(x, y, z, x % 4 === 0 || x % 4 === 3 ? frame : glass);
    }
    if (doorX.has(x)) {
      const props = (half) => ({
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 1, z, "spruce_door", props("lower"));
      put(x, gr + 2, z, "spruce_door", props("upper"));
    }
  } else if (back) {
    // Rear face: same window grid, no shopfront
    for (let y = gr + 1; y <= gr + 3; y++) {
      put(x, y, z, x % 4 === 0 ? frame : glass);
    }
    put(x, gr + 4, z, frame);
    for (let y = gr + 6; y <= gr + 9; y++) {
      put(x, y, z, x % 4 === 0 || x % 4 === 3 ? frame : glass);
    }
  }
  // End walls (x = 0 or W-1) stay plain white with the storey line
}

const out = `${DIR}/${ID}.nbt`;
g.save(out);
