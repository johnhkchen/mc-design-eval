// Beyond Radiology, Mt Eden / Eden Terrace, Auckland: a 1970s-80s concrete-frame medical block, four storeys.
// The lidar roof per cell is median-filtered on 3x3 and sorted into three flat tiers (17 / 13 / 9, roofs 16+ / 11-15 /
// lower), so the noisy south-west corner reads as a two-storey wing, not a jagged edge. Walls are a one-block shell
// with pale spandrels and blue glass between light mullions; interior is air with a slab per storey and a column grid.
// The entrance is a recessed porch on the west face (the street side, nearest the lowest ground).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_923254190.cells.json`, "utf8"));

const W = 33, H = 38, D = 47;
const g = new Voxels([W, H, D]);

const M = {
  plinth: "polished_andesite",
  wall: "white_concrete",
  band: "light_gray_concrete",   // spandrels, mullions, columns, floor slabs
  glass: "light_blue_stained_glass",
  deck: "gray_concrete",
  cap: "stone_brick_slab",
  lamp: "glowstone",
};
const FLOORS = [2, 6, 10, 14];   // global floor grid: a slab per storey, 4 blocks apart
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// footprint: "x,z" -> { g: ground, r: lidar roof }
const foot = new Map();
for (const [x, z, gr, r] of cells) foot.set(`${x},${z}`, { g: gr, r });
const inF = (x, z) => foot.has(`${x},${z}`);

// 3x3 median of the lidar roof over footprint cells, then three flat tiers
const med = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = foot.get(`${x + dx},${z + dz}`); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierTop = (r) => (r >= 16 ? 17 : r >= 11 ? 13 : 9);
const TOP = new Map();
for (const [k] of foot) { const [x, z] = k.split(",").map(Number); TOP.set(k, tierTop(med(x, z))); }
const T = (x, z) => TOP.get(`${x},${z}`);

// the entrance: a porch notch on the west face, z 20..22, storeys 1 (y 3..5); the door sits in the wall plane at x 12
const porch = (x, z, y) => x === 11 && z >= 20 && z <= 22 && y >= 3 && y <= 5;
const DOOR = { x: 12, z: 21 };

// a cell's face is exposed at height y when the neighbour is outside the footprint, is a porch, or stands lower than y
const exposed = (x, z, y, d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  if (!inF(nx, nz)) return true;
  if (porch(nx, nz, y)) return true;
  return T(nx, nz) < y;
};
const outside = (x, z, d) => { const [dx, dz] = DIRS[d]; return !inF(x + dx, z + dz); };
const isShell = (x, z, y) => ["N", "S", "E", "W"].some((d) => exposed(x, z, y, d));
const isColumn = (x, z) => x % 6 === 0 && z % 6 === 0;

const floorAtOrBelow = (y) => { let f = FLOORS[0]; for (const F of FLOORS) if (F <= y) f = F; return f; };

// pass 1: structure and envelope
for (const [k, { g: gr }] of foot) {
  const [x, z] = k.split(",").map(Number);
  const top = T(x, z);
  for (let y = 0; y <= top; y++) {
    // foundation to the cell's ground, and a plinth course under the first floor
    if (y <= gr || y < 2) { g.set(x, y, z, M.plinth); continue; }
    if (porch(x, z, y)) continue;                       // open porch, air
    if (y === top) { g.set(x, y, z, M.deck); continue; } // flat roof of the tier
    if (FLOORS.includes(y)) { g.set(x, y, z, M.band); continue; }
    if (!isShell(x, z, y)) {
      if (isColumn(x, z)) g.set(x, y, z, M.band);       // interior structure, air elsewhere
      continue;
    }
    const f = floorAtOrBelow(y), rel = y - f;
    if (rel === 3) { g.set(x, y, z, M.band); continue; }  // storey line
    const xEdge = exposed(x, z, y, "W") || exposed(x, z, y, "E");
    const zEdge = exposed(x, z, y, "N") || exposed(x, z, y, "S");
    if (x === DOOR.x && z === DOOR.z && (y === 3 || y === 4)) {
      g.set(x, y, z, "dark_oak_door", { facing: "west", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (xEdge && zEdge) { g.set(x, y, z, M.wall); continue; }           // corner pier, white against the grey spandrels
    const win = zEdge ? x % 3 !== 0 : z % 3 !== 0;                       // glass between mullions every 3
    if (!win) { g.set(x, y, z, M.wall); continue; }
    g.set(x, y, z, M.glass);
    // warm light behind some glass: a glowstone on the room side, on the floor slab
    if ((x + y + z) % 5 === 0 && rel === 1) {
      const ix = xEdge ? (exposed(x, z, y, "W") ? x + 1 : x - 1) : x;
      const iz = zEdge ? (exposed(x, z, y, "N") ? z + 1 : z - 1) : z;
      if (inF(ix, iz) && !isShell(ix, iz, y) && !porch(ix, iz, y) && !isColumn(ix, iz)) g.set(ix, y, iz, M.lamp);
    }
  }
  // parapet: a cap course on the outer edge of the roof
  for (const d of ["N", "S", "E", "W"]) {
    if (outside(x, z, d)) { g.set(x, top + 1, z, M.cap, { type: "bottom" }); break; }
  }
}

// pass 2: roof plant, a lift overrun over the middle of the top tier: a 5 x 5 glazed ring with a deck over it
for (let x = 19; x <= 23; x++) for (let z = 16; z <= 20; z++) {
  if (!inF(x, z) || T(x, z) !== 17) continue;
  const edge = x === 19 || x === 23 || z === 16 || z === 20;
  if (edge) for (let y = 18; y <= 20; y++) g.set(x, y, z, (x + z + y) % 2 === 0 ? M.glass : M.band);
  g.set(x, 21, z, M.deck);
}

g.save(`${DIR}/way_923254190.nbt`);
console.log(JSON.stringify({ blocks: g.count(), palette: g.palette.length }));
