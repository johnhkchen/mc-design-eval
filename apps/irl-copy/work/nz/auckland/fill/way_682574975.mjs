// Sugartree Altro, Auckland (way 682574975): a 1980s concrete-frame office tower, 14 storeys over a stepped low base. The
// lidar roof is one flat slab at 54-58 blocks across the core, so the massing follows it: a tower at 56 (the storey grid,
// with a plant room to 58 on the core), the lower rim of the footprint as wings snapped to 4-block storeys. Each column
// stands solid from y 0 to its roof, so nothing floats. The facade is a 4-block storey rhythm: a light-grey spandrel at
// each floor line, three rows of blue glass between white-concrete piers every 4 blocks, a basalt base and shopfront at
// street level, a dark-oak door on the lowest street face. Interiors are air with a floor slab per storey; a few hanging
// lanterns sit inside the glass, each one hung from the slab above.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_682574975.cells.json`, "utf8"));
const W = 47, D = 71, Y = 71;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), breadth-first through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed lidar roof, then the top of each column on the 4-block storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // roof-slab height of each column
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), gr = G[x][z];
  H[x][z] = r >= 50 ? 56 : Math.max(4 * Math.ceil((gr + 4) / 4), 4 * Math.round(r / 4));
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NAME = { N: "north", S: "south", E: "east", W: "west" };
// the faces of a column that are outside the footprint or beside a neighbour whose roof is at or below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the entrance: the street face with the most low-ground cells, its middle cell and a neighbour along the face
let door = null;
for (const k of Object.keys(DIRS)) {
  const list = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (inside(x, z) && dist[x][z] === 1 && H[x][z] >= 8 && exposed(x, z, G[x][z]).includes(k)) list.push([x, z]);
  }
  if (!list.length) continue;
  const lowCount = list.filter(([x, z]) => G[x][z] <= 1).length;
  const score = lowCount * 1000 + list.length;
  if (!door || score > door.score) {
    const along = k === "N" || k === "S" ? 0 : 1;
    list.sort((a, b) => a[along] - b[along]);
    const mid = list[list.length >> 1];
    const has = (x, z) => list.some(([a, b]) => a === x && b === z);
    const partner = along === 0
      ? (has(mid[0] + 1, mid[1]) ? [mid[0] + 1, mid[1]] : [mid[0] - 1, mid[1]])
      : (has(mid[0], mid[1] + 1) ? [mid[0], mid[1] + 1] : [mid[0], mid[1] - 1]);
    door = { score, dir: k, cells: [mid, partner] };
  }
}

// the facade of an exposed column at height y
function facade(x, z, y, ex, d, gr) {
  const i = ex.includes("N") || ex.includes("S") ? x : z;   // bay index along the face
  const pier = i % 4 === 0;
  if (y === gr) return "polished_basalt";                     // plinth course
  if (y < 4 && d === 1) return y === 3 ? "polished_basalt" : (pier ? "stone_bricks" : "glass");   // shopfront
  if (y % 4 === 0) return "light_gray_concrete";              // spandrel at each floor line
  if (pier) return "white_concrete";
  const bay = Math.floor(i / 4), s = Math.floor(y / 4);
  return (bay + s) % 3 === 0 ? "gray_stained_glass" : "light_blue_stained_glass";
}

const g = new Voxels([W, Y, D]);
let lanterns = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length) { g.set(x, y, z, facade(x, z, y, ex, d, gr)); continue; }
    // interior: air, with a floor slab per storey
    if (y === gr || y % 4 === 0) g.set(x, y, z, "light_gray_concrete");
  }
  // roof: a slab on the column top, a parapet on the outer ring, plant boxes on the core of the tower
  g.set(x, top, z, top >= 50 ? "light_gray_concrete" : "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "white_concrete");
  else if (top === 56 && d >= 6 && (Math.floor(x / 8) + Math.floor(z / 8)) % 3 === 1 && x % 8 >= 2 && x % 8 <= 5 && z % 8 >= 2 && z % 8 <= 5) {
    g.set(x, top + 1, z, "gray_concrete"); g.set(x, top + 2, z, "gray_concrete");
  }
}

// warm lights: a lantern hung inside a window, from the floor slab above it (never floating)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z];
  for (let y = gr + 1; y < top; y++) {
    if (y % 4 !== 3 || (x * 7 + z * 13 + y * 3) % 17 !== 0) continue;
    const ex = exposed(x, z, y);
    if (!ex.length) continue;
    const [dx, dz] = DIRS[ex[0]], ix = x - dx, iz = z - dz;
    if (!inside(ix, iz) || exposed(ix, iz, y).length || H[ix][iz] < y + 2) continue;
    g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
    lanterns++;
  }
}

// the entrance: a dark-oak door (two cells wide), a basalt lintel above it
if (door) {
  for (const [x, z] of door.cells) {
    const gr = G[x][z];
    g.set(x, gr, z, "dark_oak_door", { facing: NAME[door.dir], half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: NAME[door.dir], half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "polished_basalt");
  }
}

const stats = g.save(`${DIR}/way_682574975.nbt`);
console.log(JSON.stringify({ blocks: stats.blocks, palette: stats.palette, entrance: door?.dir, lanterns }));
