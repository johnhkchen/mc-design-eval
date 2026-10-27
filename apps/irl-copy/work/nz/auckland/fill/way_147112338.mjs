// A 1970s concrete office-over-shops block on the Mt Eden slope: basalt plinth, a stepped concrete frame (podium, wing,
// tower), glass-and-mullion facades, a shopfront ground storey, a recessed entrance and rooftop plant.
// Massing: each cell's ground is rounded up to a storey line (the plinth top F); the lidar roof is smoothed onto
// 4-block tiers (T). Structure: perimeter walls + a column grid + a floor plate per storey, all face-connected to the plinth.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112338.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112338.nbt";
const SIZE = [41, 63, 29];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels(SIZE);

// lidar roof -> flat storey tiers (absolute tops, multiples of 4)
const tierTop = (r) => (r >= 38 ? 48 : r >= 32 ? 36 : r >= 25 ? 28 : r >= 16 ? 20 : 16);
const key = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, gr, r] of cells) {
  const F = 4 * Math.ceil(gr / 4);                       // plinth top: ground rounded up to a storey line
  C.set(key(x, z), { x, z, F, T: Math.max(tierTop(r), F + 4) });
}
const cell = (x, z) => C.get(key(x, z));
// [dx, dz, outward facing]
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
// outward faces at height y: the neighbour is off the footprint, or its roof is at or below y
const faces = (c, y) => DIRS.filter(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || y >= n.T; });
const perimeter = (c) => DIRS.some(([dx, dz]) => !cell(c.x + dx, c.z + dz));
const paneState = (face) => (face === "east" || face === "west"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const windows = [];                                      // glass cells at row 1 of a storey, for the lit windows
// entrance: the lowest perimeter cell of the low tiers (the street side)
const door = [...C.values()].filter((c) => perimeter(c) && c.T <= 36)
  .sort((a, b) => a.F - b.F || a.z - b.z || a.x - b.x)[0];
const doorFace = DIRS.find(([dx, dz]) => !cell(door.x + dx, door.z + dz))[2];

for (const c of C.values()) {
  const { x, z, F, T } = c;
  for (let y = 0; y < F; y++) g.set(x, y, z, "polished_andesite");          // foundation and plinth to the storey line
  for (let y = F; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, "stone"); continue; }                // roof membrane
    const k = Math.floor((y - F) / 4), p = (y - F) % 4;                    // storey, and row within it
    const fs = faces(c, y);
    if (!fs.length) {                                                       // interior: floor plate, a column grid, air
      if (p === 0) g.set(x, y, z, "smooth_stone");
      else if (x % 4 === 2 && z % 4 === 2) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    const [dx, dz, face] = fs[0];
    const along = dx !== 0 ? z : x;                                         // position along the facade
    if (p === 0) g.set(x, y, z, k === 0 ? "polished_andesite" : "white_concrete");   // string course / base course
    else if (p === 3) g.set(x, y, z, "light_gray_concrete");                       // spandrel
    else if (along % 3 === 0) g.set(x, y, z, k === 0 ? "black_concrete" : "light_gray_concrete"); // mullion
    else {
      g.set(x, y, z, k === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", paneState(face));
      if (p === 1) windows.push({ x, y, z, dx, dz });
    }
  }
  if (perimeter(c) || DIRS.some(([dx, dz]) => cell(x + dx, z + dz)?.T < T)) g.set(x, T, z, "white_concrete"); // parapet / cornice
}

// entrance: a dark oak door in the wall cell, a glass transom, a fascia canopy, and a porch soffit with a lantern inside
const dx0 = door.x, dz0 = door.z, F0 = door.F;
const outward = DIRS.find(([dx, dz]) => !cell(dx0 + dx, dz0 + dz));
const [ox, oz] = [outward[0], outward[1]];
const ix = dx0 - ox, iz = dz0 - oz;                                         // the porch cell inside
const doorState = (half) => ({ facing: doorFace, half, hinge: "left", open: "false", powered: "false" });
g.set(dx0, F0, dz0, "dark_oak_door", doorState("lower"));
g.set(dx0, F0 + 1, dz0, "dark_oak_door", doorState("upper"));
g.set(dx0, F0 + 2, dz0, "cyan_stained_glass_pane", paneState(doorFace));
g.set(dx0, F0 + 3, dz0, "polished_andesite");
g.set(ix, F0 + 3, iz, "smooth_stone");
g.set(ix, F0 + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });

// warm light: some windows, one row above the floor plate, inside the air gap behind the glass
let lit = 0;
for (const w of windows) {
  const ix2 = w.x - w.dx, iz2 = w.z - w.dz;
  if (!cell(ix2, iz2) || g.val(ix2, w.y, iz2) !== 0) continue;
  const h = (w.x * 31 + w.z * 17 + w.y * 7) % 9;
  if (h === 0) { g.set(ix2, w.y, iz2, "glowstone"); lit++; }
  else if (h === 4) { g.set(ix2, w.y, iz2, "lantern", { hanging: "false", waterlogged: "false" }); lit++; }
  else if (h === 6) { g.set(ix2, w.y, iz2, "shroomlight"); lit++; }
}

// rooftop plant: units on the 36 tier's interior roof; a core on the tower roof
for (const c of C.values()) {
  const interior = DIRS.every(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return n && n.T === c.T; });
  if (!interior) continue;
  if (c.T === 36 && c.x % 5 === 2 && c.z % 4 === 1) { g.set(c.x, c.T, c.z, "light_gray_concrete"); g.set(c.x, c.T + 1, c.z, "light_gray_concrete"); }
  if (c.T === 48 && c.x % 3 === 1 && c.z % 3 === 1) for (let y = 48; y < 50; y++) g.set(c.x, y, c.z, "light_gray_concrete");
}

// every solid block must reach the ground through face-connected solids
const X = SIZE[0], Y = SIZE[1], Z = SIZE[2];
const solid = new Uint8Array(X * Y * Z); g.forEachCell((i) => { solid[i] = 1; });
const seen = new Uint8Array(X * Y * Z), stack = [];
for (let i = 0; i < X * Z; i++) { const x = i % X, z = Math.floor(i / X); const id = (z * Y) * X + x; if (solid[id]) { seen[id] = 1; stack.push(id); } }
while (stack.length) {
  const i = stack.pop(), x = i % X, r = Math.floor(i / X), y = r % Y, z = Math.floor(r / Y);
  for (const [nx, ny, nz] of [[x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1]]) {
    if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z) continue;
    const j = (nz * Y + ny) * X + nx;
    if (solid[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
  }
}
let floating = 0; for (let i = 0; i < solid.length; i++) if (solid[i] && !seen[i]) floating++;

const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, door: [door.x, door.z], doorFace, windows: windows.length, lit, floating, ...stats }));
