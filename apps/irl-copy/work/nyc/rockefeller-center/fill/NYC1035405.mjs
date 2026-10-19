// NYC1035405: 250 Park Avenue, a 1924 Midtown office block. Pale limestone (smooth quartz) walls on a granite base, stone-brick
// piers on a three-block storey grid with spandrel bands, a parapet on every tier. The lidar massing reads as a setback
// block: a 75-block core in the middle of the lot, 69 around it, 54 low wings at the north and south ends. The Park
// Avenue front is the west face (x 0): a recessed lobby with two doors at z 26-27 and shopfronts either side of it. The
// rear (east) face is brick. Windows are glass with air behind them; a few have lanterns hanging from the storey line.
// The penthouse on the 75 tier has glass walls, air inside and a shroomlight on its roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 25, D = 55, HMAX = 80;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035405.cells.json`, "utf8"));

// Lidar roof height per footprint cell; absent cells are outside the lot.
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) raw[z][x] = r;
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && raw[z][x] !== null;
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Flat tiers on the storey grid: a 3 x 3 median of the lidar, snapped to the nearest storey top.
const TIERS = [54, 57, 60, 63, 66, 69, 72, 75];
const tier = (h) => TIERS.reduce((best, t) => (Math.abs(t - h) < Math.abs(best - h) ? t : best));
const T = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  if (!has(x, z)) return 0;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (has(x + dx, z + dz)) nb.push(raw[z + dz][x + dx]);
  return tier(median(nb));
}));
const top = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : T[z][x]);

const DIRS = { W: [-1, 0], N: [0, -1], S: [0, 1], E: [1, 0] };   // W is Park Avenue
const ORDER = ["W", "N", "S", "E"];
const exposed = (x, z, y) => ORDER.filter((d) => top(x + DIRS[d][0], z + DIRS[d][1]) <= y);
const key = (x, y, z) => `${x},${y},${z}`;
const pane = (d) => (d === "W" || d === "E"
  ? { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
const door = (half, z) => ({ facing: "west", half, hinge: z === 26 ? "left" : "right", open: "false", powered: "false" });
const wall = (d) => (d === "E" ? "bricks" : "smooth_quartz");
// A window needs an air gap behind it: not a storey line, and the cell inside must be solid up to the storey line above.
const gapOK = (x, y, z) => has(x, z) && y % 3 !== 0 && top(x, z) > 3 * Math.floor(y / 3) + 3;

// What a footprint cell is at height y: null (air), or { b, s } plus a window flag for the glass that needs a gap.
function decide(x, y, z) {
  const t = T[z][x];
  if (!t || y >= t) return null;
  const sides = exposed(x, z, y);
  if (!sides.length) return { b: y === t - 1 ? "gray_concrete" : "stone" };   // core, or the tier's roof surface
  const d = sides[0];
  const k = Math.floor(y / 3), r = y % 3;
  const u = d === "W" || d === "E" ? z : x;                                    // position along the face
  if (y >= t - 2) return { b: "stone_bricks" };                                 // parapet on every tier edge
  if (d === "W" && k === 0 && z >= 25 && z <= 29) {                            // recessed lobby on Park Avenue
    if (z === 26 || z === 27) {
      if (y < 2) return { b: "iron_door", s: door(y === 0 ? "lower" : "upper", z), win: true, d };
      return { b: "glass_pane", s: pane(d), win: true, d };                    // transom over the doors
    }
    if (y === 0) return { b: "polished_granite" };
    return { b: "glass_pane", s: pane(d), win: true, d, glow: z !== 28 && y === 1 };
  }
  if (r === 0) return { b: k === 0 ? "polished_granite" : "smooth_quartz" };    // base course, storey line / spandrel
  if (u % 3 === 0) return { b: k === 0 ? "polished_granite" : "smooth_quartz" };   // piers
  return { b: "glass_pane", s: pane(d), win: true, d, lit: r === 2 && (u * 3 + k * 5 + (d === "E" ? 4 : 0)) % 7 === 2 };
}

// Pass 1: decide every cell; work out the air gaps behind the glass and which hold a lamp.
const dec = new Map();
const gaps = new Map();   // key -> "lantern" | "glowstone" | null (plain air)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < T[z][x]; y++) {
  let dd = decide(x, y, z); if (!dd) continue;
  if (dd.win) {
    const ix = x - DIRS[dd.d][0], iz = z - DIRS[dd.d][1];
    if (gapOK(ix, y, iz)) {
      const kk = key(ix, y, iz);
      const lamp = dd.glow && y % 3 === 1 ? "glowstone" : dd.lit && y % 3 === 2 ? "lantern" : null;   // lanterns hang from the storey line
      if (lamp || !gaps.has(kk)) gaps.set(kk, lamp);
    } else if (dd.b === "glass_pane") dd = { b: wall(dd.d) };                // no room behind it: solid wall
  }
  dec.set(key(x, y, z), dd);
}

// Pass 2: write the massing. Air gaps stay empty (or hold their lamp); everything else is solid.
const g = new Voxels([W, HMAX, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < T[z][x]; y++) {
  const kk = key(x, y, z);
  if (gaps.has(kk)) {
    const lamp = gaps.get(kk);
    if (lamp === "lantern") g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    else if (lamp) g.set(x, y, z, lamp);
    continue;
  }
  const dd = dec.get(kk);
  if (dd) g.set(x, y, z, dd.b, dd.s);
}

// Penthouse on the 75 tier: stone-brick corners, glass on each side, air inside, a stone roof.
const P = (x, z) => x >= 8 && x <= 16 && z >= 21 && z <= 33 && T[z][x] === 75;
for (let z = 21; z <= 33; z++) for (let x = 8; x <= 16; x++) {
  if (!P(x, z)) continue;
  const miss = ORDER.filter((d) => !P(x + DIRS[d][0], z + DIRS[d][1]));
  g.set(x, 75, z, miss.length ? "stone_bricks" : "stone");
  if (miss.length === 1) g.set(x, 76, z, "glass_pane", pane(miss[0]));
  else if (miss.length) g.set(x, 76, z, "stone_bricks");
  else if ((x * 5 + z * 3) % 7 === 0) g.set(x, 76, z, "lantern", { hanging: "true", waterlogged: "false" });
  g.set(x, 77, z, "stone_bricks");
}
if (P(12, 27)) g.set(12, 78, 27, "shroomlight");   // aircraft warning light on the penthouse roof

// Plant box on the north low wing (tier 54): stone base, iron top.
for (let z = 1; z <= 2; z++) for (let x = 3; x <= 5; x++) {
  if (T[z][x] !== 54) continue;
  g.set(x, 54, z, "stone_bricks");
  g.set(x, 55, z, "iron_block");
}

const out = g.save(`${DIR}/NYC1035405.nbt`);
const tiers = [...new Set(T.flat().filter(Boolean))].sort((a, b) => a - b);
console.log(`cells ${cells.length}, tiers ${tiers.join(",")}, air gaps ${gaps.size}, blocks ${out.blocks}, palette ${out.palette}`);
