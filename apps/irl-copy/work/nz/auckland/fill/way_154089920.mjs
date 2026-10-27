import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Ballantyne House: a 1980s concrete-frame office block with a glass curtain wall. The lidar roofs read as a 14-storey core
// in the middle of the site, a 12-storey block to the east and 1-3 storey podium wings (the lidar's 1-3 is a paved deck).
// A storey is 4 blocks: a floor slab on y = 1 + 4k, a sill band, two rows of glass, then the next slab. Every column is solid
// from y 0 up to its own top, so each storey stands on the one below; the interior is air except the floor slabs and a grid
// of structural columns. The lidar's noise is cleaned by a 3x3 median of storey counts.

const SX = 38, SZ = 41;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089920.cells.json", "utf8"));

const key = (x, z) => x * 100 + z;
const roofOf = new Map();
for (const [x, z, , roof] of cells) roofOf.set(key(x, z), roof);
const has = (x, z) => x >= 0 && z >= 0 && x < SX && z < SZ && roofOf.has(key(x, z));

// storeys from the lidar roof (a 1-block base, then 4-block storeys), so roof 58 is 14 storeys and roof 51 is 12
const rawStoreys = (x, z) => Math.max(0, Math.round((roofOf.get(key(x, z)) - 2) / 4));
let storeyMap = new Map();
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) v.push(rawStoreys(x + dx, z + dz));
  v.sort((a, b) => a - b);
  storeyMap.set(key(x, z), v[v.length >> 1]);
}
// twice more, a cross median (a cell and its footprint neighbours): a single lidar-noise spike is pulled down to its tier
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [x, z] of cells) {
    const v = [storeyMap.get(key(x, z))];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (has(x + dx, z + dz)) v.push(storeyMap.get(key(x + dx, z + dz)));
    v.sort((a, b) => a - b);
    next.set(key(x, z), v[v.length >> 1]);
  }
  storeyMap = next;
}
// then an opening (a 3x3 minimum, then a 3x3 maximum): fingers of lidar roof narrower than 3 cells go, the tiers stay
const window3 = (x, z, fn) => { const v = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) v.push(storeyMap.get(key(x + dx, z + dz))); return fn(...v); };
for (const pick of [Math.min, Math.max]) {
  const next = new Map();
  for (const [x, z] of cells) next.set(key(x, z), window3(x, z, pick));
  storeyMap = next;
}
const storeys = (x, z) => storeyMap.get(key(x, z));
const F = (k) => 1 + 4 * k;                                   // floor slab of storey k

const M = {
  plinth: "stone_bricks", slab: "light_gray_concrete", pier: "white_concrete", spandrel: "light_gray_concrete",
  glass: "light_blue_stained_glass", base: "smooth_stone", cornice: "smooth_stone", roof: "gray_concrete",
  column: "white_concrete", plant: "iron_block", paving: "smooth_stone", lamp: "glowstone",
};

// the faces of a cell at storey k that are exposed: to outside the footprint, or to a neighbour with no storey k
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposures = (x, z, k) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || storeys(x + dx, z + dz) <= k);
const isPier = (x, z, ex) => (ex.some(([, dz]) => dz !== 0) && x % 3 === 0) || (ex.some(([dx]) => dx !== 0) && z % 3 === 0);
const isColumn = (x, z) => x % 4 === 2 && z % 4 === 2;

// the entrance: a south-facing ground-storey window bay, off the piers, nearest the middle of the front
const frontCells = cells.filter(([x, z]) => storeys(x, z) > 0 && exposures(x, z, 0).some(([dx, dz]) => dx === 0 && dz === 1) && !isPier(x, z, [[0, 1]]));
const midX = frontCells.reduce((a, [x]) => a + x, 0) / Math.max(1, frontCells.length);
const door = frontCells.length
  ? frontCells.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))[0]
  : cells.find(([x, z]) => storeys(x, z) > 0);
const doorFacing = frontCells.length ? "south" : "north";

const glassBays = [];
const g = new Voxels([SX, 71, SZ]);

for (const [x, z] of cells) {
  const top = storeys(x, z);
  g.set(x, 0, z, M.plinth);                                   // foundation under every cell, so nothing floats
  if (top === 0) { g.set(x, 1, z, M.paving); continue; }      // the lidar's 1-3 blocks: a paved deck

  for (let k = 0; k < top; k++) g.set(x, F(k), z, M.slab);    // floor slabs
  g.set(x, F(top), z, M.roof);                                // roof cap

  for (let k = 0; k < top; k++) {
    const ex = exposures(x, z, k);
    if (!ex.length) continue;
    const f = F(k), pier = isPier(x, z, ex);
    if (k === 0) g.set(x, f, z, M.plinth);                    // the plinth course on the outside of the ground floor
    const isDoor = door && door[0] === x && door[1] === z && k === 0;
    g.set(x, f + 1, z, pier ? M.pier : k === 0 ? M.base : M.spandrel);
    for (const y of [f + 2, f + 3]) g.set(x, y, z, pier ? M.pier : M.glass);
    if (isDoor) {
      const state = { facing: doorFacing, hinge: "left", open: "false", powered: "false" };
      g.set(x, f + 1, z, "iron_door", { ...state, half: "lower" });
      g.set(x, f + 2, z, "iron_door", { ...state, half: "upper" });
      g.set(x, f + 3, z, M.cornice);                          // the lintel over the door
    } else if (!pier) {
      glassBays.push({ x, z, k, ex });
    }
  }

  // cornice and parapet on the outer edge of the roof; setback edges against taller cells stay open terraces
  if (exposures(x, z, top - 1).some(([dx, dz]) => !has(x + dx, z + dz))) {
    g.set(x, F(top), z, M.cornice);
    g.set(x, F(top) + 1, z, M.cornice);
  }

  // structural columns on an interior grid, from the foundation to the roof cap
  if (!exposures(x, z, top - 1).length && isColumn(x, z)) {
    for (let y = 1; y < F(top); y++) g.set(x, y, z, M.column);
  }
  // roof plant: small iron boxes where the lidar says the roof stands two or more blocks above the cap
  const plantH = roofOf.get(key(x, z)) - F(top);
  if (plantH >= 2 && !exposures(x, z, top - 1).length && !isColumn(x, z) && x % 3 === 1 && z % 3 === 1) {
    for (let y = F(top) + 1; y <= F(top) + 2; y++) g.set(x, y, z, M.plant);
  }
}

// warm light behind some glass: a lamp in the room just inside the window, on a floor slab
for (const { x, z, k, ex } of glassBays) {
  const [dx, dz] = ex[0];
  const bay = dz !== 0 ? x : z;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || storeys(ix, iz) <= k || isColumn(ix, iz) || exposures(ix, iz, k).length) continue;
  if ((bay * 3 + k * 5) % 7 !== 0) continue;
  g.set(ix, F(k) + 2, iz, M.lamp);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089920.nbt";
const info = g.save(out);
const tops = cells.map(([x, z]) => storeys(x, z));
console.log(`Ballantyne House: ${cells.length} cells, storeys ${Math.min(...tops)}-${Math.max(...tops)}, ${info.blocks} blocks, ${info.palette} palette entries, door ${door?.slice(0, 2)} facing ${doorFacing}`);
