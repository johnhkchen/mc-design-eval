// Way 154089912, Auckland CBD: a 1970s concrete-frame office block, 12 storeys (4 blocks each) on a shopfront
// ground floor, with a 3-block plant room on the core. Floors sit on absolute storey lines (y = 4k) across the
// whole footprint, so on the sloping site the uphill side is buried in the foundation and the downhill side
// shows its extra storeys. Facade = light-grey floor bands + white concrete piers + tinted glazing, 1 block of air
// behind each pane, glowstone behind some panes; the entrance is on the low north face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_154089912.cells.json`, "utf8"));
const W = 33, H = 64, D = 19;

// E, W, S, N (z grows south)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cell = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, r });
const at = (x, z) => cell.get(key(x, z));

// 1. Smooth lidar noise: median of the footprint's 3x3 neighbourhood of roof heights
const median = (a) => { a = [...a].sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
for (const c of cell.values()) {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) rs.push(n.r); }
  c.rs = median(rs);
}

// 2. Depth in from the outside edge of the footprint (0 = exterior wall cell)
const q = [];
for (const c of cell.values()) {
  c.d = DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz)) ? 0 : Infinity;
  if (c.d === 0) q.push(c);
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && n.d === Infinity) { n.d = c.d + 1; q.push(n); } }
}

// 3. Tops: storey-snapped lidar roof; a plant room (to 51) set in 2 blocks on the 51-tier core, else 48
for (const c of cell.values()) {
  const plant = c.rs >= 50 && c.d >= 2;
  c.top = Math.max(plant ? 51 : Math.floor(c.rs / 4) * 4, c.g + 4);
}

// a cell at height y is solid unless y is at or above its top; the foundation is solid below its ground
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.top; });

// the facade block of a shell cell at height y, from the face it shows (N/S faces run along x, E/W along z)
function facade(c, y, dirs) {
  const face = dirs.find(([dx]) => dx === 0) ?? dirs[0];
  const alongX = face[0] === 0;                       // wall runs along x: panes connect east-west
  const u = alongX ? c.x : c.z;
  const bay = u % 3 !== 0;                            // pier at u % 3 == 0, glazing in the other two
  const conn = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
  const k = Math.floor(y / 4), r = y % 4;
  if (y === c.top - 1) return { b: "smooth_stone" };                       // cornice / roof cap
  if (c.top === 51 && y >= 49) {                                          // plant room: louvres and panels
    return u % 2 === 0 ? { b: "iron_bars", state: conn } : { b: "light_gray_concrete" };
  }
  if (k === 0) {                                                          // shopfront storey
    if (c.x === 10 && c.z === 0 && (y === 1 || y === 2)) return { door: y === 1 ? "lower" : "upper", pane: true };
    if (c.z === 0 && c.x >= 9 && c.x <= 11 && y === 3) return { b: "stone_brick_slab", state: { type: "top" } };
    if (r === 0) return { b: "stone_bricks" };                             // plinth
    if (r === 3) return { b: "smooth_stone" };                             // fascia
    return bay ? { b: "glass_pane", state: conn, pane: true } : { b: "polished_andesite" };
  }
  if (r === 0) return { b: "light_gray_concrete" };                       // floor slab edge
  if (r === 3) return { b: k === 1 ? "polished_andesite" : "light_gray_concrete" };   // spandrel; podium top band
  return bay ? { b: "light_blue_stained_glass_pane", state: conn, pane: true } : { b: "white_concrete" };
}

// 4. Shell (what shows at each height) and the air behind the glazing
const shell = new Map();
for (const c of cell.values()) {
  for (let y = c.g; y < c.top; y++) {
    const dirs = exposed(c, y);
    if (dirs.length) shell.set(`${c.x},${y},${c.z}`, { c, y, dirs, f: facade(c, y, dirs) });
  }
}
const air = new Set();
for (const s of shell.values()) {
  if (!s.f.pane) continue;
  for (const [dx, dz] of s.dirs) {
    const bx = s.c.x - dx, bz = s.c.z - dz, b = at(bx, bz);
    if (!b || s.y < b.g || s.y >= b.top || shell.has(`${bx},${s.y},${bz}`)) continue;
    air.add(`${bx},${s.y},${bz}`);
  }
}

// 5. Build
const v = new Voxels([W, H, D]);
for (const c of cell.values()) {
  for (let y = 0; y < c.g; y++) v.set(c.x, y, c.z, "stone");                              // foundation under the slope
  for (let y = c.g; y < c.top; y++) {
    const k = `${c.x},${y},${c.z}`, s = shell.get(k);
    if (y === c.top - 1) { v.set(c.x, y, c.z, "smooth_stone"); continue; }
    if (s) {
      const f = s.f;
      if (f.door) {
        const state = { facing: "north", half: f.door, hinge: "left", open: "false", powered: "false" };
        v.set(c.x, y, c.z, "dark_oak_door", state);
      } else v.set(c.x, y, c.z, f.b, f.state);
      continue;
    }
    if (air.has(k)) {
      // warm light behind some panes, on the first row of each storey
      const lit = y % 4 === 1 && (c.x * 7 + c.z * 13 + Math.floor(y / 4) * 5) % 7 === 0;
      if (lit) v.set(c.x, y, c.z, "glowstone");
      continue;
    }
    v.set(c.x, y, c.z, y % 4 === 0 ? "light_gray_concrete" : "white_concrete");           // floors and core
  }
}

const out = `${DIR}/way_154089912.nbt`;
const stats = v.save(out);
const tops = {}; for (const c of cell.values()) tops[c.top] = (tops[c.top] || 0) + 1;
console.log(JSON.stringify({ file: out, ...stats, tops, plantCells: [...cell.values()].filter((c) => c.top === 51).length }));
