import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038711405.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038711405.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 36, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

let minX = Infinity, maxX = -Infinity;
for (const [x] of cells) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((() => { let a = Infinity, b = -Infinity; for (const [, z] of cells) { a = Math.min(a, z); b = Math.max(b, z); } return (a + b) / 2; })());

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => outward(x, z).length > 0;

// ---- helpers ----------------------------------------------------------------
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front = the +z edge (south side of the grid). Entrance sits at the middle of that run.
const frontXs = cells.filter(([x, z]) => has(x, z + 1) === false && z === Math.max(...cells.map(c => c[1]))).map(c => c[0]);
const fMin = Math.min(...frontXs), fMax = Math.max(...frontXs);
const entranceS = Math.round((fMin + fMax) / 2);

// Storey plan (absolute y, body top = 10 inclusive, height 11 above lowest ground):
//  g        base course (granite on edges, smooth stone inside)
//  g+1..4   ground storey: shopfront glass, mullions, transom at 4
//  5        floor band / slab
//  6..8     upper storey: window grid
//  9        stone cornice
//  10       parapet (edge) / roof deck (interior)
const TOP = 10;

// ---- 1. foundations and floors, per footprint cell ---------------------------
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "minecraft:stone_bricks");
  if (gr > TOP) continue;

  if (!isEdge(x, z)) {
    put(x, gr, z, "minecraft:smooth_stone");           // ground floor slab
    if (5 >= gr) put(x, 5, z, "minecraft:smooth_stone"); // storey 2 floor slab
    put(x, TOP, z, "minecraft:gray_concrete");         // roof deck
  }
}

// ---- 2. shell on edge cells ----------------------------------------------------
for (const [x, z, gr] of cells) {
  if (gr > TOP || !isEdge(x, z)) continue;
  const out = outward(x, z);
  const [ox, oz] = out[0];
  const corner = out.length >= 2;
  const s = oz !== 0 ? x : z;                 // bay coordinate along this face
  const front = oz === 1 && !corner;
  const isEntrance = front && s === entranceS;
  const pillar = corner || s % 3 === 0;

  for (let y = gr; y <= TOP; y++) {
    if (y === TOP) { put(x, y, z, "minecraft:white_concrete"); continue; }   // parapet
    if (y === 9) { put(x, y, z, "minecraft:stone_bricks"); continue; }        // cornice
    if (y === 5) { put(x, y, z, "minecraft:smooth_quartz"); continue; }       // storey band
    if (y === gr) { put(x, y, z, "minecraft:polished_granite"); continue; }   // base course

    if (y <= 4) {
      // ground storey: shopfront
      if (isEntrance && y === gr + 1) {
        put(x, y, z, "minecraft:dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isEntrance && y === gr + 2) {
        put(x, y, z, "minecraft:dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (front && Math.abs(s - entranceS) <= 2 && y === gr + 3 && gr + 3 <= 4) {
        put(x, y, z, "minecraft:black_concrete");                              // entrance canopy
      } else if (pillar) {
        put(x, y, z, "minecraft:smooth_quartz");
      } else if (y === 4) {
        put(x, y, z, "minecraft:smooth_quartz");                               // transom
      } else {
        put(x, y, z, "minecraft:light_blue_stained_glass");
      }
    } else if (y >= 6 && y <= 8) {
      // upper storey: window grid
      if (pillar) put(x, y, z, "minecraft:smooth_quartz");
      else put(x, y, z, "minecraft:light_blue_stained_glass");
    }
  }

  // warm lights behind some windows, inside the air gap
  if (!corner && !isEntrance) {
    const ix = x - ox, iz = z - oz;
    if (!isEdge(ix, iz) && has(ix, iz)) {
      if (s % 6 === 1 && 7 >= gr) put(ix, 7, iz, "minecraft:glowstone");
      if (s % 6 === 4 && gr + 2 <= 3) put(ix, gr + 2, iz, "minecraft:glowstone");
    }
  }
}

// ---- 3. rooftop plant room and mast ------------------------------------------
for (const [x, z, gr] of cells) {
  if (gr > TOP) continue;
  const inBox = Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 3;
  if (!inBox) continue;
  const rim = Math.abs(x - cx) === 5 || Math.abs(z - cz) === 3;
  put(x, 11, z, rim ? "minecraft:smooth_quartz" : "minecraft:light_gray_concrete");
  put(x, 12, z, "minecraft:stone_bricks");
}
for (let y = 13; y <= 15; y++) {
  put(cx, y, cz, "minecraft:lightning_rod", { facing: "up", waterlogged: "false", powered: "false" });
}

g.save(OUT);
