// NYC1034235: 56 West 45th Street, 1914 midblock office loft. Twenty storeys of red brick on a granite plinth with
// stone storey lines, a stone cornice and a tar roof, a rear step down to 57 and low rear wings on the yard side.
// The street front is the north face (z 0); its shopfront has a central iron door and warm lamps behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 11, D = 28, HMAX = 74;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034235.cells.json`, "utf8"));

// Lidar roof heights per footprint cell; absent cells are outside the lot.
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) raw[z][x] = r;
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : raw[z][x]);
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const TIERS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 62];
const tier = (h) => TIERS.reduce((best, t) => (Math.abs(t - h) < Math.abs(best - h) ? t : best));

// 1. A zero with most neighbours standing tall is a lidar drop-out inside the mass; a zero with few is the rear yard.
const filled = raw.map((row, z) => row.map((r, x) => {
  if (r !== 0) return r;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = at(x + dx, z + dz); if (v >= 40) nb.push(v); }
  return nb.length >= 4 ? median(nb) : 0;
}));

// 2. Smooth each cell with its 3 x 3 neighbourhood, then snap to the nearest storey-line tier (flat roofs, no lidar wobble).
const fz = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : filled[z][x]);
const T = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!filled[z][x]) continue;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = fz(x + dx, z + dz); if (v > 0) nb.push(v); }
  T[z][x] = tier(median(nb));
}

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const top = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : T[z][x]);
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => top(x + DIRS[d][0], z + DIRS[d][1]) <= y);
const key = (x, y, z) => `${x},${y},${z}`;

// Window glass: a pane joins its neighbours along the wall it sits in.
const pane = (d) => (d === "N" || d === "S" ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// What a cell's block is at height y: null (nothing), { b, s } (block + state), or a window/door
// flagged win so its inner cell becomes an air gap behind the glass.
function decide(x, y, z) {
  const t = T[z][x];
  if (!t || y >= t) return null;
  const sides = exposed(x, z, y);
  if (!sides.length) return { b: y === t - 1 ? "gray_concrete" : "stone" };   // core, or the tar roof
  const d = ["N", "S", "E", "W"].find((k) => sides.includes(k));
  const party = (d === "E" || d === "W") && (x + (d === "E" ? 1 : -1) < 0 || x + (d === "E" ? 1 : -1) >= W);
  const k = Math.floor(y / 3), r = y % 3, S = Math.floor(t / 3);
  const u = d === "N" || d === "S" ? x : z;
  if (y === t - 1) return { b: "stone_bricks" };                 // cornice cap
  if (y >= 3 * S) return { b: "smooth_stone" };                   // corbel band over the last full storey
  if (r === 0) return { b: k === 0 ? "polished_granite" : "smooth_stone" };   // plinth, then a storey line
  if (party) return { b: u % 4 === 0 ? "stone_bricks" : "bricks" };   // lot-line party wall: brick with stone pilasters
  if (k === 0 && d === "N") {                                     // street shopfront
    if (x === 5) return { b: "iron_door", s: door(r === 1 ? "lower" : "upper"), win: true, d, lit: false };
    if (x === 4 || x === 6) return r === 1
      ? { b: "lantern", s: { hanging: "false", waterlogged: "false" }, win: true, d, lit: false }
      : { b: "glass_pane", s: pane(d), win: true, d, lit: false };
    if (x === 0 || x === 10 || x === 3 || x === 7) return { b: "polished_granite" };
    return { b: "glass_pane", s: pane(d), win: true, d, lit: r === 1 && (x === 2 || x === 8) };
  }
  if (u % 4 === 0 || u % 4 === 3) return { b: "bricks" };         // piers between the bays
  return { b: "glass_pane", s: pane(d), win: true, d, lit: r === 1 && (u * 3 + k * 5) % 7 === 2 };
}

// Pass 1: decide every cell; work out which inner cells are air gaps behind glass (and which hold a lamp).
const dec = new Map();
const airs = new Map();   // key -> lit?
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < T[z][x]; y++) {
  const dd = decide(x, y, z); if (!dd) continue;
  dec.set(key(x, y, z), dd);
  if (!dd.win) continue;
  const ix = x - DIRS[dd.d][0], iz = z - DIRS[dd.d][1];
  if (ix < 0 || iz < 0 || ix >= W || iz >= D) continue;
  if (top(ix, iz) < y + 2) continue;   // the gap needs a slab above it, not the roof
  const kk = key(ix, y, iz);
  airs.set(kk, (airs.get(kk) || false) || dd.lit);
}

// Pass 2: write the massing. An air gap is left empty (or a glowstone lamp); everything else is solid.
const g = new Voxels([W, HMAX, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < T[z][x]; y++) {
  const kk = key(x, y, z), dd = dec.get(kk);
  if (!dd) continue;
  if (dd.b === "stone" && airs.has(kk)) { if (airs.get(kk)) g.set(x, y, z, "glowstone"); continue; }
  g.set(x, y, z, dd.b, dd.s);
}

// Penthouse on the 62 tier: brick walls, glass at the top storey, air behind the glass, stone cap.
for (let z = 4; z <= 9; z++) for (let x = 3; x <= 7; x++) {
  if (top(x, z) !== 62) continue;
  const edge = x === 3 || x === 7 || z === 4 || z === 9;
  g.set(x, 62, z, edge ? "bricks" : "stone");
  if (edge) g.set(x, 63, z, "glass_pane", pane(x === 3 || x === 7 ? "E" : "N"));
  g.set(x, 64, z, edge ? "stone_bricks" : "gray_concrete");
}
g.set(5, 65, 6, "shroomlight");   // aircraft warning light on the penthouse

// Wooden water tower on the 62 tier at the north-west corner of the roof.
for (const [x, z] of [[1, 2], [2, 2], [1, 3], [2, 3]]) {
  if (top(x, z) !== 62) continue;
  for (let y = 62; y <= 64; y++) g.set(x, y, z, "spruce_fence");
  for (let y = 65; y <= 67; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 68, z, "spruce_slab", { type: "top", waterlogged: "false" });
}

const out = g.save(`${DIR}/NYC1034235.nbt`);
const hs = T.flat().filter((v) => v > 0);
console.log(`cells ${hs.length}, tiers ${[...new Set(hs)].sort((a, b) => b - a).join(",")}, blocks ${out.blocks}, palette ${out.palette}, air gaps ${airs.size}`);
