// Mondrian Building, Eden Terrace, Auckland (way 153510449): a 1990s-2000s concrete-frame mixed-use block, six storeys
// over a basalt plinth, with a stepped roof (a 26-block main mass, a 28 tower core, a 24 skirt on the outer ring). The
// lidar roof is median-smoothed and snapped to a 4-block storey grid. The facade is a 4-block storey rhythm: a light
// spandrel band at each floor line, glass panes between white piers on a 4-block bay, a shopfront storey with
// Mondrian red, yellow and blue piers, a dark-oak entrance with a red lintel on the lowest street face, and glowstone
// behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153510449.cells.json", "utf8"));
const W = 59, D = 47, SIZE_Y = 42;
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

// median-smoothed roof (3 x 3), then snapped to the storey grid: 16, 20, 24, 26 (main mass), 28 (tower core)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const snap = (r) => r >= 27 ? 28 : r >= 25 ? 26 : r >= 23 ? 24 : r >= 20 ? 20 : 16;
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const d = dist[x][z];
  let top = snap(median(x, z));
  if (d === 1 && top >= 26) top = 24;          // a 24 skirt on the outer ring, the main mass set back behind it
  H[x][z] = top;
  tierCount[top] = (tierCount[top] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the street entrance: the outward face whose outer-ring cells sit lowest on average (at least 6 cells), its middle cell
let entranceFace = null;
{
  const best = {};
  for (const k of Object.keys(DIRS)) {
    const cand = [];
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1 && exposed(x, z, G[x][z] + 1).includes(k)) cand.push([x, z]);
    if (cand.length < 6) continue;
    const mean = cand.reduce((s, [x, z]) => s + G[x][z], 0) / cand.length;
    best[k] = { cand, mean };
  }
  const pick = Object.entries(best).sort((a, b) => a[1].mean - b[1].mean)[0];
  if (pick) {
    const [k, { cand }] = pick;
    const along = k === "N" || k === "S" ? 0 : 1;
    cand.sort((a, b) => a[along] - b[along]);
    entranceFace = { k, door: cand[cand.length >> 1] };
  }
}
const entranceCells = new Set();
if (entranceFace) {
  const { k, door } = entranceFace, along = k === "N" || k === "S" ? 0 : 1;
  for (let i = -1; i <= 1; i++) {
    const c = [door[0] + (along === 0 ? i : 0), door[1] + (along === 1 ? i : 0)];
    if (inside(c[0], c[1]) && exposed(c[0], c[1], G[c[0]][c[1]] + 1).includes(k)) entranceCells.add(`${c[0]},${c[1]}`);
  }
}
const isDoor = (x, z) => entranceFace && `${x},${z}` === `${entranceFace.door[0]},${entranceFace.door[1]}`;

const g = new Voxels([W, SIZE_Y, D]);
const MONDRIAN = ["red_concrete", "yellow_concrete", "blue_concrete"];
const lamps = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  const groundEnd = gr >= 4 ? 8 : 4;          // the shopfront storey: up to the first floor line
  // foundation: basalt from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_deepslate");
  // the roof: a cap on every cell, a parapet on any cell whose roof meets open air or a lower tier
  g.set(x, top, z, "smooth_stone");
  if (exposed(x, z, top).length) g.set(x, top + 1, z, "white_concrete");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey and on the ground
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_deepslate"); continue; }          // base course
    if (y % 4 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }      // spandrel at each floor line
    const along = ex.includes("N") || ex.includes("S") ? "NS" : "EW";
    const bay = along === "NS" ? x : z;
    const outward = ex.find(k => along === "NS" ? (k === "N" || k === "S") : (k === "E" || k === "W")) ?? ex[0];
    const ground = y < groundEnd;
    // the street door, its red lintel, and the lobby glass either side
    if (entranceFace && ex.includes(entranceFace.k) && entranceCells.has(`${x},${z}`)) {
      if (y === gr + 3 || (y === gr + 3 && groundEnd === 8)) { g.set(x, y, z, "red_concrete"); continue; }
      if (isDoor(x, z) && (y === gr + 1 || y === gr + 2)) {
        g.set(x, y, z, "dark_oak_door", { facing: entranceFace.k === "N" ? "north" : entranceFace.k === "S" ? "south" : entranceFace.k === "E" ? "east" : "west", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
    }
    if (ground && (bay % 4 === 0 || ex.length > 1)) {
      // Mondrian piers on the shopfront storey
      g.set(x, y, z, MONDRIAN[Math.floor(bay / 4) % MONDRIAN.length]);
      continue;
    }
    if (!ground && bay % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // pier
    const pane = along === "NS"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", pane);
    // warm light behind some panes: an interior air cell beside the glass
    if ((x * 31 + z * 17 + y * 7) % 11 === 0) lamps.push([x - DIRS[outward][0], y, z - DIRS[outward][1]]);
  }
}

// glowstone behind glass: only interior air cells, clear of the floor slabs
for (const [x, y, z] of lamps) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, "glowstone");

// roof plant: a grid of screen walls on the tower core, a lift overrun on the highest interior spot
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  if (x % 9 !== 4 && x % 9 !== 5) continue;
  if (z % 7 !== 3 && z % 7 !== 4) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx]?.[z + dz] !== 28 || dist[x + dx][z + dz] < 6) ok = false;
  if (!ok) continue;
  for (let y = 29; y <= 30; y++) g.set(x, y, z, y === 30 ? "white_concrete" : "light_gray_concrete");
}
let lift = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (H[x + dx][z + dz] !== 28 || dist[x + dx][z + dz] < 5) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 29; y <= 31; y++) g.set(lift[0] + dx, y, lift[1] + dz, y === 31 ? "white_concrete" : "light_gray_concrete");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153510449.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: entranceFace, lift, lamps: lamps.length, ...stats }));
