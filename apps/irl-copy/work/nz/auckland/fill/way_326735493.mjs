import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A three-storey Edwardian commercial block (c.1905-1925) on a basalt plinth: brick piers and
// sash-style glass, cream quartz string courses and cornice, a street door on the low north side.
// The lidar roof reads 12 or 13 blocks; the two tiers are smoothed into one flat parapet at 13.
// Storey lines sit at y 4 and 8, the cornice at y 12, the coping at y 13.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735493.cells.json", "utf8"));

const TOP = 12;                       // last solid row under the cornice
const WIN_ROWS = [1, 2, 3, 5, 6, 7, 9, 10, 11];   // three glazed bands, one per storey (each band starts above the ground)
const LINES = [4, 8];                 // string courses between storeys
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const DOOR = [2, 0];                  // north face, ground 0: the street entrance between two windows

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const has = (x, z) => ground.has(key(x, z));
const exterior = (x, z) => Object.keys(DIRS).filter(d => { const [dx, dz] = DIRS[d]; return !has(x + dx, z + dz); });
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];

// Glazing: on a single exterior face, every odd cell along the face is a window, with a 1-cell air
// gap behind it (the cell inward). Corners, the door and the even cells stay brick piers.
const windowOf = new Map();           // key -> outward face
const innerOf = new Map();            // window key -> inward cell [x, z]
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fs = exterior(x, z);
  if (fs.length !== 1 || isDoor(x, z)) continue;
  const f = fs[0];
  const [dx, dz] = DIRS[f];
  const along = f === "N" || f === "S" ? x : z;
  if (along % 2 === 0 || !has(x - dx, z - dz)) continue;
  windowOf.set(key(x, z), f);
  innerOf.set(key(x, z), [x - dx, z - dz]);
}
const carved = new Set([...innerOf.values()].map(([x, z]) => key(x, z)));
const isGlass = (x, y, z) => windowOf.has(key(x, z)) && WIN_ROWS.includes(y) && y > ground.get(key(x, z));

const g = new Voxels([15, 26, 9]);

for (const [x, z, gc] of cells) {
  const k = key(x, z);
  const B = exterior(x, z).length > 0;

  // foundation to the cell's own ground, then the base course on the surface
  for (let y = 0; y < gc; y++) g.set(x, y, z, B ? "stone_bricks" : "stone");
  g.set(x, gc, z, B ? "polished_basalt" : "stone");

  for (let y = gc + 1; y <= TOP; y++) {
    if (isDoor(x, z)) {
      if (y === 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 2) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 3) { g.set(x, y, z, "smooth_quartz"); continue; }
    }
    if (carved.has(k) && WIN_ROWS.includes(y)) continue;   // air behind the glass
    if (!B) { g.set(x, y, z, "stone"); continue; }         // core, hidden behind the skin
    if (LINES.includes(y) || y === TOP) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (isGlass(x, y, z)) {
      const east = isGlass(x + 1, y, z), west = isGlass(x - 1, y, z);
      const south = isGlass(x, y, z + 1), north = isGlass(x, y, z - 1);
      const s = { north: String(north), south: String(south), east: String(east), west: String(west), waterlogged: "false" };
      g.set(x, y, z, "glass_pane", s);
      continue;
    }
    g.set(x, y, z, "bricks");
  }

  // coping on the parapet
  if (B && !isDoor(x, z)) g.set(x, TOP + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// warm lights standing on the floor inside the air gaps: glowstone on the ground floor, shroomlight above
for (const [k, f] of windowOf) {
  const [x, z] = k.split(",").map(Number);
  const [ix, iz] = innerOf.get(k);
  if ((x + z) % 3 !== 0) continue;
  const gc = ground.get(k);
  if (gc + 1 <= 3) g.set(ix, gc + 1, iz, "glowstone");
  g.set(ix, 5, iz, "shroomlight");
  g.set(ix, 9, iz, "shroomlight");
}

// roof plant: a 2x2 stone enclosure with a slab cap on the flat roof, on interior cells
const interior = (x, z) => has(x, z) && exterior(x, z).length === 0;
let plant = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if ([[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => interior(a, b))) { plant = [x, z]; break; }
}
if (plant) {
  const [px, pz] = plant;
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    g.set(px + dx, 13, pz + dz, "stone_bricks");
    g.set(px + dx, 14, pz + dz, "stone_bricks");
    g.set(px + dx, 15, pz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// every solid cell above the ground must stand on a solid cell below it, or span an air gap
// behind the glass from solid neighbours (a lintel); anything else would hang in the air
const bad = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) for (let y = 1; y < 26; y++) {
  if (!g.get(x, y, z)) continue;
  if (g.get(x, y - 1, z)) continue;
  const spans = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].some(([a, b]) => g.get(a, y, b));
  if (!spans) bad.push([x, y, z]);
}
if (bad.length) console.warn("unsupported cells:", bad);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735493.nbt");
