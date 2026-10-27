// Chancery Chambers, Chancery Street, Auckland CBD: a 1970s reinforced-concrete office block. Lidar roofs run 26-34
// blocks above y 0 (about 27-29 m), so seven storeys: a shopfront ground floor (y 4-9) and six office floors of 4
// blocks, slabs at 10, 14 ... 34. The roof steps down the slope in tiers (34 tower, 30 and 26 wings, 10 a one-storey
// pavilion at the low south-west corner); the lidar's noise snaps to the nearest tier. Basalt plinth (deepslate) on a
// foundation filled from y 0 to the floor line, so nothing floats on the slope. Pale concrete piers, tinted glass
// bands, smooth stone spandrels, a cornice on every exposed edge, a dark-lintelled entrance on the lowest side, lanterns
// hung in some windows, and a roof plant room with a lightning rod. Floor slabs are one block, and the interior is air
// except a column grid, so each slab is held by the facade ring and the columns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_147110871.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_147110871.nbt`;

const X = 32, Y = 47, Z = 33;
const TIERS = [10, 14, 18, 22, 26, 30, 34];                 // roof tops: the floor slab that ends each tier
const snap = (r) => TIERS.reduce((a, t) => (Math.abs(t - r) <= Math.abs(a - r) ? t : a));
const slab = (y) => y === 4 || (y >= 10 && (y - 10) % 4 === 0);   // floor slabs: plinth at 4, then every 4 from 10

const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, R: snap(r) });
const cell = (x, z) => fp.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the air beside a cell at row y: outside the footprint, or over a lower tier's roof
const open = (x, z, y, dx, dz) => { const n = cell(x + dx, z + dz); return !n || n.R < y; };
const ring = (x, z, y) => DIRS.some(([dx, dz]) => open(x, z, y, dx, dz));
const edge = (x, z, R) => DIRS.some(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.R < R; });
// the column grid: interior cells on every fourth x and z, whose neighbours all reach this roof
const isColumn = (x, z, R) => x % 4 === 2 && z % 4 === 2 && DIRS.every(([dx, dz]) => { const n = cell(x + dx, z + dz); return n && n.R >= R; });

// the entrance: the lowest outward-facing cell on the ground floor, with its neighbour along the same face
const ENT = { row: 5 };
let door = null;
for (const [x, z] of cells) {
  const c = cell(x, z);
  for (const [dx, dz] of DIRS) {
    if (cell(x + dx, z + dz)) continue;                      // outside the footprint only
    const score = c.g * 100 + Math.abs((dx ? z : x) - 16);
    if (!door || score < door.score) door = { x, z, dx, dz, score };
  }
}
const alongFace = door.dx ? [0, 1] : [1, 0];
const doorCells = [[door.x, door.z]];
for (const s of [1, -1]) {
  const nx = door.x + alongFace[0] * s, nz = door.z + alongFace[1] * s;
  if (cell(nx, nz) && !cell(nx + door.dx, nz + door.dz)) { doorCells.push([nx, nz]); break; }
}
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" }[`${door.dx},${door.dz}`];
const doorKey = new Set(doorCells.map(([x, z]) => `${x},${z}`));

const v = new Voxels([X, Y, Z]);
const lanterns = [];
for (const [x, z] of cells) {
  const c = cell(x, z), R = c.R;
  for (let y = 0; y <= R + 1; y++) {
    const outX = open(x, z, y, 1, 0) || open(x, z, y, -1, 0);
    const outZ = open(x, z, y, 0, 1) || open(x, z, y, 0, -1);
    const outside = ring(x, z, y);
    if (y <= 3) { v.set(x, y, z, "deepslate_bricks"); continue; }
    if (y === R + 1) { if (edge(x, z, R)) v.set(x, y, z, "smooth_stone"); continue; }
    if (y === R) { v.set(x, y, z, outside ? "smooth_stone" : "gray_concrete"); continue; }
    if (y === 4) { v.set(x, y, z, outside ? "deepslate_tiles" : "light_gray_concrete"); continue; }
    if (slab(y)) { v.set(x, y, z, outside ? "smooth_stone" : "light_gray_concrete"); continue; }
    if (!outside) { if (isColumn(x, z, R)) v.set(x, y, z, "light_gray_concrete"); continue; }

    // the facade: a door and lintel at the entrance, the fascia over the shopfronts, then piers and glass
    if (doorKey.has(`${x},${z}`) && y >= ENT.row && y <= ENT.row + 1) {
      const half = y === ENT.row ? "lower" : "upper";
      v.set(x, y, z, "iron_door", { facing: FACING, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (doorKey.has(`${x},${z}`) && y === ENT.row + 2) { v.set(x, y, z, "black_concrete"); continue; }
    if (y === 9) { v.set(x, y, z, "smooth_stone"); continue; }                  // ground-floor fascia
    const pier = outX && outZ ? true : outX ? z % 3 === 0 : x % 3 === 0;
    const groundPier = outX && outZ ? true : outX ? z % 4 === 0 : x % 4 === 0;
    const grnd = y < 10;
    if (grnd ? groundPier : pier) v.set(x, y, z, "white_concrete");
    else v.set(x, y, z, "light_blue_stained_glass");
    // one window in five lit by a lantern hung under the floor slab above it, on the inside
    const slabAbove = [10, 14, 18, 22, 26, 30, 34].find((s) => s > y);
    if (!grnd && slabAbove && y === slabAbove - 1 && (x * 31 + z * 17 + y) % 5 === 0 && !pier) {
      // the inside neighbour: opposite the open side
      const dx = open(x, z, y, -1, 0) ? 1 : open(x, z, y, 1, 0) ? -1 : 0;
      const dz = open(x, z, y, 0, -1) ? 1 : open(x, z, y, 0, 1) ? -1 : 0;
      if (dx || dz) lanterns.push([x + dx, y, z + dz]);
    }
  }
}

// lanterns hang from the slab above, on the interior cell behind the window
for (const [x, y, z] of lanterns) {
  if (cell(x, z) && !v.get(x, y, z)) v.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// the roof plant room: a 5 x 5 box on the tallest tier, with a lightning rod on its cap
let cx = 0, cz = 0, n = 0, bestD = Infinity;
const tallest = [...fp.entries()].filter(([, c]) => c.R === 34).map(([k]) => k.split(",").map(Number));
for (const [tx, tz] of tallest) { cx += tx; cz += tz; n++; }
cx /= n; cz /= n;
let site = null;
for (const [x, z] of tallest) {
  const ok = [-2, -1, 0, 1, 2].every((dx) => [-2, -1, 0, 1, 2].every((dz) => { const c = cell(x + dx, z + dz); return c && c.R === 34; }));
  if (!ok) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (d < bestD) { bestD = d; site = [x, z]; }
}
if (site) {
  const [px, pz] = site;
  for (let x = px - 2; x <= px + 2; x++) for (let z = pz - 2; z <= pz + 2; z++) {
    const edgeCell = x === px - 2 || x === px + 2 || z === pz - 2 || z === pz + 2;
    for (let y = 35; y <= 37; y++) {
      if (!edgeCell) continue;
      const win = y === 36 && (x + z) % 2 === 0;
      v.set(x, y, z, win ? "light_blue_stained_glass" : "white_concrete");
    }
    v.set(x, 38, z, "smooth_stone");
  }
  v.set(px, 39, pz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const r = v.save(OUT);
console.log(`wrote ${OUT}: ${r.blocks} blocks, ${r.palette} palette entries; door on ${door.x},${door.z} facing ${FACING}; plant room ${site ? site.join(",") : "none"}`);
