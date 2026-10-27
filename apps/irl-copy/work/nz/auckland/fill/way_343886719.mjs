// Auckland, way 343886719 (seen from Maungawhau): a 1970s concrete-frame office block on a basalt plinth, five storeys
// over a setback podium with a stepped crown. Lidar roof heights are median-smoothed and snapped into flat tiers: a 28
// crown on the core (7+ blocks in from the edge), a 24 setback ring, a 20 podium, 12 low wings. The facade is a
// 4-block storey rhythm (cream floor band, tinted glass between dark piers, grey spandrel), a shopfront on the ground
// floor, a door on the lowest street face, glowstone behind some panes, roof plant on the crown. Interiors are air
// with a floor slab per storey and a ceiling slab under each roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_343886719.cells.json`, "utf8"));
const W = 92, D = 62, TOP = 43;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed lidar roof, snapped to flat tiers, then stepped in by distance from the edge (20 edge podium, 24
// setback, 28 crown on the core, where the lidar's tall north block sits)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (m) => (m >= 26 ? 28 : m >= 22 ? 24 : m >= 16 ? 20 : 12);
const cap = (d) => (d >= 3 ? 28 : d >= 2 ? 24 : 20);
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z];
  const top = Math.min(tierOf(median(x, z)), cap(dist[x][z]));
  H[x][z] = Math.max(top, 4 * Math.ceil((gr + 8) / 4));       // at least two storeys above the lowest ground under the cell
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose roof stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the street entrance: the lowest edge cell, nearest the middle of the footprint
let cx = 0, cz = 0, n = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) { cx += x; cz += z; n++; }
cx /= n; cz /= n;
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] !== 1 || H[x][z] < 12) continue;
  const face = Object.keys(DIRS).find(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));
  if (!face) continue;
  const score = G[x][z] * 2 + Math.hypot(x - cx, z - cz);
  if (!door || score < door.score) door = { x, z, face, score };
}

const g = new Voxels([W, TOP, D]);
const PANE = (ex) => ex.includes("N") || ex.includes("S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  // roof covering on the top of the cell, a parapet on the outside ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "smooth_quartz");
  // the ground storey runs from the ground to the first floor line above it
  let gTop = gr + 1; while (gTop % 4 !== 0) gTop++;

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey, the ground floor, and a ceiling slab under the roof
      if (y === gr || y % 4 === 0 || y === top - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "deepslate_tiles"); continue; }    // basalt-look plinth
    if (door && door.x === x && door.z === z && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: FACING[door.face], half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }     // cream floor band
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; } // grey spandrel
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.find(k => k === "N" || k === "S") ?? ex[0];
    const u = face === "N" || face === "S" ? x : z;
    const piers = y < gTop ? 4 : 3;                                    // a wider shopfront below the first floor line
    if (corner || u % piers === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    g.set(x, y, z, "cyan_stained_glass_pane", PANE(ex));
    if (y >= gTop && (x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1], face]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, standing on the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0 && y % 4 !== 3) g.set(x, y, z, "glowstone");

// roof plant on the crown: 3 x 3 plant rings on a clear 28 tier, and a lift core on the most central crown spot
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  if (x % 11 !== 5 || z % 11 !== 5) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== 28 || dist[x + dx][z + dz] < 3) ok = false;
  if (!ok) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx === 0 && dz === 0) continue;
    for (let y = 29; y <= 30; y++) g.set(x + dx, y, z + dz, "light_gray_concrete");
  }
}
let lift = null;
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== 28 || dist[x + dx][z + dz] < 3) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 29; y <= 31; y++) g.set(lift[0] + dx, y, lift[1] + dz, y === 31 ? "smooth_quartz" : "light_gray_concrete");

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save(`${FILL}/way_343886719.nbt`);
console.log(JSON.stringify({ tiers: tierCount, door, lift, glow: glowAt.length, ...stats }));
