// NYC1036185: 230 Park Avenue, a 1929 commercial and office tower (NYC individual and interior landmark). Read from its
// record: a Jazz-Age setback office block, cream limestone and glazed terracotta piers over a granite base, a stone
// cornice, the tallest mass in the middle of the lot and lower wings at the ends. The Park Avenue front is the west face
// (x 0): a granite shopfront with a recessed lobby and a central bronze door under a granite canopy lip.
// The walls are one block thick with an air gap behind each pane, a solid floor slab per storey and a solid roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 25, D = 55, HMAX = 76;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1036185.cells.json`, "utf8"));

// Lidar roof heights per footprint cell (the fourth number); a 0 with no roof is a drop-out, not a yard.
const inFoot = Array.from({ length: D }, () => Array(W).fill(false));
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) { inFoot[z][x] = true; if (r > 0) raw[z][x] = r; }
const NB = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const at = (a, x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : a[z][x]);
const mode = (count) => {                                         // the commonest value; ties go to the lower
  let best = null, n = 0;
  for (const [v, c] of count) if (c > n || (c === n && v < best)) { best = v; n = c; }
  return best;
};

// 1. Drop-outs take the commonest height of their neighbours.
const filled = raw.map((row, z) => row.map((r, x) => {
  if (r || !inFoot[z][x]) return r;
  const count = new Map();
  for (const [dx, dz] of NB) { const v = at(raw, x + dx, z + dz); if (v) count.set(v, (count.get(v) || 0) + 1); }
  return mode(count);
}));

// 2. Snap every roof to a whole number of 3-block storeys (flat tiers, no lidar wobble).
const snap = (h) => Math.max(3, Math.round(h / 3) * 3);
const S = filled.map((row, z) => row.map((h, x) => (inFoot[z][x] && h ? snap(h) : 0)));

// 3. A lone cell that disagrees with all its neighbours, where most of them agree, takes their height.
const T = S.map((row, z) => row.map((h, x) => {
  if (!h) return 0;
  const count = new Map(); let same = 0;
  for (const [dx, dz] of NB) { const v = at(S, x + dx, z + dz); if (v) { count.set(v, (count.get(v) || 0) + 1); if (v === h) same++; } }
  if (same) return h;
  const m = mode(count);
  return count.get(m) >= 5 ? m : h;
}));

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const top = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : T[z][x]);
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => top(x + DIRS[d][0], z + DIRS[d][1]) <= y);
const key = (x, y, z) => `${x},${y},${z}`;

const pane = (d) => (d === "N" || d === "S" ? { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const stairs = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });

// What a cell holds at height y: null (air), or { b, s, win, d, lit }. Interior cells are air except the floor
// slabs (every third row) and the top storey's ceiling; a window is a pane on the outer wall with air behind it.
function decide(x, y, z) {
  const t = T[z][x];
  if (!t || y >= t) return null;
  const ex = exposed(x, z, y);
  if (!ex.length) {
    if (y === t - 1) return { b: "stone" };                                // tar roof
    return y % 3 === 0 || y >= t - 2 ? { b: "smooth_stone" } : null;       // floor slabs, the ceiling under the roof
  }
  if (y === t - 1) return { b: "stone_bricks" };                          // cornice cap
  if (y === t - 2) return { b: "smooth_sandstone" };                      // corbel course under it
  if (y === 0) return { b: "polished_granite" };                          // base course on the lowest ground
  const k = Math.floor(y / 3), r = y % 3;
  if (ex.length > 1) return { b: r === 0 ? "smooth_sandstone" : k === 0 ? "polished_granite" : "white_terracotta" };   // corner pier
  const d = ex[0];
  const west = d === "W";
  const u = d === "N" || d === "S" ? x : z;
  if (west && k === 0) {                                                  // Park Avenue shopfront and lobby
    if (u === 27) return { b: "iron_door", s: door(FACING[d], r === 1 ? "lower" : "upper") };
    if (u % 3 === 0) return { b: "polished_granite" };
    return { b: "glass_pane", s: pane(d), win: true, d };
  }
  if (west && y === 3 && u >= 24 && u <= 30) return { b: "polished_granite_stairs", s: stairs("west") };   // canopy lip over the lobby
  if (r === 0) return { b: "smooth_sandstone" };                          // storey line
  if (u % 3 === 0) return { b: k === 0 ? "polished_granite" : "white_terracotta" };   // piers, the window frames
  return { b: "glass_pane", s: pane(d), win: true, d, lit: r === 1 && (u * 3 + k * 7) % 9 === 0 };
}

// Pass 1: decide every cell.
const dec = new Map();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < T[z][x]; y++) {
  const v = decide(x, y, z); if (v) dec.set(key(x, y, z), { ...v, x, y, z });
}

// Pass 2: panes join the solid or glass beside them; a lit window gets a glowstone on the slab inside it.
const lamp = [];
for (const v of dec.values()) {
  if (!v.win) continue;
  const { x, y, z, d } = v;
  if (d === "N" || d === "S") v.s = { east: String(dec.has(key(x - 1, y, z))), west: String(dec.has(key(x + 1, y, z))), north: "false", south: "false", waterlogged: "false" };
  else v.s = { east: "false", west: "false", north: String(dec.has(key(x, y, z - 1))), south: String(dec.has(key(x, y, z + 1))), waterlogged: "false" };
  if (v.lit) {
    const ix = x - DIRS[d][0], iz = z - DIRS[d][1];
    if (!dec.has(key(ix, y, iz))) lamp.push([ix, y, iz]);
  }
}

// Roof plant: a mechanical penthouse on the lowest tier that holds a clear 4 x 4 of roof, and a mast on the tallest roof.
const sq = (x0, z0, h) => { for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) if (top(x0 + dx, z0 + dz) !== h) return false; return true; };
let ph = null, best = Infinity;
for (let z = 0; z + 4 <= D; z++) for (let x = 0; x + 4 <= W; x++) {
  const h = top(x, z); if (h < 12 || h > 30 || h === 60 || !sq(x, z, h)) continue;
  const dist = Math.abs(x + 2 - 12) + Math.abs(z + 2 - 27);
  if (dist < best) { best = dist; ph = { x, z, h }; }
}
const maxT = Math.max(...T.flat());
let mast = null; best = Infinity;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (T[z][x] === maxT) {
  const dist = Math.abs(x - 12) + Math.abs(z - 27);
  if (dist < best) { best = dist; mast = { x, z }; }
}

// Build.
const g = new Voxels([W, HMAX, D]);
for (const v of dec.values()) g.set(v.x, v.y, v.z, v.b, v.s);
for (const [x, y, z] of lamp) g.set(x, y, z, "glowstone");
g.set(1, 1, 27, "lantern", { hanging: "false", waterlogged: "false" });                    // a lamp in the lobby
if (ph) for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) for (let y = ph.h; y < ph.h + 3; y++) {
  const edge = dx === 0 || dz === 0 || dx === 3 || dz === 3;
  g.set(ph.x + dx, y, ph.z + dz, edge ? "bricks" : "stone");
}
if (ph) for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) g.set(ph.x + dx, ph.h + 3, ph.z + dz, "smooth_stone");
for (let y = maxT; y < maxT + 4; y++) g.set(mast.x, y, mast.z, "iron_bars", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });

const info = g.save(`${DIR}/NYC1036185.nbt`);
console.log(JSON.stringify({ footprint: cells.length, maxRoof: maxT, penthouse: ph, mast, lamps: lamp.length, ...info }));
