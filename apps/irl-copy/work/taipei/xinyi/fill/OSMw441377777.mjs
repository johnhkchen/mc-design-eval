import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377777";
const W = 58, H = 23, D = 27;

// Record: no name. Lidar roof ~11 blocks above lowest ground, footprint 58 x 27.
// Read as a two-storey commercial block (about 5 blocks per storey) in
// Xinyi-style concrete and stone, with a shopfront ground floor, a
// horizontal storey band, a stone cornice and parapet, and a flat roof
// carrying a small plant box.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(key(x, z));
// Relative ground for each cell, clamped so the ground floor stays below the cornice.
const rel = (x, z) => Math.min(ground.get(key(x, z)) - minG, 9);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: north (low-z) face, middle of that run of cells.
const northRun = cells
  .filter(([x, z]) => z === Math.min(...cells.map(c => c[1])) && !has(x, z - 1))
  .map(c => c[0])
  .sort((a, b) => a - b);
const zMin = northRun.length ? cells.filter(c => !has(c[0], c[1] - 1)).map(c => c[1]).reduce((a, b) => Math.min(a, b), Infinity) : 0;
const doorX = northRun.length ? northRun[Math.floor(northRun.length / 2)] : -1;

// Pass 1: foundations, floors, walls, roof.
for (const [x, z] of cells) {
  const r = rel(x, z);
  const faces = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const edge = faces.N || faces.S || faces.W || faces.E;

  // Foundation under the cell, up to its ground.
  for (let y = 0; y < r; y++) put(x, y, z, "stone_bricks");
  // Ground slab / base course.
  put(x, r, z, edge ? "polished_andesite" : "light_gray_concrete");

  for (let y = r + 1; y <= 9; y++) {
    if (!edge) {
      // Interior: only floor slab at the storey line, air elsewhere.
      if (y === 5) put(x, y, z, "smooth_stone");
      continue;
    }
    if (y === 9) { put(x, y, z, "stone_bricks"); continue; } // cornice
    if (y === 5) { put(x, y, z, "smooth_stone"); continue; } // storey band
    // Pillar choice: a pillar on the face where along-face index is a multiple of 3.
    let pillar = false;
    if (faces.N || faces.S) if (x % 3 === 0) pillar = true;
    if (faces.W || faces.E) if (z % 3 === 0) pillar = true;
    if (y < 5) {
      if (y === 4) { put(x, y, z, "stone_bricks"); continue; } // transom
      put(x, y, z, pillar ? "white_concrete" : "glass_pane");
    } else {
      put(x, y, z, pillar ? "smooth_quartz" : "glass_pane");
    }
  }

  // Roof deck (top layer) and parapet on the edge.
  put(x, 10, z, edge ? "stone_bricks" : "light_gray_concrete");
}

// Pass 2: entrance door on the north face.
if (doorX >= 0) {
  const r = rel(doorX, zMin);
  put(doorX, r + 1, zMin, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, r + 2, zMin, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Pass 3: warm light behind some upper-storey windows.
for (const [x, z] of cells) {
  const r = rel(x, z);
  const faces = { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
  if (!(faces.N || faces.S || faces.W || faces.E)) continue;
  if (r > 7) continue;
  const a = faces.N || faces.S ? x : z;
  if (a % 6 !== 1) continue;
  let inward = null;
  if (faces.N) inward = [x, z + 1];
  else if (faces.S) inward = [x, z - 1];
  else if (faces.W) inward = [x + 1, z];
  else if (faces.E) inward = [x - 1, z];
  if (inward && has(inward[0], inward[1])) put(inward[0], 7, inward[1], "glowstone");
}

// Pass 4: roof plant box in the middle of the roof.
for (const [x, z] of cells) {
  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (edge) continue;
  if (x < 24 || x > 31 || z < 9 || z > 16) continue;
  put(x, 11, z, "smooth_stone");
  put(x, 12, z, (x + z) % 2 === 0 ? "smooth_stone_slab" : "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
