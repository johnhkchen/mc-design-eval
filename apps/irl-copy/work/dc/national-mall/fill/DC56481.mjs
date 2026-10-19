// 400 Indiana Ave NW: a mid-century federal office block (precast concrete piers, bands and tinted glass) on a granite-
// grey plinth. The lidar roof is median-smoothed over 3x3 and snapped to four clean tiers (17 tower, 15 podium, 13 and
// 11 wings), so the stepped roofs read as setbacks. Storeys are 2 blocks: a window row over a band row, with a floor
// slab per storey and a one-block air gap behind the glass. Nothing is built outside the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56481.cells.json", "utf8"));
const X = 67, Z = 38, H = 29;
const grid = () => Array.from({ length: Z }, () => Array(X).fill(-1));
const gnd = grid(), roofRaw = grid();
for (const [x, z, g, r] of cells) { gnd[z][x] = g; roofRaw[z][x] = r; }
const fp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && gnd[z][x] >= 0;

// Clean tiers: the lidar's noise is removed by a 3x3 median, then each value snaps to the nearest setback level.
const tier = (r) => (r >= 16 ? 17 : r >= 14 ? 15 : r >= 12 ? 13 : r >= 9 ? 11 : r);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const top = grid();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp(x, z)) continue;
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (fp(x + dx, z + dz)) near.push(roofRaw[z + dz][x + dx]);
  top[z][x] = Math.max(gnd[z][x], tier(median(near)));
}

// The building's volume: inside the footprint and below the column's top. A face is exposed when its neighbour is outside.
const vol = (x, y, z) => fp(x, z) && y >= 0 && y < top[z][x];
const faces = (x, y, z) => ({ n: !vol(x, y, z - 1), s: !vol(x, y, z + 1), w: !vol(x - 1, y, z), e: !vol(x + 1, y, z) });

// B[y][z][x] = [block, state] | null. Built in passes so the glass knows its neighbours and the lights know the glass.
const B = Array.from({ length: H }, () => Array.from({ length: Z }, () => Array(X).fill(null)));
const put = (x, y, z, block, state) => { B[y][z][x] = [block, state]; };
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp(x, z)) continue;
  const G = gnd[z][x], T = top[z][x];
  for (let y = 0; y < T; y++) {
    if (y < G) { put(x, y, z, "polished_andesite"); continue; }                 // foundation: nothing floats on a slope
    const f = faces(x, y, z), facade = f.n || f.s || f.w || f.e;
    if (T - G <= 1) { put(x, y, z, "polished_andesite"); continue; }           // a one-block paved plinth
    if (y === T - 1) { put(x, y, z, facade ? "smooth_quartz" : "gray_concrete"); continue; }   // cornice / roof surface
    if (y === G) { put(x, y, z, "polished_andesite"); continue; }              // base course
    if (!facade) {
      if (y % 2 === 0 || y === T - 2) put(x, y, z, "smooth_stone");           // floor slab per storey, and the top ceiling
      continue;                                                              // otherwise the air gap behind the glass
    }
    if (y % 2 === 0 || y === T - 2) { put(x, y, z, "light_gray_concrete"); continue; }   // storey band (spandrel)
    const pier = (f.n || f.s) && (f.w || f.e) ? true : (f.n || f.s) ? x % 3 === 0 : z % 3 === 0;
    if (pier) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
}

// Main entrance: a recessed double door on the south face at x 45..46, with a canopy over it on the flanking piers.
const DX = [45, 46];
const zs = Math.max(...Array.from({ length: Z }, (_, z) => z).filter((z) => fp(45, z)));
const G0 = gnd[zs][45];
for (const x of [44, 45, 46, 47]) for (const dz of [0, -1]) for (const y of [G0, G0 + 1]) B[y][zs + dz][x] = null;   // recess + door rows
for (const x of [44, 47]) for (let y = G0; y <= G0 + 2; y++) put(x, y, zs, "white_concrete");                     // flanking piers
for (const x of [44, 45, 46, 47]) for (const dz of [0, -1]) put(x, G0 + 2, zs + dz, "smooth_quartz");               // canopy
for (const x of DX) {
  const hinge = x === DX[0] ? "left" : "right";
  put(x, G0, zs, "iron_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, G0 + 1, zs, "iron_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}
put(45, G0 + 1, zs - 1, "lantern", { hanging: "true", waterlogged: "false" });

// Glass: connect along its facade, so the panes read as one curtain wall with the piers.
for (let y = 0; y < H; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = B[y][z][x];
  if (!c || c[0] !== "light_blue_stained_glass_pane") continue;
  const f = faces(x, y, z);
  const ns = f.n || f.s;
  const link = (dx, dz) => B[y][z + dz]?.[x + dx] != null;
  if (ns) { c[1].east = String(link(1, 0)); c[1].west = String(link(-1, 0)); }
  else { c[1].north = String(link(0, -1)); c[1].south = String(link(0, 1)); }
}

// Warm light: some of the air cells just behind the glass hold a glowstone or shroomlight.
for (let y = 0; y < H; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = B[y][z][x];
  if (!c || c[0] !== "light_blue_stained_glass_pane") continue;
  const f = faces(x, y, z);
  const [ix, iz] = f.n ? [0, 1] : f.s ? [0, -1] : f.w ? [1, 0] : [-1, 0];
  const tx = x + ix, tz = z + iz;
  if (!fp(tx, tz) || B[y][tz][tx] || (x * 7 + z * 13 + y * 5) % 9 !== 0) continue;
  put(tx, y, tz, (x + z) % 2 ? "glowstone" : "shroomlight");
}

// Roof plant: 2x2 vent boxes on a grid over the tiers' roof surfaces.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp(x, z) || x % 8 !== 4 || z % 8 !== 4) continue;
  const T = top[z][x];
  if (T < 11 || !B[T - 1][z][x] || B[T - 1][z][x][0] !== "gray_concrete") continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    if (!fp(x + dx, z + dz) || top[z + dz][x + dx] !== T) continue;
    put(x + dx, T, z + dz, "iron_block");
  }
}

const g = new Voxels([X, H, Z]);
for (let y = 0; y < H; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = B[y][z][x];
  if (c) g.set(x, y, z, c[0], c[1]);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56481.nbt";
console.log(g.save(out));
