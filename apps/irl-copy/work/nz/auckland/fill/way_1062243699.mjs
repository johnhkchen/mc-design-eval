// A 1980s-style Auckland CBD office tower, 17 x 25 blocks, on the lidar roof record.
// Pale concrete piers and storey bands, tinted blue glass between them, a recessed lobby on the north face,
// and a lift overrun at the top. The massing follows the lidar roof heights, quantised to 4-block storeys
// (the storey lines sit at y = 3 + 4k, y 3 being the ground floor), with the 83-block spikes (five isolated
// edge cells) read as lidar noise and clamped, and the outer ring of the tallest tier stepped back one storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1062243699.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..16, z 0..24

const W = 17, D = 25, H = 96;
const FLOOR0 = 3;                                        // the ground floor's base row: podium below, storeys from here
const LEVELS = [23, 27, 31, 35, 39, 43, 47];             // storey tops on the 4-block grid (3 + 4k)
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];         // north, east, south, west (z grows south)
const DIR_NAME = { "0,-1": "north", "1,0": "east", "0,1": "south", "-1,0": "west" };
const DOOR = { x: 8, z: 0 };                             // the lobby on the north face, under the lowest ground

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => F.has(key(x, z));
const at = (x, z) => F.has(key(x, z)) ? F.get(key(x, z)) : null;

// quantise a lidar roof to a storey line; spikes above the tallest tier are noise, ties go up
function quantise(r) {
  if (r > LEVELS[LEVELS.length - 1]) return LEVELS[LEVELS.length - 1];
  let best = LEVELS[0];
  for (const L of LEVELS) if (Math.abs(r - L) <= Math.abs(r - best)) best = L;
  return best;
}
const T = new Map();                                     // top row (exclusive) per cell
for (const [k, c] of F) T.set(k, quantise(c.roof));
// a lone low cell wedged among taller neighbours is lidar noise, not a wing: it takes the tallest neighbour's tier
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const nb = DIRS.filter(([dx, dz]) => inF(x + dx, z + dz)).map(([dx, dz]) => T.get(key(x + dx, z + dz)));
  if (T.get(k) < 39 && nb.length && nb.every((t) => t >= 43)) T.set(k, Math.max(...nb));
}
// setback: the outer ring of the tallest tier steps back one storey, so the top reads as a stepped tower
const top = LEVELS[LEVELS.length - 1];
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const edge = DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));
  if (edge && T.get(k) === top) T.set(k, top - 4);
}
const topOf = (x, z) => (inF(x, z) ? T.get(key(x, z)) : -1);

// the faces of a cell at height y that are exterior: the neighbour is outside the footprint or has no storey there
function exposed(x, z, y) {
  return DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inF(nx, nz) || topOf(nx, nz) <= y; });
}
function exposedRoof(x, z, t) {
  return DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inF(nx, nz) || topOf(nx, nz) < t; });
}

const PODIUM = { block: "polished_andesite" };
const PIER = { block: "white_concrete" };
const BAND = { block: "light_gray_concrete" };
const GLASS = { block: "light_blue_stained_glass" };
const LIT = { block: "glowstone" };

// what sits at x, y, z for a footprint cell (null is air): podium, storeys, bands, glass, parapet
function blockAt(x, z, y) {
  if (!inF(x, z)) return null;
  if (y < FLOOR0) return PODIUM;                                             // foundation and base course, every cell
  const t = topOf(x, z);
  if (y > t) return null;
  if (y === t) return exposedRoof(x, z, t).length ? PIER : null;             // parapet on the outer edge
  const r = (y - FLOOR0) % 4;
  const faces = exposed(x, z, y);
  if (r === 0 || r === 3) {                                                  // floor slab and storey band, solid across the footprint
    return faces.length && y === FLOOR0 ? PODIUM : BAND;
  }
  if (x === DOOR.x && z === DOOR.z && (y === FLOOR0 || y === FLOOR0 + 1)) {  // the lobby door, a pair of halves
    return { block: "iron_door", state: { facing: "north", half: y === FLOOR0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (x === DOOR.x && z === DOOR.z && y === FLOOR0 + 2) return BAND;         // lintel over the door
  if (!faces.length) return lightBehind(x, z, y, r);                         // interior: air, a lamp behind a pane
  if (faces.length >= 2) return PIER;                                        // corners
  const [dx, dz] = faces[0];
  const along = dz !== 0 ? x : z;                                            // a pier every third block, panes between
  return along % 3 === 0 ? PIER : GLASS;
}
// a warm lamp on the floor of the room behind some lower-row panes
function lightBehind(x, z, y, r) {
  if (r !== 1 || (x * 31 + z * 17 + y * 7) % 7 !== 0) return null;
  for (const [dx, dz] of DIRS) if (blockAt(x + dx, z + dz, y) === GLASS) return LIT;
  return null;
}

const g = new Voxels([W, H, D]);
// the lift overrun: the largest 3x3 square of cells on the tallest tier, four blocks above the roof
let plant = null;
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const sq = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) sq.push(topOf(x + dx, z + dz));
  const t = sq[0];
  if (sq.every((v) => v === t) && (!plant || t > plant.t)) plant = { x, z, t };
}
const overrides = new Map();
const put = (x, y, z, v) => overrides.set(`${x},${y},${z}`, v);
put(DOOR.x, FLOOR0 + 1, 1, { block: "lantern", state: { hanging: "false" } }); // a lantern just inside the lobby door
if (plant) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = plant.t; y < plant.t + 4; y++) {
      const edge = Math.abs(dx) === 1 || Math.abs(dz) === 1;
      put(plant.x + dx, y, plant.z + dz, y === plant.t + 3 ? { block: "gray_concrete" } : edge ? BAND : PIER);
    }
  }
}

let maxY = 0;
for (const [, t] of T) maxY = Math.max(maxY, t);
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < maxY + 4; y++) {
    const ov = overrides.get(`${x},${y},${z}`);
    const b = ov !== undefined ? ov : blockAt(x, z, y);
    if (b) g.set(x, y, z, b.block, b.state);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1062243699.nbt");
console.log("tiers", [...new Set(T.values())].sort((a, b) => a - b), "blocks", g.count(), "plant", plant);
