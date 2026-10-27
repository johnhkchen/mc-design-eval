import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Fifty Albert, Auckland CBD: a concrete-frame office block in a glass curtain wall, of the late-20th / early-21st
// century city. From the lidar: a 21-storey slab body (roof 84), a setback ring at 104, and a central tower stepping
// to 132 (the record's 131). Shell = one facade cell plus one air gap behind the glass; the core behind is solid
// concrete, so every floor and roof is carried by what is below it. Storey lines sit on absolute multiples of 4, so
// the bands run level across the cells that sit on the slope.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 77, D = 70, H = 143;

const cells = JSON.parse(readFileSync(`${DIR}/way_772039405.cells.json`, "utf8"));
const key = (x, z) => x * 1000 + z;
const raw = new Map(cells.map(([x, z, g, R]) => [key(x, z), { x, z, g, R }]));
const inside = (x, z) => raw.has(key(x, z));

// the lidar roof, median-filtered over a 5 x 5 window of footprint cells, so the noise drops out
function roofSmooth(x, z) {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) v.push(c.R);
  }
  v.sort((a, b) => a - b); return v[v.length >> 1];
}

// clean flat tiers: low wings on storey lines, the slab body at one roof, the setback ring, then the tower
function tierOf(Rs, g) {
  let T;
  if (Rs < 72) T = 8 * Math.round(Rs / 8);                // the ragged lidar edge of the wings: two-storey steps, not one
  else if (Rs < 96) T = 84;
  else if (Rs < 116) T = 104;
  else T = Math.min(132, 4 * Math.round(Rs / 4));
  return Math.max(T, 4 * Math.ceil((g + 4) / 4));          // at least one storey above its own ground
}

// the tower's crown keeps its peak: a median would shave the thin core's top from 132 to 124
function roofPeak(x, z) {
  let m = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) m = Math.max(m, raw.get(key(x + dx, z + dz))?.R ?? 0);
  return m;
}
const cellsArr = cells.map(([x, z, g]) => {
  const Rs = roofSmooth(x, z);
  return { x, z, g, top: tierOf(Rs >= 116 ? roofPeak(x, z) : Rs, g) };
});
const topOf = new Map(cellsArr.map((c) => [key(c.x, c.z), c.top]));
const topAt = (x, z) => topOf.get(key(x, z)) ?? -1;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const airAt = (x, z, y) => topAt(x, z) <= y;               // outside the footprint, or above that cell's roof
const outDirs = (x, z, y) => DIRS.filter(([dx, dz]) => airAt(x + dx, z + dz, y));
const ext = (x, z, y) => topAt(x, z) > y && outDirs(x, z, y).length > 0;   // a facade cell at height y

const FOUND = "stone_bricks", BASE = "polished_andesite", FRAME = "white_concrete";
const SPAN = "light_gray_concrete", GLASS = "light_blue_stained_glass", LIGHT = "glowstone";

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

function facade(c, y, ex) {
  if (y === c.top - 1) return put(c.x, y, c.z, FRAME);     // parapet / cornice
  if (y === c.g) return put(c.x, y, c.z, BASE);            // plinth course on the ground
  const [dx, dz] = ex[0];
  const pier = ex.length > 1 || (dx !== 0 ? c.z : c.x) % 3 === 0;   // corners and every third cell: a white mullion
  let block;
  if (pier) block = FRAME;
  else if (y < c.g + 4) block = y - c.g === 3 ? FRAME : GLASS;        // shopfront, glazed, over a lintel band
  else if (y % 4 === 0) block = FRAME;                               // floor edge
  else if (y % 4 === 1) block = SPAN;                                // spandrel under the window
  else block = GLASS;
  put(c.x, y, c.z, block);
  // warm light in the air gap behind some glass (not on a floor edge, not in the roof)
  if (block === GLASS) {
    const ix = c.x - dx, iz = c.z - dz;
    if (inside(ix, iz) && topAt(ix, iz) > y && y % 4 !== 0 && y !== topAt(ix, iz) - 1 &&
        ((c.x * 31 + c.z * 17 + y * 7) % 11 === 0)) put(ix, y, iz, LIGHT);
  }
}

for (const c of cellsArr) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, FOUND);   // foundation up to the cell's ground
  for (let y = c.g; y < c.top; y++) {
    const ex = outDirs(c.x, c.z, y);
    if (ex.length) facade(c, y, ex);
    else if (y === c.top - 1 || y === c.g) put(c.x, y, c.z, SPAN);   // roof deck and ground floor plate
    else if (!DIRS.some(([dx, dz]) => ext(c.x + dx, c.z + dz, y))) put(c.x, y, c.z, SPAN);   // solid core
    // else the air gap behind the glass
  }
}

// main entrance on the south face: a pair of iron doors at the lowest street-level cell, a lintel canopy over them
const southFace = cellsArr.filter((c) => {
  const ex = outDirs(c.x, c.z, c.g + 1);
  return ex.length === 1 && ex[0][0] === 0 && ex[0][1] === 1 && c.top > c.g + 4;
});
const minG = Math.min(...southFace.map((c) => c.g));
const low = southFace.filter((c) => c.g === minG);
const midX = low.reduce((s, c) => s + c.x, 0) / low.length;
const door = low.reduce((a, c) => (Math.abs(c.x - midX) < Math.abs(a.x - midX) ? c : a));
const { x: dX, z: dZ, g: dG } = door;
put(dX, dG + 1, dZ, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dX, dG + 2, dZ, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const ox of [-1, 0, 1]) put(dX + ox, dG + 3, dZ, BASE);

// roof plant: 3 x 2 rooms on a roof that is one tier across, a mast on the tower
let plant = 0;
for (const c of cellsArr) {
  if (c.x % 13 !== 6 || c.z % 11 !== 5) continue;
  let ok = true;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) {
    if (!inside(c.x + dx, c.z + dz) || topAt(c.x + dx, c.z + dz) !== c.top) ok = false;
  }
  if (!ok) continue;
  plant++;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) {
    for (let y = c.top; y < c.top + 3; y++) put(c.x + dx, y, c.z + dz, y === c.top + 2 ? FRAME : SPAN);
  }
}
const topMax = Math.max(...cellsArr.map((c) => c.top));
const crown = cellsArr.filter((c) => c.top === topMax);
const cx = crown.reduce((s, c) => s + c.x, 0) / crown.length, cz = crown.reduce((s, c) => s + c.z, 0) / crown.length;
const mastAt = crown.reduce((a, c) => (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(a.x - cx, a.z - cz) ? c : a));
for (let y = mastAt.top; y < mastAt.top + 6; y++) put(mastAt.x, y, mastAt.z, "iron_bars");

const saved = v.save(`${DIR}/way_772039405.nbt`);
const tiers = {};
for (const c of cellsArr) tiers[c.top] = (tiers[c.top] || 0) + 1;
console.log(JSON.stringify({ ...saved, cells: cellsArr.length, plantRooms: plant, mastTop: mastAt.top + 6, door: [dX, dZ], tiers }));
