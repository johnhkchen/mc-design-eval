import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE108-0216-22F";
const W = 35, H = 119, D = 49;
const ROOF = 105;          // top floor slab; 5-block storeys
const TOP_PARAPET = 107;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);
const has = (x, z) => cellMap.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
};

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Inward distance from the edge (edge cells = 1).
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (isEdge(x, z)) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz) || dist.has(key(nx, nz))) continue;
    dist.set(key(nx, nz), d + 1);
    queue.push([nx, nz]);
  }
}

// Mullions every 3 blocks, relative to the face the cell sits on.
const isMullion = (x, z) => {
  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  if (missX && missZ) return x % 3 === 0 || z % 3 === 0;
  if (missX) return z % 3 === 0;
  if (missZ) return x % 3 === 0;
  return false;
};

// Footprint centre; front entrance is the -z face, three cells either side of centre.
let minX = Infinity, maxX = -Infinity, sumX = 0, sumZ = 0;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  sumX += x; sumZ += z;
}
const cxMid = (minX + maxX) / 2;
const cAvgX = sumX / cells.length, cAvgZ = sumZ / cells.length;
const isEntrance = (x, z) => !has(x, z - 1) && Math.abs(x - cxMid) <= 3;

// Lit glass: a few warm windows per storey, the rest pale blue glass.
const windowBlock = (x, y, z) => {
  if (isMullion(x, z)) return "light_gray_concrete";
  if (y % 5 === 2 && ((x * 7 + z * 3 + Math.floor(y / 5) * 5) % 11) === 0) return "glowstone";
  return "light_blue_stained_glass_pane";
};

for (const [x, z, ground0] of cells) {
  const gr = Math.max(0, Math.min(100, ground0));
  const edge = isEdge(x, z);
  const d = dist.get(key(x, z)) ?? 99;

  // Foundation below ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Body from this cell's ground to the roof slab.
  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      put(x, y, z, edge ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (edge && y < gr + 5) {
      // Ground storey: shopfront, entrance opening with lintel and lanterns.
      if (isEntrance(x, z)) {
        if (y === gr + 1) { put(x, y, z, "air"); continue; }
        if (y === gr + 2) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
        if (y === gr + 3) { put(x, y, z, "smooth_stone"); continue; }
      }
      if (y === gr + 4) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, windowBlock(x, y, z));
      continue;
    }
    if (y % 5 === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // storey line / floor slab
    if (edge) {
      if (y % 5 === 4) put(x, y, z, "white_concrete");                    // spandrel
      else put(x, y, z, windowBlock(x, y, z));
    }
  }

  // Parapet on the outer edge.
  if (edge) {
    for (let y = ROOF + 1; y <= TOP_PARAPET; y++) put(x, y, z, "white_concrete");
  }

  // Roof penthouse core, stepped in from the edge.
  if (d >= 5) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    if (d === 5) {
      for (let y = ROOF + 2; y <= ROOF + 3; y++) {
        put(x, y, z, (x + z + y) % 2 === 0 ? "light_blue_stained_glass_pane" : "white_concrete");
      }
    }
    put(x, ROOF + 4, z, "light_gray_concrete");
  }
}

// Antenna mast on the core cell nearest the centroid.
let best = null, bestDist = Infinity;
for (const [x, z] of cells) {
  const d = dist.get(key(x, z)) ?? 0;
  if (d < 5) continue;
  const dd = (x - cAvgX) ** 2 + (z - cAvgZ) ** 2;
  if (dd < bestDist) { bestDist = dd; best = [x, z]; }
}
if (best) {
  const [mx, mz] = best;
  for (let y = ROOF + 5; y <= ROOF + 10; y++) put(mx, y, mz, "iron_block");
  put(mx, ROOF + 11, mz, "lightning_rod");
}

vox.save(`${DIR}/${ID}.nbt`);
