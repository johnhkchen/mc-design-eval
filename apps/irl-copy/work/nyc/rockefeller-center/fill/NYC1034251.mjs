// NYC1034251: 554 5 Avenue, 1909 commercial & office block, about seven storeys (23 blocks) on a 28 x 7 footprint.
// Built from the record's era and use, not from a survey: a pale terracotta street front on a polished granite
// plinth, a shopfront row with a dark double entrance, storey courses, a cornice cap and a flat tar roof. The lidar
// roof steps the block down in two places: a six-storey section to the west (18) and a slightly lower east end (21),
// with a two-storey rear wing (6) on the yard side. The street front is the north face (z 0); the rear is z 6.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 28, D = 7, H = 26;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034251.cells.json`, "utf8"));

// Lidar roof heights per footprint cell; 0 is a lidar drop-out, filled from its in-plan neighbours.
const raw = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, , r] of cells) raw[z][x] = r;
const inPlan = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const filled = raw.map((row, z) => row.map((r, x) => {
  if (r) return r;
  const nb = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dz]) => (inPlan(x + dx, z + dz) ? raw[z + dz][x + dx] : 0)).filter((v) => v > 0);
  return nb.length ? median(nb) : 23;
}));
// Snap each cell to the storey-line tiers: 6 (two storeys), 18 (six), 21 (seven, thin cap), 23 (seven with cornice).
const snap = (h) => (h < 12 ? 6 : h < 19.5 ? 18 : h < 22 ? 21 : 23);
const T = filled.map((row) => row.map(snap));
const topAt = (x, z) => (inPlan(x, z) ? T[z][x] : 0);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// A face is a street or rear or end face when the cell beyond it is off the footprint; a step face sits against a lower neighbour.
const perimeterDirs = (x, z) => Object.keys(DIRS).filter(([d]) => !inPlan(x + DIRS[d][0], z + DIRS[d][1]));
const exposedDirs = (x, z, y) => Object.keys(DIRS).filter((d) => topAt(x + DIRS[d][0], z + DIRS[d][1]) <= y);
const key = (x, y, z) => `${x},${y},${z}`;

// Storey rows: course at y % 3 == 0 (y 0 is the granite plinth), window rows between them, the cornice at the top.
const isCourse = (y) => y > 0 && y % 3 === 0;
const isWindowRow = (y, t) => y > 0 && y % 3 !== 0 && y < t - 1;
// Piers sit on the bay lines: every third cell on the street and rear faces, every third cell on the ends.
const isPier = (x, z, d) => (d === "N" || d === "S" ? x % 3 === 0 : z % 3 === 0);
// The entrance is the two cells between the piers at x 12 and x 15; its shopfront is full glass elsewhere on the ground floor.
const isEntrance = (x, y, z, d) => d === "N" && z === 0 && (x === 13 || x === 14) && (y === 1 || y === 2);
const isCanopy = (x, y, z, d) => d === "N" && z === 0 && y === 3 && x >= 12 && x <= 15;

// Glass is set back one cell: the cell behind each window row is air (a room), with a floor course above and below.
const cavity = new Set(), lit = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = T[z][x];
  for (const d of perimeterDirs(x, z)) {
    const [dx, dz] = DIRS[d];
    for (let y = 1; y < t; y++) {
      if (!isWindowRow(y, t) || isPier(x, z, d)) continue;
      const cx = x - dx, cz = z - dz;
      if (!inPlan(cx, cz)) continue;
      cavity.add(key(cx, y, cz));
      if (y % 3 === 1 && (x * 5 + y * 3 + z) % 7 === 0) lit.add(key(cx, y, cz));   // a warm lamp in some rooms
    }
  }
}

// What the block at (x, y, z) is: null (air), or { b, s } with a state where it has one.
function decide(x, y, z) {
  const t = T[z][x];
  if (!t || y >= t) return null;
  const k = key(x, y, z);
  if (cavity.has(k)) return lit.has(k) ? { b: "glowstone" } : null;
  const sides = exposedDirs(x, z, y);
  if (!sides.length) return { b: y === t - 1 ? "gray_concrete" : "stone" };    // core, and the tar roof on top
  if (y === 0) return { b: "polished_granite" };                                 // plinth
  if (y === t - 1) return { b: "stone_bricks" };                                 // cornice cap
  const per = perimeterDirs(x, z).find((d) => sides.includes(d));
  if (!per) return { b: isCourse(y) ? "smooth_stone" : "white_terracotta" };      // step face against a lower neighbour: plain wall
  if (isCanopy(x, y, z, per)) return { b: "dark_oak_slab", s: { type: "top", waterlogged: "false" } };
  if (isEntrance(x, y, z, per)) {
    return { b: "dark_oak_door", s: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 13 ? "left" : "right", open: "false", powered: "false" } };
  }
  if (isCourse(y)) return { b: "smooth_stone" };
  if (isWindowRow(y, t) && !isPier(x, z, per)) {
    if (per === "N" || per === "S") {
      // Ground-floor shopfront on the street front; upper windows are panes joined along the wall.
      if (per === "N" && y <= 2) return { b: "glass" };
      return { b: "glass_pane", s: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } };
    }
    return { b: "glass_pane", s: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } };
  }
  // Piers: polished granite at the street front's ground floor, pale terracotta above.
  if (per === "N" && y <= 2) return { b: "polished_granite" };
  return { b: "white_terracotta" };
}

const g = new Voxels([W, H, D]);
let blocks = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < T[z][x]; y++) {
  const d = decide(x, y, z);
  if (!d) continue;
  g.set(x, y, z, d.b, d.s);
  blocks++;
}

// Roof plant: a bulkhead stair-tower on the 23 roof, set back from the street, behind the cornice.
for (let z = 2; z <= 3; z++) for (let x = 14; x <= 17; x++) {
  if (T[z][x] !== 23) continue;
  g.set(x, 23, z, "stone_bricks"); g.set(x, 24, z, "stone_bricks");
  g.set(x, 25, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Sanity: nothing hangs. A block above y 0 with air below it must be a floor course over a room, held by the walls beside it.
let floating = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!side) floating++;
}
const saved = g.save(`${DIR}/NYC1034251.nbt`);
console.log(JSON.stringify({ blocks, floating, ...saved, tiers: [...new Set(T.flat())] }));
