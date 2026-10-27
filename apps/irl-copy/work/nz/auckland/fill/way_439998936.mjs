// Meridian Apartments: a 1980s concrete-frame apartment block, ten storeys on a tower-and-wings massing (lidar tiers),
// pale precast bands, mullioned glazing with a 1-block air gap behind it, warm lights in some windows, a stone base
// course, a lobby entrance on the outside face of the tower, a parapet and roof plant. Storey lines sit on a global
// 4-block grid from y 0, so the downhill side (ground 0) shows extra storeys below the uphill ground floor.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_439998936.cells.json", "utf8"));
const DX = 39, DZ = 24, H = 58;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// footprint lookup: ground g (foundation top) and tier top T (exclusive), T on the 4-block storey grid
const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, ground, roof] of cells) {
  // lidar tiers: roof rounded to the nearest storey; anything under 2 blocks above ground is a slab on the ground
  let T = roof < 2 ? ground + 1 : Math.max(4, 4 * Math.round(roof / 4));
  if (T <= ground) T = ground + 1;
  fp.set(key(x, z), { g: ground, T });
}
const inFp = (x, z) => fp.has(key(x, z));
const cell = (x, z) => fp.get(key(x, z));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// the outward directions a footprint cell at height y is exposed on: outside the footprint, or beside a lower tier
function exposures(x, z, y) {
  const out = [];
  for (const [dx, dz] of DIRS) {
    const n = cell(x + dx, z + dz);
    if (!n || y >= n.T) out.push([dx, dz]);
  }
  return out;
}

const g = new Voxels([DX, H, DZ]);
const windowCells = [], lobby = [];

// pass 1: the solid mass, storey bands, glazing grid, base course, cornice, roof
for (const [k, { g: ground, T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (y < ground) { g.set(x, y, z, "stone"); continue; }
    const ex = exposures(x, z, y);
    if (y === T - 1) { g.set(x, y, z, ex.length ? "white_concrete" : "smooth_stone"); continue; }    // cornice / roof
    if (!ex.length) { g.set(x, y, z, "light_gray_concrete"); continue; }                              // core
    if (y === ground) { g.set(x, y, z, "stone_bricks"); continue; }                                     // base course
    const r = y % 4;
    if (r === 0 || r === 3) { g.set(x, y, z, "white_concrete"); continue; }                             // floor and head bands
    const [dx, dz] = ex[0];
    const u = dx !== 0 ? z : x;                                                                          // position along the face
    if (u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }                                     // mullion
    g.set(x, y, z, hash(x, y, z) % 5 === 0 ? "gray_stained_glass" : "light_blue_stained_glass");
    windowCells.push({ x, y, z, dx, dz });
  }
  // a parapet on the outside edge of the top
  if (exposures(x, z, T).some(([dx, dz]) => !inFp(x + dx, z + dz))) g.set(x, T, z, "white_concrete");
}

// pass 2: an air gap behind each window (only where the cell inward is enclosed), a warm light in some of them
for (const { x, y, z, dx, dz } of windowCells) {
  if (y % 4 === 3) continue;
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz)) continue;
  const inner = cell(ix, iz);
  if (y >= inner.T || y < inner.g) continue;
  const enclosed = DIRS.every(([ex, ez]) => inFp(ix + ex, iz + ez) && (cell(ix + ex, iz + ez).T > y));
  if (!enclosed) continue;
  g.set(ix, y, iz, "air");
  if (y % 4 === 1 && hash(x, y, z) % 4 === 0) g.set(ix, y, iz, "glowstone");
}

// the lobby: a door on the outward face of the tower, a stone canopy over it, two hanging lanterns
let best = null;
for (const [k, { g: ground, T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (T < 40 || ground > 6) continue;
  for (const [dx, dz] of exposures(x, z, ground + 1)) {
    if (inFp(x + dx, z + dz)) continue;
    const score = Math.abs(x - 19) + Math.abs(z - 12);
    if (!best || score < best.score) best = { x, z, dx, dz, ground, score };
  }
}
if (best) {
  const { x, z, dx, dz, ground: gr } = best;
  const facing = FACING[`${dx},${dz}`];
  const door = { facing, hinge: "left", open: "false", powered: "false" };
  g.set(x, gr, z, "dark_oak_door", { ...door, half: "lower" });
  g.set(x, gr + 1, z, "dark_oak_door", { ...door, half: "upper" });
  const along = dx !== 0 ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
  for (const [ax, az] of [[0, 0], ...along]) {
    const cx = x + ax, cz = z + az;
    if (!inFp(cx, cz)) continue;
    g.set(cx, gr + 2, cz, "stone_bricks");
    if (ax || az) g.set(cx, gr + 1, cz, "lantern", { hanging: "true" });
    lobby.push([cx, cz]);
  }
}

// rooftop plant on the tower and the upper wings: plain boxes on the roof, set on the roof cap
for (const [k, { T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (T < 28 || x % 6 !== 3 || z % 6 !== 3) continue;
  if (exposures(x, z, T - 1).length) continue;
  g.set(x, T, z, "light_gray_concrete");
  if (T + 1 < H) g.set(x, T + 1, z, "light_gray_concrete");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_439998936.nbt";
console.log(g.save(out), "entrance", best ? `${best.x},${best.z} facing ${FACING[`${best.dx},${best.dz}`]}` : "none");
