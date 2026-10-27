// The Shortland Centre: a 1980s concrete office tower on a stepped podium. Massing from the lidar roof (a 5x5 median,
// snapped to 4-block storeys); white concrete piers with blue glass bays, spandrel bands on each storey line, a
// polished-andesite base course, a glass entrance under a canopy, warm lights behind some windows, a plant room on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_147110851.cells.json`, "utf8"));
const W = 91, D = 71, Y = 95, TOP = 84;                 // roof cap at y 83 (83 blocks above the lowest ground), parapet at 84
const grid = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, ground, roof] of cells) grid[z][x] = { G: ground, R: roof };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && grid[z][x] !== null;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" };   // a door faces the way you walk in

// Massing: the lidar roof's 5x5 median (noise out), snapped to whole 4-block storeys, at least two storeys above the cell's ground.
const H = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) vals.push(grid[z + dz][x + dx].R);
  vals.sort((a, b) => a - b);
  const floorH = 4 * Math.ceil((grid[z][x].G + 8) / 4);
  H[z][x] = Math.min(TOP, Math.max(4 * Math.round(vals[vals.length >> 1] / 4), floorH));
}

// A face is exposed at height y where the neighbour is outside the footprint or its top is at or below y.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || H[z + dz][x + dx] <= y);

const g = new Voxels([W, Y, D]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Pass 1: each column from its foundation up to its cap; storey slabs at multiples of 4 (absolute), spandrel bands,
// window rows with piers every 3 blocks, a shopfront on the first storey above ground, some lights one block in.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const G = grid[z][x].G, h = H[z][x], s0 = 4 * Math.ceil(G / 4);
  for (let y = 0; y < G; y++) set(x, y, z, "stone");
  for (let y = G; y < h; y++) {
    if (y === h - 1) { set(x, y, z, "gray_concrete"); continue; }
    const ext = exposed(x, z, y);
    if (!ext.length) { if (y % 4 === 0) set(x, y, z, "smooth_stone"); continue; }    // interior: floor slab, else air
    if (y < s0) { set(x, y, z, "polished_andesite"); continue; }                      // base course
    if (y % 4 === 0 || y % 4 === 3) { set(x, y, z, "light_gray_concrete"); continue; }  // spandrel + head band
    const [dx, dz] = ext[0];
    const shop = y < s0 + 4;
    const pier = !shop && (dx !== 0 ? z : x) % 3 === 0;
    set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
    if (!pier && y % 4 === 1 && (x * 31 + z * 17 + y * 7) % 13 === 0) {
      const ix = x - dx, iz = z - dz;                                                  // the room behind the glass, on its slab
      if (inside(ix, iz) && H[iz][ix] > y && !exposed(ix, iz, y).length) set(ix, y, iz, (x + z) % 3 ? "glowstone" : "shroomlight");
    }
  }
}

// Pass 2: an exposed wall must stand on something: where a setback's wall has open air under it, a slab fills the course below.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  for (let y = grid[z][x].G + 1; y < H[z][x] - 1; y++)
    if (exposed(x, z, y).length && !g.val(x, y - 1, z)) set(x, y - 1, z, "smooth_stone");
}

// Pass 3: a parapet course on the roof edge (outside the footprint, or a neighbour lower), on the cap.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const h = H[z][x];
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || H[z + dz][x + dx] < h)) set(x, h, z, "light_gray_concrete");
}

// Pass 4: plant room on the tallest tier, centred, set back from the parapet; a lightning rod on it.
let sx = 0, sz = 0, n = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z) && H[z][x] === TOP) { sx += x; sz += z; n++; }
const cx = Math.round(sx / n), cz = Math.round(sz / n);
for (let z = cz - 4; z <= cz + 4; z++) for (let x = cx - 6; x <= cx + 6; x++) {
  if (!inside(x, z) || H[z][x] !== TOP) continue;
  for (let y = TOP; y < TOP + 3; y++) set(x, y, z, "light_gray_concrete");
  set(x, TOP + 3, z, "smooth_stone");
}
set(cx, TOP + 4, cz, "lightning_rod");

// Pass 5: the entrance on the footprint's lowest exterior face: a 3-wide door (iron, two halves) between glass, and a
// canopy band over the whole bay. Its outward face is the one whose ground is lowest, so the street meets the door.
let best = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  for (const [dx, dz] of DIRS) if (!inside(x + dx, z + dz) && (!best || grid[z][x].G < best.G)) best = { x, z, dx, dz, G: grid[z][x].G };
}
const inward = FACING[`${-best.dx},${-best.dz}`];
for (let t = -2; t <= 2; t++) {
  const ex = best.dz !== 0 ? best.x + t : best.x, ez = best.dx !== 0 ? best.z + t : best.z;
  if (!inside(ex, ez)) continue;
  const G = grid[ez][ex].G;
  if (Math.abs(t) <= 1) {
    const door = (half) => ({ facing: inward, half, hinge: "left", open: "false", powered: "false" });
    set(ex, G, ez, "iron_door", door("lower"));
    set(ex, G + 1, ez, "iron_door", door("upper"));
  } else {
    set(ex, G, ez, "light_blue_stained_glass");
    set(ex, G + 1, ez, "light_blue_stained_glass");
  }
  set(ex, G + 2, ez, "polished_andesite");
}

g.save(`${HERE}/way_147110851.nbt`);
const tops = {};
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) tops[H[z][x]] = (tops[H[z][x]] || 0) + 1;
console.log(`blocks ${g.count()} palette ${g.palette.length} entrance x${best.x} z${best.z} (G ${best.G}) tops`, tops);
