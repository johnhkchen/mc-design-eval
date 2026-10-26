import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 15, H = 18, D = 4;
const STOREY = 3;

const cells = JSON.parse(readFileSync(`${DIR}/DC86592.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  cm.set(`${x},${z}`, { gr: Math.max(0, Math.round(gr)), rf: Math.round(rf) });
}
const has = (x, z) => cm.has(`${x},${z}`);

const put = (x, y, z, id, st) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const GLASS = { east: "true", west: "true", south: "false", north: "false", waterlogged: "false" };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "true", waterlogged: "false" };

const frontXs = cells.filter(c => c[1] === 0).map(c => c[0]);
const doorX = frontXs.length ? Math.min(...frontXs) + 1 : 1;

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr, rf } = cm.get(`${x},${z}`);
  const b = gr;
  const R = Math.min(H - 2, Math.max(rf, b + 5));
  const interior = z > 0 && z < D - 1 && has(x - 1, z) && has(x + 1, z);
  const front = z === 0;
  const back = z === D - 1;
  const sideEdge = !interior && !front && !back && z > 0 && z < D - 1;

  // Foundation and base course
  for (let y = 0; y <= b; y++) put(x, y, z, "stone_bricks");

  // Walls, floor slabs, roof deck
  for (let y = b + 1; y <= R - 1; y++) {
    const rel = y - b;
    if (y === R - 1) {
      put(x, y, z, "smooth_stone");
    } else if (interior) {
      if (rel % STOREY === 0) put(x, y, z, "stone_bricks");
    } else {
      if (rel % STOREY === 0 && front) put(x, y, z, "smooth_stone");
      else put(x, y, z, "bricks");
    }
  }

  // Continuous brick parapet on exterior cells
  if (!interior) put(x, R, z, "bricks");

  // Ground-floor shopfront (front face)
  if (front) {
    put(x, b + 3, z, "dark_oak_planks");              // fascia band
    if (x === doorX) {
      put(x, b + 1, z, "dark_oak_door", DOOR("lower"));
      put(x, b + 2, z, "dark_oak_door", DOOR("upper"));
      put(x, b + 2, z, "lantern", LANTERN);
    } else if (x % 3 === 0) {
      // brick piers between shopfronts
      put(x, b + 1, z, "bricks");
      put(x, b + 2, z, "bricks");
    } else {
      put(x, b + 1, z, "glass_pane", GLASS);
      if (x % 3 === 2) {
        put(x, b + 2, z, "lantern", LANTERN);
      } else {
        put(x, b + 2, z, "glass_pane", GLASS);
      }
    }
    // warm light behind shopfront glass
    if (has(x, 1) && x !== doorX && x % 3 === 1) {
      put(x, b + 1, 1, "glowstone");
    }
  }

  // Upper storeys: window grids (fit under deck; single row if needed)
  for (let k = 1; b + STOREY * k < R - 1; k++) {
    const fl = b + STOREY * k;
    const top = Math.min(fl + 2, R - 2);
    if (fl + 1 > R - 2) break;
    const rows = [];
    for (let y = fl + 1; y <= top; y++) rows.push(y);

    if (front && x % 3 !== 0) {
      for (const y of rows) put(x, y, z, "glass_pane", GLASS);
      if (has(x, 1) && x % 3 === 1 && k % 2 === 1) put(x, fl + 1, 1, "glowstone");
    }
    if (back && x % 2 === 0) {
      for (const y of rows) put(x, y, z, "glass_pane", GLASS);
    }
    if (sideEdge && (z === 1 || z === 2) && (!has(x - 1, z) || !has(x + 1, z)) && z === 1) {
      for (const y of rows) put(x, y, z, "glass_pane", GLASS);
    }
  }
}

g.save(`${DIR}/DC86592.nbt`);
