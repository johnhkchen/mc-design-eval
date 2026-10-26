// FR245184473: a five-storey Haussmann-type residential block of 1800, in pale limestone (calcite piers, smooth stone
// courses, a rusticated stone_bricks ground storey on a plinth), a one-block shell round an air-and-floor-slab interior
// (an air gap behind every window, glowstone lamps in some), a stepped slate mansard, chimneys. The lidar's per-cell
// roof is smoothed (3x3 median); cells under 15 blocks are the low wing, which stops at a cornice at y 9.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184473.cells.json", "utf8"));
const g = new Voxels([23, 40, 30]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(), roofRaw = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); roofRaw.set(key(x, z), r); }
const inFoot = (x, z) => ground.has(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// the lidar roof, median-smoothed over the 3x3 footprint neighbourhood; the low wing is where it stays under 15
const roof = new Map();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number), v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(roofRaw.get(key(x + dx, z + dz)));
  roof.set(k, median(v));
}
const isWing = (x, z) => roof.get(key(x, z)) < 15;
const isMain = (x, z) => inFoot(x, z) && !isWing(x, z);
const isWingCell = (x, z) => inFoot(x, z) && isWing(x, z);

// depth 0 on a set's outer edge, growing inward (4-neighbour BFS): the shell is depth 0, the air gap depth 1+
function depthIn(inSet) {
  const d = new Map(), q = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (inSet(x, z) && Object.values(DIRS).some(([dx, dz]) => !inSet(x + dx, z + dz))) { d.set(k, 0); q.push(k); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i].split(",").map(Number);
    for (const [dx, dz] of Object.values(DIRS)) {
      const n = key(x + dx, z + dz);
      if (inSet(x + dx, z + dz) && !d.has(n)) { d.set(n, d.get(q[i]) + 1); q.push(n); }
    }
  }
  return d;
}
const depthM = depthIn(isMain), depthW = depthIn(isWingCell);

// the first outward face of a footprint cell (null inside); windows key off its u, the along-the-face coordinate
const faceOf = (x, z) => Object.keys(DIRS).find((d) => !inFoot(x + DIRS[d][0], z + DIRS[d][1])) ?? null;
const uOf = (x, z, face) => (face === "north" || face === "south" ? x : z);
const winCol = (u) => u % 4 === 1 || u % 4 === 2;     // a 2-bay window, then a pier pair: the rhythm of the facade

// the doors: on the two longest exposed sides, the middle cell of each, ground floor low enough to fit a 2-high door
const doors = new Map();
{
  const bySide = {};
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number), f = faceOf(x, z);
    if (!f || !isMain(x, z) || depthM.get(k) !== 0 || ground.get(k) > 2) continue;
    (bySide[f] ??= []).push([x, z]);
  }
  const sides = Object.entries(bySide).sort((a, b) => b[1].length - a[1].length).slice(0, 2);
  for (const [f, list] of sides) {
    list.sort((a, b) => uOf(a[0], a[1], f) - uOf(b[0], b[1], f));
    const [x, z] = list[Math.floor(list.length / 2)];
    doors.set(key(x, z), f);
  }
}

// three chimney stacks on the mansard's flat top, spaced apart
const chimneys = new Set();
{
  const tops = [...ground.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => isMain(x, z) && depthM.get(key(x, z)) >= 3);
  tops.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const [x, z] of tops) {
    if (chimneys.size >= 3) break;
    if ([...chimneys].every((c) => Math.max(Math.abs(c.split(",")[0] - x), Math.abs(c.split(",")[1] - z)) >= 6)) chimneys.add(key(x, z));
  }
}

const FLOORS = [5, 9, 13, 17];     // storey course rows (the floor slab of each storey, and its string course)
const COURSES = [...FLOORS, 21];   // 21 is the main body's cornice; 9 is the low wing's cornice and roof
const isFacade = (x, z, main) => (main ? depthM : depthW).get(key(x, z)) === 0 && faceOf(x, z) !== null;

// a cell behind a window (the air gap) at the window's middle row: lit in one bay of three, per storey
function lampAt(x, z, y) {
  const storey = FLOORS.findIndex((c) => y === c + 2);
  if (storey < 0) return false;
  return Object.values(DIRS).some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz, nf = faceOf(nx, nz);
    return nf && isFacade(nx, nz, isMain(nx, nz)) && winCol(uOf(nx, nz, nf)) && (storey + uOf(nx, nz, nf)) % 3 === 0;
  });
}

// the dormer window: a mansard cell one in from the facade, in the bay that the facade's window sits above
const dormerAt = (x, z) => {
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz, nf = faceOf(nx, nz);
    if (nf && isMain(nx, nz) && depthM.get(key(nx, nz)) === 0 && uOf(nx, nz, nf) % 4 === 1) return true;
  }
  return false;
};

// what one cell holds at one height: [block, state], or null for air
function blockAt(x, z, y, main) {
  const k = key(x, z), gr = ground.get(k), d = (main ? depthM : depthW).get(k);
  const top = main ? 27 : 9;
  if (y > top) return null;
  if (y < gr) return ["stone_bricks"];                  // foundation, down to the lowest ground under the block
  if (y === gr) return ["stone_bricks"];                 // the ground storey's floor
  const face = faceOf(x, z), facade = d === 0 && face !== null;
  if (doors.has(k) && d === 0 && (y === gr + 1 || y === gr + 2)) {   // a 2-high door on the ground storey, on its floor
    return ["dark_oak_door", { facing: doors.get(k), half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (main && y >= 22) {                                  // the stepped mansard: each tier stands on the one below it
    if (chimneys.has(k) && y >= 25 && y <= 26) return ["bricks"];
    if (chimneys.has(k) && y === 27) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];
    if (y === 22 && d === 1 && dormerAt(x, z)) return ["glass_pane"];
    if (y - 21 <= d && d >= 1) return ["deepslate_tiles"];   // tier 22 one in, 23 two in, 24 three in
    return null;
  }
  if (COURSES.includes(y)) return ["smooth_stone"];   // the string courses and cornices run round the whole block
  if (y === 4) return d === 0 ? ["stone_bricks"] : null;  // the ground storey's lintel band
  if (y >= 1 && y <= 3 && y > gr) {                       // the ground storey: shopfront glass
    if (d !== 0) return null;
    if (facade && winCol(uOf(x, z, face))) return ["glass_pane"];
    return ["calcite"];
  }
  // the storeys: a window in each bay of a facade cell, the air gap behind it, a lamp in some
  const inWindowBand = FLOORS.some((c) => y >= c + 1 && y <= c + 3);
  if (inWindowBand && (main || y <= 8)) {
    if (d === 0) return facade && winCol(uOf(x, z, face)) ? ["glass_pane"] : ["calcite"];
    if (y === FLOORS.find((c) => y >= c + 1 && y <= c + 3) + 2 && lampAt(x, z, y)) return ["glowstone"];
    return null;
  }
  return null;
}

// first pass: everything but the glass panes' connections; the glass cells are remembered for the second
const glass = new Set();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number), main = isMain(x, z);
  for (let y = 0; y <= 27; y++) {
    const b = blockAt(x, z, y, main);
    if (!b) continue;
    if (b[0] === "glass_pane") glass.add(`${x},${y},${z}`);
    g.set(x, y, z, b[0], b[1]);
  }
}

// second pass: glass panes connect to the glass beside them, so a window reads as one grid
const hasGlass = (x, y, z) => glass.has(`${x},${y},${z}`);
for (const s of glass) {
  const [x, y, z] = s.split(",").map(Number);
  g.set(x, y, z, "glass_pane", {
    north: hasGlass(x, y, z - 1), south: hasGlass(x, y, z + 1), east: hasGlass(x + 1, y, z), west: hasGlass(x - 1, y, z),
    waterlogged: false,
  });
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184473.nbt");
console.log(stats);
