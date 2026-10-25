// Indifférencié, Mont-Saint-Michel (FR301499692). Stone-walled 2-storey house under a steep slate attic roof.
// Walls andesite/granite-grey, stone-brick bands, quoins and window surrounds, deepslate-tile roof, two chimneys.
// Massing follows the lidar roof per cell (3x3 median smoothed), each cell with its own eave line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499692";
const W = 23, H = 28, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const K = (x, z) => `${x},${z}`;
const K3 = (x, y, z) => `${x},${y},${z}`;

const fp = new Map();
for (const [x, z, gr, rr] of cells) fp.set(K(x, z), { x, z, gr, rr });
const has = (x, z) => fp.has(K(x, z));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Distance from the outside edge (Manhattan BFS) -> hipped, stepped roof
const dist = new Map();
const q = [];
for (const c of fp.values()) {
  if (DIRS.some((d) => !has(c.x + d.dx, c.z + d.dz))) { dist.set(K(c.x, c.z), 1); q.push(c); }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  const dc = dist.get(K(c.x, c.z));
  for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = c.x + ox, nz = c.z + oz, kk = K(nx, nz);
    if (has(nx, nz) && !dist.has(kk)) { dist.set(kk, dc + 1); q.push(fp.get(kk)); }
  }
}

for (const c of fp.values()) {
  // smoothed roof: median of the cell and its in-footprint 8-neighbours
  const nb = [];
  for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
    const n = fp.get(K(c.x + ox, c.z + oz));
    if (n) nb.push(n.rr);
  }
  const R = clamp(Math.round(median(nb)), 8, H - 4);
  c.gc = clamp(Math.round(c.gr), 0, H - 14);
  c.E = clamp(Math.max(c.gc + 5, R - 5), 5, H - 8);     // this cell's eave / cornice row
  c.rise = clamp(R - c.E, 2, 7);
  c.ext = DIRS.filter((d) => !has(c.x + d.dx, c.z + d.dz));
  c.bnd = c.ext.length > 0;
  c.d = dist.get(K(c.x, c.z)) ?? 1;
  c.top = c.E + Math.min(c.d, c.rise);
  c.door = false;
  c.doorB = null;
  c.doorFace = null;
  c.win = null;
  // window bays only on single-face wall cells, every 3rd block (u % 3 === 1)
  if (c.ext.length === 1) {
    const f = c.ext[0];
    const u = f.dz !== 0 ? c.x : c.z;
    if (u % 3 === 1) c.win = f;
  }
}

// Entrance: on the face with the most single-face wall cells, nearest the median bay, lowest ground step
const faceCount = {};
for (const c of fp.values()) if (c.ext.length === 1) faceCount[c.ext[0].n] = (faceCount[c.ext[0].n] || 0) + 1;
const doorFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const fd = DIRS.find((d) => d.n === doorFace);
const cand = [...fp.values()].filter((c) => c.ext.length === 1 && c.ext[0].n === doorFace);
const medU = median(cand.map((c) => (fd.dz !== 0 ? c.x : c.z)));
let best = null, bestScore = Infinity;
for (const c of cand) {
  const j = Math.max(1, Math.floor((c.E - c.gc) / 5));
  const doorB = c.E - 5 * j;
  const u = fd.dz !== 0 ? c.x : c.z;
  const score = Math.abs(doorB - c.gc) * 100 + Math.abs(u - medU);
  if (score < bestScore) { bestScore = score; best = { c, doorB }; }
}
if (best) {
  best.c.door = true;
  best.c.doorB = best.doorB;
  best.c.doorFace = doorFace;
  best.c.win = null;
}

// Air pockets behind windows (inside the wall line) with occasional lanterns
const pockets = new Map();
for (const c of fp.values()) {
  if (!c.bnd || !c.win) continue;
  const px = c.x - c.win.dx, pz = c.z - c.win.dz;
  const pc = fp.get(K(px, pz));
  if (!pc || pc.bnd) continue;
  for (let j = 1; ; j++) {
    const b = c.E - 5 * j;
    if (b < c.gc) break;
    const lan = ((c.x + c.z + b) % 3) === 0;
    pockets.set(K3(px, b + 2, pz), lan ? "lantern" : "air");
    pockets.set(K3(px, b + 3, pz), "air");
  }
}

const paneProps = (f) => (f.dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

function resolve(c, y) {
  if (y < c.gc) return ["cobblestone"];
  if (y >= c.E) {
    if (y === c.E) return ["stone_bricks"];                     // cornice
    if (y <= c.top) return ["deepslate_tiles"];
    return null;
  }
  const j = Math.floor((c.E - 1 - y) / 5) + 1;
  const b = c.E - 5 * j;
  const row = y - b;
  const hasStorey = b >= c.gc;
  const pk = pockets.get(K3(c.x, y, c.z));

  if (!c.bnd) {
    if (pk === "lantern") return ["lantern", { hanging: "false", waterlogged: "false" }];
    if (pk === "air") return null;
    return ["stone"];
  }

  if (y === c.gc) return ["stone_bricks"];                      // base course
  if (c.door && b === c.doorB) {
    if (row === 1 || row === 2) {
      return ["dark_oak_door", {
        facing: c.doorFace,
        half: row === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      }];
    }
    if (row === 3) return ["stone_bricks"];
  }
  if (row === 0) return ["stone_bricks"];                       // floor band
  if (!hasStorey) return ["andesite"];
  if (c.ext.length >= 2) return ["stone_bricks"];               // quoins at corners
  if (c.win && (row === 1 || row === 4)) return ["stone_bricks"]; // sill and lintel
  if (c.win && (row === 2 || row === 3)) return ["glass_pane", paneProps(c.win)];
  return ["andesite"];
}

const blk = new Map();
const put = (x, y, z, n, p) => blk.set(K3(x, y, z), { x, y, z, n, p });

for (const c of fp.values()) {
  for (let y = 0; y <= c.top; y++) {
    const r = resolve(c, y);
    if (r) put(c.x, y, c.z, r[0], r[1]);
  }
}

// Two stone chimneys standing out of the roof
const pts = [...fp.values()];
const cx = pts.reduce((s, c) => s + c.x, 0) / pts.length;
const cz = pts.reduce((s, c) => s + c.z, 0) / pts.length;
const chimneyTargets = [[cx - 4, cz - 2], [cx + 4, cz + 2]];
for (const [tx, tz] of chimneyTargets) {
  let pick = null, bd = Infinity;
  for (const c of pts) {
    if (c.d < 3 || c.top + 3 > H - 1) continue;
    const dd = (c.x - tx) ** 2 + (c.z - tz) ** 2;
    if (dd < bd) { bd = dd; pick = c; }
  }
  if (!pick) continue;
  for (let y = pick.top + 1; y <= pick.top + 3; y++) put(pick.x, y, pick.z, "stone_bricks");
}

const g = new Voxels([W, H, D]);
for (const { x, y, z, n, p } of blk.values()) {
  if (p) g.set(x, y, z, n, p);
  else g.set(x, y, z, n);
}
g.save(`${DIR}/${ID}.nbt`);
