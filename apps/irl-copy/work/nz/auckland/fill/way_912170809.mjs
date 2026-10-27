// Way 912170809: a three-storey brick commercial block of the 1900s (Eden Terrace / Mt Eden main-street type).
// Basalt plinth and base course (Auckland's volcanic stone), red brick walls, cream plaster string courses and
// cornice, a timber shopfront on the ground floor with a dark-oak door under a fascia, and a dark roof. The lidar
// tiers are a low wing (11), a body (12) and a stepped tower on the north-east corner (13-14, smoothed to 14).
// Each storey stands on a solid floor slab; the walls are one block thick with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170809.cells.json", "utf8"));
const SIZE = [10, 27, 8];

// footprint: (x, z) -> { ground, roof }; the lidar's 13 and 14 are one tower tier, so the tower reads as clean flat tiers
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof: roof >= 13 ? 14 : roof });
const cellAt = (x, z) => foot.get(`${x},${z}`);
const roofs = [...new Set([...foot.values()].map((c) => c.roof))];
const topRoof = Math.max(...roofs);

// floor slabs: the storeys at 4 and 8, plus the cap of each lower tier so a tier that steps up stands on something
const FLOORS = new Set([0, 4, 8]);
for (const r of roofs) if (r !== topRoof) FLOORS.add(r - 1);

// the four faces: name, step in x, step in z
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// a face is exposed where the neighbour is off the footprint, or its roof is below this height
function exposedFace(x, z, y) {
  return FACES.find((f) => {
    const n = cellAt(x + f.dx, z + f.dz);
    return !n || n.roof <= y;
  }) ?? null;
}

const STONE = { block: "stone_bricks" };
const BRICK = { block: "bricks" };
const QUARTZ = { block: "smooth_quartz" };
const GLASS = { block: "glass" };
const MULLION = { block: "dark_oak_log", state: { axis: "y" } };
const PLANK = { block: "dark_oak_planks" };
const ROOF = { block: "deepslate_tiles" };
const FLOOR = { block: "smooth_stone" };
const IRON = { block: "iron_block" };
const LAMP = { block: "glowstone" };
const doorPart = (half) => ({ block: "dark_oak_door", state: { facing: "north", half, hinge: "left", open: "false", powered: "false" } });

// the wall at (x, y, z) on exposed face f: a storey pattern with windows on the odd columns of the face
function facade(x, y, z, roof, f) {
  const col = f.dz !== 0 ? x : z;                    // the coordinate running along this face
  const odd = col % 2 === 1;
  const onDoor = f.name === "north" && x === 3 && z === 0;
  if (onDoor && (y === 1 || y === 2)) return doorPart(y === 1 ? "lower" : "upper");
  if (y === 1) return STONE;                         // base course
  if (y === 2 || y === 3) {
    if (onDoor && y === 3) return PLANK;             // fascia over the door
    if (f.name === "north" && z === 0 && x >= 2 && x <= 4 && y === 3) return PLANK;
    return odd ? GLASS : MULLION;                    // shopfront: glass between timber mullions
  }
  if (y === 4 || y === 8) return QUARTZ;             // string courses
  if (y === 5 || y === 6 || y === 9 || y === 10) return odd ? GLASS : BRICK;
  if (y === 7) return odd ? QUARTZ : BRICK;          // lintels over the windows
  if (y === 11 || y === 12) return odd ? GLASS : BRICK;
  return BRICK;
}

// the block at (x, y, z), or null for air
function blockAt(x, y, z) {
  const c = cellAt(x, z);
  if (!c || y >= c.roof) return null;
  if (y < c.ground) return STONE;                    // foundation up to this cell's ground
  if (y === 0) return STONE;                         // the ground floor slab
  const face = exposedFace(x, z, y);
  if (y === c.roof - 1) return face ? QUARTZ : ROOF; // cornice on the edge, roof covering inside
  if (face) return facade(x, y, z, c.roof, face);
  if (FLOORS.has(y)) return FLOOR;
  return null;
}

const g = new Voxels(SIZE);
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < SIZE[1]; y++) {
    const b = blockAt(x, y, z);
    if (b) g.set(x, y, z, b.block, b.state);
  }
}

// warm light behind some of the glass: the air gap inside a window, one block in from the wall
for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
  const c = cellAt(x, z);
  for (const y of [2, 5, 6, 9, 10]) {
    if (y >= c.roof - 1) continue;
    const face = exposedFace(x, z, y);
    if (!face) continue;
    const col = face.dz !== 0 ? x : z;
    if (col % 2 !== 1 || ((x * 3 + z * 5 + y) % 4) !== 0) continue;
    if (y === 2 && face.name === "north" && x === 3) continue;   // keep the door bay dark
    const ix = x - face.dx, iz = z - face.dz;
    if (!cellAt(ix, iz) || blockAt(ix, y, iz)) continue;
    g.set(ix, y, iz, LAMP.block);
  }
}

// the roof: a low plant plinth on the tower, and a vent on the low wing
for (const x of [6, 7]) for (const z of [6, 7]) g.set(x, 14, z, QUARTZ.block);
g.set(3, 11, 3, IRON.block);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170809.nbt");
console.log(`way_912170809: ${g.count()} blocks, palette ${g.palette.length}`);
