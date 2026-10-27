// Way 292861505, Auckland: a 1980s precast-concrete-framed office block of 12 storeys over a stone plinth, the
// mid-rise commercial typical of the CBD's fringe. Its lidar roofs are median-smoothed and snapped to the 4-block storey
// grid (floors at y 8, 12, 16 ...; the storey line at 8 is the entrance floor, the highest ground under the footprint),
// so the body is a 40 tier, lower wings at 36, a 44-48 step, and a 52-56 tower strip on the east side. Each tier's
// coping is a block above its roof; the 56 tower tops out at the lidar's 58 with its plant. Facade: a white concrete floor band at each
// storey line, glass curtain-wall bays between white concrete piers (every third cell), a light-grey spandrel band
// under each head, glowstone or shroomlight behind a few panes. The ground floor is a glazed shopfront with a dark-oak
// entrance door at the highest street-level cell on a face. A stone plinth fills from y 0 up to the entrance floor, so the
// downhill side carries its extra storeys as a basement. Open ground (the two small courts, roof at ground) is paved, not
// built. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861505.cells.json", "utf8"));
const W = 31, D = 52, TOP = 70;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const open = (x, z) => R[x][z] <= G[x][z] + 1;                  // roof at ground: a court, not a building

// median-smoothed roof over built neighbours, snapped down to the storey grid (floor lines at 8 + 4k), then the tiers
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !open(nx, nz)) v.push(R[nx][nz]);
  }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // tier top: the roof covers y = T - 1
const H = Array.from({ length: W }, () => Array(D).fill(0));    // what a neighbour stands to: T, or ground for a court
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (open(x, z)) { H[x][z] = G[x][z]; continue; }
  T[x][z] = Math.max(12, 8 + 4 * Math.floor((median(x, z) - 8) / 4));
}
// a second pass over the tiers: the 1-2 cell fins between tiers become the tier around them, so each tower is a block
const T1 = T.map(col => col.slice());
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !open(x, z)) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz) && !open(x + dx, z + dz)) v.push(T1[x + dx][z + dz]);
  v.sort((a, b) => a - b); T[x][z] = v[v.length >> 1];
}
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) H[x][z] = open(x, z) ? G[x][z] : T[x][z];

const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const WORD = { W: "west", E: "east", N: "north", S: "south" };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the entrance: the highest street-level cell on an outside wall, at the middle of that run, so the door sits at the floor
const street = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || open(x, z) || G[x][z] < 7) continue;
  if (exposed(x, z, 8).length) street.push([x, z]);
}
street.sort((a, b) => G[b[0]][b[1]] - G[a[0]][a[1]] || 0);
const top = street.length ? G[street[0][0]][street[0][1]] : 0;
const pool = street.filter(([x, z]) => G[x][z] === top);
const zc = pool.length ? pool.reduce((s, [, z]) => s + z, 0) / pool.length : 0;
pool.sort((a, b) => Math.abs(a[1] - zc) - Math.abs(b[1] - zc));
const [ex, ez] = pool[0] ?? [-1, -1];
const entryFace = ex >= 0 ? exposed(ex, ez, 8)[0] : null;

// roof plant: the tallest 2x2 of flat roof, set in from every edge, a plant box with an iron cap
let plant = null;
for (let x = 1; x < W - 2 && !plant; x++) for (let z = 1; z < D - 2 && !plant; z++) {
  const t = T[x][z]; if (!t || t < 40) continue;
  let ok = true;
  for (let dx = -1; dx <= 2 && ok; dx++) for (let dz = -1; dz <= 2 && ok; dz++) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || open(nx, nz) || T[nx][nz] !== t) ok = false;
    else if (exposed(nx, nz, t - 1).length && dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1) ok = false;
  }
  if (ok) plant = { x0: x, z0: z, y: t };
}

const g = new Voxels([W, TOP, D]);
const glassFor = (x, z, s) => ((x + z + s) & 1 ? "light_blue_stained_glass" : "cyan_stained_glass");

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z];
  if (open(x, z)) {                                             // a court: foundation and paving only
    for (let y = 0; y < gr - 1; y++) g.set(x, y, z, "stone_bricks");
    if (gr > 0) g.set(x, gr - 1, z, "gray_concrete");
    continue;
  }
  const t = T[x][z];
  // plinth and foundation: solid from 0 to the entrance floor (stone), with basement windows on a downhill side
  for (let y = 0; y < 8; y++) {
    const ex4 = exposed(x, z, y);
    const basementGlass = ex4.length && y >= 5 && y <= 6 && gr <= 4 && !((x + z) % 3 === 0 || ex4.length >= 2);
    g.set(x, y, z, basementGlass ? glassFor(x, z, 0) : "stone_bricks");
  }
  // storeys: a floor band at each storey line, head band (spandrel) at the top of each, glass between piers on the walls
  for (let y = 8; y < t; y++) {
    const r = (y - 8) % 4, s = Math.floor((y - 8) / 4), ex4 = exposed(x, z, y);
    const isRoof = y === t - 1;
    if (r === 0) { g.set(x, y, z, "white_concrete"); continue; }                  // floor band, the whole footprint
    if (r === 3) {                                                              // head band, or the roof
      if (isRoof) g.set(x, y, z, ex4.length ? "light_gray_concrete" : "gray_concrete");
      else if (ex4.length) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!ex4.length) continue;                                                  // interior air behind the wall
    const corner = ex4.length >= 2;
    const pier = corner || (x + z) % 3 === 0;
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, glassFor(x, z, s));
    // a warm light just inside some panes
    const h = (x * 31 + z * 17 + s * 7 + r) % 13;
    if (h === 0 || h === 6) {
      const [dx, dz] = DIRS[ex4[0]], ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && !open(ix, iz) && H[ix][iz] > y && !exposed(ix, iz, y).length)
        g.set(ix, y, iz, h === 0 ? "glowstone" : "shroomlight");
    }
  }
  // the parapet: one course of coping on the edge of each roof, a block over the roof's top
  if (exposed(x, z, t - 1).length) g.set(x, t, z, "light_gray_concrete");
}

// the entrance: a dark-oak door in the street-level cell, lintel above, glowstone just inside
if (ex >= 0 && entryFace) {
  const face = { facing: WORD[entryFace], hinge: "left", open: "false", powered: "false" };
  g.set(ex, 8, ez, "stone_bricks");   // the floor band under the door (the entrance floor itself)
  g.set(ex, 9, ez, "dark_oak_door", { ...face, half: "lower" });
  g.set(ex, 10, ez, "dark_oak_door", { ...face, half: "upper" });
  g.set(ex, 11, ez, "white_concrete");
  const [dx, dz] = DIRS[entryFace], ix = ex - dx, iz = ez - dz;
  if (inside(ix, iz) && !open(ix, iz)) g.set(ix, 9, iz, "glowstone");
}

// the plant box: two blocks of light-grey concrete with an iron cap, standing on the roof
if (plant) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    g.set(plant.x0 + dx, plant.y, plant.z0 + dz, "light_gray_concrete");
    g.set(plant.x0 + dx, plant.y + 1, plant.z0 + dz, dx === 0 && dz === 0 ? "iron_block" : "light_gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861505.nbt");
