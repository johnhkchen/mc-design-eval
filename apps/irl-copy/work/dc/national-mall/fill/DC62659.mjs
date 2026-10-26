// 2001 M St NW: a 1980s commercial office block, 5 storeys on a 15-block tower, 4-storey wings, a 2-storey south annex.
// Storey lines sit on absolute y (every 3 blocks from y 0), so the tiers and the foundations line up across the slope.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62659.cells.json", "utf8"));

const X = 15, Y = 27, Z = 37;

// lidar roof heights smoothed into flat tiers: 15 tower, 12 wings, 9 and 7 the south annex; 0-1 is a floor-only plaza
const tier = (r) => (r >= 14 ? 15 : r >= 11 ? 12 : r >= 9 ? 9 : r >= 7 ? 7 : 1);

const fp = new Map();
for (const [x, z, G, roof] of cells) fp.set(`${x},${z}`, { x, z, G, T: tier(roof) });
const cell = (x, z) => fp.get(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];     // N (z 0, the M St frontage), S, W, E

// the sides of a cell that face air or a lower tier at height y
const openSides = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || y >= n.T; });
const outer = (x, z) => DIRS.some(([dx, dz]) => !cell(x + dx, z + dz));

const M = {
  plinth: "polished_andesite", floor: "light_gray_concrete", roof: "stone",
  cornice: "polished_andesite", pier: "calcite", spandrel: "smooth_quartz",
  glass: "light_blue_stained_glass_pane", shop: "glass_pane", shopPier: "polished_andesite",
  lamp: "lantern",
};

const V = new Map();
const put = (x, y, z, block, state) => V.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => V.get(`${x},${y},${z}`);

for (const { x, z, G, T } of fp.values()) {
  for (let y = 0; y <= T; y++) {
    if (y < G) { put(x, y, z, M.plinth); continue; }               // foundation up to the cell's ground
    const sides = openSides(x, z, y);
    if (y === 0) { put(x, y, z, sides.length ? M.plinth : M.floor); continue; }
    if (y === T) { if (outer(x, z)) put(x, y, z, M.cornice); continue; }    // parapet on the footprint edge
    if (y === T - 1) { put(x, y, z, sides.length ? M.cornice : M.roof); continue; }  // roof cap
    if (!sides.length) { if (y % 3 === 0) put(x, y, z, M.floor); continue; }  // interior: air, slab per storey
    if (y % 3 === 0) { put(x, y, z, M.spandrel); continue; }        // storey line
    const ground = y < 3;
    const pier = (sides[0][0] !== 0 ? z : x) % 3 === 0;             // bays: pier, two panes
    put(x, y, z, pier ? (ground ? M.shopPier : M.pier) : (ground ? M.shop : M.glass));
  }
}

// warm light in some windows: a lantern on the floor just inside the pane
for (const [k, v] of [...V]) {
  if (v.block !== M.glass && v.block !== M.shop) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 3 !== 1) continue;
  const [dx, dz] = openSides(x, z, y)[0];
  const ix = x - dx, iz = z - dz;
  if (!cell(ix, iz) || at(ix, y, iz) || !at(ix, y - 1, iz)) continue;
  const lit = v.block === M.shop ? (x + z) % 2 === 0 : (x * 5 + z * 3 + y) % 8 === 0;
  if (lit) put(ix, y, iz, M.lamp, { hanging: "false", waterlogged: "false" });
}

// the M St entrance: a recessed bay at x 8, a granite canopy over it, and a hanging lantern inside
put(8, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(8, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 6; x <= 10; x++) put(x, 3, 0, M.shopPier);
put(8, 2, 1, M.lamp, { hanging: "true", waterlogged: "false" });

// a mechanical penthouse on the tower's roof: 5 x 5 footprint, two storeys of walls, a cornice roof
for (let x = 5; x <= 9; x++) for (let z = 14; z <= 18; z++) {
  const edge = x === 5 || x === 9 || z === 14 || z === 18;
  const mid = x === 5 || x === 9 ? z > 14 && z < 18 : x > 5 && x < 9;
  if (edge) { put(x, 15, z, M.pier); put(x, 16, z, mid ? M.glass : M.pier); }
  put(x, 17, z, M.cornice);
}
// a plant box on the tower's roof beside it, only where the footprint is the tower's full height
for (let x = 6; x <= 7; x++) for (let z = 21; z <= 22; z++) {
  if (cell(x, z)?.T !== 15) continue;
  put(x, 15, z, M.pier); put(x, 16, z, M.cornice);
}

// panes join the solid and pane neighbours in their plane
const FULL = new Set([M.plinth, M.cornice, M.roof, M.pier, M.spandrel, M.floor, M.shopPier]);
const joins = (x, y, z, dx, dz) => { const v = at(x + dx, y, z + dz); return !!v && (FULL.has(v.block) || v.block.endsWith("_pane")); };
for (const [k, v] of V) {
  if (!v.block.endsWith("_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  v.state = { north: String(joins(x, y, z, 0, -1)), south: String(joins(x, y, z, 0, 1)), east: String(joins(x, y, z, 1, 0)), west: String(joins(x, y, z, -1, 0)), waterlogged: "false" };
}

const g = new Voxels([X, Y, Z]);
for (const [k, { block, state }] of V) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const r = g.save(join(here, "DC62659.nbt"));
console.log(`DC62659.nbt: ${r.blocks} blocks, ${r.palette} palette entries`);
