// Hobson Quay Apartments: a 2000s waterfront apartment block (concrete frame, white render, dark glazing, recessed loggias
// on the upper storeys, a lobby porch with a canopy). The lidar roof is smoothed (3x3 median) into four tiers: a 3-storey
// wing, a 6-storey main block, a 7-storey band, and a 9-storey tower that steps back in two setbacks (37, then 41).
// Storey lines sit on one grid (y = 1 + 4k) so every tier, band and roof lines up across the footprint; the downhill
// cells (ground 0-1) get an extra storey at the bottom, and the uphill cells stand on a solid plinth.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128254.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128254.nbt";
const SIZE = [42, 54, 43];
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const k2 = (x, z) => `${x},${z}`;

const byXZ = new Map();
for (const [x, z, g, r] of cells) byXZ.set(k2(x, z), { x, z, g, r });
const at = (x, z) => byXZ.get(k2(x, z));

// 1. smooth the lidar roof (3x3 median) and quantise it to storey-line tiers; 0 marks the tower zone
for (const c of byXZ.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  c.s = v[Math.floor(v.length / 2)];
  c.T = c.s < 20 ? 17 : c.s < 28 ? 25 : c.s < 36 ? 33 : 0;
}
// the tower zone steps in as it rises: its outer ring stays at the main height (33), the next ring at 37, the core at 41
const isTower = (c) => c.T === 0;
const dist = new Map();
const q = [];
for (const c of byXZ.values()) {
  if (isTower(c) && N4.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || !isTower(n); })) { dist.set(k2(c.x, c.z), 1); q.push(c); }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i], d = dist.get(k2(c.x, c.z));
  for (const [dx, dz] of N4) {
    const n = at(c.x + dx, c.z + dz);
    if (n && isTower(n) && !dist.has(k2(n.x, n.z))) { dist.set(k2(n.x, n.z), d + 1); q.push(n); }
  }
}
// a zone too small to read as a tower (a stray two-cell spike) stays at the main height
const seen = new Set();
for (const c of byXZ.values()) {
  if (!isTower(c) || seen.has(k2(c.x, c.z))) continue;
  const part = [c]; seen.add(k2(c.x, c.z));
  for (let i = 0; i < part.length; i++) for (const [dx, dz] of N4) {
    const n = at(part[i].x + dx, part[i].z + dz);
    if (n && isTower(n) && !seen.has(k2(n.x, n.z))) { seen.add(k2(n.x, n.z)); part.push(n); }
  }
  for (const p of part) { const d = dist.get(k2(p.x, p.z)); p.T = part.length < 16 ? 33 : d === 1 ? 33 : d === 2 ? 37 : 41; }
}

// 2. a cell's exposed sides at height y: the neighbours that are outside the footprint or stand lower than y
const exposed = (c, y) => N4.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.T; });
const slabRow = (y) => y >= 1 && y % 4 === 1;    // floor lines 1, 5, 9 ...
const lintelRow = (y) => y >= 4 && y % 4 === 0;  // spandrel above each window band, the roof row under each tier's top
const glassRow = (y) => y >= 2 && (y % 4 === 2 || y % 4 === 3);

// 3. the lobby: the lowest-ground exposed cell near the middle of a face gets a door in a porch recess under a canopy
const override = new Map();
const setO = (x, y, z, v) => override.set(`${x},${y},${z}`, v);
const AIR = { air: true };
let entrance = null;
for (const c of byXZ.values()) {
  const ex = exposed(c, 2);
  if (c.g > 1 || ex.length !== 1 || c.T < 17) continue;
  const [dx, dz] = ex[0];
  const along = dx !== 0 ? c.z : c.x;
  const score = Math.abs(along - 21) + (dz === -1 ? 0 : 6);
  if (!entrance || score < entrance.score) entrance = { c, dx, dz, along, score };
}
if (entrance) {
  const { c, dx, dz } = entrance;
  const side = (k) => (dx !== 0 ? [c.x, c.z + k] : [c.x + k, c.z]);
  const [px, pz] = side(0);
  const hinge = { facing: FACING[`${dx},${dz}`], hinge: "left", open: "false", powered: "false" };
  setO(px, 2, pz, { b: "dark_oak_door", s: { ...hinge, half: "lower" } });
  setO(px, 3, pz, { b: "dark_oak_door", s: { ...hinge, half: "upper" } });
  for (const k of [-1, 1]) {
    const [sx, sz] = side(k);
    if (at(sx, sz)) { setO(sx, 2, sz, AIR); setO(sx, 3, sz, AIR); }
    if (at(sx, sz)) setO(sx, 4, sz, { b: "light_gray_concrete" });
  }
  setO(px, 4, pz, { b: "light_gray_concrete" });
  const [lx, lz] = side(-1);
  if (at(lx, lz)) setO(lx, 3, lz, { b: "lantern", s: { hanging: "true", waterlogged: "false" } });
}

// 4. the wall element at (cell, y): solid fill, plinth, floor line, roof, spandrel, window bay, or air behind the glass
function element(c, y, ex) {
  const o = override.get(`${c.x},${y},${c.z}`);
  if (o) return o.air ? null : o;
  if (y === 0) return { b: "stone_bricks" };
  if (c.g >= 2 && y < 5) {
    if (!ex.length) return { b: "stone_bricks" };
    return { b: y === 4 ? "smooth_stone" : "polished_andesite" };
  }
  if (slabRow(y) || y === c.T - 1) return { b: "light_gray_concrete" };
  if (!ex.length) return null;
  const pier = c.T >= 37 ? "gray_concrete" : "white_concrete";
  if (lintelRow(y)) return { b: pier };
  if (!glassRow(y)) return null;
  if (ex.length > 1) return { b: pier };
  const [dx] = ex[0];
  const along = dx !== 0 ? c.z : c.x;
  if (along % 3 === 0) return { b: pier };
  const pane = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  if (y < 5 && c.g <= 1) return { b: "glass_pane", s: pane };
  const h = (c.x * 31 + c.z * 17 + y * 7) % 5;
  return { b: h === 0 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane", s: pane };
}

const g = new Voxels(SIZE);
let lamps = 0;
for (const c of byXZ.values()) {
  for (let y = 0; y < c.T; y++) {
    const ex = exposed(c, y);
    const e = element(c, y, ex);
    if (!e) continue;
    g.set(c.x, y, c.z, e.b, e.s);
    // warm glass: a glowstone one cell inside a lit window, on the upper storeys and the shopfront
    const isWindow = ex.length === 1 && glassRow(y) && e.b.includes("glass_pane");
    if (isWindow && y >= 2 && (c.x * 13 + c.z * 5 + y * 3) % 9 === 0) {
      const [dx, dz] = ex[0];
      const inner = at(c.x - dx, c.z - dz);
      if (inner && !element(inner, y, exposed(inner, y))) { g.set(inner.x, y, inner.z, "glowstone"); lamps++; }
    }
  }
  // the cornice on the outer edge of each tier, sitting on the roof row
  if (exposed(c, c.T - 1).length) g.set(c.x, c.T, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 5. roof plant: a lift overrun on the tower core, two plant boxes on the main roof, one on the wing terrace
function pick(T, w, h, count) {
  const cs = [...byXZ.values()].filter((c) => c.T === T);
  if (!cs.length) return [];
  const cx = cs.reduce((a, c) => a + c.x, 0) / cs.length, cz = cs.reduce((a, c) => a + c.z, 0) / cs.length;
  const cand = [];
  for (let x0 = 0; x0 + w <= SIZE[0]; x0++) for (let z0 = 0; z0 + h <= SIZE[2]; z0++) {
    let ok = true;
    for (let dx = 0; dx < w && ok; dx++) for (let dz = 0; dz < h && ok; dz++) {
      const c = at(x0 + dx, z0 + dz);
      if (!c || c.T !== T || exposed(c, T - 1).length) ok = false;
    }
    if (ok) cand.push({ x0, z0, d: (x0 + w / 2 - cx) ** 2 + (z0 + h / 2 - cz) ** 2 });
  }
  cand.sort((a, b) => a.d - b.d);
  const out = [];
  for (const r of cand) {
    if (out.length >= count) break;
    if (out.some((o) => Math.abs(o.x0 - r.x0) < w + 1 && Math.abs(o.z0 - r.z0) < h + 1)) continue;
    out.push(r);
  }
  return out;
}
const plant = [
  ...pick(41, 3, 3, 1).map((r) => ({ ...r, w: 3, h: 3, T: 41, b: "light_gray_concrete", hh: 2 })),
  ...pick(33, 3, 2, 2).map((r) => ({ ...r, w: 3, h: 2, T: 33, b: "gray_concrete", hh: 2 })),
  ...pick(17, 3, 2, 1).map((r) => ({ ...r, w: 3, h: 2, T: 17, b: "gray_concrete", hh: 1 })),
];
for (const p of plant) for (let dx = 0; dx < p.w; dx++) for (let dz = 0; dz < p.h; dz++) for (let dy = 0; dy < p.hh; dy++) {
  g.set(p.x0 + dx, p.T + dy, p.z0 + dz, p.b);
}

const info = g.save(OUT);
console.log(`way_293128254: ${info.blocks} blocks, palette ${info.palette}, lamps ${lamps}, entrance ${entrance ? `${entrance.c.x},${entrance.c.z}` : "none"}, plant ${plant.length}`);
