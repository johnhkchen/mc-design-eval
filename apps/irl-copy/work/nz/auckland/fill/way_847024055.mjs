// Way 847024055: a 1980s Auckland office tower on a stepped podium, built from its lidar envelope. The lidar roof
// steps down from 54 (the tower) through 36 and 20 (the wing along the north-east edge) to 12 and 8 (the sheds at the
// tip), so the massing is the lidar's with its noise median-smoothed into flat tiers. Each cell stands on a solid
// foundation to its own ground; floor slabs run across the footprint every 4 blocks (a slab at y = 4k, the storey's
// glass above it), so nothing hangs. Walls are only the cells on the outside of the footprint or against a shorter
// neighbour; everything else behind the glass is air. Concrete piers frame each window, the ground storey is a base
// course and shopfront, and a few windows show glowstone behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_847024055.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..67, z 0..59
const W = 68, D = 60;
const g = new Voxels([68, 67, 60]);

// the footprint and its lidar, by [z][x]
const G = Array.from({ length: D }, () => Array(W).fill(-1));
const R = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, ground, roof] of cells) { G[z][x] = ground; R[z][x] = roof; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z][x] >= 0;

// the roof, smoothed: a 3 x 3 median of the lidar over the footprint, then flat tiers (54 tower, 36 setback, 20 wing,
// 12 low wing, 8 sheds)
function median3(x, z) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) v.push(R[z + dz][x + dx]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
}
const tierTop = (v) => (v >= 50 ? 54 : v >= 28 ? 36 : v >= 17 ? 20 : v >= 9 ? 12 : 8);
const TOP = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) TOP[z][x] = tierTop(median3(x, z));

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// the outward direction of the first side that shows at height y (outside the footprint, or against a shorter tier)
function exposure(x, z, y) {
  if (y < G[z][x]) return null;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || TOP[nz][nx] <= y) return [dx, dz];
  }
  return null;
}

// the facade of one cell: piers every third cell along the wall, glass between them, a base and shopfront at the ground
function facade(x, z, y, [dx, dz]) {
  const u = dx !== 0 ? z : x;
  const g0 = G[z][x], firstSlab = Math.floor(g0 / 4) * 4 + 4;
  const ground = y < firstSlab;
  if (u % 3 === 0) return { b: ground ? "polished_andesite" : "light_gray_concrete", out: [dx, dz] };
  return { b: "light_blue_stained_glass", out: [dx, dz] };
}

// what stands in the cell (x, z) at height y, or null for air
function kindAt(x, z, y) {
  const g0 = G[z][x], top = TOP[z][x];
  if (y < 0 || y >= top) return null;
  if (y < g0) return { b: "stone" };                                    // the foundation, to the cell's own ground
  if (y === g0) return { b: "polished_andesite" };                      // the base course
  if (y === top - 1) return { b: exposure(x, z, y) ? "stone_bricks" : "smooth_stone" };   // roof deck and parapet
  if (y % 4 === 0) return { b: "smooth_stone" };                        // the floor slab (and spandrel) of each storey
  const out = exposure(x, z, y);
  return out ? facade(x, z, y, out) : null;
}

// the body: every footprint cell from its foundation to its roof
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < TOP[z][x]; y++) {
    const k = kindAt(x, z, y);
    if (k) g.set(x, y, z, k.b);
  }
}

// warm light behind some windows: a glowstone in the air just inside the pane
let lit = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  for (let y = 1; y < TOP[z][x] - 1; y++) {
    const k = kindAt(x, z, y);
    if (!k || k.b !== "light_blue_stained_glass" || (x * 31 + z * 17 + y * 7) % 13 !== 0) continue;
    const [dx, dz] = k.out, ix = x - dx, iz = z - dz;
    if (!inside(ix, iz) || kindAt(ix, iz, y)) continue;
    g.set(ix, y, iz, "glowstone"); lit++;
  }
}

// the entrance: the lowest exposed street-level cell on the north-east edge, a double door, and a canopy slab over it
let door = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const out = exposure(x, z, G[z][x] + 1);
  if (!out || out[0] !== 1 && out[1] !== -1) continue;
  if (!door || G[z][x] < door.ground || (G[z][x] === door.ground && x > door.x)) door = { x, z, ground: G[z][x], out };
}
if (door) {
  const { x, z, ground, out } = door;
  const facing = DIRS.find(([dx, dz]) => dx === out[0] && dz === out[1])[2];
  const st = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  g.set(x, ground + 1, z, "oak_door", st("lower"));
  g.set(x, ground + 2, z, "oak_door", st("upper"));
  const u = out[0] !== 0 ? z : x;
  for (const d of [-1, 0, 1]) {
    const cx = out[0] !== 0 ? x : u + d, cz = out[0] !== 0 ? u + d : z;
    if (inside(cx, cz) && kindAt(cx, cz, ground + 3)) g.set(cx, ground + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// roof plant: a few units on the tower roof, each on the deck, clear of the parapet
let plant = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z) || TOP[z][x] !== 54 || x % 9 !== 4 || z % 9 !== 4) continue;
  if (![[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inside(x + dx, z + dz) && TOP[z + dz][x + dx] === 54)) continue;
  g.set(x, 54, z, "iron_block"); g.set(x, 55, z, "iron_block"); plant++;
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_847024055.nbt");
const tops = {}; for (const [, , , r] of cells) tops[r] = 1;
console.log(JSON.stringify({ blocks: g.count(), lit, plant, door: door && { x: door.x, z: door.z, ground: door.ground }, tiers: [...new Set(TOP.flat().filter(Boolean))] }));
