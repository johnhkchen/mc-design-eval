// FR245184466: a residential block of 1870, 7 storeys, cream Paris limestone with a zinc-grey roof. The lidar roof heights snap to clean tiers (13/17/21/25 for the lower wings, 29 for the main
// body); every column stands on a plinth from y 0 up to its ground, floor slabs sit on storey lines 1, 5, ..., 25, and the
// street-facing walls are a one-cell ring with an open interior, so each window has air behind it. Where a lower tier meets
// a taller one, the taller column's exposed face is walled too (a setback, not an open well).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184466.cells.json", "utf8"));

const BODY = "calcite";            // Paris limestone, cream
const BAND = "smooth_sandstone";   // string courses, sills and cornice
const PLINTH = "stone_bricks";     // base course and foundation
const FLOOR = "smooth_stone";      // storey slabs
const ROOF = "deepslate_tiles";    // zinc-grey roof cap
const GLASS = "glass";
const IRON = "iron_bars";          // a second-floor balcony railing
const BRICK = "bricks";            // chimney stacks
const LIGHT = "glowstone";         // warm lamps behind some windows

const W = 27, D = 14, H = 31;

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, top: TIER(r) - 1 });
const cell = (x, z) => byXZ.get(`${x},${z}`);
const inFp = (x, z) => byXZ.has(`${x},${z}`);

// lidar roof -> clean tiers (the height in blocks above y 0): 13, 17, 21, 25 for the wings, 29 for the main body
function TIER(r) {
  if (r >= 27) return 29;
  if (r >= 23) return 25;
  if (r >= 19) return 21;
  if (r >= 15) return 17;
  return 13;
}

// the four sides and which of them face open air at layer y: outside the footprint, or above a lower neighbour's roof
const SIDES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
function exposed(x, z, y) {
  const out = [];
  for (const [s, dx, dz] of SIDES) {
    const n = cell(x + dx, z + dz);
    if (!n || y > n.top) out.push(s);
  }
  return out;
}

const isFloorLine = (y) => y >= 1 && (y - 1) % 4 === 0;   // storey lines 1, 5, ..., 25

const g = new Voxels([W, H, D]);

// front door on the north face of the ground floor, with its lintel
const DOOR = { x: 4, z: 1 };
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z] of cells) {
  const { top } = cell(x, z);
  for (let y = 0; y <= top; y++) {
    // (y 0 is the plinth, y 1 the ground-floor course, the rest is wall or floor by its line)
    const sides = exposed(x, z, y);

    // interior: a foundation, a floor slab per storey, a roof cap; the air between is the room
    if (sides.length === 0) {
      if (y === 0) g.set(x, y, z, PLINTH);
      else if (y === top) g.set(x, y, z, ROOF);
      else if (isFloorLine(y)) g.set(x, y, z, FLOOR);
      continue;
    }

    // exposed wall: base course, storey strings, cornice, and windows in the bays between them
    if (y === 0) { g.set(x, y, z, PLINTH); continue; }
    if (y === 1 || y === top || isFloorLine(y)) { g.set(x, y, z, BAND); continue; }

    // the face this wall looks out of: the street sides first, then a setback over a lower neighbour
    const face = sides.find((s) => s === "N" || s === "S" || s === "W" || s === "E");
    const alongX = face === "N" || face === "S";
    const along = alongX ? x : z;
    const pier = along % 3 === 0;                        // stone piers every third block
    const k = Math.floor((y - 2) / 4), row = (y - 2) % 4; // storey index and the row inside it: 0 sill, 1-2 glass
    const onDoor = face === "N" && x === DOOR.x && z === DOOR.z;

    if (onDoor && y <= 3) { g.set(x, y, z, "oak_door", doorState(y === 2 ? "lower" : "upper")); continue; }
    if (onDoor && y === 4) { g.set(x, y, z, BAND); continue; }

    if (pier) { g.set(x, y, z, BODY); continue; }
    if (row === 0) { g.set(x, y, z, k === 1 ? IRON : BAND); continue; }   // the piano nobile's balcony rail
    g.set(x, y, z, GLASS);

    // some windows hold a warm lamp in the room behind (the air cell inward from the glass)
    if (row === 1 && (along + k) % 5 === 0) {
      const [dx, dz] = face === "N" ? [0, 1] : face === "S" ? [0, -1] : face === "W" ? [1, 0] : [-1, 0];
      const nx = x + dx, nz = z + dz;
      if (inFp(nx, nz) && exposed(nx, nz, y).length === 0) g.set(nx, y, nz, LIGHT);
    }
  }
}

// brick chimney stacks on a few cells of the main roof, standing on its cap
for (const [x, z] of cells) {
  if (cell(x, z).top !== 28 || x % 7 !== 3 || z % 4 !== 1) continue;
  if (exposed(x, z, 28).length) continue;
  g.set(x, 29, z, BRICK); g.set(x, 30, z, BRICK);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184466.nbt");
