// Way 1167684912, Mt Eden / Newton edge of the CBD: a 1980s-style office block, a six-storey white concrete podium
// with a ribbon-glazed ground floor, and a tower on its south-west edge (lidar roof 70-80) that steps back as it rises.
// Storey lines sit at y = 4k so every floor, setback and roof lands on the course below. Interior is air behind the
// glass, with one floor slab per storey; only the exposed ring of the footprint (and the setback faces) is walled.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1167684912.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const at = (x, z) => cell.get(key(x, z));
const round4 = (v) => Math.round(v / 4) * 4;
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// 1. Smooth the lidar roof: the median of a 7 x 7 window of footprint cells removes the 1-3 cell rim of tall
//    returns and single-cell noise, leaving the podium, the tower strip and the low wing as flat bands.
for (const c of cells.map(([x, z, g, r]) => at(x, z))) {
  const v = []; for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); c.R = v[v.length >> 1];
}
// The tall returns (roof 60+) sit mostly in a 2-4 cell rim along the south-west edge; a single cell or a thin strip is
// rim noise, not massing, so a tier only counts where at least 60% of the footprint within 5 cells agrees.
const dense = (x0, z0, test) => { let n = 0, t = 0; for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) { const c = at(x0 + dx, z0 + dz); if (c) { n++; if (test(c)) t++; } } return t / n >= 0.6; };
const tallRaw = (c) => c.r >= 60, mid = (c) => c.R >= 30;
const towerMask = new Set(), midMask = new Set();
for (const c of cells.map(([x, z]) => at(x, z))) {
  if (tallRaw(c) && dense(c.x, c.z, tallRaw)) towerMask.add(key(c.x, c.z));
  if (mid(c) && dense(c.x, c.z, mid)) midMask.add(key(c.x, c.z));
}

// 2. Tiers: a tower (80 where the lidar reads the top, 64 round it), a 40 shoulder within 2 cells of it and the mid
//    setback, the 24 podium, and the low wing (at least 2 storeys over its ground).
const nearTower = (x0, z0, d) => { for (let dz = -d; dz <= d; dz++) for (let dx = -d; dx <= d; dx++) if (towerMask.has(key(x0 + dx, z0 + dz))) return true; return false; };
for (const c of cells.map(([x, z]) => at(x, z))) {
  let top;
  if (towerMask.has(key(c.x, c.z))) {
    top = c.r >= 70 ? 80 : 64;                      // the full height where the lidar reads the top, a step-back elsewhere
  } else if (nearTower(c.x, c.z, 2) || midMask.has(key(c.x, c.z))) top = 40;   // the shoulder steps down from the tower
  else if (c.R >= 17) top = 24;
  else top = Math.max(16, round4(c.g + 8));
  c.F0 = Math.ceil(c.g / 4) * 4;                    // first storey line at or above the ground under the cell
  c.T = Math.max(top, c.F0 + 8);                    // roof top, always on a storey line
}
const exposed = (c) => DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; });
for (const c of cells.map(([x, z]) => at(x, z))) c.ext = exposed(c);

// 3. Build the columns.
const g = new Voxels([72, 92, 111]);
const STONE = "stone", BASALT = "polished_basalt", SLAB = "light_gray_concrete", BAND = "smooth_stone", PARAPET = "stone_bricks";
for (const c of cells.map(([x, z]) => at(x, z))) {
  const tower = c.T >= 56;
  const spandrel = tower ? "light_gray_concrete" : "white_concrete";
  const glass = tower ? "cyan_stained_glass" : "light_blue_stained_glass";
  const mullion = tower ? "gray_concrete" : "light_gray_concrete";
  for (let y = 0; y < c.F0; y++) g.set(c.x, y, c.z, y < c.g ? STONE : BASALT);
  for (let y = c.F0; y < c.T; y++) {
    const r = (y - c.F0) % 4, storey = (y - c.F0) >> 2;
    if (!c.ext) {                                   // interior: a floor slab per storey, a roof slab, air between
      if (r === 0 || y === c.T - 1) g.set(c.x, y, c.z, SLAB);
      continue;
    }
    if (r === 0) { g.set(c.x, y, c.z, BAND); continue; }                    // string course on the slab line
    if (r === 3) { g.set(c.x, y, c.z, y === c.T - 1 ? BAND : spandrel); continue; }   // head band or cornice
    // glass with frames: a fin every third ring cell; the ground storey is a shopfront with no fins
    if (storey === 0) g.set(c.x, y, c.z, glass);
    else g.set(c.x, y, c.z, (c.x + c.z) % 3 === 0 ? mullion : glass);
  }
  if (c.ext) g.set(c.x, c.T, c.z, PARAPET);
}

// 4. The entrance: one door on the lowest exposed cell, facing out, with a threshold and a header.
const ring = cells.map(([x, z]) => at(x, z)).filter((c) => c.ext && c.g <= 1);
const ent = ring.sort((a, b) => a.g - b.g || a.z - b.z || a.x - b.x)[Math.floor(ring.length / 2)];
const outward = DIRS.find(([dx, dz]) => !at(ent.x + dx, ent.z + dz))?.[2] ?? "north";
g.set(ent.x, ent.F0, ent.z, "smooth_stone");
g.set(ent.x, ent.F0 + 3, ent.z, PARAPET);
for (const [half, y] of [["lower", ent.F0 + 1], ["upper", ent.F0 + 2]])
  g.set(ent.x, y, ent.z, "dark_oak_door", { facing: outward, half, hinge: "left", open: "false", powered: "false" });

// 5. Warm light behind some glass: a glowstone on the interior cell inside a lit window (one in nine).
for (const c of cells.map(([x, z]) => at(x, z))) {
  if (!c.ext) continue;
  for (let s = 1; (c.F0 + 4 * s + 1) < c.T - 1; s++) {
    const y = c.F0 + 4 * s + 1;
    if (y % 4 !== 1 || (c.x + c.z) % 3 === 0 || (c.x * 7 + c.z * 3 + s * 5) % 9 !== 0) continue;
    const inner = DIRS.map(([dx, dz]) => at(c.x + dx, c.z + dz)).find((n) => n && !n.ext && n.T > y);
    if (inner) g.set(inner.x, y, inner.z, "glowstone");
  }
}

// 6. Roof plant: 2 x 2 rooftop units on the podium's flat roof, and a lightning rod on the tallest tower cell.
for (const c of cells.map(([x, z]) => at(x, z))) {
  if (c.ext || c.T !== 24 || c.x % 12 !== 5 || c.z % 12 !== 5) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (quad.every((n) => n && !n.ext && n.T === 24)) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(c.x + dx, 24, c.z + dz, "iron_block");
}
const crown = cells.map(([x, z]) => at(x, z)).filter((c) => !c.ext && c.T === 80).sort((a, b) => a.x - b.x || a.z - b.z)[0];
if (crown) g.set(crown.x, 80, crown.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const stats = g.save(`${DIR}/way_1167684912.nbt`);
console.log(JSON.stringify({ cells: cells.length, tower: cells.filter(([x, z]) => at(x, z).T === 80).length, ...stats }));
