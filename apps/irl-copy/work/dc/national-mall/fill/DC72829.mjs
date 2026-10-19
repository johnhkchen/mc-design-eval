// DC72829: 600 Maryland Ave SW, vacant, abutting. A stepped concrete-and-glass office block (1960s-70s federal
// office grammar): a plinth, a 3-block storey module with a dark floor line and quartz mullions every third cell,
// lower wings to the north and east, a six-storey core at the centre, and a mechanical penthouse on the top tier.
// The lidar roof is a 3x3 median, then snapped to whole storeys (tiers at 4, 7, 10, ... 19 above y 0).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72829.cells.json`, "utf8"));

const W = 58, H = 46, Y = 32;
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, gr, r]) => [key(x, z), { gr, r }]));
const inFp = (x, z) => cell.has(key(x, z));

// Storeys are 3 blocks: floor lines at y = 1, 4, 7 ..., storey tops (roof caps) at y = 3, 6, 9 ... so tiers snap to 4, 7, 10 ...
const TIERS = [4, 7, 10, 13, 16, 19];
const snap = (v) => TIERS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
const roof = new Map();
for (const [x, z] of Array.from(cell.keys(), (k) => k.split(",").map(Number))) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cell.get(key(x + dx, z + dz)); if (c) near.push(c.r); }
  near.sort((a, b) => a - b);
  roof.set(key(x, z), snap(near[Math.floor(near.length / 2)]));
}
const top = (x, z) => roof.get(key(x, z)) - 1;     // top occupied layer (the roof cap)
const base = (x, z) => cell.get(key(x, z)).gr;     // ground under the cell

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E
const exposed = (x, z, y, [dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  if (!inFp(nx, nz)) return true;
  return y > top(nx, nz) || y < base(nx, nz);
};

const b = new Voxels([W, Y, H]);
const lights = [];
for (const [x, z] of Array.from(cell.keys(), (k) => k.split(",").map(Number))) {
  const T = top(x, z);
  for (let y = 0; y <= T; y++) {
    if (y === 0) { b.set(x, y, z, "stone_bricks"); continue; }          // plinth: nothing stands on air
    const ex = DIRS.filter((d) => exposed(x, z, y, d));
    if (y === T) { b.set(x, y, z, ex.length ? "smooth_quartz" : "stone"); continue; }   // cornice ring, roof
    if (ex.length) {
      if ((y - 1) % 3 === 0) { b.set(x, y, z, y === 1 ? "stone_bricks" : "polished_andesite"); continue; }   // base course, floor lines
      const exZ = ex.some(([, dz]) => dz !== 0), exX = ex.some(([dx]) => dx !== 0);
      const mullion = (exZ && x % 3 === 0) || (exX && z % 3 === 0) || (exZ && exX);
      if (mullion) { b.set(x, y, z, "quartz_block"); continue; }
      b.set(x, y, z, "light_blue_stained_glass");
      if ((x * 5 + z * 3 + y) % 13 === 0) {                              // some windows lit from just inside
        const [dx, dz] = ex[0];
        lights.push([x - dx, y, z - dz, (x + z) % 2 ? "glowstone" : "shroomlight"]);
      }
      continue;
    }
    if ((y - 1) % 3 === 0) b.set(x, y, z, "stone");                       // interior floor slab per storey; else air
  }
}
for (const [x, y, z, block] of lights) if (inFp(x, z) && y <= top(x, z) && !b.get(x, y, z)) b.set(x, y, z, block);

// Entrance: one door on the north face of the low wing at x = 28, in a plinth surround.
const zmin = Math.min(...cells.filter(([x]) => x === 28).map(([, z]) => z));
for (const x of [27, 29]) for (const y of [1, 2]) if (inFp(x, zmin)) b.set(x, y, zmin, "stone_bricks");
b.set(28, 1, zmin, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
b.set(28, 2, zmin, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Mechanical penthouse: a 5 x 3 solid box on the tallest tier, nearest the middle of it.
const tall = cells.map(([x, z]) => [x, z]).filter(([x, z]) => roof.get(key(x, z)) === 19);
let best = null;
for (let x0 = 0; x0 <= W - 5; x0++) for (let z0 = 0; z0 <= H - 3; z0++) {
  const ok = [...Array(5)].every((_, i) => [...Array(3)].every((_, j) => roof.get(key(x0 + i, z0 + j)) === 19));
  if (!ok) continue;
  const d = Math.hypot(x0 + 2 - 26, z0 + 1 - 24);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) for (const y of [19, 20]) b.set(best.x0 + i, y, best.z0 + j, "light_gray_concrete");

const out = b.save(`${DIR}/DC72829.nbt`);
console.log(`DC72829: ${tall.length} tallest cells, penthouse ${best ? "placed" : "none"}, ${out.blocks} blocks, ${out.palette} palette`);
