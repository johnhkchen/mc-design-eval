// FR245184533: a Haussmann-era commercial block (c.1865, five storeys under a zinc mansard, stone) for the
// Compagnies motocyclistes de la préfecture de police. Walls are calcite piers and glass bays with smooth-stone string
// courses at each storey line; a stone-brick base course carries the shopfronts and the street door. The mansard
// (deepslate tiles, from y 21) steps in one block a block, with stair courses on its outer edge. Lidar roofs under 19
// are lower wings and a glazed court (skylights), snapped to 3-block tiers. Floors are slabs at y 5, 10, 15, 20.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184533.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..65, z 0..73

const g = new Voxels([66, 42, 74]);

const FLOORS = [5, 10, 15, 20];   // storey lines: a slab at each, string course on the facade
const MANSARD_Y = 20;             // the cornice; the mansard rises from 21
const MAIN_MIN = 19;              // lidar roofs at or above this are the block; below are wings and the court

const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];

const cellMap = new Map();
for (const [x, z, ground, roof] of cells) cellMap.set(`${x},${z}`, { x, z, ground, lidar: roof });
const at = (x, z) => cellMap.get(`${x},${z}`);
const neighbours = (c) => DIRS.map((d) => ({ d, n: at(c.x + d.dx, c.z + d.dz) }));

// Roof tiers: the block keeps its lidar roof (the mansard does the rest); wings snap to 3-block tiers.
for (const c of cellMap.values()) {
  c.main = c.lidar >= MAIN_MIN;
  c.T = c.main ? c.lidar : Math.max(c.ground + 1, Math.round(c.lidar / 3) * 3);
}

// Depth in from the street: 1 on the outline, rising inward. The mansard steps down with it.
const depth = new Map();
const queue = [];
for (const c of cellMap.values()) if (neighbours(c).some(({ n }) => !n)) { depth.set(c, 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const { n } of neighbours(c)) if (n && !depth.has(n)) { depth.set(n, depth.get(c) + 1); queue.push(n); }
}

for (const c of cellMap.values()) {
  c.d = depth.get(c);
  // a wall where the outside is, or where the neighbour is a lower roof (a setback's exposed face)
  c.wall = neighbours(c).some(({ n }) => !n || n.T < c.T);
  c.top = Math.max(c.main ? Math.min(c.T, MANSARD_Y + c.d) : c.T, c.ground + 1);
  // a mansard cell below the lidar roof: its outer edge is a stair course facing the next cell out
  const out = c.main && c.top === MANSARD_Y + c.d && c.top < c.T
    ? neighbours(c).find(({ n }) => (n ? depth.get(n) : 0) === c.d - 1) : null;
  c.stepDir = out ? out.d.name : null;
}

// The street door: the lowest-based front cell nearest the middle of the block.
const frontDoors = [...cellMap.values()].filter((c) => c.wall && !at(c.x, c.z - 1) && c.ground <= 2);
const door = frontDoors.sort((a, b) => a.ground - b.ground || (Math.abs(a.x - 33) + 2 * a.z) - (Math.abs(b.x - 33) + 2 * b.z))[0];

const lit = (x, y, z) => (x * 7 + z * 13 + y) % 11 === 0;   // about one window in eleven shows warm light

// The block at one cell and height, or null for air. Foundation to the ground; a base course with shopfronts;
// a slab at each storey line; piered window bands on the walls; roof volume above the last slab.
function blockAt(c, y) {
  if (y <= c.ground) return ["stone_bricks"];
  if (y > c.top) return null;
  if (y === c.top) return cap(c);
  if (y <= 4) {
    if (!c.wall || y === 1) return ["stone_bricks"];
    if (y === 4) return ["smooth_stone"];
    if ((c.x + c.z) % 3 === 0) return ["calcite"];
    return lit(c.x, y, c.z) ? ["glowstone"] : ["glass"];
  }
  if (FLOORS.includes(y)) return c.wall ? ["smooth_stone"] : ["stone"];
  const roofBase = Math.max(...FLOORS.filter((f) => f < c.top));
  if (y > roofBase) return c.main ? ["deepslate_tiles"] : ["stone_bricks"];
  if (!c.wall) return null;
  const r = y - Math.max(...FLOORS.filter((f) => f < y));   // 1..4 above the storey's slab
  if (r === 1) return ["calcite"];
  if (r === 4) return ["smooth_stone"];
  if ((c.x + c.z) % 3 === 0) return ["calcite"];
  return r === 2 && lit(c.x, y, c.z) ? ["glowstone"] : ["glass"];
}

// The top layer: mansard stairs on the outer edge, flat deepslate on the block, glazed skylights over the court.
function cap(c) {
  if (c.main) {
    if (c.stepDir) return ["deepslate_tile_stairs", { facing: c.stepDir, half: "bottom", shape: "straight", waterlogged: "false" }];
    return ["deepslate_tiles"];
  }
  if (!c.wall && c.x % 3 === 1 && c.z % 3 === 1) return ["glass"];
  return c.wall ? ["smooth_stone"] : ["stone_bricks"];
}

for (const c of cellMap.values()) {
  for (let y = 0; y <= c.top; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// The street door, set into the base course, with a lantern under the lintel.
if (door) {
  g.set(door.x, door.ground + 1, door.z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, door.ground + 2, door.z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, door.ground + 3, door.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Four chimney stacks on the flat deepslate of the main roof, spaced apart.
const flat = [...cellMap.values()].filter((c) => c.main && !c.stepDir && c.d >= 8 && c.top >= 26)
  .sort((a, b) => a.x - b.x || a.z - b.z);
const chimneys = [];
for (const c of flat) {
  if (chimneys.length === 4) break;
  if (chimneys.every((h) => Math.abs(h.x - c.x) + Math.abs(h.z - c.z) >= 12)) chimneys.push(c);
}
for (const c of chimneys) {
  g.set(c.x, c.top + 1, c.z, "bricks");
  g.set(c.x, c.top + 2, c.z, "bricks");
  g.set(c.x, c.top + 3, c.z, "smooth_stone");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184533.nbt");
