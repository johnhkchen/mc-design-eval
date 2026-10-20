import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295631";
const W = 15, H = 23, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const inside = (x, z) => ground.has(key(x, z));

// outward directions for a cell (sides with no footprint neighbour)
const OUT = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
function outwardDirs(x, z) {
  const res = [];
  for (const [name, [dx, dz]] of Object.entries(OUT)) {
    if (!inside(x + dx, z + dz)) res.push(name);
  }
  return res;
}

// ---- helpers ----
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Facade palette
const FOUND = "stone";
const BASE = "stone_bricks";
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const BAND = "quartz_block";
const GLASS = "light_blue_stained_glass";
const SLAB_FLOOR = "gray_concrete";
const ROOF = "light_gray_concrete";
const PLANT = "iron_block";

// ---- 1. foundations and per-cell storeys ----
// Storey plan relative to each cell's ground b:
//   b       base course (edge) / floor slab (interior)
//   b+1..+3 ground-floor shopfront glazing
//   b+4     ground-floor fascia band
//   b+5     first-floor slab band / floor slab
//   b+6..+8 upper windows
//   b+9     upper lintel band
//   b+10    cornice / roof slab (interior)
// Roof top sits at b+10, so the parapet is 11 blocks tall above lowest ground.

for (const [x, z, gr0] of cells) {
  const b = Math.round(gr0);

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, FOUND);

  const outs = outwardDirs(x, z);
  const edge = outs.length > 0;
  const corner = outs.length >= 2;

  if (!edge) {
    // interior: floor slabs and roof only, air between
    put(x, b, z, SLAB_FLOOR);
    put(x, b + 5, z, SLAB_FLOOR);
    put(x, b + 10, z, SLAB_FLOOR);
    continue;
  }

  // index along the facade for pier rhythm
  const primary = outs.includes("north") || outs.includes("south") ? "ns" : "ew";
  const i = primary === "ns" ? x : z;
  const pier = corner || i % 3 === 0;

  // base course
  put(x, b, z, BASE);

  // ground floor shopfront
  for (let y = b + 1; y <= b + 3; y++) {
    put(x, y, z, pier ? PIER : GLASS);
  }
  // ground-floor fascia
  put(x, b + 4, z, BAND);

  // first floor slab band
  put(x, b + 5, z, BAND);

  // upper windows
  for (let y = b + 6; y <= b + 8; y++) {
    put(x, y, z, pier ? WALL : GLASS);
  }
  // upper lintel and cornice
  put(x, b + 9, z, WALL);
  put(x, b + 10, z, BAND);

  // corner lanterns on the parapet for dusk warmth
  if (corner && (x + z) % 2 === 0) {
    put(x, b + 11, z, "lantern", { hanging: "false" });
  }
}

// ---- 2. entrance on the south street face ----
const southCells = cells
  .map(([x, z, gr]) => [x, z, Math.round(gr)])
  .filter(([x, z]) => !inside(x, z + 1));

if (southCells.length) {
  const meanX = southCells.reduce((s, c) => s + c[0], 0) / southCells.length;
  southCells.sort((a, c) => Math.abs(a[0] - meanX) - Math.abs(c[0] - meanX));
  const [dx, dz, db] = southCells[0];

  // door: lower and upper halves
  put(dx, db + 1, dz, "iron_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, db + 2, dz, "iron_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // transom glazing above the door
  put(dx, db + 3, dz, GLASS);
}

// ---- 3. warm lights behind some upper and ground windows ----
for (const [x, z, gr0] of cells) {
  const b = Math.round(gr0);
  const outs = outwardDirs(x, z);
  if (outs.length === 0 || outs.length >= 2) continue;

  // inward neighbour is opposite of the single outward direction
  const o = outs[0];
  const [ox, oz] = OUT[o];
  const ix = x - ox, iz = z - oz;
  if (!inside(ix, iz)) continue;
  if (outwardDirs(ix, iz).length > 0) continue; // inward cell is also edge

  for (const yOff of [2, 7]) {
    const y = b + yOff;
    if (hash(x, y, z) % 4 === 0) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// ---- 4. roof: plant boxes and a slim mechanical block ----
for (const [x, z, gr0] of cells) {
  const b = Math.round(gr0);
  if (outwardDirs(x, z).length > 0) continue;
  if ((x * 5 + z * 7) % 13 === 0) {
    put(x, b + 11, z, PLANT);
  }
}

// ---- 5. parapet roof cover on edge where no lantern ----
for (const [x, z, gr0] of cells) {
  const b = Math.round(gr0);
  if (outwardDirs(x, z).length === 0) continue;
  // make sure top row of edge is cornice band (already set), nothing else needed
  void b;
}

g.save(`${DIR}/${ID}.nbt`);
