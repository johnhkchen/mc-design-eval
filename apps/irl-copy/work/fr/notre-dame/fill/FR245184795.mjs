// FR245184795: a commercial block of 1800, seven storeys of five blocks (shops at the ground, six floors, an attic), round
// two light courts, on the lidar footprint. Calcite walls on a stone_bricks plinth; each floor line is a smooth-stone
// string course and each window band ends in a calcite lintel, so the storeys fall on y = 5k and 5k+1. Glazing sits in
// calcite piers on the outer two blocks of the wall, with an air gap behind each pane (a glowstone light in some).
// The lidar steps the mass down to 5-, 10- and 20-block tiers: setbacks with a stone parapet on each edge, a slate deck
// over a stone cornice, brick chimneys on the top tier. Two doors, each with a stair step and a canopy band.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184795.cells.json`, "utf8"));

const W = 70, H = 50, D = 85;
const STEP = 5, MAX_STOREYS = 7;

const fp = new Map();                                // "x,z" -> { lidar, n }: n = storeys, 0 for a light court
for (const [x, z, , r] of cells) fp.set(`${x},${z}`, { lidar: r, n: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// Smooth the lidar with a 3x3 median and snap to whole storeys (a light court, roof 0, has none).
for (const [key, c] of fp) {
  if (!c.lidar) continue;
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const m = at(x + dx, z + dz); if (m?.lidar) near.push(m.lidar); }
  near.sort((a, b) => a - b);
  c.n = Math.min(MAX_STOREYS, Math.max(1, Math.round(near[Math.floor(near.length / 2)] / STEP)));
}
// A second pass over the storey counts: a lone tall cell among low ones is lidar noise, not a tower (the stub at the east end).
const storeys = new Map();
for (const [key, c] of fp) {
  if (!c.lidar) continue;
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const m = at(x + dx, z + dz); if (m?.n) near.push(m.n); }
  near.sort((a, b) => a - b);
  storeys.set(key, near[Math.floor(near.length / 2)]);
}
for (const [key, n] of storeys) fp.get(key).n = n;
const nAt = (x, z) => at(x, z)?.n ?? 0;
const inS = (x, z, y) => nAt(x, z) > 0 && STEP * nAt(x, z) >= y;   // the mass at layer y: cells whose roof is at or above it

// Depth of each cell in the mass at layer y: 0 = on its outer face (a neighbour is outside), 1 = one cell in; 2+ is absent.
const depthCache = new Map();
function depthAt(y) {
  if (depthCache.has(y)) return depthCache.get(y);
  const live = [], d = new Map();
  for (const key of fp.keys()) { const [x, z] = key.split(",").map(Number); if (inS(x, z, y)) live.push([x, z]); }
  for (const [x, z] of live) if (NEI.some(([, dx, dz]) => !inS(x + dx, z + dz, y))) d.set(`${x},${z}`, 0);
  for (const [x, z] of live) if (!d.has(`${x},${z}`) && NEI.some(([, dx, dz]) => d.get(`${x + dx},${z + dz}`) === 0)) d.set(`${x},${z}`, 1);
  depthCache.set(y, d); return d;
}
const depth = (x, z, y) => depthAt(y).get(`${x},${z}`);

// The face a cell is on: "ns" (a north or south face, bays run along x), "ew" (bays run along z), or null at a corner.
function faceOf(x, z, y) {
  const ns = !inS(x, z - 1, y) || !inS(x, z + 1, y);
  const ew = !inS(x - 1, z, y) || !inS(x + 1, z, y);
  return ns && ew ? null : ns ? "ns" : ew ? "ew" : null;
}
// Glazed bays: two of every three outer cells (every three of four in the shopfront), a pier between.
const bayWindow = (x, z, y) => {
  if (depth(x, z, y) !== 0) return false;
  const f = faceOf(x, z, y); if (!f) return false;
  const idx = f === "ns" ? x : z, period = y < STEP + 1 ? 4 : 3;
  return idx % period !== 0;
};
const behindWindow = (x, z, y) => depth(x, z, y) === 1 && NEI.some(([, dx, dz]) => bayWindow(x + dx, z + dz, y));

// Entrances: the north door at x 33 (the first footprint row there), the south door at x 20 (the last row).
const DOORS = [];
{
  let zN = 0; while (!nAt(33, zN)) zN++;
  let zS = D - 1; while (!nAt(20, zS)) zS--;
  DOORS.push({ x: 33, z: zN, facing: "north", ox: 0, oz: -1 }, { x: 20, z: zS, facing: "south", ox: 0, oz: 1 });
}
const doorFacing = new Map(), doorBack = new Set(), lanterns = new Set();
for (const d of DOORS) {
  doorFacing.set(`${d.x},${d.z}`, d.facing);
  doorBack.add(`${d.x - d.ox},${d.z - d.oz}`);                     // the cell inside the door: an air passage
  lanterns.add(`${d.x - 2},${d.z}`); lanterns.add(`${d.x + 2},${d.z}`);
}
const nearDoor = (x, z) => DOORS.some((d) => Math.abs(x - d.x) <= 2 && Math.abs(z - d.z) <= 1);

// Roof equipment: a few brick chimneys on the top tier's interior, standing on its slate deck.
const chimney = new Set();
for (const [key, c] of fp) {
  if (c.n !== MAX_STOREYS) continue;
  const [x, z] = key.split(",").map(Number);
  if (depth(x, z, STEP * MAX_STOREYS) === undefined && (x * 13 + z * 7) % 97 === 0) chimney.add(key);
}

const hash = (x, y, z) => (x * 37 + z * 19 + y * 7) % 9;
const stair = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });

// What stands at (x, y, z): [block, state] or null (air). Every block sits on the one below it: the plinth at 0, the
// floor and lintel rows solid across the whole mass, and the walls on the outer face run unbroken from the plinth up.
function classify(x, y, z) {
  const n = nAt(x, z), key = `${x},${z}`;
  if (!n) return y === 0 ? ["stone_bricks"] : null;                    // a light court: paved at ground level
  const top = STEP * n, d = depth(x, z, y);
  const boundary = NEI.some(([, dx, dz]) => nAt(x + dx, z + dz) < n);
  if (chimney.has(key) && y > top && y <= top + 3) return ["bricks"];
  if (y > top + 1) return null;
  if (y === top + 1) return boundary ? ["stone_brick_wall"] : null;   // parapet on the tier's edge
  if (y === 0) return doorFacing.has(key) ? ["stone_brick_stairs", stair(doorFacing.get(key))] : ["stone_bricks"];
  if (y === top) return d === 0 ? ["smooth_stone"] : ["deepslate_tiles"];   // cornice over the slate deck

  const door = doorFacing.get(key);
  if (door && d === 0 && (y === 1 || y === 2)) return ["dark_oak_door", { facing: door, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (doorBack.has(key) && (y === 1 || y === 2)) return null;
  if (door && d === 0 && (y === 3 || y === 4)) return ["glass"];
  if (y === STEP && d === 0 && nearDoor(x, z)) return ["dark_oak_planks"];   // canopy band over the doors
  if (y === 2 && d === 0 && lanterns.has(key)) return ["lantern", { hanging: "false", waterlogged: "false" }];

  if (y % STEP === 1) return ["smooth_stone"];                       // floor line: string course, solid across the mass
  if (y % STEP === 0) return ["calcite"];                            // lintel row, solid across the mass
  if (d === 0) {                                                      // window band on the outer face
    if (!bayWindow(x, z, y)) return ["calcite"];
    if (y < STEP + 1) return ["glass"];                               // shopfront glass
    return ["glass_pane", faceOf(x, z, y) === "ns"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
  }
  if (d === 1) {                                                      // behind the outer face: air behind glass, a light in some
    if (doorBack.has(key)) return null;
    if (behindWindow(x, z, y)) return y > STEP && hash(x, y, z) === 0 ? ["glowstone"] : null;
    return ["calcite"];
  }
  return null;                                                        // interior: no rooms, just air
}

const g = new Voxels([W, H, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!fp.has(`${x},${z}`)) continue;
  for (let y = 0; y < H; y++) { const b = classify(x, y, z); if (b) g.set(x, y, z, b[0], b[1]); }
}
const info = g.save(`${DIR}/FR245184795.nbt`);
console.log(`wrote FR245184795.nbt: ${info.blocks} blocks, ${info.palette} palette entries, ${chimney.size} chimneys, doors ${DOORS.map((d) => `${d.x},${d.z}`).join(" ")}`);
