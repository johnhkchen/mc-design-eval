// 923 F St NW, Penn Quarter: a brick commercial block on a granite base, 4 storeys over a shopfront and a set-back attic.
// The lidar roof heights are smoothed into two tiers (16 and 18) and a 6 block wing; storeys are 4 blocks, so each
// floor line sits on y % 4 == 0 and the roof is the lidar height. The shell is hollow: floor slabs, walls, air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57927.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 21, Y = 30, Z = 15;
const cell = new Map();
for (const [x, z, g, raw] of cells) cell.set(`${x},${z}`, { x, z, g, raw, r: raw });
const at = (x, z) => cell.get(`${x},${z}`);

// Lidar noise: the tall masses (roof >= 10) take the median of their 3x3 neighbourhood and snap to the 16 or 18 tier;
// the low wing (6) and the porch (2) keep their own heights.
for (const c of cell.values()) {
  if (c.raw < 10) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = at(c.x + dx, c.z + dz); if (n && n.raw >= 10) vals.push(n.raw);
  }
  vals.sort((a, b) => a - b);
  c.r = vals[vals.length >> 1] >= 17 ? 18 : 16;
}

// A cell is solid at height y when it is in the footprint and y lies below its roof (foundation included).
const solidAt = (x, z, y) => { const c = at(x, z); return !!c && y >= 0 && y < c.r; };
const exposedZ = (x, z, y) => !solidAt(x, z - 1, y) || !solidAt(x, z + 1, y);   // the wall runs along x here
const exposedX = (x, z, y) => !solidAt(x - 1, z, y) || !solidAt(x + 1, z, y);   // the wall runs along z here
const perimeter = (x, z, y) => exposedZ(x, z, y) || exposedX(x, z, y);

// The block a cell holds at (x, y, z), or null for air. Glass sits on a brick wall with air behind it.
function kind(x, y, z) {
  const c = at(x, z); if (!c || y < 0) return null;
  if (y < c.g) return { b: "stone_bricks" };                                     // foundation to the lowest ground
  if (y >= c.r) return null;
  const per = perimeter(x, z, y);
  if (y === c.r - 1) return { b: per ? "smooth_stone" : "stone" };              // cornice on the edge, roof surface inside
  if (y === c.g) return { b: per ? "polished_granite" : "smooth_stone" };      // base course, ground floor slab
  if (y % 4 === 0) return { b: "smooth_stone" };                                // storey line and floor slab
  if (!per) return null;                                                        // interior air
  const zs = exposedZ(x, z, y), xs = exposedX(x, z, y);
  if (zs && xs) return { b: "stone_bricks" };                                   // quoins at the corners
  const idx = zs ? x : z;
  if (y % 4 === 3 || idx % 3 === 0) return { b: "bricks" };                    // spandrels and piers
  if (y < 4) return { b: "glass" };                                             // shopfront
  return { b: "glass_pane", s: zs
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" } };
}

const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const k = kind(x, y, z); if (k) g.set(x, y, z, k.b, k.s);
}

// Porch entrance on the south face: a dark oak door (two halves) under a stone canopy.
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(11, 0, 14, "dark_oak_door", door("lower"));
g.set(11, 1, 14, "dark_oak_door", door("upper"));
for (const [x, z] of [[10, 13], [11, 13], [10, 14], [11, 14]]) g.set(x, 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// Roof plant on the 18 tier; planters on the 16 tier and the low wing.
for (const c of cell.values()) {
  if (c.r === 18 && (c.x === 7 || c.x === 13) && (c.z === 3 || c.z === 5)) g.set(c.x, 18, c.z, "iron_block");
  if (c.r === 16 && c.x >= 2 && c.x <= 18 && c.z >= 2 && c.z <= 10 && (c.x + c.z) % 5 === 0) g.set(c.x, 16, c.z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
  if (c.r === 6 && (c.x + c.z) % 3 === 0) g.set(c.x, 6, c.z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

// Warm light behind some glass: a lamp in the interior air next to the window.
for (const c of cell.values()) for (let y = c.g; y < c.r - 1; y++) {
  const k = kind(c.x, y, c.z);
  if (!k || (k.b !== "glass" && k.b !== "glass_pane")) continue;
  if ((c.x * 3 + c.z * 5 + y * 7) % 11 !== 0) continue;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(c.x + dx, c.z + dz); if (!n || y < n.g || y >= n.r) continue;
    if (kind(n.x, y, n.z) === null) { g.set(n.x, y, n.z, y < 4 ? "glowstone" : "shroomlight"); break; }
  }
}

const out = g.save(`${DIR}/DC57927.nbt`);
console.log(`DC57927.nbt: ${out.blocks} blocks, palette ${out.palette}`);
