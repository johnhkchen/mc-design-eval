// Walker Wayland Centre: a late-1970s / 1980s Auckland office tower, 25 x 27 blocks on a sloping site (the ground falls
// from about 14 blocks above the lowest ground in the south-west to 0 on the north and east). The lidar roof sits on two
// flat tiers: a 13-storey slab (roof 52) across the footprint, and a 14-storey core (roof 56) on the west-central part
// (the lidar's 57s). Each column is solid from y 0 up to its ground and then up to its roof, so every storey stands on
// the one below. Facade: a stone base (two storeys, a plinth, shopfront glazing, a stone band), then a 4-block storey
// grammar: a grey spandrel, two rows of glass between white concrete mullions every third block, and a pale band.
// Warm glass in about one bay in eight. A recessed entrance on the north face, at the lowest ground, under a stone lintel.
// Roof: a white parapet, plant boxes on the core and a mast. Interiors: air between the floor slabs, walled by the shell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_147110862.cells.json", "utf8"));

const W = 25, D = 27, H = 64;
const SIDES = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// the palette: a dark stone base, pale concrete piers and parapet, grey spandrels, blue-grey glass, warm yellow glass
const FOUND = "stone", BASE = "stone_bricks", PLINTH = "polished_andesite", BAND = "smooth_stone";
const PIER = "white_concrete", SPANDREL = "gray_concrete", GLASS = "light_blue_stained_glass", WARM = "yellow_stained_glass";
const FLOOR = "light_gray_concrete", ROOF = "gray_concrete", PLANT = "light_gray_concrete";

const key = (x, z) => `${x},${z}`;
const cell = new Map();                                 // "x,z" -> { g: ground, r: lidar roof above y 0 }
for (const [x, z, g, r] of cells) cell.set(key(x, z), { g, r });
const inF = (x, z) => cell.has(key(x, z));

// 1. The roof tiers: the lidar's noise is medianed over 5x5, then each cell is one of two flat tiers (a core at 56 where
// the median is 55 or over, the slab at 52 elsewhere). A tier is never less than two storeys above its ground.
const top = new Map();
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number), v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) v.push(cell.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const med = v[v.length >> 1];
  top.set(k, Math.max(med >= 55 ? 56 : 52, c.g + 8));
}
const topAt = (x, z) => top.get(key(x, z)) ?? -1;
const maxTop = Math.max(...top.values());

// Solid where it is in the footprint and under its roof (the foundation below the ground included).
const solid = (x, y, z) => y >= 0 && inF(x, z) && topAt(x, z) > y;
// The sides a block at (x, y, z) shows to the outside: no solid massing beside it at that height.
const faces = (x, y, z) => SIDES.filter(([, dx, dz]) => !solid(x + dx, y, z + dz));
// Piers every third block along the face the block shows (z on a west or east face, x on a north or south one).
const pier = (x, z, f) => (f[0][1] !== 0 ? z : x) % 3 === 0;
const hash = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };
const lit = (x, y, z) => hash(x, y, z) % 8 === 0;     // one bay in eight is warm glass

// 2. The entrance: the north face (the street at the lowest ground), two door leaves in the middle of the face.
const DOOR_X = [16, 17], DOOR_Z = 0;
const doorAt = (x, y, z) => z === DOOR_Z && DOOR_X.includes(x) && (y === 0 || y === 1);

const vox = new Voxels([W, H, D]);
const counts = {};
const put = (x, y, z, block, state) => { vox.set(x, y, z, block, state); counts[block] = (counts[block] || 0) + 1; };

// 3. The shell: foundation to each ground, then walls where a column shows a face, floor slabs on the storey lines,
// and air between them.
const wall = (x, y, z, f) => {
  if (y < 4) {                                          // the base: a plinth, shopfront glass, a stone band
    if (y === 0) return PLINTH;
    if (y === 3) return BAND;
    return pier(x, z, f) ? BASE : (lit(x, y, z) ? WARM : GLASS);
  }
  if (y % 4 === 0) return SPANDREL;                     // a grey spandrel under each storey's glass
  if (y % 4 === 3) return BAND;                         // a pale band at the top of each storey
  if (pier(x, z, f)) return PIER;
  return lit(x, y, z) ? WARM : GLASS;
};
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number), t = topAt(x, z), g = c.g;
  for (let y = 0; y < g; y++) put(x, y, z, FOUND);
  for (let y = g; y < t; y++) {
    const f = faces(x, y, z);
    if (doorAt(x, y, z)) {                              // two door leaves, hinged at their outer edges
      const lower = y === 0 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half: lower, hinge: x === DOOR_X[0] ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (f.length && z === DOOR_Z && DOOR_X.includes(x) && y === 2) { put(x, y, z, "chiseled_stone_bricks"); continue; }
    if (f.length && y === t - 1) { put(x, y, z, BAND); continue; }        // the cornice course under the parapet
    if (f.length) { put(x, y, z, wall(x, y, z, f)); continue; }
    if (y % 4 === 0 || y === t - 1) put(x, y, z, y === t - 1 ? ROOF : FLOOR);   // a floor slab, or the roof deck
  }
  // the parapet: one block of pale concrete on each roof edge, standing on the column's own roof
  const edge = SIDES.some(([, dx, dz]) => !inF(x + dx, z + dz) || topAt(x + dx, z + dz) < t);
  if (edge) put(x, t, z, PIER);
}

// 4. The rooftop: plant boxes on the core (its 4 x 4 middle), and a mast with a lightning rod on the plant.
const plant = [];
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (topAt(x, z) === maxTop && x >= 4 && x <= 7 && z >= 11 && z <= 14) plant.push([x, z]);
}
for (const [x, z] of plant) { put(x, maxTop, z, PLANT); put(x, maxTop + 1, z, PLANT); }
if (plant.length) {
  const [mx, mz] = [5, 12];
  for (let y = maxTop + 2; y < maxTop + 6; y++) put(mx, y, mz, "iron_bars");
  put(mx, maxTop + 6, mz, "lightning_rod");
}

const res = vox.save(DIR + "way_147110862.nbt");
console.log(JSON.stringify({ tiers: [...new Set(top.values())].sort((a, b) => a - b), maxTop, plant: plant.length, counts, ...res }));
