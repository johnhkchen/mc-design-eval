// The Lister Building, Auckland CBD (way 24010338): a 1960s-70s concrete office block, read from the lidar.
// Massing: the lidar roof (36-48 blocks above y 0) is median-smoothed over the footprint and quantised to whole
// storeys (4 blocks each) from a datum at y 2: 8 storeys on the east wing, 9-10 mid, 11 at the north-west tower.
// Every column stands on a solid plinth (y 0-1) and a base course at y 2, so nothing floats on the slope.
// Walls are the footprint's outer cells and the faces that drop to a lower tier; interiors are air with a floor slab
// per storey (the slab is the only interior block, plus a few glowstone behind the glass).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24010338.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24010338.nbt";

const W = 27, H = 62, D = 24, DATUM = 2, STOREY = 4, MIN_N = 8, MAX_N = 11;
const PLINTH = "polished_andesite", FACADE = "white_concrete", SLAB = "light_gray_concrete", FRAME = "iron_block";
const GLASS = "light_blue_stained_glass_pane", CORNICE = "polished_andesite_slab";
const DIRS = { x: [[1, 0], [-1, 0]], z: [[0, 1], [0, -1]] };

// footprint by cell
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); roof.set(`${x},${z}`, r); }
const inFp = (x, z) => roof.has(`${x},${z}`);

// smoothed storeys: median of the 5x5 footprint neighbourhood, quantised to whole storeys
const rawN = (r) => Math.min(MAX_N, Math.max(MIN_N, MIN_N + Math.floor((r - 36) / STOREY)));
const nAt = new Map();
for (const [key, r] of roof) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFp(x + dx, z + dz)) vals.push(rawN(roof.get(`${x + dx},${z + dz}`)));
  vals.sort((a, b) => a - b);
  nAt.set(key, vals[Math.floor(vals.length / 2)]);
}
const N = (x, z) => nAt.get(`${x},${z}`);

// wall faces: the outer side (no footprint) first, then a side that drops to a lower tier
function faceOf(x, z) {
  const n = N(x, z);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!inFp(x + dx, z + dz)) return [dx, dz];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inFp(x + dx, z + dz) && N(x + dx, z + dz) < n) return [dx, dz];
  return null;
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) v.set(x, y, z, block, state); };
const pane = (x, y, z, face) => {
  // a pane connects along the wall it sits in, so the glass reads as a continuous band
  const conn = face[0] !== 0 ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
  put(x, y, z, GLASS, conn);
};

// the door: the east face, near the middle of the footprint's east edge
let door = null;
for (let x = W - 1; x >= 0 && !door; x--) for (const z of [8, 7]) if (inFp(x, z) && !inFp(x + 1, z)) { door = { x, z, face: [1, 0] }; break; }

const doorState = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });

for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const n = N(x, z), top = DATUM + STOREY * n;
  const face = faceOf(x, z), wall = face !== null;
  // bay index along the wall: the z of an east/west face, the x of a north/south face
  const bay = face && face[0] !== 0 ? z : x;
  // plinth: solid from y 0 up to the datum under every cell (the ground step is filled, the downhill side shows its storeys)
  for (let y = 0; y < DATUM; y++) put(x, y, z, PLINTH);
  // storeys
  for (let y = DATUM; y <= top + 1; y++) {
    const rel = y - DATUM, k = Math.floor(rel / STOREY), r = rel % STOREY;
    if (y === top) { put(x, y, z, SLAB); continue; }                       // roof deck
    if (y === top + 1) { if (wall) put(x, y, z, FACADE); continue; }       // parapet on the outer edge
    if (y > top) continue;
    if (r === 0) {                                                          // floor slab / storey line
      put(x, y, z, wall && k === 0 ? PLINTH : SLAB);
      continue;
    }
    if (!wall) continue;                                                   // interior: air behind the glass
    if (r === 3) { put(x, y, z, k === n - 1 ? CORNICE : FACADE); continue; } // spandrel; the top one is the cornice
    // glazed band: r = 1, 2
    const isDoorBay = door && x === door.x && z === door.z;
    if (k === 0 && isDoorBay && r === 1) { put(x, y, z, "oak_door", doorState("lower")); continue; }
    if (k === 0 && isDoorBay && r === 2) { put(x, y, z, "oak_door", doorState("upper")); continue; }
    if (bay % 3 === 0) { put(x, y, z, FRAME); continue; }                   // mullion frame
    pane(x, y, z, face);
  }
  // door canopy: the lintel over the door bay (a slab band, reads as a canopy at street level)
  if (wall && door && x === door.x && z === door.z) put(x, DATUM + 3 - 0, z, CORNICE, { type: "bottom", waterlogged: "false" });
}

// the entrance canopy's neighbours on the lintel row, and the warm lights: glowstone one cell inside a pane
const isWall = (x, z) => inFp(x, z) && faceOf(x, z) !== null;
for (const [key] of roof) {
  const [x, z] = key.split(",").map(Number);
  const n = N(x, z), face = faceOf(x, z);
  if (!face) continue;
  const bay = face[0] !== 0 ? z : x;
  for (let k = 1; k < n; k++) {
    if ((bay + k * 2 + x) % 5 !== 2) continue;                         // a few of the upper windows
    const y = DATUM + STOREY * k + 1, ix = x - face[0], iz = z - face[1];
    if (!inFp(ix, iz) || isWall(ix, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// roof plant on the terraces and roof decks: a few one-block air-handling units on the deck
for (const [key] of roof) {
  const [x, z] = key.split(",").map(Number);
  const n = N(x, z), top = DATUM + STOREY * n;
  if (isWall(x, z) || faceOf(x, z) !== null) continue;
  if ((x * 5 + z * 3) % 13 === 0 && n >= 9) put(x, top + 1, z, FRAME);
}

v.save(OUT);
const tiers = {}; for (const n of nAt.values()) tiers[n] = (tiers[n] || 0) + 1;
console.log(`way_24010338: ${v.count()} blocks, tiers (storeys: cells) ${JSON.stringify(tiers)}, door ${JSON.stringify(door)}`);
