import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC53962 - 1 Dupont Circle NW, Washington DC 20036
// Commercial-Office-Large: a 1920s Classical Revival office block in pale stone, a polished granite
// base course, a shopfront-style ground storey, 3-block storeys (spandrel, two glazed rows, cornice cap),
// a 12-block wing ring around a 15-block core. The lidar roof is clamped to two flat tiers (12 and 15);
// the lone 2-block cell is noise and reads as wing. The entrance sits on the north (street) face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC53962";
const X = 22, Y = 18, Z = 27;
const STOREY = 3;
const WING = 12, CORE = 15;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north, south, west, east

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const roofAt = new Map();
for (const [x, z, , rf] of raw) roofAt.set(`${x},${z}`, rf >= 13 ? CORE : WING);

const inside = (x, z) => roofAt.has(`${x},${z}`);
const roof = (x, z) => roofAt.get(`${x},${z}`) ?? 0;

// A cell's face at height y is exposed when the neighbour is outside the footprint or stands lower than y.
const exposedFaces = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || roof(x + dx, z + dz) <= y);

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const glazing = (x, y, z) => put(x, y, z, "light_blue_stained_glass_pane", { waterlogged: "false" });

function wallBlock(x, y, z, r, faces) {
  const s = Math.floor(y / STOREY), k = y % STOREY, top = y === r - 1;

  if (s === 0 && k === 0) return put(x, y, z, "polished_andesite");           // base course

  // street entrance: iron-framed door in granite, a lintel over it, a lantern inside
  if (z === 0 && x >= 9 && x <= 11) {
    if (y === 3) return put(x, y, z, "polished_andesite");
    if (y <= 2 && x === 10) return put(x, y, z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    if (y <= 2) return put(x, y, z, "polished_andesite");
  }

  if (top) return put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });   // cornice cap
  if (k === 0) return put(x, y, z, "smooth_quartz");                                             // storey-line spandrel

  // window zone: piers every third bay along the face; corners are piers
  const along = faces[0][0] !== 0 ? z : x;
  const pier = faces.length > 1 || along % 3 === 0;
  if (pier) return put(x, y, z, s === 0 ? "polished_andesite" : "smooth_quartz");

  glazing(x, y, z);

  // warm light behind some panes: a glowstone on the first interior cell, inside the glass
  if (k === 1 && (x * 5 + z * 3 + s) % 4 === 0) {
    const [dx, dz] = faces[0];
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && roof(ix, iz) > y && exposedFaces(ix, iz, y).length === 0) put(ix, y, iz, "glowstone");
  }
}

for (const [key, r] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < r; y++) {
    const faces = exposedFaces(x, z, y);
    if (faces.length) { wallBlock(x, y, z, r, faces); continue; }
    // interior: solid floor slabs and the roof deck, air between (no interiors)
    if (y === 0 || y % STOREY === 0 || y === r - 1) put(x, y, z, "smooth_stone");
  }
}

// Roof equipment: 1-block rooftop units on the wing roof grid, and a mechanical box on the core roof
for (const [key, r] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  const ringed = DIRS.every(([dx, dz]) => inside(x + dx, z + dz));
  if (r === WING && ringed && DIRS.every(([dx, dz]) => roof(x + dx, z + dz) === WING) && x % 4 === 1 && z % 4 === 1)
    put(x, WING, z, "light_gray_concrete");
  if (r === CORE && ringed && DIRS.every(([dx, dz]) => roof(x + dx, z + dz) === CORE) && x >= 7 && x <= 11 && z >= 8 && z <= 12)
    put(x, CORE, z, "light_gray_concrete");
}

const out = g.save(`${DIR}/${ID}.nbt`);
console.log(`${ID}.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
