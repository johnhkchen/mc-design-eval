// NYC1035369: 7 East 44th Street, a 1927 commercial and office building midblock off Fifth Avenue. Twenty storeys
// of brick piers and steel-sash windows on a granite base and shopfronts, a stone cornice and parapet over a flat
// tar roof, and a two-storey wing on the yard side (north, low z). The street front is the south face (z 9): a
// granite-framed lobby door at x 11, a black marquee above it and a lit window beside it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 23, D = 10, HY = 73;
const TOWER_TOP = 60;          // tower solid up to y 59, a parapet course at y 60
const WING_TOP = 7;            // wing solid up to y 6 (its roof deck)
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035369.cells.json`, "utf8"));

const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) raw[z][x] = { g, r };
const rawAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : raw[z][x]);
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Lidar smoothing: each cell takes the median roof of its 3 x 3 neighbourhood (drop-outs and spikes go), then is
// either tower (roof above 30) or wing (roof 5 to 9). Two flat tops, no lidar wobble.
const col = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  if (!rawAt(x, z)) return null;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = rawAt(x + dx, z + dz); if (n && n.r > 0) nb.push(n.r); }
  const tower = median(nb) >= 30;
  return { g: rawAt(x, z).g, tower, top: tower ? TOWER_TOP : WING_TOP };
}));
const cl = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : col[z][x]);

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
// A face is exposed when its neighbour is outside the footprint or that neighbour is open air at this height.
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const n = cl(x + DIRS[d][0], z + DIRS[d][1]);
  return !n || y >= n.top;
});
// The tower's roof edge: a cell with open ground or the lower wing beside it gets a parapet.
const perim = (x, z) => Object.keys(DIRS).some((d) => {
  const n = cl(x + DIRS[d][0], z + DIRS[d][1]);
  return !n || !n.tower;
});

// Pane connections follow the wall the pane sits in.
const glass = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Outside walls. The street face (south) wins a corner-less cell; corners are always piers. Piers sit on a
// 3-block grid anchored on the east end (z faces) and the south-east corner (x faces).
function shell(x, z, y, c, ex) {
  const zFace = ex.includes("S") || ex.includes("N");
  const xFace = ex.includes("E") || ex.includes("W");
  const face = ex.includes("S") ? "S" : ex.includes("N") ? "N" : ex.includes("E") ? "E" : "W";
  const u = zFace ? 22 - x : z;
  const pier = (zFace && xFace) || u % 3 === 0;

  // Lobby on the street front: door at x 11 (lower and upper half), lit glass at x 12, granite lintel, marquee.
  if (face === "S" && z === D - 1 && (x === 11 || x === 12)) {
    if (x === 11 && y <= 1) return { b: "dark_oak_door", s: { facing: "south", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" } };
    if (x === 11 && y === 2) return { b: "polished_granite" };
    if (y === 3) return { b: "black_concrete" };
    if (x === 12 && y > 0 && y < 3) return { b: "glass_pane", s: glass("S") };
  }
  if (y === c.g) return { b: "polished_granite" };                 // base course on the ground line
  if (y === c.top - 1) return { b: "stone_bricks" };               // cornice / top course
  if (y % 3 === 0) return { b: "smooth_stone" };                   // storey line
  if (pier) return { b: y < 3 ? "polished_granite" : "bricks" };  // brick piers, granite at the shopfronts
  return { b: "glass_pane", s: glass(face) };                      // steel-sash windows
}

// Inside: a floor slab per storey and the roof deck, air between. A few lamps stand behind windows.
const windowAt = (x, z, y) => {
  const c = cl(x, z);
  if (!c || y < c.g || y >= c.top) return false;
  const ex = exposed(x, z, y);
  return ex.length > 0 && shell(x, z, y, c, ex).b === "glass_pane";
};
function interior(x, z, y, c) {
  if (y === c.top - 1 || y === c.g || y % 3 === 0) return { b: "stone" };
  if (y % 3 === 1 && (x * 7 + y * 5 + z * 3) % 5 === 0
    && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dz]) => windowAt(x + dx, z + dz, y))) {
    return y < 3 ? { b: "glowstone" } : { b: "lantern", s: { hanging: "false", waterlogged: "false" } };
  }
  return null;
}

function blockAt(x, z, y) {
  const c = cl(x, z);
  if (!c) return null;
  if (y < c.g) return { b: "polished_granite" };                   // foundation under the ground line
  if (y >= c.top) {
    return y === c.top && c.tower && perim(x, z) ? { b: "stone_brick_slab", s: { type: "bottom", waterlogged: "false" } } : null;
  }
  const ex = exposed(x, z, y);
  return ex.length ? shell(x, z, y, c, ex) : interior(x, z, y, c);
}

const g = new Voxels([W, HY, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < HY; y++) {
  const b = blockAt(x, z, y);
  if (b) g.set(x, y, z, b.b, b.s);
}

// Roof plant on the tower's roof (standing on the deck) and a lit lobby behind the glass.
for (const [x, z] of [[9, 6], [10, 6], [9, 7], [10, 7], [16, 6]]) g.set(x, TOWER_TOP, z, "copper_block");
g.set(12, 1, D - 2, "glowstone");

// Structural check: every block above ground has something under it or beside it at its own height.
let loose = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 1; y < HY; y++) {
  if (!g.get(x, y, z)) continue;
  const below = g.get(x, y - 1, z);
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!below && !beside) loose++;
}
const out = g.save(`${DIR}/NYC1035369.nbt`);
console.log(`NYC1035369: ${out.blocks} blocks, ${out.palette} palette entries, loose blocks ${loose}`);
