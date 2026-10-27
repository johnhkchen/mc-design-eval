// Crown on Cintra, Auckland (way 264868163): a 1980s concrete-frame office tower, sixteen storeys (64 blocks to the roof
// slab, 4 blocks a storey) on a stone plinth. Lidar roofs are median-smoothed into two tiers: the core at 64 (a roof of 63-64
// over the middle of the footprint), the ring at 60 (61-62 at the edges), with a roof plant room on the core. Every cell is
// filled solid from 0 up to its storey line (4-block grid, so the plinth steps with the slope), a floor slab runs across
// the whole footprint at each storey line, and only the outer layer is facade: white piers on a 3-cell rhythm, tinted glass
// between, a light-grey spandrel under each window band, a white floor line, a dark sign band and a dark-oak door at the
// ground storey. Behind some panes a glowstone lights the air gap. Interiors are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_264868163.cells.json", "utf8"));
const X = 39, Y = 77, Z = 39;
const G = Array.from({ length: X }, () => Array(Z).fill(-1));    // ground under the cell, -1 = not footprint
const R = Array.from({ length: X }, () => Array(Z).fill(0));     // lidar roof above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: X }, () => Array(Z).fill(0));
const queue = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, then two clean tiers; the foundation ends on the storey line at or above the cell's ground
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: X }, () => Array(Z).fill(-1));    // roof slab row (top of the envelope)
const FL = Array.from({ length: X }, () => Array(Z).fill(0));    // first storey line (ground floor), a multiple of 4
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inside(x, z)) {
  T[x][z] = median(x, z) >= 63 ? 64 : 60;
  FL[x][z] = 4 * Math.ceil(G[x][z] / 4);
}
const top = (x, z) => (inside(x, z) ? T[x][z] : -1);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a facade face points to a neighbour outside the footprint, or to one whose roof is lower than this height
const exposedAt = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < y);
// the roof plant: the middle of the 64 core, six cells in from the edge
const plant = (x, z) => inside(x, z) && T[x][z] === 64 && dist[x][z] >= 6;

// the ground-floor entrance: the lowest street face on the north side, middle of its run
let entrance = null;
{
  const north = [];
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inside(x, z) && !inside(x, z - 1)) north.push([x, z]);
  const lowest = Math.min(...north.map(([x, z]) => FL[x][z]));
  const run = north.filter(([x, z]) => FL[x][z] === lowest).sort((a, b) => a[0] - b[0]);
  if (run.length) entrance = run[run.length >> 1];
}
const isEntrance = (x, z) => entrance && entrance[0] === x && entrance[1] === z;

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const pick = (x, y, z, a, b) => ((x * 31 + z * 17 + y * 7) % 11 === 0 ? a : b);

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inside(x, z)) continue;
  const fl = FL[x][z], t = T[x][z];
  const edgeCell = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < t);

  // foundation and plinth: solid from 0 up to the ground floor
  for (let y = 0; y < fl; y++) {
    const ext = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz));
    if (!ext) put(x, y, z, "stone_bricks");
    else if (y === 0) put(x, y, z, "polished_andesite");
    else if (y === fl - 1) put(x, y, z, "smooth_stone");
    else put(x, y, z, "stone_bricks");
  }

  // the storeys: a floor slab on every storey line across the footprint, facade on the outer layer, air inside
  if (plant(x, z)) {
    // roof plant: louvred shell at 65-67, a solid cap at 68 (nothing above the core roof but this)
    for (let y = 65; y <= 67; y++) {
      const edge = DIRS.some(([dx, dz]) => !plant(x + dx, z + dz));
      if (!edge) continue;
      const louvre = (y === 66) ? "gray_concrete" : "light_gray_concrete";
      put(x, y, z, louvre);
    }
    put(x, 68, z, "smooth_stone");
    continue;
  }
  for (let y = fl; y <= t; y++) {
    const rel = y - fl;
    if (y % 4 === 0) {
      // floor slab; on the outer layer it is the white floor line
      put(x, y, z, exposedAt(x, z, y).length ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    const exp = exposedAt(x, z, y);
    if (!exp.length) continue;                                  // air behind the facade
    const [dx, dz] = exp[0];
    const col = dz !== 0 ? x : z;                               // along the face
    const corner = exp.length > 1;
    const ground = rel < 4;
    if (ground && isEntrance(x, z) && (rel === 1 || rel === 2)) {
      put(x, y, z, "dark_oak_door", { facing: outwardName(dx, dz), half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (rel === 3) { put(x, y, z, ground ? "gray_concrete" : "light_gray_concrete"); continue; }
    if (corner || col % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
    if (ground) { put(x, y, z, "glass"); continue; }             // shopfront
    put(x, y, z, pick(x, y, z, "gray_stained_glass", "light_blue_stained_glass"));
  }

  // parapet over the roof slab on the outer layer: a cornice and a white parapet
  if (edgeCell && t >= 0 && !plant(x, z)) {
    put(x, t + 1, z, "smooth_stone");
    put(x, t + 2, z, "white_concrete");
  }
}

// warm light: glowstone in the air gap behind some panes (the cell inside the facade, same storey line)
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inside(x, z) || plant(x, z)) continue;
  for (let y = FL[x][z] + 1; y <= T[x][z]; y++) {
    if (y % 4 === 0 || y % 4 === 3) continue;
    const exp = exposedAt(x, z, y);
    if (!exp.length || exp.length > 1 || (x * 13 + z * 29 + y) % 37 !== 0) continue;
    const [dx, dz] = exp[0];
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && !exposedAt(ix, iz, y).length && y % 4 !== 0 && g.get(ix, y, iz) === null) put(ix, y, iz, "glowstone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_264868163.nbt");
console.log("way_264868163: blocks", g.count(), "palette", g.palette.length - 1);

// a door's facing is the way it faces out of the building: the outward direction of its face
function outwardName(dx, dz) {
  return dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north";
}
