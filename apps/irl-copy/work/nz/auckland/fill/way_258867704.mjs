// Way 258867704, Auckland (Mt Eden / Newton edge): a 1970s concrete-frame office block, six storeys on a stepped
// basalt-and-stone plinth, with a seven-storey core rising to the middle of the footprint. The lidar roof is
// median-smoothed over 5x5 footprint cells and snapped to the 4-block storey grid (24 body, 28 core, 16/12 wings, 8
// low edges, never under the ground plus one storey). Facade: a white band at each floor line, a light-grey spandrel
// under each glass ribbon, blue glass with light-grey piers every third bay, a white cornice and a light-grey parapet
// on the outer edge. The ground floor is a glass shopfront with one dark-oak entrance on the lowest south-facing edge
// under a lintel. Interiors are air with a floor slab per storey and a roof slab; glowstone and shroomlight sit behind
// some panes. Setback faces take the same treatment as the outer walls wherever a lower neighbour leaves them open.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_258867704.cells.json", "utf8"));
const W = 141, D = 115, H = 42, TOP_MAX = 28;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1);   // ground under each cell, -1 = not footprint
const R = grid(0);    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// smoothed, snapped roof tier per cell: a clean storey-grid top, never under the ground plus one storey
const median = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inF(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = grid(0);
for (const [x, z, g] of cells) T[x][z] = Math.max(g + 4, Math.min(TOP_MAX, Math.max(8, Math.round(median(x, z) / 4) * 4)));

// a cell's open sides at height y: a neighbour not enclosed there (outside the footprint, or its roof is lower)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const enclosed = (x, z, y) => inF(x, z) && y < T[x][z];
const exposure = (x, z, y) => DIRS.filter(([dx, dz]) => !enclosed(x + dx, z + dz, y));

// the entrance: the lowest cell on the south edge (outside neighbour at +z), nearest the middle
const doorCands = cells.filter(([x, z]) => !inF(x, z + 1)).sort((a, b) => a[2] - b[2] || Math.abs(a[0] - 70) - Math.abs(b[0] - 70));
const [DX, DZ] = doorCands[0].slice(0, 2), DG = G[DX][DZ];

// warm lights in the room cell behind some glass panes (one window in seven, no two on the same bay)
const lamps = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  for (let y = G[x][z]; y < T[x][z] - 1; y++) {
    const ex = exposure(x, z, y);
    if (!ex.length || y % 4 === 0 || y % 4 === 3 || y <= G[x][z] + 2 && y > G[x][z]) continue;
    if (((x * 31 + y * 17 + z * 13) % 7) !== 0) continue;
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
    if (inF(ix, iz) && !exposure(ix, iz, y).length) lamps.add(`${ix},${y},${iz}`);
  }
}

const WHITE = "white_concrete", LIGHT = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const FLOOR = "smooth_stone", BASE = "polished_andesite", FOUND = "stone";

function blockAt(x, y, z) {
  if (!inF(x, z)) return null;
  const g = G[x][z], t = T[x][z];
  if (y < g) return FOUND;
  // entrance: dark-oak door on the lower two rows, lintel above it across five bays
  if (x === DX && z === DZ && (y === DG || y === DG + 1)) {
    const st = { facing: "south", hinge: "left", open: "false", powered: "false", half: y === DG ? "lower" : "upper" };
    return ["dark_oak_door", st];
  }
  if (z === DZ && Math.abs(x - DX) <= 2 && y === DG + 2) return LIGHT;
  const ex = exposure(x, z, Math.min(y, t - 1));
  const outer = ex.some(([dx, dz]) => !inF(x + dx, z + dz));
  // roof: parapet on the outer edge, roof slab, plant boxes on the roof of the room cells
  if (y >= t) {
    if (y === t && outer) return LIGHT;
    // rooftop plant: a 7 x 7 cell plant block, two blocks high, once per 40 x 36 bay of the 24+ tiers
    const plant = !ex.length && t >= 24 && x % 40 >= 14 && x % 40 <= 20 && z % 36 >= 10 && z % 36 <= 16;
    if (plant && (y === t || y === t + 1)) return LIGHT;
    return null;
  }
  if (y === t - 1) return ex.length ? WHITE : LIGHT;
  if (!ex.length) {
    if (y === g || (y % 4 === 0 && y > g)) return FLOOR;
    if (lamps.has(`${x},${y},${z}`)) return ((x + y + z) % 2) ? "glowstone" : "shroomlight";
    return null;
  }
  if (y === g) return BASE;
  if (y <= g + 2 && y % 4 !== 0) return GLASS;             // shopfront
  if (y % 4 === 0) return WHITE;                           // floor line band
  if (y % 4 === 3) return LIGHT;                           // spandrel
  const [dx] = ex[0];
  const along = dx !== 0 ? z : x;                          // piers every third bay along the face
  return along % 3 === 0 ? LIGHT : GLASS;
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
  const b = blockAt(x, y, z);
  if (!b) continue;
  if (typeof b === "string") g.set(x, y, z, b);
  else g.set(x, y, z, b[0], b[1]);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_258867704.nbt";
console.log(g.save(out));
