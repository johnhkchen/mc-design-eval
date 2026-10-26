// FR245184570: a Haussmann residential block (1850). Limestone walls over a stone plinth, five floors with
// string courses and framed windows, a deepslate mansard attic with dormers, chimney stacks. Footprint cells only;
// the facade is the edge cells, rooms sit one and two cells in with a floor slab per storey, the core is solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184570.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184570.nbt";
const SIZE = [23, 40, 36];
const FLOORS = [6, 10, 14, 18];       // storey lines above the ground floor line
const MANSARD = 21;                   // the attic's first course; the mansard runs MANSARD..23 and tops out at 24
const LEVELS = [6, 10, 14, 18, 21, 24];
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

const key = (x, z) => `${x},${z}`;
const at = new Map();
for (const [x, z, G, R] of JSON.parse(readFileSync(CELLS, "utf8"))) at.set(key(x, z), { x, z, G, R });
const nb = (c, dx, dz) => at.get(key(c.x + dx, c.z + dz));

// roof: the 3x3 median of the lidar's roof heights, snapped to the nearest storey line (lidar noise out)
for (const c of at.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.R); }
  v.sort((a, b) => a - b);
  const m = v[v.length >> 1];
  c.T = LEVELS.reduce((best, L) => (Math.abs(L - m) < Math.abs(best - m) ? L : best));
}

// d: steps from the cell to the outside of the footprint (0 = facade)
const queue = [];
for (const c of at.values()) {
  c.d = DIRS.some(([dx, dz]) => !nb(c, dx, dz)) ? 0 : Infinity;
  if (c.d === 0) queue.push(c);
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of DIRS) { const n = nb(c, dx, dz); if (n && n.d === Infinity) { n.d = c.d + 1; queue.push(n); } }
}

// the way out: the missing neighbour on the facade, else the neighbour one step nearer the facade
function outward(c) {
  for (const [dx, dz, name] of DIRS) {
    const n = nb(c, dx, dz);
    if (c.d === 0 ? !n : n && n.d === c.d - 1) return name;
  }
  return "north";
}

const bay = (c) => (c.x + c.z) % 3;   // a window on every third facade cell: 1 glass bay, 2 stone jambs

// storey lines for a cell: its ground, the floor lines between, and its top (the mansard starts at MANSARD)
function storeys(c) {
  const top = c.T === 24 ? MANSARD : c.T;
  return { top, B: [c.G, ...FLOORS.filter((f) => f > c.G && f < top), top] };
}
const storeyAt = (B, y) => { let s = 0; while (B[s + 1] <= y) s++; return B[s + 1]; };   // the storey's upper line

// the entrance: the facade cell on the southern edge nearest the middle
const facade = [...at.values()].filter((c) => c.d === 0);
const maxZ = Math.max(...facade.map((c) => c.z));
const meanX = facade.reduce((s, c) => s + c.x, 0) / facade.length;
const door = facade.filter((c) => c.z === maxZ).sort((a, b) => Math.abs(a.x - meanX) - Math.abs(b.x - meanX))[0];

// warm light on the floor of a room behind some lit windows (one room cell in from the glass)
const lights = new Set();
for (const c of facade) {
  const { B } = storeys(c);
  for (let s = 0; s + 1 < B.length; s++) {
    const fl = B[s], fu = B[s + 1];
    if (bay(c) !== 1 || fu - fl < 3 || c === door || (c.x * 7 + c.z * 11 + fl) % 4 !== 0) continue;
    const room = DIRS.map(([dx, dz]) => nb(c, dx, dz)).find((n) => n && n.d === 1);
    if (room) lights.add(`${room.x},${fl + 1},${room.z}`);
  }
}

const stairs = (c, half) => ({ facing: outward(c), half, shape: "straight", waterlogged: "false" });
const doorState = (c, half) => ({ facing: outward(c), half, hinge: "left", open: "false", powered: "false" });

// what stands at (c, y): [block, state] or null for air
function blockAt(c, y) {
  if (y < c.G) return ["stone_bricks"];                                   // foundation under every cell, up to its ground
  if (c.T === 24 && y >= MANSARD) {                                       // mansard: each course steps in one cell
    const k = y - MANSARD;
    if (c.d > k) return ["deepslate_tiles"];
    if (c.d === k) {
      if (k === 1 && bay(c) === 1) return ["light_blue_stained_glass"];   // dormer windows in the slope
      return ["deepslate_tile_stairs", stairs(c, "bottom")];
    }
    return null;
  }
  if (y >= c.T) return null;
  const { top, B } = storeys(c);
  const top1 = c.T - 1;
  if (c.d >= 3) return y === top1 && c.T !== 24 ? ["deepslate_tiles"] : ["stone_bricks"];   // solid core
  if (c.d === 0) {
    if (c === door && y === c.G) return ["dark_oak_door", doorState(c, "lower")];
    if (c === door && y === c.G + 1) return ["dark_oak_door", doorState(c, "upper")];
    if (c === door && y === c.G + 2) return ["stone_brick_stairs", stairs(c, "top")];   // a hood over the door
    if (y === c.G) return ["stone_bricks"];                                             // plinth course
    if (B.includes(y)) return ["smooth_stone"];                                          // string courses
    const fu = storeyAt(B, y);
    if (bay(c) === 1 && y <= fu - 2) return ["light_blue_stained_glass"];                // glass, framed by the jambs
    if (bay(c) === 1 && y === fu - 1) return ["smooth_stone"];                           // lintel
    return ["calcite"];
  }
  // rooms: a cap where the roof is flat, floor slabs, the lamps behind the glass
  if (y === top1 && c.T !== 24) return ["deepslate_tiles"];
  if (B.includes(y) && y < top) return ["oak_planks"];
  if (lights.has(`${c.x},${y},${c.z}`)) return ["shroomlight"];
  return null;
}

const g = new Voxels(SIZE);
for (const c of at.values()) {
  for (let y = 0; y < 24; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// chimney stacks on the attic, spaced apart
const chimneys = [];
for (const c of [...at.values()].sort((a, b) => a.x - b.x || a.z - b.z)) {
  if (c.T === 24 && c.d >= 3 && chimneys.every((h) => Math.abs(h.x - c.x) + Math.abs(h.z - c.z) >= 6)) chimneys.push(c);
}
for (const c of chimneys.slice(0, 5)) {
  for (let y = 24; y <= 26; y++) g.set(c.x, y, c.z, "bricks");
  g.set(c.x, 27, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = g.save(OUT);
console.log(JSON.stringify({ cells: at.size, door: door && [door.x, door.z], chimneys: chimneys.length, lights: lights.size, ...out }));
