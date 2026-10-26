// DC58394: Hotel-Small, 933 L St NW. A 1920s-30s brick commercial hotel: red brick walls on a stone plinth,
// cream sandstone string courses every three blocks, a glazed ground storey, a stepped roof (a 15-block core and a
// 16-block crown set into the south wing, a 12-block rear wing), and a flat roof with a cornice.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58394.cells.json`, "utf8"));

const X = 8, Y = 27, Z = 14;
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Lidar roof, smoothed into flat tiers: the body at 14, a rear wing at 12, a tower core at 15 and a crown at 16
// set into the south end of the body. Heights are the top surface (blocks 0 .. H-1 are solid).
function tierOf(x, z) {
  if (!inFoot(x, z)) return 0;
  if (z >= 12) return 12;
  if (x >= 2 && x <= 4 && z >= 4 && z <= 8) return 15;
  if (x >= 2 && x <= 3 && z >= 9 && z <= 10) return 16;
  return 14;
}

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E
const SLABS = new Set([1, 4, 7, 10, 13, 14]);      // floor slabs across the whole footprint (no air under a storey)
const BANDS = new Set([1, 4, 7, 10, 13]);          // string courses on the exterior
const WIN = new Set([2, 3, 5, 6, 8, 9, 11, 12]);   // storey window rows (ground storey is 2-3)
const DOOR = new Set(["2,0,2", "2,0,3"]);          // the entrance on the north front, x,z,y

// The faces of (x, z) that are exposed at height y: a neighbour outside the footprint, or lower than y.
function exposed(x, z, y) {
  return DIRS.filter(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return !inFoot(nx, nz) || y >= tierOf(nx, nz);
  });
}

// Piers sit on the corners and every third column along a face (the bays are two windows wide).
function isPier(x, z, faces) {
  if (faces.length >= 2 && faces.some(([dx]) => dx) && faces.some(([, dz]) => dz)) return true;
  return faces.some(([dx, dz]) => ((dx ? z : x) % 3) === 0);
}

function solid(x, y, z) {
  const H = tierOf(x, z);
  if (!inFoot(x, z) || y >= H) return false;
  if (y === 0 || SLABS.has(y) || y === H - 1) return true;
  return exposed(x, z, y).length > 0;
}

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const H = tierOf(x, z);
  for (let y = 0; y < H; y++) {
    if (!solid(x, y, z)) continue;
    const faces = exposed(x, z, y), ext = faces.length > 0, top = y === H - 1;
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                                  // plinth
    if (top) { put(x, y, z, ext ? "smooth_sandstone" : "smooth_stone"); continue; }             // cornice / roof
    if (!ext) { put(x, y, z, "smooth_stone"); continue; }                                       // floor slab, interior
    if (BANDS.has(y)) { put(x, y, z, "smooth_sandstone"); continue; }                           // string course
    if (y === 14) { put(x, y, z, "bricks"); continue; }                                         // crown wall
    // upper panes are tinted blue so they read as glass, not as holes through to the sky behind the air gap
    if (WIN.has(y) && !isPier(x, z, faces)) { put(x, y, z, y <= 3 ? "glass" : "light_blue_stained_glass_pane"); continue; }
    put(x, y, z, "bricks");                                                                     // pier / spandrel
  }
}

// Entrance: a dark oak door in the north front, flanked by the storey glass.
for (const k of DOOR) {
  const [x, z, y] = k.split(",").map(Number);
  put(x, y, z, "dark_oak_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light: lanterns on the ground-floor slab behind some shopfront glass, glowstone behind the upper windows.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const H = tierOf(x, z);
  for (const y of [2, 5, 8]) {
    if (y >= H) continue;
    const faces = exposed(x, z, y);
    if (!faces.length || isPier(x, z, faces) || DOOR.has(`${x},${z},${y}`)) continue;
    if (!((x + z + y) % 3 === 0)) continue;
    const [dx, dz] = faces[0];
    const ix = x - dx, iz = z - dz;                       // the cell behind the glass
    if (!inFoot(ix, iz) || y >= tierOf(ix, iz) || solid(ix, y, iz)) continue;
    if (y === 2) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else put(ix, y, iz, "glowstone");
  }
}

// Roof plant: two condenser boxes on the roof of the body, standing on the roof slab.
put(2, 14, 11, "light_gray_concrete");
put(3, 14, 11, "light_gray_concrete");
put(2, 15, 11, "iron_bars");
put(3, 15, 11, "iron_bars");

g.save(`${DIR}/DC58394.nbt`);
console.log(`DC58394.nbt: ${g.count()} blocks, ${g.palette.length - 1} palette entries`);
