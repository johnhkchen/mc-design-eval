// DC87040: a stone-and-brick office block of the 1920s-30s on the Mall's east end, as a 1.21.1 module. The footprint is a
// 37 x 33 comb with a 5-storey tower on the south-west and 3-storey wings. Lidar roofs are 3x3-median smoothed and snapped
// to 4-block storeys (3 of wall + 1 band course), so every column top is 8, 12, 16 or 20 and every tier stands on the one
// below. Each column is solid from y 0 up to its top, so nothing floats. Walls are brick with calcite string courses and
// sills, granite plinth and piers, and a calcite cornice under a brick parapet. Window bays are two glass panes wide, each
// backed by a one-cell air pocket with a floor and ceiling slab, so the glass has an air gap behind it; some pockets hold
// glowstone. The street side (z = 0) has a centred entrance with a door, calcite surround and a hanging lantern.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87040.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87040.nbt";

const key = (x, z) => `${x},${z}`;
const K = (x, y, z) => `${x},${y},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FRONT = [0, -1];      // the street side: the z = 0 edge, the longest unbroken run of facade
const DOOR_X = 17;

// Roof tops: 3x3 median of the footprint's lidar roofs (noise and 0-1 gaps drop out), snapped to 4-block storeys.
const smooth = new Map();
for (const c of F.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), v[v.length >> 1]);
}
const snap = (h) => ((h + 2) >> 2) << 2;
const top = (x, z) => (inF(x, z) ? snap(smooth.get(key(x, z))) : 0);
const isFront = (d) => d[0] === FRONT[0] && d[1] === FRONT[1];

// Exposed faces: a solid voxel faces outside when the neighbour is off the footprint or stands lower than it.
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) <= y);
const facade = new Map();
for (const c of F.values()) for (let y = 0; y < top(c.x, c.z); y++) {
  const d = exposed(c.x, y, c.z); if (d.length) facade.set(K(c.x, y, c.z), d);
}
const isFacade = (x, y, z) => facade.has(K(x, y, z));
const bandTop = (y) => (y | 3) + 1;             // top of the 4-block storey holding y

const planned = new Map();                       // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => planned.set(K(x, y, z), { block, state });
const open = new Set();                          // air pockets behind the glass (never filled)
const panes = [];

// Facade pass: plinth, storey lines, piers and window bays, the entrance, pilasters at corners.
for (const [k, dirs] of facade) {
  const [x, y, z] = k.split(",").map(Number);
  const t0 = top(x, z), w = y % 4;
  const front = dirs.length === 1 && isFront(dirs[0]);
  if (y === 0) { put(x, y, z, "polished_granite"); continue; }
  if (front && x === DOOR_X && (y === 1 || y === 2)) {
    put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    continue;
  }
  if (front && x === DOOR_X && y === 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
  if (front && Math.abs(x - DOOR_X) <= 1 && y <= 2) { put(x, y, z, "calcite"); continue; }   // entrance surround
  if (y === t0 - 1 || w === 0 || w === 3) { put(x, y, z, "calcite"); continue; }           // sills, string course, cornice
  if (dirs.length > 1) { put(x, y, z, "calcite"); continue; }                                 // corner pilasters
  const [dx, dz] = dirs[0];
  const t = dx !== 0 ? z : x;
  if (t % 3 === 0) { put(x, y, z, y < 4 ? "polished_granite" : "bricks"); continue; }          // piers
  const ix = x - dx, iz = z - dz;                                                               // the cell behind the glass
  const pocketOK = inF(ix, iz) && top(ix, iz) >= bandTop(y) && !isFacade(ix, y, iz);
  if (!pocketOK) { put(x, y, z, "bricks"); continue; }
  panes.push([x, y, z, dx, dz, ix, iz]);
  open.add(K(ix, y, iz));
}

// Glass panes, joined to whatever stands beside them on the same face, and a few warm lamps in the pockets.
for (const [x, y, z, dx, dz, ix, iz] of panes) {
  const n = (a, b, c) => planned.has(K(a, b, c)) ? "true" : "false";
  const st = dz !== 0
    ? { east: n(x + 1, y, z), west: n(x - 1, y, z), north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: n(x, y, z - 1), south: n(x, y, z + 1), waterlogged: "false" };
  put(x, y, z, "glass_pane", st);
  if (y % 4 === 1 && (x * 31 + z * 17 + (y >> 2) * 11) % 5 === 0) put(ix, y, iz, "glowstone");
}

// Core: solid behind the walls, the roof membrane on top, air only in the pockets.
for (const c of F.values()) for (let y = 0; y < top(c.x, c.z); y++) {
  const k = K(c.x, y, c.z);
  if (planned.has(k) || open.has(k) || facade.has(k)) continue;
  put(c.x, y, c.z, y === top(c.x, c.z) - 1 ? "smooth_stone" : "stone");
}

// Parapet on the outer edge of every roof, and two-by-two condenser units on the tower roof.
for (const c of F.values()) {
  if (DIRS.some(([dx, dz]) => !inF(c.x + dx, c.z + dz))) put(c.x, top(c.x, c.z), c.z, "bricks");
}
const allTop = (x0, x1, z0, z1, T) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!inF(x, z) || top(x, z) !== T) return false;
  return true;
};
for (const c of F.values()) {
  if (c.x % 6 !== 2 || c.z % 6 !== 2 || !allTop(c.x - 2, c.x + 3, c.z - 2, c.z + 3, 20)) continue;
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) for (let y = 20; y < 22; y++) put(c.x + dx, y, c.z + dz, "light_gray_concrete");
}

const g = new Voxels([37, 31, 33]);
for (const [k, { block, state }] of planned) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
// Every solid block above y 0 stands on a solid block (lantern and glass hang or sit on what is already there).
let floating = 0;
for (const [k, { block }] of planned) {
  const [x, y, z] = k.split(",").map(Number);
  if (y > 0 && block !== "lantern" && !planned.has(K(x, y - 1, z))) floating++;
}
const r = g.save(OUT);
const tops = {}; for (const c of F.values()) tops[top(c.x, c.z)] = (tops[top(c.x, c.z)] || 0) + 1;
console.log(JSON.stringify({ blocks: r.blocks, palette: r.palette, panes: panes.length, pockets: open.size, floating, tops }));
