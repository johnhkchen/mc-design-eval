// 999 9th St NW (Hotel-Large): a 1980s postmodern downtown hotel. Pale precast tower on a granite plinth, stepped
// down to a light-court roof and a low north wing, with storeys on a 3-block rhythm (spandrel row, two glazed rows).
// Massing follows the lidar roof, median-smoothed (3x3) then snapped to a few setback tiers, so every tier is flat.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61719.cells.json", "utf8"));
const W = 28, D = 46, Y = 33;
const TIERS = [5, 13, 16, 19, 21];          // light court, north wing, west setback, shoulder, tower top

const key = (x, z) => `${x},${z}`;
const C = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => C.has(key(x, z));

// 3x3 median of the lidar roof over the footprint, then snap to the nearest tier
const H = new Map(), G = new Map();
for (const [k, { g }] of C) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = C.get(key(x + dx, z + dz)); if (c) vals.push(c.r); }
  vals.sort((a, b) => a - b);
  const med = vals[vals.length >> 1];
  H.set(k, TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best)));
  G.set(k, g);
}
const top = (x, z) => (inside(x, z) ? H.get(key(x, z)) : -1);
const gr = (x, z) => G.get(key(x, z));

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // z-faces first: they decide the mullion axis
// the neighbour directions where the cell at height y has air beside it: outside the footprint, or above that neighbour's roof
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y >= top(nx, nz);
});

const v = new Voxels([W, Y, D]);
const PLINTH = "polished_granite", BASE = "polished_granite", BODY = "white_concrete", SPAN = "light_gray_concrete";
const CORNICE = "stone_bricks", ROOF = "stone", PARAPET = "stone_brick_wall", MULL = "gray_concrete", SHOP_MULL = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane", SHOP = "light_blue_stained_glass", AWNING = "dark_oak_planks";
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [k] of C) {
  const [x, z] = k.split(",").map(Number);
  const g = G.get(k), h = H.get(k);
  for (let y = 0; y < g; y++) v.set(x, y, z, PLINTH);

  for (let y = g; y < h; y++) {
    const ex = exposed(x, y, z);
    const isCap = y === h - 1, isBase = y === g, isFloor = y % 3 === 1;
    if (isCap) { v.set(x, y, z, ex.length ? CORNICE : ROOF); continue; }
    if (isBase) { v.set(x, y, z, ex.length ? BASE : SPAN); continue; }
    if (isFloor) { v.set(x, y, z, SPAN); continue; }     // storey slab: solid across, so every floor stands on the one below
    if (!ex.length) continue;                              // interior air behind the glass
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    const [dx, dz] = ex[0];
    const alongZ = dz !== 0;                               // exposed to the z faces (front and back)
    const idx = alongZ ? x : z;
    if (corner) { v.set(x, y, z, BODY); continue; }
    const front = alongZ && z === 0;
    if (front && y < g + 3) {                              // ground-floor shopfront on the street face
      v.set(x, y, z, idx % 3 === 0 ? SHOP_MULL : SHOP);
      continue;
    }
    if (idx % 3 === 0) { v.set(x, y, z, MULL); continue; }
    v.set(x, y, z, GLASS, alongZ ? PANE_Z : PANE_X);
    // warm light in some windows: a glowstone in the air gap just inside the glass
    if ((x * 5 + y * 3 + z * 7) % 9 === 0) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && y < top(ix, iz) - 1 && (y - 1) % 3 !== 0) v.set(ix, y, iz, "glowstone");
    }
  }

  // parapet on the roof edges that stand above a lower neighbour or the outside
  if (exposed(x, h, z).length && exposed(x, h, z).some(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < h)) {
    v.set(x, h, z, PARAPET);
  }
}

// the street entrance: a double door in the front shopfront, under the black awning band over it
const ENTRY = [13, 14];
for (const x of ENTRY) {
  const g = gr(x, 0);
  const hinge = x === ENTRY[0] ? "left" : "right";
  v.set(x, g, 0, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  v.set(x, g + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = 10; x <= 17; x++) for (let z = 0; z <= 1; z++) {
  const g = gr(x, z);
  if (inside(x, z)) v.set(x, g + 3, z, AWNING);
}

// roof equipment: two plant boxes on the tower top, where the whole footprint sits at the top tier
const plant = [[6, 22, 10, 25], [18, 21, 20, 23]];
for (const [x0, z0, x1, z1] of plant) {
  let ok = true;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (top(x, z) !== 21) ok = false;
  if (!ok) continue;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    v.set(x, 21, z, edge ? SPAN : BODY);
    v.set(x, 22, z, edge ? SPAN : BODY);
    v.set(x, 23, z, ROOF);
  }
}

// the light court's roof: a few planted tubs of azalea on the terrace
for (const [k] of C) {
  const [x, z] = k.split(",").map(Number);
  if (H.get(k) === 5 && (x * 3 + z * 5) % 7 === 0) v.set(x, 5, z, "azalea_leaves");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61719.nbt";
const info = v.save(out);
console.log(JSON.stringify(info));
