// Harbour Board Building, Auckland (way 154260845): a 1960s-70s concrete-frame office block on a basalt plinth. Lidar roofs
// are 5x5 median-smoothed and snapped to a 4-block storey grid: wings at 8, 20 and 28, the broad slab at 36 (nine storeys),
// a 44 setback round the core and a 52 crown in the middle. Facade is a storey rhythm: white floor bands, light-blue glass
// between white mullions, grey spandrels, deepslate plinth; lobby door on the north face under a hanging lantern; glowstone
// two blocks behind some panes; a green roof terrace on the 36 slab and a lightning rod on the crown. Interiors are air with
// a floor slab per storey, and every tier stands on the solid column beneath it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154260845.cells.json", "utf8"));
const W = 60, D = 60, TOP = 63;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// 5x5 median of the lidar roof over footprint cells that have a height (zeros are lidar gaps at the edges)
const median = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz) && R[x + dx][z + dz] > 0) v.push(R[x + dx][z + dz]);
  if (!v.length) return 0;
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
// the storey grid: each tier is a whole number of 4-block storeys above y 0
const tierOf = (r) => (r < 14 ? 8 : r < 24 ? 20 : r < 33 ? 28 : r < 40 ? 36 : r < 47 ? 44 : 52);
const T = Array.from({ length: W }, () => Array(D).fill(0));    // top of each column (the roof cap sits at y = T)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = Math.max(tierOf(median(x, z)), G[x][z] + 8);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a column that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || T[nx][nz] <= y;
});

// lobby: the north-facing cells with the lowest ground, three wide round the middle of the north run
const northZ = Array(W).fill(-1);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && northZ[x] < 0) northZ[x] = z;
const northRun = [];
for (let x = 0; x < W; x++) if (northZ[x] >= 0 && G[x][northZ[x]] === 0 && T[x][northZ[x]] >= 20) northRun.push(x);
const doorX = northRun.length ? northRun[northRun.length >> 1] : -1;
const isDoorCell = (x, z) => doorX >= 0 && z === northZ[x] && Math.abs(x - doorX) <= 1;

const g = new Voxels([W, TOP, D]);
const litAt = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 5 === 0;
const glowFor = [];                                              // glowstone cells placed behind lit panes

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = T[x][z];

  // foundation under the ground, a basalt plinth course on the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey and on the ground
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // lobby door: the middle north cell, two high at the ground, a hanging lantern above it on a ground-level storey
    if (ex.includes("N") && isDoorCell(x, z) && (y === gr || y === gr + 1) && x === doorX) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ex.includes("N") && x === doorX && z === northZ[x] && y === 2 && gr === 0) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    // the plinth course, then the storey rhythm from absolute y: floor band, two rows of glass, spandrel
    if (y === gr && gr < 4) { g.set(x, y, z, "deepslate_bricks"); continue; }
    const r = y % 4;
    if (r === 0) { g.set(x, y, z, "white_concrete"); continue; }
    if (r === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }

    // rows 1 and 2: a white mullion on every third column of a face, a corner column, else a glass pane
    const alongFace = ex.includes("N") || ex.includes("S") ? x : z;
    if (ex.length > 1 || alongFace % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }
    const runsEW = ex.includes("N") || ex.includes("S");
    const pane = runsEW
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "light_blue_stained_glass_pane", pane);

    // a warm room: glowstone two blocks inside the pane, with an air gap between it and the glass
    if (litAt(x, y, z)) {
      const k = ex[0], [dx, dz] = DIRS[k];
      const gx = x - dx * 2, gz = z - dz * 2;
      if (inside(gx, gz) && T[gx][gz] > y && exposed(gx, gz, y).length === 0) glowFor.push([gx, y, gz]);
    }
  }

  // the roof: a white cornice on the edge of a tier, grey membrane inside it
  const edge = exposed(x, z, top).length > 0;
  g.set(x, top, z, edge ? "white_concrete" : "light_gray_concrete");
}

for (const [gx, y, gz] of glowFor) g.set(gx, y, gz, "glowstone");

// a green roof terrace on the 36 slab: two-by-two grey planters, a tree on each, clear of the tier's edge
const planterOk = (x, z) => [0, 1].every((dx) => [0, 1].every((dz) => {
  const nx = x + dx, nz = z + dz;
  if (!inside(nx, nz) || T[nx][nz] !== 36) return false;
  for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) if (!inside(nx + ax, nz + az) || T[nx + ax][nz + az] < 36) return false;
  return true;
}));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || x % 9 !== 4 || z % 9 !== 4 || !planterOk(x, z)) continue;
  for (const dx of [0, 1]) for (const dz of [0, 1]) {
    g.set(x + dx, 37, z + dz, "light_gray_concrete");
    g.set(x + dx, 38, z + dz, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
  }
}

// a lightning rod on the crown, over the crown's middle
const crown = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && T[x][z] === 52) crown.push([x, z]);
if (crown.length) {
  const cx = crown.reduce((s, [x]) => s + x, 0) / crown.length, cz = crown.reduce((s, [, z]) => s + z, 0) / crown.length;
  const [mx, mz] = crown.reduce((best, p) => (Math.hypot(p[0] - cx, p[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? p : best));
  for (let y = 53; y <= 56; y++) g.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154260845.nbt");
