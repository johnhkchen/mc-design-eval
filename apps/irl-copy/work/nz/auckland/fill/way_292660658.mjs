// The Peaks, Mt Eden / Eden Terrace side of Auckland (way 292660658): a 13-storey concrete-frame office block of the
// 1980s-90s, on a dark basalt plinth. Lidar roofs are median-smoothed and snapped to a 4-block storey grid: a 52 core
// (more than 2 cells in from the edge), a 48 setback ring, 40 / 32 / 28 / 16 / 8 lower wings and podiums. Each storey is a
// concrete floor line, then three rows of blue-tinted glass between white concrete piers (every third cell on each face);
// a few panes are lit from behind with glowstone. The lobby is glazed on the north face with a dark oak door. The flat
// roof is a grey deck with a stone-brick parapet, and a louvred plant box sits on the core. The shell is one cell deep
// with an air gap behind the glass; floor slabs run across each storey and every tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660658.cells.json", "utf8"));
const W = 42, D = 31, TOP = 66;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, then snapped to the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (r, d) => {
  if (r >= 50) return d >= 3 ? 52 : 48;      // the core, and a one-storey setback ring at its edge
  if (r >= 46) return 48;
  if (r >= 40) return 40;
  if (r >= 30) return 32;
  if (r >= 24) return 28;
  if (r >= 12) return 16;
  return 8;                                  // two-storey podium
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) H[x][z] = tier(median(x, z), dist[x][z]);

// a neighbour that is outside the footprint or stops below height y leaves this cell's face open
const open = (x, z, y) => DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || H[x + dx][z + dz] <= y);
// the north face's lobby: the middle of the street front, where the ground is lowest
const LOBBY_X = [4, 8], DOOR_X = 6;

const g = new Voxels([W, TOP, D]);
const solid = (x, y, z, b) => g.set(x, y, z, b);

// plant box on the core: solid, louvred band at mid height, a stone-brick cap
const plant = new Set();
for (let x = 13; x <= 27; x++) for (let z = 9; z <= 21; z++) if (inside(x, z) && H[x][z] === 52 && dist[x][z] >= 3) plant.add(`${x},${z}`);
const inPlant = (x, z) => plant.has(`${x},${z}`);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z];
  // the open face runs north-south (z edge) or east-west (x edge): piers sit on the matching grid
  const faceNS = (y) => [[0, -1], [0, 1]].some(([dx, dz]) => !inside(x + dx, z + dz) || H[x + dx][z + dz] <= y);
  const faceEW = (y) => [[1, 0], [-1, 0]].some(([dx, dz]) => !inside(x + dx, z + dz) || H[x + dx][z + dz] <= y);
  for (let y = 0; y < top; y++) {
    if (y < gr) { solid(x, y, z, "blackstone"); continue; }              // basalt foundation, nothing floats on the ground
    if (y === 0) { solid(x, y, z, "blackstone"); continue; }             // base course at the street
    if (y === top - 1) { solid(x, y, z, "gray_concrete"); continue; }    // flat roof deck, stands on the storey below
    if (y % 4 === 0) { solid(x, y, z, "light_gray_concrete"); continue; } // floor slab / spandrel line of each storey
    if (!open(x, z, y)) continue;                                         // interior: air behind the glass
    const onNorth = z === 0 && x >= LOBBY_X[0] && x <= LOBBY_X[1];
    if (onNorth && y < 4) {                                               // lobby: a glazed front with the door
      if (x === DOOR_X && y <= 2) solid(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else solid(x, y, z, "light_blue_stained_glass");
      continue;
    }
    const pier = (faceNS(y) && x % 3 === 0) || (faceEW(y) && z % 3 === 0);
    if (pier) { solid(x, y, z, "white_concrete"); continue; }
    const lit = y % 4 === 2 && (x * 31 + z * 17 + y * 7) % 16 === 0;     // a few panes lit from behind (sparser: the flecks read as noise)
    solid(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
  }
  // a stone-brick parapet on the roof's edge, where the roof falls away
  const edge = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || H[x + dx][z + dz] < top);
  if (edge) solid(x, top, z, "stone_bricks");
  if (inPlant(x, z)) {
    const perim = DIRS.some(([dx, dz]) => !inPlant(x + dx, z + dz));
    for (let y = top; y < top + 3; y++) solid(x, y, z, perim && y === top + 1 ? "iron_bars" : "light_gray_concrete");
    solid(x, top + 3, z, "stone_bricks");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660658.nbt");
