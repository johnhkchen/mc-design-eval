// Rydges Auckland: a late-1990s hotel on a podium. A low lobby and a 13-storey wing at the east, an 18-storey tower on the
// west, precast white concrete with tinted glazing, grey mullions, stone plinth, a parapet on every roof edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292660678.cells.json`, "utf8"));
const X = 71, Y = 86, Z = 39;
// storey lines (4 blocks a storey): each cell's lidar roof snaps to the nearest one
const TIERS = [8, 16, 28, 40, 52, 68, 72];

// the footprint: fp[x][z] = { g: ground, roof, T: top of the massing }
const fp = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, g, roof] of cells) fp[x][z] = { g, roof, T: 0 };
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && fp[x][z] !== null;

// 1. massing: snap to tiers (ties go up), then a 3x3 majority twice so the tiers come out as flat blocks, not lidar speckle
const nearest = (roof) => TIERS.reduce((best, t) => (Math.abs(t - roof) <= Math.abs(best - roof) ? t : best));
let L = fp.map((col) => col.map((c) => (c ? nearest(c.roof) : 0)));
for (let pass = 0; pass < 2; pass++) {
  const N = L.map((col) => col.slice());
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    if (!fp[x][z]) continue;
    const count = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!inFp(x + dx, z + dz)) continue;
      const t = L[x + dx][z + dz];
      count.set(t, (count.get(t) || 0) + 1);
    }
    const self = L[x][z];
    let best = self, bestN = -1;
    for (const [t, n] of count) if (n > bestN || (n === bestN && t === self)) { best = t; bestN = n; }
    N[x][z] = best;
  }
  L = N;
}
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (fp[x][z]) fp[x][z].T = L[x][z];

const solid = (x, y, z) => inFp(x, z) && y >= 0 && y < fp[x][z].T;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward directions with no solid beside (x, y, z): a face, a corner (two), or none
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const zMax = (x) => { for (let z = Z - 1; z >= 0; z--) if (fp[x][z]) return z; return -1; };
// a roof's edge: a side with nothing (outside the footprint) or a lower tier beside it
const roofEdge = (x, z) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz) || fp[x + dx][z + dz].T < fp[x][z].T);

// 2. the entrance: on the south (+z) face, the lowest bay with a flat run of three, nearest the face's middle
const southXs = [];
for (let x = 0; x < X; x++) if (zMax(x) >= 0) southXs.push(x);
const centreX = southXs.reduce((a, b) => a + b, 0) / southXs.length;
let x0 = null, bestScore = Infinity;
for (const x of southXs) {
  if (!southXs.includes(x - 1) || !southXs.includes(x + 1)) continue;
  const z = zMax(x);
  const flat = [x - 1, x + 1].every((n) => zMax(n) === z) ? 0 : 10;
  const score = fp[x][z].g * 5 + flat * 10 + Math.abs(x - centreX) * 0.5;
  if (score < bestScore) { bestScore = score; x0 = x; }
}
const entZ = zMax(x0);
const isEnt = (x, z, dx, dz) => dx === 0 && dz === 1 && z === entZ && Math.abs(x - x0) <= 1;
const entG = fp[x0][entZ].g;

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const windows = [];

// 3. the envelope: plinth below each cell's ground, a shell with floor slabs every 4 blocks, glazed bays, a 1-deep air
//    cavity behind each window (a floor slab stays under it), the solid core behind that
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const c = fp[x][z]; if (!c) continue;
  const { g: gr, T } = c;
  for (let y = 0; y < T; y++) {
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }
    const E = exposed(x, y, z);
    const r = y % 4, s = y >> 2;
    if (E.length === 0) {
      put(x, y, z, y === T - 1 || r === 0 ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    if (E.length > 1) { put(x, y, z, r === 0 ? "light_gray_concrete" : "white_concrete"); continue; }   // corner pilaster
    const [dx, dz] = E[0];
    const u = dx ? z : x;
    const ent = isEnt(x, z, dx, dz);
    if (ent && y === gr + 2) { put(x, y, z, "light_gray_concrete"); continue; }                     // entrance canopy
    if (ent && u === x0 && (y === gr || y === gr + 1)) {                                              // the door
      const st = { facing: "south", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      put(x, y, z, "dark_oak_door", st); continue;
    }
    if (ent && y === gr + 1 && Math.abs(u - x0) === 1) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (s === 0) {
      if (r === 0) { put(x, y, z, "smooth_stone"); continue; }                                       // base course
      if (r === 3) { put(x, y, z, "white_concrete"); continue; }                                      // fascia
      if (u % 6 === 0) { put(x, y, z, "gray_concrete"); continue; }
      put(x, y, z, "glass"); windows.push({ x, y, z, dx, dz, r, pane: false }); continue;             // shopfront glazing
    }
    if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; }                                  // floor slab edge
    if (r === 3) { put(x, y, z, "white_concrete"); continue; }                                         // head band
    if (u % 3 === 0) { put(x, y, z, "gray_concrete"); continue; }                                      // mullion
    const tint = (Math.floor(u / 3) + s) % 2 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
    put(x, y, z, tint, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    windows.push({ x, y, z, dx, dz, r, pane: true, tint });
  }
  // parapet: one block over the roof edge
  if (roofEdge(x, z)) put(x, T, z, "white_concrete");
}

// 4. the cavity behind each window (rows 1-2 only) and a warm light in some of them
let lit = 0;
for (const w of windows) {
  if (w.r !== 1 && w.r !== 2) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!inFp(ix, iz) || exposed(ix, w.y, iz).length) continue;
  if (ix === x0 || (w.z === entZ && Math.abs(w.x - x0) <= 1 && w.y <= entG + 2)) continue;   // keep the entrance solid
  g.set(ix, w.y, iz, "air");
  if (w.r === 1 && (w.x * 7 + w.y * 3 + w.z * 5) % 9 === 0) {
    g.set(ix, w.y, iz, w.y < 4 ? "shroomlight" : "glowstone"); lit++;
  }
}

// 5. panes join their neighbours in the wall plane (a pane arm to any block beside it, a frame or another pane)
for (const w of windows) {
  if (!w.pane) continue;
  const { x, y, z, dx } = w;
  const has = (ax, az) => g.get(ax, y, az) !== null;
  const st = dx
    ? { north: String(has(x, z - 1)), south: String(has(x, z + 1)), east: "false", west: "false" }
    : { north: "false", south: "false", east: String(has(x + 1, z)), west: String(has(x - 1, z)) };
  g.set(x, y, z, w.tint, { ...st, waterlogged: "false" });
}

// 6. roof: a planted terrace on the podium, plant boxes on the podium and on the crown (interior roof only)
let plants = 0, moss = 0;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const c = fp[x][z]; if (!c || roofEdge(x, z)) continue;
  if (c.T === 52 && (x + z) % 5 === 0) { put(x, 52, z, "moss_block"); moss++; }
  if ((c.T === 52 && [3, 4].includes(x % 9) && [2, 3].includes(z % 7)) ||
      (c.T === 72 && [3, 4].includes(x % 8) && [2, 3].includes(z % 6))) {
    put(x, c.T, z, "light_gray_concrete"); put(x, c.T + 1, z, "light_gray_concrete"); put(x, c.T + 2, z, "moss_block"); plants++;
  }
}

const out = g.save(`${DIR}/way_292660678.nbt`);
const tiers = {};
for (const col of fp) for (const c of col) if (c) tiers[c.T] = (tiers[c.T] || 0) + 1;
console.log(JSON.stringify({ footprint: cells.length, tiers, entrance: { x0, z: entZ, ground: entG }, windows: windows.length, lit, plants, moss, ...out }));
