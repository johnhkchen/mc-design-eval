import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Taipei shophouse-style block, c. 1980s: two storeys of commercial
// ground floor and residential upper floor, white-rendered concrete, stone-clad
// base and storey bands, a cornice and parapet, and a small rooftop service box.
const ID = "OSMw1042397483";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 14, H = 23, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

// Bounds of footprint
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midZ = Math.floor((minZ + maxZ) / 2);

// Bounds-checked setter
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward facade normal for an exterior cell (null if interior)
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function facade(x, z) {
  for (const [nx, nz] of DIRS) {
    if (!has(x + nx, z + nz)) return [nx, nz];
  }
  return null;
}

const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const base = gr;
  const f = facade(x, z);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab (interior) and base course (exterior)
  if (f) put(x, base, z, "stone_bricks");
  else put(x, base, z, "smooth_stone");

  // Storey line / floor slab at top of ground floor
  if (f) put(x, base + 5, z, "stone_bricks");
  else put(x, base + 5, z, "light_gray_concrete");

  // Roof deck (interior) or cornice (exterior) at top of walls
  if (f) put(x, base + 10, z, "stone_brick_slab", SLAB_BOTTOM);
  else put(x, base + 10, z, "gray_concrete");

  if (!f) continue;

  // Exterior walls with window bays
  const [nx, nz] = f;
  const along = nx !== 0 ? z : x;
  const bay = along % 3 !== 0;
  const pane = nx !== 0 ? PANE_X : PANE_Z;

  // Entrance: centred on the street (-z) facade
  const isEntrance = nx === 0 && nz === -1 && x === Math.floor(W / 2);

  // Ground floor: shopfront glazing
  for (let y = base + 1; y <= base + 3; y++) {
    if (isEntrance && y <= base + 2) continue; // open doorway
    if (bay) put(x, y, z, "glass_pane", pane);
    else put(x, y, z, "white_concrete");
  }
  if (isEntrance) {
    // Lantern on the floor inside the doorway
    const ix = x - nx, iz = z - nz;
    if (has(ix, iz)) put(ix, base + 1, iz, "lantern", LANTERN);
  } else {
    put(x, base + 4, z, "white_concrete");
  }

  // Upper floor: windows between storey line and spandrel
  for (let y = base + 6; y <= base + 8; y++) {
    if (bay) put(x, y, z, "glass_pane", pane);
    else put(x, y, z, "white_concrete");
  }
  put(x, base + 9, z, "light_gray_concrete");

  // Warm lights just inside some bays
  if (bay && ((x * 5 + z * 3 + base) % 4 === 0)) {
    const ix = x - nx, iz = z - nz;
    if (has(ix, iz) && !facade(ix, iz)) {
      put(ix, base + 1, iz, "lantern", LANTERN);
      put(ix, base + 6, iz, "lantern", LANTERN);
    }
  }

  // Parapet on exterior edge
  put(x, base + 11, z, "white_concrete");
}

// Rooftop service box (small penthouse) on the central interior cells
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  if (facade(x, z)) continue;
  if (x < minX + 4 || x > maxX - 4) continue;
  if (z < midZ - 2 || z > midZ + 2) continue;
  const base = gr;
  put(x, base + 11, z, "light_gray_concrete");
  put(x, base + 12, z, "light_gray_concrete");
  put(x, base + 13, z, "stone_brick_slab", SLAB_BOTTOM);
}

g.save(`${DIR}/${ID}.nbt`);
