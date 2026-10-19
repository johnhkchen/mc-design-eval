// DC83501: a Federal-style limestone office block of the 1930s on the Mall's flank, as a 1.21.1 module (21 x 36 blocks).
// The lidar roofs are 3x3-median smoothed and snapped to four tiers of 4 blocks (3 blocks of room and 1 course of
// lintel or floor): 1, 2, 3 or 4 storeys. The 16-block tiers are a central tower on a 3-storey podium; the tower's
// outer ring steps in to the podium, so it reads as a setback. Each storey is closed under by a solid lintel course
// (a ceiling in the interior) and the tier below, so nothing hangs. Windows are glass panes in calcite piers, with
// stone string courses and a smooth-quartz cornice; the interior is air behind the glass, with a few lamps set back.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC83501.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC83501.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                       // east, west, south, north
const SIDE = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Smoothed roof: the median of the footprint cells in the 3x3 around each cell (lidar noise and 0-1 gaps drop out).
const sm = new Map();
for (const c of F.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); sm.set(key(c.x, c.z), v[v.length >> 1]);
}
// Tier tops (exclusive): 4, 8, 12 or 16 blocks. The 16s are the tower; its outer ring steps down to the podium.
const snap = (h) => (h <= 5 ? 4 : h <= 9 ? 8 : h <= 13 ? 12 : 16);
const edge = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));
const top = new Map();
for (const c of F.values()) {
  let t = snap(sm.get(key(c.x, c.z)));
  if (t === 16 && edge(c.x, c.z)) t = 12;
  top.set(key(c.x, c.z), t);
}
const T = (x, z) => top.get(key(x, z)) ?? 0;
// Depth: steps from the outside of the footprint (1 = on the outer ring), for the roof units set back from the edge.
const depth = new Map(); const queue = [];
for (const c of F.values()) if (edge(c.x, c.z)) { depth.set(key(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) { const k = key(c.x + dx, c.z + dz); if (inF(c.x + dx, c.z + dz) && !depth.has(k)) { depth.set(k, d + 1); queue.push(F.get(k)); } }
}
// Outward sides at height y: a wall stands where a neighbour is outside the footprint or has no block at y.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y);

// Palette: calcite walls (Indiana-limestone white), polished granite plinth, stone-brick string courses, smooth-quartz
// cornice and lintels, gray concrete roofs (tar and gravel), glass panes in the window bays, glowstone lamps.
const BASE = "polished_granite", WALL = "calcite", PIER = "calcite", STRING = "stone_bricks", CORNICE = "smooth_quartz";
const FLOOR = "smooth_stone", ROOF = "gray_concrete", GLASS = "glass_pane", LAMP = "glowstone", PARAPET = "stone_brick_wall";
const PORTAL = "polished_granite", DOOR = "dark_oak_door", PLANT = "stone_bricks";

// Entrances: on the north face (the street front, the narrow portico) and the south face, in the middle of the long side.
const doors = [];
const zMax = Math.max(...[...F.values()].filter((c) => c.x === 10).map((c) => c.z));
for (const [x, z, facing] of [[10, 1, "north"], [10, zMax, "south"]]) {
  if (inF(x, z) && T(x, z) >= 4) doors.push({ x, z, facing });
}
const doorAt = new Set(doors.map((d) => key(d.x, d.z)));

const g = new Voxels([21, 28, 36]);
const B = new Map();                                              // block name by "x,y,z", for the pane connections
const put = (x, y, z, b, s) => { g.set(x, y, z, b, s); B.set(`${x},${y},${z}`, b); };

for (const c of F.values()) {
  const t = T(c.x, c.z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(c.x, c.z, y), wall = ex.length > 0;
    if (y === 0) { put(c.x, 0, c.z, BASE); continue; }                       // plinth and foundation course
    if (y % 4 === 0) { put(c.x, y, c.z, wall ? STRING : FLOOR); continue; }   // floor line: string course on the wall, slab inside
    if (y % 4 === 3) {                                                       // lintel course; the top is the roof
      put(c.x, y, c.z, wall ? CORNICE : y === t - 1 ? ROOF : FLOOR);
      continue;
    }
    if (!wall) continue;                                                     // interior: air behind the glass
    // Window band. Bays of two panes between piers, counted along the face (x on north/south faces, z on east/west).
    const alongX = ex.some(([, dz]) => dz !== 0);
    const along = alongX ? c.x : c.z;
    const bay = along % 4 === 1 || along % 4 === 2;
    if (bay) put(c.x, y, c.z, GLASS);
    else put(c.x, y, c.z, PIER);
    // Warm light in some windows: a lamp set back behind the pane, in the air of the room.
    if (bay && (c.x * 7 + c.z * 5 + y * 3) % 11 === 0) {
      const [dx, dz] = [-ex[0][0], -ex[0][1]], ix = c.x + dx, iz = c.z + dz;
      if (inF(ix, iz) && exposed(ix, iz, y).length === 0) put(ix, y, iz, LAMP);
    }
  }
  // Parapet on the roof edge: the outer ring and the tier's edge against a lower tier.
  if (DIRS.some(([dx, dz]) => !inF(c.x + dx, c.z + dz) || T(c.x + dx, c.z + dz) < t)) put(c.x, t, c.z, PARAPET);
  // Roof units on the tower, set in from the edge so they read as plant on the roof.
  if (t === 16 && (depth.get(key(c.x, c.z)) ?? 0) >= 3 && c.x % 4 >= 1 && c.x % 4 <= 2 && c.z % 4 >= 1 && c.z % 4 <= 2) {
    put(c.x, 16, c.z, PLANT); put(c.x, 17, c.z, PLANT);
  }
}

// Entrances: a dark oak door (two halves) in the shell, with granite portal columns either side up to the lintel.
for (const d of doors) {
  const s = (half) => ({ facing: d.facing, half, hinge: "left", open: "false", powered: "false" });
  put(d.x, 1, d.z, DOOR, s("lower"));
  put(d.x, 2, d.z, DOOR, s("upper"));
  for (const dx of [-1, 1]) if (inF(d.x + dx, d.z)) { put(d.x + dx, 1, d.z, PORTAL); put(d.x + dx, 2, d.z, PORTAL); }
}

// Panes join the piers and the glass beside them along the wall; a pane with air beside it keeps that arm off.
for (const [k, b] of B) {
  if (b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const s = { east: "false", north: "false", south: "false", west: "false" };
  for (const [dx, dz] of DIRS) {
    const nb = B.get(`${x + dx},${y},${z + dz}`);
    if (nb && nb !== LAMP && nb !== "smooth_stone" && nb !== "gray_concrete") s[SIDE[`${dx},${dz}`]] = "true";
  }
  g.set(x, y, z, GLASS, s);
}

const r = g.save(OUT);
console.log(`DC83501: ${r.blocks} blocks, ${r.palette} palette entries, ${doors.length} doors`);
