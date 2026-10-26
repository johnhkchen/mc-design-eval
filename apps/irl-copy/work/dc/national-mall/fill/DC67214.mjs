// DC67214: MADAME TUSSAUDS, 1025 F St NW. Commercial-office-large, read as a 1920s Beaux-Arts office block:
// pale limestone walls, diorite pilasters, a granite base, a shopfront and lobby on the street face, and a
// copper-capped tower over wings. Two blocks per storey (a spandrel row, then a window row), so the tower's ~20
// blocks read as ten storeys. Hollow shell: a 1-block wall, an air gap behind the glass, and a solid floor
// slab on every even row (plus the setback roofs), so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67214.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67214.nbt";

const X = 28, Z = 38, H = 32;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const at = new Map();                                    // "x,z" -> { g, r, top, x, z }
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { x, z, g, r, top: 0 });

// Lidar roof, median-smoothed over the 3x3 neighbourhood, then snapped to flat tiers: 20 (tower), 18 (shoulder),
// 15 (wings), and low annexes at their own height. Never below the cell's ground plus two blocks.
const median = (a) => { a = [...a].sort((p, q) => p - q); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const tier = (s) => (s >= 19 ? 20 : s >= 17 ? 18 : s >= 9 ? 15 : Math.max(3, Math.round(s)));
for (const c of at.values()) {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at.get(`${c.x + dx},${c.z + dz}`); if (n) rs.push(n.r); }
  c.top = Math.max(tier(median(rs)), c.g + 2);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inside = (x, y, z) => { const c = at.get(`${x},${z}`); return !!c && y >= 0 && y < c.top; };
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, y, z + dz));
const roofRows = new Set([...at.values()].map((c) => c.top - 1));
const isSolid = (y) => y % 2 === 0 || roofRows.has(y);   // floor slabs on even rows, plus every setback roof

const WALL = "calcite", PIER = "polished_diorite", BASE = "stone_bricks", FILL = "stone", GLASS = "glass";
const CROWN = "oxidized_cut_copper", PARAPET = "smooth_stone", DOOR = "dark_oak_door";
const doorState = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
const AWNING = ["oxidized_cut_copper_slab", { type: "bottom", waterlogged: "false" }];

// the street face is the footprint's north edge (dz = -1); the entrance is a double door in the middle of it
const isEntrance = (x, dz) => dz === -1 && (x === 13 || x === 14);

// block (and state) of one shell cell: base, pilasters, spandrels, glass, entrance, copper crown on the tower
function shell(c, x, y, z, exp) {
  if (y === 0) return [BASE];
  if (y === c.top - 1) return [c.top === 20 ? CROWN : PARAPET];
  if (exp.length >= 2) return [PIER];                    // corners
  const [dx, dz] = exp[0];
  if (isEntrance(x, dz)) {
    if (y === 1) return [DOOR, doorState("lower", x === 13 ? "left" : "right")];
    if (y === 2) return [DOOR, doorState("upper", x === 13 ? "left" : "right")];
    if (y === 3) return AWNING;
  }
  if ((dz ? x : z) % 4 === 0) return [PIER];            // a pilaster every four bays along the face
  return isSolid(y) ? [WALL] : [GLASS];                 // spandrel row, then window row
}

const v = new Voxels([X, H, Z]);
for (const c of at.values()) {
  for (let y = 0; y < c.top; y++) {
    const exp = exposed(c.x, y, c.z);
    if (!exp.length) { if (isSolid(y) || y === c.top - 1) v.set(c.x, y, c.z, FILL); continue; }
    const [block, state] = shell(c, c.x, y, c.z, exp);
    v.set(c.x, y, c.z, block, state);
  }
}

// warm light behind some window bays: a glowstone or shroomlight in the air gap just inside the glass
for (const c of at.values()) {
  for (let y = 1; y < c.top; y += 2) {
    const exp = exposed(c.x, y, c.z);
    if (exp.length !== 1 || isSolid(y)) continue;
    const [dx, dz] = exp[0];
    const bay = dz ? c.x : c.z;
    if (bay % 4 !== 2 || y % 4 !== 1) continue;
    if (v.get(c.x, y, c.z)?.block !== "minecraft:glass") continue;
    if (exposed(c.x - dx, y, c.z - dz).length) continue;
    v.set(c.x - dx, y, c.z - dz, y % 8 === 1 ? "glowstone" : "shroomlight");
  }
}

// roof equipment on the wings and the tower: a few air-conditioning housings standing on the roof slab
for (const c of at.values()) {
  if (exposed(c.x, c.top - 1, c.z).length) continue;
  if (c.top === 15 && c.x % 6 === 3 && c.z % 8 === 4) v.set(c.x, c.top, c.z, "iron_block");
  if (c.top === 20 && c.x % 5 === 2 && c.z % 7 === 3) v.set(c.x, c.top, c.z, "iron_block");
}

const res = v.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries`);
