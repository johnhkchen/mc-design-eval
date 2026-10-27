// Auckland office block (way 147110869): a 1980s concrete-frame office on a basalt plinth. The lidar roof is median-smoothed
// and snapped to the 4-block storey grid: a 76 tower at the north-west spine (a lift and plant box on its roof), a 32 shoulder,
// a 25 main block (six storeys with the cornice at 24), 21 lower wings, 12 and 8 low edges. The facade is a 4-block storey
// rhythm: a light spandrel at each floor line, a ribbon of panes on white piers, a light-grey head band; basalt plinth at the
// ground, a dark-oak entrance on the lowest face, shopfront glass on the ground storey, glowstone behind some panes. The tower
// glazing is blue-tinted. Walls are one block thick with air behind the glass; interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110869.cells.json", "utf8"));
const W = 57, D = 70, H = 89;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const FACING = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };

// median of the 3x3 roof neighbourhood (inside the footprint), then snapped to the storey tiers
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (r) => r >= 70 ? 76 : r >= 30 ? 32 : r >= 24 ? 25 : r >= 20 ? 21 : r >= 12 ? 12 : 8;
const T = Array.from({ length: W }, () => Array(D).fill(0));    // top (roof surface) per column, y 0..T-1 is the building
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = Math.max(tier(median(x, z)), G[x][z] + 4);

const g = new Voxels([W, H, D]);
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || y >= T[nx][nz]; });
const panes = [];                                               // [x, y, z, outward dx, outward dz] for the glazing
const doors = new Set();
const key = (x, y, z) => `${x},${y},${z}`;

// pass 1: foundation, shell (walls, glazing, cornice, roof) and the floor slabs of the interior air
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], t = T[x][z], pane = t >= 76 ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane";
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation up to this cell's ground
    const ex = exposed(x, z, y);
    if (y === t - 1) { g.set(x, y, z, ex.length ? "smooth_stone" : "gray_concrete"); continue; }   // cornice / roof deck
    if (!ex.length) {
      if (y === gr || (y >= 4 && y % 4 === 0)) g.set(x, y, z, "smooth_stone");   // floor slab per storey
      continue;
    }
    if (y < 4) {                                                                  // base course and shopfront
      if (y === gr || y === 3) g.set(x, y, z, "stone_bricks");
      else { g.set(x, y, z, pane); panes.push([x, y, z, ex[0][0], ex[0][1]]); }
      continue;
    }
    const rel = y % 4;                                                            // storey: spandrel, ribbon, head
    if (rel === 0) g.set(x, y, z, "smooth_stone");
    else if (rel === 3) g.set(x, y, z, "light_gray_concrete");
    else {
      const coord = ex[0][0] !== 0 ? z : x;                                       // along the face
      if (coord % 3 === 0) g.set(x, y, z, "white_concrete");                      // pier
      else { g.set(x, y, z, pane); panes.push([x, y, z, ex[0][0], ex[0][1]]); }
    }
  }
}

// entrance: the lowest outward horizontal face on the street storey, a dark-oak door (2 high) in place of its glass
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || G[x][z] > 1) continue;
  const ex = exposed(x, z, G[x][z]);
  if (!ex.length) continue;
  if (!door || G[x][z] < G[door[0]][door[1]]) door = [x, z, ex[0]];
}
if (door) {
  const [x, z, [dx, dz]] = door, y0 = G[x][z], facing = FACING[`${dx},${dz}`];
  for (const [yy, half] of [[y0, "lower"], [y0 + 1, "upper"]]) {
    g.set(x, yy, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
    doors.add(key(x, yy, z));
  }
}

// pass 2: panes connect to their in-plane neighbours (frames read as a grid), warm glow behind some windows
for (const [x, y, z, dx, dz] of panes) {
  if (doors.has(key(x, y, z))) continue;
  const block = g.get(x, y, z).block;
  const conn = (ox, oz) => (g.get(x + ox, y, z + oz) ? "true" : "false");
  g.set(x, y, z, block, { north: conn(0, -1), east: conn(1, 0), south: conn(0, 1), west: conn(-1, 0), waterlogged: "false" });
  const ix = x - dx, iz = z - dz;                                                  // the air behind the glass
  if (y !== 3 && (x * 31 + y * 17 + z * 7) % 9 === 0 && inside(ix, iz) && !g.get(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// roof plant: a 3 x 3 box with a louvred ring on the tower roof, a mast from its roof
let box = null;
for (let x = 1; x < W - 3 && !box; x++) for (let z = 1; z < D - 3 && !box; z++) {
  let ok = true;
  for (let dx = 0; dx < 3 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) ok = inside(x + dx, z + dz) && T[x + dx][z + dz] >= 76;
  if (ok) box = [x, z];
}
if (box) {
  const [bx, bz] = box;
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) for (let y = 76; y <= 78; y++) {
    const edge = dx === 0 || dz === 0 || dx === 2 || dz === 2;
    if (edge) g.set(bx + dx, y, bz + dz, y === 77 && (dx === 1 || dz === 1) ? "iron_bars" : "light_gray_concrete");
  }
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) g.set(bx + dx, 79, bz + dz, "gray_concrete");
  for (let y = 80; y <= 86; y++) g.set(bx + 1, y, bz + 1, "iron_bars");
}

// podium roof: two plant units (2 x 2 x 3) set in from the edges of the main block
const units = [];
for (let x = 1; x < W - 2 && units.length < 2; x++) for (let z = 1; z < D - 2 && units.length < 2; z++) {
  const cellsIn = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ring = [[x - 1, z], [x - 1, z + 1], [x + 2, z], [x + 2, z + 1], [x, z - 1], [x + 1, z - 1], [x, z + 2], [x + 1, z + 2]];
  const ok = cellsIn.every(([a, b]) => inside(a, b) && T[a][b] === 25) && ring.every(([a, b]) => inside(a, b) && T[a][b] >= 25);
  if (ok && units.every(([a, b]) => Math.abs(a - x) + Math.abs(b - z) > 10)) units.push([x, z]);
}
for (const [ux, uz] of units) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    for (let y = 25; y <= 26; y++) g.set(ux + dx, y, uz + dz, "light_gray_concrete");
    g.set(ux + dx, 27, uz + dz, "smooth_stone");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110869.nbt";
console.log(g.save(out), { tower: box ? "plant box" : "none", units: units.length, door: door ? door.slice(0, 2) : null });
