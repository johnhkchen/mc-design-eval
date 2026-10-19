// 601 Fifth Avenue (1930, mixed residential and commercial): a limestone-and-brick Fifth Avenue block over
// shops. The lidar roof per cell is smoothed (3x3 median over built neighbours) and rounded to whole 3-block
// storeys, so the main mass stands at 7 storeys, a few corner bulkheads at 8, and the north-east wing at 3 to 4.
// Every built cell is solid at each storey's floor row and at its roof row; the outer shell is a wall where a
// cell's neighbour is off the footprint or lower than that row, and everything else inside is air (glass has air
// behind it, with a lantern in some bays).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035431.cells.json`, "utf8"));
const X = 27, Z = 8, Y = 36;

const ground = Array.from({ length: Z }, () => Array(X).fill(0));
const roof = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, g, r] of cells) { ground[z][x] = g; roof[z][x] = r; }
const built = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && roof[z][x] > 0;

// Tiers: 3x3 median of the lidar roof over the built cells around each cell, rounded to whole storeys.
const T = Array.from({ length: Z }, () => Array(X).fill(0));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!built(x, z)) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (built(x + dx, z + dz)) vals.push(roof[z + dz][x + dx]);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  T[z][x] = Math.max(3, 3 * Math.round(med / 3));
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Directions in which the cell's face is open at row y: off the footprint, or a neighbour whose top is at or below y.
const outFace = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !built(nx, nz) || T[nz][nx] <= y;
});
const exterior = (x, z, y) => y < T[z][x] && outFace(x, z, y).length > 0;
const perimeter = (x, z) => DIRS.some(([dx, dz]) => !built(x + dx, z + dz));

const v = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => v.set(x, y, z, block, state);

// Foundation: solid from y 0 up to the cell's ground (all 0 on this lot, so nothing extra below the slab).
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!built(x, z)) continue;
  for (let y = 0; y < ground[z][x]; y++) set(x, y, z, "stone");
}

// Shell and floors: every row of every built cell up to its tier.
const pierMat = (k) => (k === 0 ? "polished_blackstone" : k < 3 ? "calcite" : "bricks");
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!built(x, z)) continue;
  const t = T[z][x];
  for (let y = 0; y < t; y++) {
    const k = Math.floor(y / 3), r = y % 3;
    const dirs = outFace(x, z, y);
    if (!dirs.length) {
      if (y === t - 1) set(x, y, z, "stone");              // roof deck
      else if (r === 0) set(x, y, z, "smooth_stone");     // interior floor slab
      continue;
    }
    if (y === t - 1) { set(x, y, z, "smooth_quartz"); continue; }   // cornice band
    if (r === 0) { set(x, y, z, k === 0 ? "stone_bricks" : "smooth_quartz"); continue; }   // plinth, storey lines
    // Bays: piers on the street faces where x is a multiple of 3, on the ends where z is; corners are piers.
    const zf = dirs.some(([, dz]) => dz !== 0), xf = dirs.some(([dx]) => dx !== 0);
    const pier = zf && xf ? true : zf ? x % 3 === 0 : xf ? z % 3 === 0 : false;
    if (pier) set(x, y, z, pierMat(k));
    else set(x, y, z, k === 0 ? "glass" : "light_blue_stained_glass");
  }
  if (perimeter(x, z)) set(x, t, z, "calcite");   // parapet
}

// Entrances: an iron lobby door on Fifth Avenue's shop front (z 7) and a dark oak residential door on the north.
const door = (x, y, z, facing, block, half) => set(x, y, z, block, { facing, half, hinge: "left", open: "false", powered: "false" });
door(13, 1, 7, "south", "iron_door", "lower"); door(13, 2, 7, "south", "iron_door", "upper");
door(4, 1, 0, "north", "dark_oak_door", "lower"); door(4, 2, 0, "north", "dark_oak_door", "upper");

// Warm lights: a lantern on the floor just inside some lower window bays, with air behind the glass.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!built(x, z)) continue;
  const t = T[z][x];
  for (let y = 1; y < t - 1; y += 3) {
    const k = Math.floor(y / 3);
    if (!exterior(x, z, y) || y % 3 !== 1 || (x + z + k) % 4 !== 0) continue;
    const dirs = outFace(x, z, y);
    if (dirs.length !== 1) continue;
    const [dx, dz] = dirs[0];
    const ix = x - dx, iz = z - dz;
    if (!built(ix, iz) || exterior(ix, iz, y) || y >= T[iz][ix] - 1) continue;
    set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof plant: two penthouse-scale service boxes on the main roof, standing on the deck.
for (let z = 3; z <= 4; z++) for (let x = 14; x <= 16; x++) {
  if (!built(x, z) || exterior(x, z, T[z][x])) continue;
  set(x, T[z][x], z, "stone_bricks");
  set(x, T[z][x] + 1, z, "smooth_quartz");
}

const info = v.save(`${DIR}/NYC1035431.nbt`);
let maxY = 0; for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (built(x, z)) maxY = Math.max(maxY, T[z][x]);
console.log(JSON.stringify({ ...info, tierMax: maxY }));
