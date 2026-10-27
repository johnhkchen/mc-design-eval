// Sky World: a 1990s city-centre hotel and convention block on a stone plinth, a ten-storey tower stepping back at its top
// (the lidar's 43 m roof), a white-concrete podium at eight storeys, and low wings. Storeys run from each cell's own ground
// so the foundation fills the slope; the roof is the lidar's median, quantized to 4-block storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23906758";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 101, D = 94, H = 56;
const at2 = (x, z) => z * W + x;
const ground = new Int16Array(W * D).fill(-1), raw = new Int16Array(W * D);
for (const [x, z, g0, r] of cells) { ground[at2(x, z)] = g0; raw[at2(x, z)] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[at2(x, z)] >= 0;
const G = (x, z) => ground[at2(x, z)];

// 1. Roofs: the median of the lidar roof over a 5 x 5 window, in whole 4-block storeys, at least two storeys over the ground.
const tq0 = new Int16Array(W * D); let maxT = 0;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const a = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) a.push(raw[at2(x + dx, z + dz)]);
  a.sort((p, q) => p - q);
  const i = at2(x, z);
  tq0[i] = Math.max(G(x, z) + 8, 4 * Math.round(a[a.length >> 1] / 4));
  maxT = Math.max(maxT, tq0[i]);
}
const body = (i) => tq0[i] < maxT - 4;

// 2. Tower setbacks: the tower (top two storeys' worth) steps in twice as it rises, by distance from the podium edge.
const dist = new Int16Array(W * D).fill(-1), bfs = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) if (body(at2(x, z))) { dist[at2(x, z)] = 0; bfs.push([x, z]); }
for (let h = 0; h < bfs.length; h++) {
  const [x, z] = bfs[h], d0 = dist[at2(x, z)];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!inF(x + dx, z + dz) || dist[at2(x + dx, z + dz)] >= 0) continue;
    dist[at2(x + dx, z + dz)] = d0 + 1; bfs.push([x + dx, z + dz]);
  }
}
const tf = new Int16Array(W * D);   // each cell's roof: the top block is at tf - 1
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const i = at2(x, z);
  if (body(i)) { tf[i] = tq0[i]; continue; }
  const d = Math.max(1, dist[i]), s = Math.min(2, Math.floor(d / 3));
  tf[i] = Math.min(tq0[i], maxT - 4 * (2 - s));
}

// 3. The solid volume: each footprint cell from its ground to its roof. Shell = a block with a neighbour outside the volume;
// depth counts inward from the shell, so depth 1 is the air gap behind the glass and depth 2+ is the solid core.
const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const inO = (x, y, z) => inF(x, z) && y >= G(x, z) && y < tf[at2(x, z)] && y >= 0 && y < H;
const key = (x, y, z) => (z * H + y) * W + x;
const depth = new Int16Array(W * H * D).fill(-1), front = [];
const solids = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) for (let y = G(x, z); y < tf[at2(x, z)]; y++) {
  solids.push([x, y, z]);
  if (NB.some(([dx, dy, dz]) => !inO(x + dx, y + dy, z + dz))) { depth[key(x, y, z)] = 0; front.push([x, y, z]); }
}
for (let h = 0; h < front.length; h++) {
  const [x, y, z] = front[h], d0 = depth[key(x, y, z)];
  for (const [dx, dy, dz] of NB) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (!inO(nx, ny, nz) || depth[key(nx, ny, nz)] >= 0) continue;
    depth[key(nx, ny, nz)] = d0 + 1; front.push([nx, ny, nz]);
  }
}
const dep = (x, y, z) => (inO(x, y, z) ? depth[key(x, y, z)] : -1);
const exposedDirs = (x, y, z) => NB.filter(([dx, dy, dz]) => !inO(x + dx, y + dy, z + dz));

// 4. The entrance: the outward face with the most ground-storey shell; three bays wide at its middle, three high.
const faceCount = {};
for (const [x, y, z] of solids) {
  if (dep(x, y, z) !== 0 || y - G(x, z) !== 1) continue;
  const h = exposedDirs(x, y, z).filter(([dx, dy]) => dy === 0);
  if (h.length !== 1) continue;
  const k = h[0].join(",");
  faceCount[k] = (faceCount[k] || 0) + 1;
}
const [entryDir] = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0];
const [enx, , enz] = entryDir.split(",").map(Number);
const alongEntry = [];
for (const [x, y, z] of solids) {
  if (dep(x, y, z) !== 0 || y - G(x, z) > 2) continue;
  const h = exposedDirs(x, y, z).filter(([dx, dy]) => dy === 0);
  if (h.length === 1 && h[0][0] === enx && h[0][2] === enz) alongEntry.push(enx !== 0 ? z : x);
}
alongEntry.sort((a, b) => a - b);
const mid = alongEntry[alongEntry.length >> 1];
const isDoor = (x, y, z, a) => Math.abs(a - mid) <= 1 && y - G(x, z) <= 2;

// 5. Window bays: a pier every third cell along each face, glass between, and a warm light behind some panes.
const winKind = (x, y, z) => {
  const r = y - G(x, z), h = exposedDirs(x, y, z).filter(([dx, dy]) => dy === 0);
  if (h.length !== 1) return h.length > 1 ? "pier" : null;
  const [dx, , dz] = h[0], a = dx !== 0 ? z : x;
  if (isDoor(x, y, z, a) && enx === dx && enz === dz) return "door";
  if (r === 0) return "plinth";
  if (r === 3 || (r >= 4 && r % 4 === 3)) return "string";
  if (r >= 4 && r % 4 === 0) return "spandrel";
  if (a % 3 === 0) return "pier";
  return "glass";
};
const airCells = new Map();   // inward air cell key -> its outward normal
for (const [x, y, z] of solids) {
  if (dep(x, y, z) !== 0) continue;
  const kind = winKind(x, y, z);
  if (kind !== "glass" && kind !== "door") continue;
  const h = exposedDirs(x, y, z).find(([dx, dy]) => dy === 0);
  const [qx, qy, qz] = [x - h[0], y, z - h[2]];
  if (dep(qx, qy, qz) === 1) airCells.set(key(qx, qy, qz), h);
}

// 6. Placement.
const g = new Voxels([W, H, D]);
for (const [x, y, z] of solids) {
  const dp = dep(x, y, z);
  if (dp === 0) {
    const kind = winKind(x, y, z);
    if (kind === "door") continue;   // the open entrance
    if (kind === "glass") { g.set(x, y, z, "light_blue_stained_glass"); continue; }
    if (kind === "plinth") { g.set(x, y, z, "stone_bricks"); continue; }
    if (kind === "string") { g.set(x, y, z, "smooth_stone"); continue; }
    if (kind === "spandrel") { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (kind === "pier") { g.set(x, y, z, y - G(x, z) < 4 ? "stone_bricks" : "white_concrete"); continue; }
    if (exposedDirs(x, y, z).some(([, dy]) => dy === 1)) {
      const perimeter = exposedDirs(x, y, z).some(([dx, dy]) => dy === 0);
      g.set(x, y, z, perimeter ? "smooth_stone" : "gray_concrete");
      continue;
    }
    g.set(x, y, z, "white_concrete");
    continue;
  }
  const hit = airCells.get(key(x, y, z));
  if (hit) {
    const inward = [x - hit[0], y, z - hit[2]];
    const seed = (x * 7 + y * 3 + z * 5) % 5;
    if (seed === 0 && dep(...inward) >= 2) g.set(x, y, z, "glowstone");
    continue;   // air behind the glass
  }
  g.set(x, y, z, "stone");   // solid behind the piers, spandrels and string courses; the core behind the air gap
}

// The plinth's foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) for (let y = 0; y < G(x, z); y++) g.set(x, y, z, "stone_bricks");

// Roof plant on the roof, and a mast on the tallest roof.
let mast = null;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const t = tf[at2(x, z)];
  if (t === maxT && (!mast || dist[at2(x, z)] > dist[at2(mast[0], mast[1])])) mast = [x, z];
  const perimeter = exposedDirs(x, t - 1, z).some(([dx, dy]) => dy === 0);
  if (perimeter) continue;
  if (x % 18 === 6 && z % 18 === 9) for (let y = t; y < t + 2; y++) g.set(x, y, z, "light_gray_concrete");
}
if (mast) for (let y = maxT; y < maxT + 8; y++) g.set(mast[0], y, mast[1], "iron_bars");

const stats = g.save(`${FILE}.nbt`);
console.log(JSON.stringify({ maxT, entryDir, mid, blocks: stats.blocks, palette: stats.palette, tops: [...new Set(cells.map((c) => tf[at2(c[0], c[1])]))].sort((a, b) => a - b) }));
