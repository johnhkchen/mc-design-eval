import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// The Corporate Centre: a 1980s five-storey office block in precast concrete and tinted glass, with a recessed lobby
// portico on its lowest street face and a plant room on the roof. Storey lines sit at y = 1 (mod 4): every floor is a
// solid slab, every tier top lands on a slab, and the windows are recessed one block behind white piers with an air
// gap behind the glass. The lidar roof is snapped to tiers of 4-block storeys (10, 14, 18, 22), and the 26 m core
// stays at 26.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058277.cells.json", "utf8"));
const X = 35, Y = 39, Z = 58;
const TIERS = [10, 14, 18, 22];
const CORE_TOP = 26;
const GLASS = "light_blue_stained_glass", LOBBY = "cyan_stained_glass";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const at = new Map();
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { x, z, g, r, dist: 0, out: [] });
const get = (x, z) => at.get(`${x},${z}`);
const key = (c) => `${c.x},${c.z}`;

// Each cell's top: the nearest storey tier to the lidar roof, the 26 m core kept as is.
const snapTop = (r) => {
  if (r >= 25) return CORE_TOP;
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - r) <= Math.abs(best - r)) best = t;
  return best;
};
for (const c of at.values()) { c.T = snapTop(c.r); c.core = c.T === CORE_TOP; }

// Lidar noise: a non-core cell takes the tier that holds at least 6 of the 9 cells around it.
const smoothed = new Map();
for (const c of at.values()) {
  if (c.core) continue;
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = get(c.x + dx, c.z + dz); if (n) votes.set(n.T, (votes.get(n.T) || 0) + 1);
  }
  let mode = c.T, count = 0;
  for (const [t, n] of votes) if (n > count) { mode = t; count = n; }
  smoothed.set(c, count >= 6 ? mode : c.T);
}
for (const [c, t] of smoothed) c.T = t;

// Distance in cells from outside the footprint: 1 is the facade, 2 the wall behind it, 3 the room.
const queue = [];
for (const c of at.values()) {
  c.out = DIRS.filter(([dx, dz]) => !get(c.x + dx, c.z + dz));
  if (c.out.length) { c.dist = 1; queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of DIRS) {
    const n = get(c.x + dx, c.z + dz);
    if (n && !n.dist) { n.dist = c.dist + 1; queue.push(n); }
  }
}
const outwardOf = (c) => {
  if (c.dist === 1) return c.out;
  for (const [dx, dz] of DIRS) { const n = get(c.x + dx, c.z + dz); if (n && n.dist === 1) return n.out; }
  return [];
};
for (const c of at.values()) {
  if (c.dist > 2) continue;
  const out = outwardOf(c);
  // corners and every third column/row on the wall are white piers; the glazing sits between them
  c.pier = out.length > 1 || (out.length === 1 && (out[0][0] !== 0 ? c.z % 3 === 0 : c.x % 3 === 0));
  c.hasInner = [...DIRS].some(([dx, dz]) => get(c.x + dx, c.z + dz)?.dist === 2);
}

// The street face is the outward face with the lowest mean ground (8 or more cells). The portico is 5 cells wide,
// its door in the middle, the lobby glass to either side, and a canopy slab over the door.
const faces = new Map();
for (const c of at.values()) if (c.dist === 1 && c.out.length === 1) {
  const k = c.out[0].join(); if (!faces.has(k)) faces.set(k, []); faces.get(k).push(c);
}
let entKey = null, bestG = Infinity;
for (const [k, list] of faces) {
  if (list.length < 8) continue;
  const m = list.reduce((s, c) => s + c.g, 0) / list.length;
  if (m < bestG) { bestG = m; entKey = k; }
}
const entList = faces.get(entKey);
const [eox, eoz] = entKey.split(",").map(Number);
const uOf = (c) => (eox !== 0 ? c.z : c.x);
const us = entList.map(uOf).sort((a, b) => a - b);
const cu = us[Math.floor(us.length / 2)];
const porch = new Set(), door = new Set();
for (const c of entList) {
  if (Math.abs(uOf(c) - cu) > 2) continue;
  porch.add(key(c));
  const inner = get(c.x - eox, c.z - eoz);
  if (uOf(c) === cu) {
    if (inner && inner.dist === 2) { porch.add(key(inner)); door.add(key(inner)); } else door.add(key(c));
  } else if (inner && inner.dist === 2) porch.add(key(inner));
}
const doorState = (half) => ({ facing: DIR_NAME[entKey], half, hinge: "left", open: "false", powered: "false" });

const lit = (c, y) => {
  if (c.dist !== 3 || y < 5) return false;
  for (const [dx, dz] of DIRS) {
    const n = get(c.x + dx, c.z + dz);
    if (n && n.dist === 2 && !n.pier && (n.x * 31 + n.z * 17 + y * 7) % 9 === 0) return true;
  }
  return false;
};
// A plant room on the main roof, two blocks high (the roof deck is the T-1 row)
const plant = (c) => c.T === 22 && c.dist >= 3 &&
  ((c.x >= 12 && c.x <= 15 && c.z >= 26 && c.z <= 29) || (c.x >= 24 && c.x <= 27 && c.z >= 36 && c.z <= 40));

function blockAt(c, y) {
  const { g, T, dist } = c, k = key(c);
  if (y < g) return ["stone_bricks"];
  if (porch.has(k) && (y === g + 1 || y === g + 2)) {
    if (door.has(k)) return ["oak_door", doorState(y === g + 1 ? "lower" : "upper")];
    return dist === 1 ? null : [LOBBY];
  }
  if (porch.has(k) && y === g + 3) return ["light_gray_concrete"];
  if (y >= T) return plant(c) && y < T + 2 ? ["light_gray_concrete"] : null;
  if (y === T - 1) return dist === 1 ? ["white_concrete"] : ["gravel"];
  if (c.core && y >= 22) return ["light_gray_concrete"];
  if (y === g) return ["stone_bricks"];
  if (y % 4 === 1) return ["light_gray_concrete"];
  if (y % 4 === 0) return ["gray_concrete"];
  const glass = y < 5 ? LOBBY : GLASS;
  if (c.pier && dist <= 2) return ["white_concrete"];
  if (dist === 1) return c.hasInner ? null : [glass];
  if (dist === 2) return [glass];
  if (dist === 3 && lit(c, y)) return ["glowstone"];
  return null;
}

const g3 = new Voxels([X, Y, Z]);
let placed = 0;
for (const c of at.values()) {
  for (let y = 0; y < Y; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    g3.set(c.x, y, c.z, b[0], b[1]); placed++;
  }
}

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058277.nbt";
const stats = g3.save(OUT);
const tiers = {};
for (const c of at.values()) tiers[c.T] = (tiers[c.T] || 0) + 1;
console.log(JSON.stringify({ cells: at.size, placed, entrance: entKey, tiers, ...stats }));
