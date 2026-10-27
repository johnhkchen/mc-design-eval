// Wellesley Street Car Park, Auckland CBD (way 291249519): a 1970s concrete-frame multi-storey car park, six decks of
// 4 blocks over a shopfront ground floor. Lidar roofs are median-smoothed and snapped to the storey grid: a 28 stair and
// lift core where the lidar reads 27+, a 24 deck (six decks) over most of the plan, a 20 five-deck wing on the lower
// side, a 16 and an 8 at the low end. Each open deck is a grey concrete floor band, a light-grey beam, light-grey fins
// every 4 blocks, and a dark iron-bar screen between them (the ventilated open deck), with interior air and a floor
// slab per deck. The ground floor is a stone plinth, shopfront glass and a dark-oak pedestrian door, with a vehicle
// entry (air under a concrete lintel) on the north edge at the lowest ground. The roof deck carries parking bays (white
// lines every 3 blocks) and a parapet with a smooth-stone cap; glowstone sits behind some screens.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291249519.cells.json", "utf8"));
const W = 66, D = 53, TOP = 31;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
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

// median-smoothed roof (5 x 5, so the lidar's stair-stepped edges become clean tiers), then tiers on the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z);
  const tier = r >= 27 ? 28 : r >= 23 ? 24 : r >= 19 ? 20 : r >= 14 ? 16 : 8;
  const floorH = 4 * Math.ceil((G[x][z] + 4) / 4);           // at least two decks above the ground under the cell
  H[x][z] = Math.max(tier, floorH);
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the vehicle entry: the north edge at the lowest street ground, the middle three cells of its run; the pedestrian door
// four cells along it
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 1 && H[x][z] >= 20) northEdge.push([x, z]);
const mid = northEdge.length ? northEdge[northEdge.length >> 1] : null;
const entrance = new Set(), door = new Set();
if (mid) {
  for (const [x, z] of northEdge) if (Math.abs(x - mid[0]) <= 1 && z === mid[1]) entrance.add(`${x},${z}`);
  // the first north-edge cell at least four along from the entry, on a deck wall (not the lintel or the opening)
  const dc = northEdge.find(([x]) => Math.abs(x - mid[0]) >= 4 && Math.abs(x - mid[0]) <= 8);
  if (dc) door.add(`${dc[0]},${dc[1]}`);
}

const g = new Voxels([W, TOP, D]);
const BARS = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // the deck: parking bays (white lines across the deck every 3 blocks) on the open roof, a parapet on the outer ring
  const bays = d >= 2 && top < 28 && x % 3 === 1;
  g.set(x, top, z, bays ? "white_concrete" : "gray_concrete");
  if (d === 1) { g.set(x, top + 1, z, "light_gray_concrete"); g.set(x, top + 2, z, "smooth_stone"); }

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: open air with a floor slab per deck (and the ground deck)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "gray_concrete");
      continue;
    }
    if (y === gr) {
      // the ground course: a stone plinth, or the car park floor at the vehicle entry
      g.set(x, y, z, entrance.has(`${x},${z}`) ? "gray_concrete" : "stone_bricks");
      continue;
    }
    const key = `${x},${z}`;
    if (entrance.has(key)) {
      if (y === 3) g.set(x, y, z, "light_gray_concrete");   // lintel over the vehicle opening
      continue;                                             // the opening itself is air
    }
    if (door.has(key) && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "gray_concrete"); continue; }     // deck edge
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // beam over the bay
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (corner || u % 4 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }   // concrete fin every 4 blocks
    if (y < 4) {
      // the shopfront: glass in light-grey frames on the ground deck
      g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
      continue;
    }
    // the open deck screen: iron bars between the fins
    g.set(x, y, z, "iron_bars", BARS(ex));
    if ((x * 31 + z * 17 + y * 7) % 7 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light just inside some screens: an interior air cell beside the bars, on its deck slab
let glowN = 0;
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0 && g.get(x, y, z) === null) { g.set(x, y, z, "glowstone"); glowN++; }

// the stair and lift cores' roof plant: a small screen block on the top deck of the 28 tier, and the lift overrun
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  if (H[x][z] !== 28 || dist[x][z] < 2) continue;
  if (x % 4 !== 2 || z % 4 !== 2) continue;
  for (let dx = -1; dx <= 0; dx++) for (let dz = -1; dz <= 0; dz++) {
    if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== 28) continue;
    for (let y = 28; y <= 29; y++) g.set(x + dx, y, z + dz, y === 29 ? "smooth_stone" : "light_gray_concrete");
  }
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291249519.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: [...entrance], door: [...door], glow: glowN, ...stats }));
