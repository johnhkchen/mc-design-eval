// Auckland City Central Christian Centre: a late-20th-century concrete-and-glass church centre on a brick podium.
// Five storeys (about 4 blocks each, a double-height ground floor) under a flat roof at y 20 with a few 22-block crown
// bays; tinted glazing in concrete piers, a glazed front door under a slab canopy, lit windows, and rooftop plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270737191.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270737191.nbt";
const [W, H, D] = [63, 35, 64];

// E, W, S, N: the outward direction of a face
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const SLABS = [8, 12, 16, 20];          // floor slabs: the ground floor's ceiling at 8, then one per 4-block storey
const k = (x, z) => `${x},${z}`;

// the palette: a concrete body with a brick podium, pale string courses, tinted glass
const MAT = {
  found: "stone_bricks", base: "smooth_stone", brick: "bricks", pier: "white_concrete", spandrel: "light_gray_concrete",
  slab: "light_gray_concrete", cornice: "light_gray_concrete", parapet: "white_concrete", deck: "smooth_stone",
  glass: "light_blue_stained_glass", plant: "iron_block",
};

// the lidar's roof heights, quantised to flat tiers (12, 16, 20, 22), never under four blocks above the cell's ground
const tierOf = (r, g) => Math.max(r >= 21 ? 22 : r >= 17 ? 20 : r >= 13 ? 16 : r >= 8 ? 12 : 0, g + 4);

const col = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) col.set(k(x, z), { g, r, t: tierOf(r, g) });

// one mode pass: a cell whose neighbours (three or more) stand on another tier takes that tier, so lidar notches close
const snap = new Map([...col].map(([kk, c]) => [kk, c.t]));
for (const [kk, c] of col) {
  const [x, z] = kk.split(",").map(Number), votes = new Map();
  for (const [dx, dz] of DIRS) { const n = snap.get(k(x + dx, z + dz)); if (n !== undefined) votes.set(n, (votes.get(n) ?? 0) + 1); }
  for (const [t, n] of votes) if (n >= 3 && t >= c.g + 4) c.t = t;
}

const T = (x, z) => col.get(k(x, z))?.t ?? -1;                     // -1 outside the footprint
// the first face of (x,z) that is open at height y: outside the footprint, or a lower tier's top lies at or under y
const openFace = (x, z, y) => DIRS.find(([dx, dz]) => T(x + dx, z + dz) <= y);

// what solid thing a block of the massing is: foundation, slab, deck, cornice, parapet, wall; null is air
function kindAt(x, y, z) {
  const c = col.get(k(x, z));
  if (!c || y < 0 || y > c.t) return null;
  if (y < c.g) return "found";
  if (y === c.t) return c.t > 0 && openFace(x, z, c.t - 1) ? "parapet" : null;
  if (y === c.t - 1) return openFace(x, z, y) ? "cornice" : "deck";
  if (SLABS.includes(y)) return "slab";
  // a step: the roof of a lower neighbour is the floor of this tier
  if (DIRS.some(([dx, dz]) => { const n = col.get(k(x + dx, z + dz)); return n && n.t < c.t && n.t - 1 === y; })) return "slab";
  return openFace(x, z, y) ? "wall" : null;
}

const B = new Map();                                                 // "x,y,z" -> [block, state]
const put = (x, y, z, name, state) => B.set(`${x},${y},${z}`, [name, state]);
const at = (x, y, z) => B.get(`${x},${y},${z}`);

// the entrance: the outside face with the most cells, its middle cell, a glazed door with flanking piers and a transom
const exposed = (dx, dz) => [...col].filter(([kk]) => { const [x, z] = kk.split(",").map(Number); return T(x + dx, z + dz) < 0; });
let face = DIRS[0], most = -1;
for (const d of DIRS) { const n = exposed(d[0], d[1]).length; if (n > most) { most = n; face = d; } }
const faceCells = exposed(face[0], face[1]).map(([kk]) => kk.split(",").map(Number))
  .sort((a, b) => (face[0] !== 0 ? a[1] - b[1] : a[0] - b[0]));
const [dorX, dorZ] = faceCells[Math.floor(faceCells.length / 2)];
const dorG = col.get(k(dorX, dorZ)).g;
const doorFacing = face[2];
const along = (x, z, s) => (face[0] !== 0 ? [x, z + s] : [x + s, z]);

// the wall's skin: a base course, brick podium and glazed shopfront, then a concrete storey module with two-high glazing
function wallBlock(x, y, z, c, dir) {
  if (y < 8) {
    if (y === c.g) return MAT.base;
    return y === c.g + 1 || y === c.g + 2 ? (glassy(x, z, dir) ? MAT.glass : MAT.brick) : MAT.brick;
  }
  const L = Math.max(...SLABS.filter((s) => s <= y)), rel = y - L;
  if (rel === 1 || rel === 2) return glassy(x, z, dir) ? MAT.glass : MAT.pier;
  return MAT.spandrel;
}
// two glazed bays and a pier in every four along a face
const glassy = (x, z, dir) => { const i = dir[0] !== 0 ? z : x; return i % 4 === 1 || i % 4 === 2; };

for (const [kk, c] of col) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = 0; y <= c.t; y++) {
    const kind = kindAt(x, y, z);
    if (!kind) continue;
    const name = kind === "wall" ? wallBlock(x, y, z, c, openFace(x, z, y)) : MAT[kind];
    put(x, y, z, name.startsWith("minecraft:") ? name.slice(10) : name);
  }
}

// warm light behind some upper-storey windows: a glowstone or a standing lantern on the storey's floor
for (const [kk, c] of col) {
  const [x, z] = kk.split(",").map(Number);
  for (const y of [9, 13, 17, 21].filter((yy) => yy < c.t - 1)) {
    const dir = openFace(x, z, y); if (!dir || at(x, y, z)?.[0] !== MAT.glass) continue;
    if (!glassy(x, z, dir) || (x * 7 + z * 3 + y) % 3 !== 0) continue;
    const ix = x - dir[0], iz = z - dir[1];
    if (!col.has(k(ix, iz)) || kindAt(ix, y, iz)) continue;
    put(ix, y, iz, (x + z) % 2 ? "glowstone" : "lantern", (x + z) % 2 ? undefined : { hanging: "false", waterlogged: "false" });
  }
}

// rooftop plant: 2x2 units on the flat roof at y 20, on interior bays of the main tier
for (const [kk, c] of col) {
  const [x, z] = kk.split(",").map(Number);
  if (c.t !== 20 || x % 9 !== 4 || z % 9 !== 4) continue;
  if (DIRS.every(([dx, dz]) => T(x + dx, z + dz) === 20)) for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(x + a, 20, z + b, MAT.plant);
}

// the entrance: a dark oak door (lower and upper halves) with polished andesite flanks and a glazed transom
const eState = (half) => ({ facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
for (const s of [-1, 1]) {
  const [px, pz] = along(dorX, dorZ, s);
  for (let y = dorG; y <= dorG + 2; y++) if (at(px, y, pz)) put(px, y, pz, "polished_andesite");
}
put(dorX, dorG, dorZ, "dark_oak_door", eState("lower"));
put(dorX, dorG + 1, dorZ, "dark_oak_door", eState("upper"));
put(dorX, dorG + 2, dorZ, MAT.glass);

// the structure must hang from the ground: flood out from the solid blocks at y 0 through face-touching solids, and any
// solid that the flood never reaches is floating (a floor plate is held by its walls, a wall by the slab under it)
const SOFT = new Set(["lantern", "dark_oak_door"]);
const solidAt = (x, y, z) => { const b = at(x, y, z); return b && !SOFT.has(b[0]) ? b : null; };
const seen = new Set(), queue = [];
for (const kk of B.keys()) { const [x, y, z] = kk.split(",").map(Number); if (y === 0 && solidAt(x, y, z)) { seen.add(kk); queue.push([x, y, z]); } }
while (queue.length) {
  const [x, y, z] = queue.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const [nx, ny, nz] = [x + dx, y + dy, z + dz], nk = `${nx},${ny},${nz}`;
    if (!seen.has(nk) && solidAt(nx, ny, nz)) { seen.add(nk); queue.push([nx, ny, nz]); }
  }
}
const floating = [...B.keys()].filter((kk) => !SOFT.has(B.get(kk)[0]) && !seen.has(kk));

const v = new Voxels([W, H, D]);
for (const [kk, [name, state]] of B) { const [x, y, z] = kk.split(",").map(Number); v.set(x, y, z, name, state); }
const stats = v.save(OUT);
console.log(JSON.stringify({ face: face[2], door: [dorX, dorZ], columns: col.size, blocks: stats.blocks, palette: stats.palette, unsupported: floating.length, sample: floating.slice(0, 8) }));
