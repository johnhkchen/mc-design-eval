import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise commercial block, Xinyi, c.1985-2000: five storeys over a
// stone base, cream tiled facade with tinted glass bands, shopfront ground floor
// with a street door on the south face, flat roof with parapet, a small
// glazed penthouse and HVAC plant.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535167416.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535167416.nbt";

const W = 12, H = 38, D = 20;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), Math.max(0, Math.round(gr)));

const gmax = Math.max(...fp.values());
const B = gmax;                 // podium top / ground floor level (absolute y)
const STOREYS = 5;              // 5 storeys x 5 blocks
const ROOF = B + STOREYS * 5;   // roof slab level

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const inFp = (x, z) => fp.has(key(x, z));

// missing-neighbour count and facing for edge cells
function edgeInfo(x, z) {
  const N = !inFp(x, z - 1), S = !inFp(x, z + 1), Wm = !inFp(x - 1, z), E = !inFp(x + 1, z);
  const missing = [N, S, Wm, E].filter(Boolean).length;
  if (missing === 0) return null;
  let face;
  if (N) face = "N"; else if (S) face = "S"; else if (Wm) face = "W"; else face = "E";
  return { face, corner: missing >= 2 };
}
const inward = (face, x, z) =>
  face === "N" ? [x, z + 1] : face === "S" ? [x, z - 1] : face === "W" ? [x + 1, z] : [x - 1, z];

// 1. Foundations, then podium/base course up to B
for (const [key_, gr] of fp) {
  const [x, z] = key_.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  for (let y = gr; y < B; y++) put(x, y, z, "stone_bricks");
}
// base course accent line on the podium's top course
for (const [key_] of fp) {
  const [x, z] = key_.split(",").map(Number);
  const e = edgeInfo(x, z);
  if (e) put(x, B - 1, z, "smooth_stone");
}

// 2. Floor slabs at every storey line (full footprint) and roof slab
for (let k = 0; k <= STOREYS; k++) {
  const y = B + 5 * k;
  for (const [key_] of fp) {
    const [x, z] = key_.split(",").map(Number);
    put(x, y, z, k === STOREYS ? "light_gray_concrete" : "light_gray_concrete");
  }
}

// 3. Facade: edge cells, storey by storey
const door = { x: 5, z: D - 1 };
for (const [key_] of fp) {
  const [x, z] = key_.split(",").map(Number);
  const e = edgeInfo(x, z);
  if (!e) continue;
  const along = (e.face === "N" || e.face === "S") ? x : z;
  const len = (e.face === "N" || e.face === "S") ? W : D;
  const pier = e.corner || along % 3 === 0 || along === len - 1;

  for (let k = 0; k < STOREYS; k++) {
    const base = B + 5 * k;
    for (let j = 1; j <= 4; j++) {
      const y = base + j;
      if (k === 0) {
        // shopfront ground floor
        if (e.face === "S" && x === door.x && z === door.z) {
          if (j === 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (j === 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          else if (j === 3) put(x, y, z, "light_gray_concrete");
          else put(x, y, z, "smooth_stone");
          continue;
        }
        if (j === 4) { put(x, y, z, "smooth_stone"); continue; }
        if (pier) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "cyan_stained_glass_pane");
        continue;
      }
      // upper storeys: glazed bands with piers, spandrel at j=4
      if (j === 4) { put(x, y, z, "white_concrete"); continue; }
      if (pier) { put(x, y, z, "light_gray_concrete"); continue; }
      put(x, y, z, "cyan_stained_glass_pane");
    }
  }
}

// 4. Warm lights behind some upper-floor windows (glowstone on the inside cell)
for (const [key_] of fp) {
  const [x, z] = key_.split(",").map(Number);
  const e = edgeInfo(x, z);
  if (!e || e.corner) continue;
  const along = (e.face === "N" || e.face === "S") ? x : z;
  const len = (e.face === "N" || e.face === "S") ? W : D;
  if (along % 3 === 0 || along === len - 1) continue;
  for (let k = 1; k < STOREYS; k++) {
    if ((along + k) % 4 !== 0) continue;
    const [ix, iz] = inward(e.face, x, z);
    if (!inFp(ix, iz)) continue;
    put(ix, B + 5 * k + 2, iz, "glowstone");
  }
}

// 5. Parapet and cornice on the roof edge
for (const [key_] of fp) {
  const [x, z] = key_.split(",").map(Number);
  if (!edgeInfo(x, z)) continue;
  put(x, ROOF, z, "white_concrete");
  put(x, ROOF + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 6. Roof plant: HVAC units on the roof slab
const pent = { x0: 4, x1: 7, z0: 6, z1: 13 };
const inPent = (x, z) => x >= pent.x0 && x <= pent.x1 && z >= pent.z0 && z <= pent.z1;
for (const [x, z] of [[1, 2], [2, 2], [1, 3], [9, 16], [10, 16], [9, 17]]) {
  if (inFp(x, z) && !inPent(x, z)) put(x, ROOF, z, "iron_block");
}

// 7. Small glazed penthouse on the roof (2 storeys, roof slab at ROOF+3)
for (let x = pent.x0; x <= pent.x1; x++) {
  for (let z = pent.z0; z <= pent.z1; z++) {
    const border = x === pent.x0 || x === pent.x1 || z === pent.z0 || z === pent.z1;
    const corner = (x === pent.x0 || x === pent.x1) && (z === pent.z0 || z === pent.z1);
    for (let j = 1; j <= 2; j++) {
      const y = ROOF + j;
      if (!border) continue;
      if (corner) put(x, y, z, "white_concrete");
      else if (j === 1) put(x, y, z, "cyan_stained_glass_pane");
      else put(x, y, z, "white_concrete");
    }
    put(x, ROOF + 3, z, "smooth_stone");
  }
}
// penthouse entrance facing the roof slab edge (open doorway on the west side)
put(pent.x0, ROOF + 1, 9, "air");
put(pent.x0, ROOF + 2, 9, "air");

g.save(OUT);
