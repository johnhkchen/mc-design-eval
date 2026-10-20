import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016292947";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 38, D = 20;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Outer shell: a footprint cell with any neighbour outside the footprint
const ring0 = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Storey lines every 5 blocks: spandrel at y%5==0, window band y%5 in 1..3,
// lower spandrel band at y%5==4. Parapet at 26, cornice at 25, roof slab at 25.
const ROOF = 25, PARAPET = 26;

for (const [x, z, gr] of cells) {
  const outer = ring0(x, z);

  // 1. Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "minecraft:stone_bricks");

  // 2. Floor slabs at each storey line (interior and shell alike)
  for (let k = 1; k <= 4; k++) {
    const y = 5 * k;
    if (y >= gr) put(x, y, z, "minecraft:light_gray_concrete");
  }

  // 3. Roof slab
  if (ROOF >= gr) put(x, ROOF, z, "minecraft:gray_concrete");

  // 4. Shell walls with window grid
  if (!outer) continue;

  // Determine face and index along it for pier rhythm
  let idx;
  if (!has(x, z - 1) || !has(x, z + 1)) idx = x - minX;
  else idx = z - minZ;
  const corner = isCorner(x, z);
  const pier = corner || idx % 3 === 0;
  const southFace = !has(x, z + 1);
  const entranceX = southFace && Math.abs(x - cx) <= 2;

  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) { put(x, y, z, "minecraft:white_concrete"); continue; }
    if (y === ROOF) { put(x, y, z, "minecraft:smooth_quartz"); continue; }
    if (y === gr) { put(x, y, z, "minecraft:polished_andesite"); continue; }

    // Entrance: centre bay, doors and transom, canopy above
    if (southFace && Math.abs(x - cx) <= 1 && y >= gr + 1 && y <= gr + 3) {
      if (x === cx) {
        if (y === gr + 1) { put(x, y, z, "minecraft:dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 2) { put(x, y, z, "minecraft:dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      }
      put(x, y, z, "minecraft:cyan_stained_glass");
      continue;
    }
    if (entranceX && y === gr + 4) {
      put(x, y, z, "minecraft:stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    if (y % 5 === 0) { put(x, y, z, "minecraft:white_concrete"); continue; }
    if (y % 5 === 4) { put(x, y, z, "minecraft:light_gray_concrete"); continue; }

    // Window band
    put(x, y, z, pier ? "minecraft:smooth_quartz" : "minecraft:cyan_stained_glass");
  }
}

// 5. Warm lights behind some windows, on interior floor (ring 1 cells)
for (const [x, z, gr] of cells) {
  if (ring0(x, z)) continue;
  let adjacent = false;
  if (ring0(x - 1, z) && has(x - 1, z)) adjacent = true;
  if (ring0(x + 1, z) && has(x + 1, z)) adjacent = true;
  if (ring0(x, z - 1) && has(x, z - 1)) adjacent = true;
  if (ring0(x, z + 1) && has(x, z + 1)) adjacent = true;
  if (!adjacent) continue;
  for (let k = 0; k <= 3; k++) {
    const y = k === 0 ? gr : 5 * k + 1;
    if (y < gr || y > 24) continue;
    if ((x + z + k) % 4 === 0) put(x, y, z, "minecraft:glowstone");
  }
}

// 6. Roof: mechanical penthouse, AC units, antenna
for (const [x, z, gr] of cells) {
  if (ring0(x, z)) continue;
  const inPH = x >= minX + 5 && x <= maxX - 5 && z >= minZ + 4 && z <= maxZ - 4;
  if (inPH) {
    const edge = x === minX + 5 || x === maxX - 5 || z === minZ + 4 || z === maxZ - 4;
    put(x, 26, z, "minecraft:light_gray_concrete");
    put(x, 27, z, "minecraft:light_gray_concrete");
    put(x, 28, z, edge ? "minecraft:smooth_quartz" : "minecraft:light_gray_concrete");
  } else if ((x * 3 + z * 5) % 11 === 0 && (x - minX) % 2 === 0) {
    put(x, 26, z, "minecraft:iron_block");
  }
}

// Antenna on the penthouse centre
if (has(cx, cz) && !ring0(cx, cz)) {
  for (let y = 29; y <= 33; y++) put(cx, y, cz, "minecraft:iron_bars");
  put(cx, 34, cz, "minecraft:lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
