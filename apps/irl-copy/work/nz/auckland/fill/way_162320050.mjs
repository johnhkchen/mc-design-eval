// Parklane (way 162320050): a 1970s-80s concrete-frame office block, nine storeys over a stone plinth, the usual
// Auckland mix of its decade: white precast piers, light-grey spandrels, blue-green tinted glazing. The lidar roof (33-39
// blocks above the lowest ground) is median-smoothed and snapped to the 4-block storey grid: the tower core at 36, the
// shoulders at 32, the wings at 24-28, the low edges one or two storeys. Each cell stands on a fill to its ground, so the
// downhill side shows an extra storey of plinth. A floor line (white band) at every multiple of 4, glazing in the bays
// between piers, a dark-oak entrance on the north face, glowstone behind some panes, a plant box on the tower core.
// Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162320050.cells.json`, "utf8"));
const W = 42, D = 42, MAXY = 52;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// distance in cells from the outside edge (1 on the ring), through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, snapped to a floor line plus a 2-block parapet; at least one storey above the cell's ground
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // roof slab y of each cell (a multiple of 4)
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const snapped = 4 * Math.round((median(x, z) - 3) / 4);
  const top = Math.min(36, Math.max(snapped, 4 * Math.ceil((G[x][z] + 4) / 4)));
  H[x][z] = top;
  tiers[top] = (tiers[top] || 0) + 1;
}
const maxH = Math.max(...H.flat());

// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the entrance: on the north face, near the middle of the run, at the street (lowest) ground
const minG = Math.min(...cells.map(c => c[2]));
const northRun = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= minG + 2 && H[x][z] >= 8) northRun.push([x, z]);
// the north face is the top row of the run (least z); its middle cell takes the door
const rowZ = northRun.length ? Math.min(...northRun.map(c => c[1])) : 0;
const row = northRun.filter(c => c[1] === rowZ).sort((a, b) => a[0] - b[0]);
const mid = row.length ? row[row.length >> 1] : null;
const entrance = new Set();
if (mid) for (const [x, z] of row) if (Math.abs(x - mid[0]) <= 1) entrance.add(`${x},${z}`);

const g = new Voxels([W, MAXY, D]);
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  // roof slab on every cell, a parapet on the outside ring
  g.set(x, top, z, d === 1 ? "polished_andesite" : "smooth_stone");
  if (d === 1) { g.set(x, top + 1, z, "white_concrete"); g.set(x, top + 2, z, "white_concrete"); }

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey and on the ground
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (entrance.has(`${x},${z}`) && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }     // plinth
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // floor line
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (corner || u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // pier
    g.set(x, y, z, "cyan_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, between two floor lines
for (const [x, y, z] of glowAt) if (inside(x, z) && y !== G[x][z] && y % 4 !== 0 && exposed(x, z, y).length === 0) g.set(x, y, z, "glowstone");

// roof plant: a 3x3 lift and plant core on the tower's top tier, well in from the edge, with a cap
let core = null;
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== maxH || dist[x + dx][z + dz] < 3) ok = false;
  if (ok && (!core || Math.hypot(x - W / 2, z - D / 2) < Math.hypot(core[0] - W / 2, core[1] - D / 2))) core = [x, z];
}
if (core) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  for (let y = maxH + 1; y <= maxH + 3; y++) g.set(core[0] + dx, y, core[1] + dz, "light_gray_concrete");
  g.set(core[0] + dx, maxH + 4, core[1] + dz, "white_concrete");
}

const stats = g.save(`${DIR}/way_162320050.nbt`);
console.log(JSON.stringify({ tiers, maxH, entrance: [...entrance], core, glow: glowAt.length, ...stats }));
