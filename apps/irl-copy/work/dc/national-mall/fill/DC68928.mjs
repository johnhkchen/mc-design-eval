import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC68928";
const W = 24, H = 32, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const rawMap = new Map();
for (const [x, z, gr, rr] of cells) {
  rawMap.set(key(x, z), { g: Math.round(gr), r: Math.round(rr) });
}
const has = (x, z) => rawMap.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// global storey datum: lowest ground, so every storey line lines up across the footprint
let globalG = Infinity;
for (const { g } of rawMap.values()) if (g < globalG) globalG = g;

// smooth the lidar roof: median over the 3x3 neighbourhood, then even it to storey pairs
const cellMap = new Map();
let maxR = 0;
for (const [k, { g, r }] of rawMap) {
  const [x, z] = k.split(",").map(Number);
  const rs = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (has(x + dx, z + dz)) rs.push(rawMap.get(key(x + dx, z + dz)).r);
  rs.sort((a, b) => a - b);
  const med = rs[Math.floor(rs.length / 2)];
  let rr = 2 * Math.round(med / 2);
  rr = Math.min(H - 3, Math.max(rr, g + 4));
  const gg = Math.max(0, Math.min(g, rr - 3));
  cellMap.set(k, { g: gg, r: rr });
  if (rr > maxR) maxR = rr;
}

// ---- foundation, floors, walls, roof -------------------------------------
for (const [k, { g, r }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const edge = isEdge(x, z);
  const xFaceWall = !has(x, z - 1) || !has(x, z + 1);
  const yFaceWall = !has(x - 1, z) || !has(x + 1, z);
  const corner = xFaceWall && yFaceWall;

  for (let y = 0; y < g; y++) vox.set(x, y, z, "stone_bricks");

  for (let y = g; y < r; y++) {
    const rel = y - globalG;
    let b = null;

    if (y === r - 1) {
      b = "smooth_stone"; // roof slab carries everything above it
    } else if (!edge) {
      if (rel % 2 === 0 || y === r - 2) b = "smooth_stone";
    } else {
      if (y === g) {
        b = "polished_granite"; // base course at this cell's ground
      } else if (rel % 2 === 0) {
        b = "smooth_quartz"; // spandrel band
      } else {
        const pier = corner || (xFaceWall ? x % 3 === 0 : z % 3 === 0);
        b = pier ? "smooth_quartz" : "light_blue_stained_glass";
      }
    }
    if (b) vox.set(x, y, z, b);
  }

  if (edge) vox.set(x, r, z, "smooth_quartz"); // parapet
}

// warm light: glowstone behind some lit windows (second pass so it never lands in a slab)
for (const [k, { g, r }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const xFaceWall = !has(x, z - 1) || !has(x, z + 1);
  const yFaceWall = !has(x - 1, z) || !has(x + 1, z);
  const corner = xFaceWall && yFaceWall;
  const dx = !has(x - 1, z) ? 1 : !has(x + 1, z) ? -1 : 0;
  const dz = dx !== 0 ? 0 : (!has(x, z - 1) ? 1 : !has(x, z + 1) ? -1 : 0);
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  for (let y = g + 1; y < r - 2; y++) {
    if ((y - globalG) % 2 !== 1) continue;
    const pier = corner || (xFaceWall ? x % 3 === 0 : z % 3 === 0);
    if (pier) continue;
    if ((x + z + y) % 5 !== 0) continue;
    vox.set(ix, y, iz, "glowstone");
  }
}

// one centred penthouse on the top tier, instead of scattered roof plant
{
  let sx = 0, sz = 0, n = 0;
  for (const k of cellMap.keys()) {
    const [x, z] = k.split(",").map(Number);
    sx += x; sz += z; n++;
  }
  const cx = Math.round(sx / n), cz = Math.round(sz / n);
  for (const [k, { r }] of cellMap) {
    const [x, z] = k.split(",").map(Number);
    if (isEdge(x, z) || r !== maxR || r > H - 5) continue;
    if (Math.abs(x - cx) > 2 || Math.abs(z - cz) > 2) continue;
    const ring = Math.abs(x - cx) === 2 || Math.abs(z - cz) === 2;
    vox.set(x, r, z, ring ? "stone_bricks" : "light_gray_concrete");
    vox.set(x, r + 1, z, ring ? "light_blue_stained_glass" : "light_gray_concrete");
    vox.set(x, r + 2, z, "smooth_stone");
  }
}

// ---- main entrance on the front (lowest z) wall --------------------------
let minZ = Infinity, minX = Infinity, maxX = -Infinity;
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z < minZ) minZ = z;
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
}
const midX = (minX + maxX) / 2;
let door = null;
for (const [k, { g, r }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (z !== minZ) continue;
  if (!door || Math.abs(x - midX) < Math.abs(door.x - midX)) door = { x, z, g, r };
}
if (door) {
  // glazed lobby bay three cells wide, framed by a granite surround and lintel
  for (let dx = -1; dx <= 1; dx++) {
    const x = door.x + dx;
    if (!cellMap.has(key(x, door.z))) continue;
    vox.set(x, door.g, door.z, "polished_granite");
    vox.set(x, door.g + 1, door.z, dx === 0 ? "air" : "light_blue_stained_glass");
    vox.set(x, door.g + 2, door.z, "polished_granite");
  }
  const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
  vox.set(door.x, door.g, door.z, "dark_oak_door", { ...dp, half: "lower" });
  vox.set(door.x, door.g + 1, door.z, "dark_oak_door", { ...dp, half: "upper" });
  // lobby lantern behind the doors
  if (cellMap.has(key(door.x, door.z + 1))) {
    vox.set(door.x, door.g + 1, door.z + 1, "glowstone");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
