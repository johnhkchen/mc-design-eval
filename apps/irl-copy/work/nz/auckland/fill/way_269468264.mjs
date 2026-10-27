// Way 269468264, Auckland (Newton / Grafton edge): a 1980s concrete office-and-shop block. Four storeys of 4 blocks over a
// basalt plinth, a shopfront ground floor under a black fascia, white concrete piers and storey lines with tinted glass
// ribbons between them, a flat roof with a parapet and cap. Lidar roof heights are 3x3-median smoothed and snapped to the
// 4-block storey grid: 24 (a lift and plant core), 20, 16 (the main slab), 12 and 8 (the low south-west wings). Each tier
// stands on the floor slab under it; the interior is air with a floor slab per storey and a warm light in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468264.cells.json", "utf8"));
const W = 63, D = 73, TOP = 37;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: "south", S: "north", W: "east", E: "west" };
const PANE = { N: "ns", S: "ns", W: "ew", E: "ew" };

// roof tiers: 3x3 median of the lidar roof, snapped to a 4-block storey grid, at least two storeys
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const snap = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) snap[x][z] = Math.max(8, 4 * Math.round(median(x, z) / 4));
// a tall tier needs a volume: a 20 or 24 cell with fewer than 12 tall neighbours in its 5x5 is lidar noise (a spike), not a tower
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  let tall = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz) && snap[x + dx][z + dz] >= 20) tall++;
  H[x][z] = snap[x][z] >= 20 && tall < 12 ? 16 : snap[x][z];
  tiers[H[x][z]] = (tiers[H[x][z]] || 0) + 1;
}

// faces of a cell at height y that are open to the outside: beyond the footprint, or beside a lower tier that stops below y
const faces = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// roof edge: beyond the footprint, or beside a lower tier (parapet)
const roofEdge = (x, z) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] < H[x][z];
});

// the entrance: the longest street-side run of the main slab (tiers 12+), the middle of it, two doors wide
const runs = { N: [], S: [], W: [], E: [] };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] >= 12) {
  for (const k of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[k];
    if (!inside(x + dx, z + dz)) runs[k].push([x, z]);
  }
}
const along = (k, [x, z]) => (k === "N" || k === "S" ? x : z);
const best = Object.keys(runs).sort((a, b) => runs[b].length - runs[a].length)[0];
const sorted = runs[best].sort((a, b) => along(best, a) - along(best, b));
const mid = sorted[sorted.length >> 1];
const doors = new Map();
const inRun = (c) => sorted.some(p => p[0] === c[0] && p[1] === c[1]);
const second = [mid[0] + (best === "N" || best === "S" ? 1 : 0), mid[1] + (best === "W" || best === "E" ? 1 : 0)];
const pairWith = inRun(second) ? second : [mid[0] - (best === "N" || best === "S" ? 1 : 0), mid[1] - (best === "W" || best === "E" ? 1 : 0)];
doors.set(`${mid[0]},${mid[1]}`, { k: best, hinge: "left" });
doors.set(`${pairWith[0]},${pairWith[1]}`, { k: best, hinge: "right" });

const g = new Voxels([W, TOP, D]);
const lights = [];   // [x, y, z, block, outward direction], placed behind glass once the air behind is known
const facadeGlass = (k) => ({
  north: PANE[k] === "ns" ? "false" : "true", south: PANE[k] === "ns" ? "false" : "true",
  east: PANE[k] === "ns" ? "true" : "false", west: PANE[k] === "ns" ? "true" : "false", waterlogged: "false",
});

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z];
  // foundation below the lowest ground under the cell (none here: ground is 0)
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const ex = faces(x, z, y), yy = y % 4, s = Math.floor(y / 4);
    if (!ex.length) {
      if (yy === 0) g.set(x, y, z, "smooth_stone");          // interior floor slab per storey
      continue;                                              // interior air
    }
    const k = ex[0], h = k === "N" || k === "S" ? x : z;     // k: the face; h: the bay coordinate along it
    const door = doors.get(`${x},${z}`);
    if (s === 0 && door && door.k === k && (yy === 1 || yy === 2)) {
      g.set(x, y, z, "iron_door", { facing: INWARD[k], half: yy === 1 ? "lower" : "upper", hinge: door.hinge, open: "false", powered: "false" });
      continue;
    }
    if (y === 0) g.set(x, y, z, "polished_basalt");           // basalt plinth
    else if (yy === 0) g.set(x, y, z, "white_concrete");      // storey line
    else if (yy === 3) g.set(x, y, z, s === 0 ? "black_concrete" : "light_gray_concrete");  // fascia / spandrel
    else {
      const pier = s === 0 ? h % 4 === 0 : h % 3 === 0;       // mullion; shopfronts have wider glass
      if (pier) g.set(x, y, z, "white_concrete");
      else {
        g.set(x, y, z, "light_blue_stained_glass_pane", facadeGlass(k));
        if (s === 0 && h % 5 === 2 && yy === 1) lights.push([x, y, z, "shroomlight", k]);
        else if (s > 0 && yy === 1 && (x * 7 + z * 5 + s) % 13 === 0) lights.push([x, y, z, "glowstone", k]);
      }
    }
  }

  // roof: a cover on the top of every cell, a parapet with a cap on the edge, plant boxes on the tallest core
  g.set(x, top, z, "smooth_stone");
  const edge = roofEdge(x, z);
  if (edge.length) {
    g.set(x, top + 1, z, "white_concrete");
    g.set(x, top + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else if (top >= 20 && x % 5 === 2 && z % 5 === 2) {
    g.set(x, top + 1, z, "light_gray_concrete");
    g.set(x, top + 2, z, "light_gray_concrete");
  }
}

// warm lights behind the glass: only into air (an interior cell with nothing in it)
for (const [x, y, z, block, k] of lights) {
  const [dx, dz] = DIRS[k], ix = x - dx, iz = z - dz;
  if (inside(ix, iz) && H[ix][iz] > y && !g.get(ix, y, iz)) g.set(ix, y, iz, block);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468264.nbt";
const { blocks, palette } = g.save(out);
console.log(JSON.stringify({ tiers, entrance: { face: best, cells: [mid, pairWith] }, blocks, palette }));
