// NYC1035423: 16 East 48th Street, Commercial & Office, 1940. A Moderne midblock office block: pale limestone walls
// and piers (calcite), smooth-quartz storey lines, a granite base, metal-framed glass bays, a dark-door entrance on the
// 48th Street front under a black canopy band, a 7-storey tower stepping down to a 2-storey retail wing and a 6-storey
// wing at the south end. Walls are a one-block shell with air behind the glass; a full floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035423.cells.json`, "utf8"));
const W = 7, D = 25, H = 35;
const k = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));
const inF = (x, z) => cell.has(k(x, z));
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const EXT = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// Roof: zero returns (lidar misses, light wells) take their neighbours' median; a 3x3 median then removes single-cell
// noise; the result snaps to three flat tiers: the 23-block tower, a 19-block wing and a 7-block retail wing.
const raw = new Map([...cell].map(([key, c]) => [key, c.r]));
for (const [key, c] of cell) if (!c.r) {
  const [x, z] = key.split(",").map(Number);
  raw.set(key, median(NB8.map(([dx, dz]) => cell.get(k(x + dx, z + dz))?.r).filter((v) => v)));
}
const top = new Map();
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  const v = median([raw.get(key), ...NB8.map(([dx, dz]) => raw.get(k(x + dx, z + dz))).filter((q) => q !== undefined)]);
  top.set(key, v >= 20 ? 23 : v >= 12 ? 19 : 7);
}
const T = (x, z) => top.get(k(x, z));
// A column is solid up to its top (exclusive). Anything outside the footprint, or a neighbour that stops lower, is open air.
const occ = (x, z, y) => inF(x, z) && y < T(x, z);
const exposedDirs = (x, z, y) => EXT.filter(([dx, dz]) => !occ(x + dx, z + dz, y));

const PANE_Z = { east: "true", west: "true", north: "false", south: "false" };   // runs along x on a z-facing wall
const PANE_X = { north: "true", south: "true", east: "false", west: "false" };   // runs along z on an x-facing wall
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// One exterior window-row cell. Corners are piers; street-front cells carry the shopfront and entrance.
function facade(x, y, z, zs, xs) {
  const zOut = zs.some(([, dz]) => !inF(x, z + dz));
  const xOut = xs.some(([dx]) => !inF(x + dx, z));
  const ground = y < 3;
  if (zOut && xOut) return put(x, y, z, "calcite");                                 // corner pier
  if (zOut || (!xOut && zs.length)) {                                               // a z-facing wall (street or step)
    const dz = zs[0][1], front = ground && z === 24 && dz === 1;
    if (front && x === 3) return put(x, y, z, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
    if (front && (x === 2 || x === 4)) return put(x, y, z, "polished_granite");    // door jambs
    if (z === 24 && dz === 1 && y === 4 && x >= 2 && x <= 4) return put(x, y, z, "black_concrete"); // canopy band
    if (x === 3) return put(x, y, z, "iron_bars", PANE_Z);                          // metal mullion
    put(x, y, z, "light_blue_stained_glass_pane", PANE_Z);
    light(x, y, z - dz);
    return;
  }
  // an x-facing wall: a pier every third block, glass between
  if (z % 3 === 0) return put(x, y, z, "calcite");
  put(x, y, z, "light_blue_stained_glass_pane", PANE_X);
  light(x - xs[0][0], y, z);
}

// Warm light behind some panes: shroomlight in the air cell just inside the glass.
function light(x, y, z) {
  if (!inF(x, z) || (x * 3 + y * 5 + z * 7) % 11 !== 0) return;
  if (!exposedDirs(x, z, y).length) g.set(x, y, z, "shroomlight");
}

for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = T(x, z), deck = t - 2, parapet = t - 1;
  for (let y = 0; y < t; y++) {
    const ex = exposedDirs(x, z, y);
    const zs = ex.filter(([, dz]) => dz), xs = ex.filter(([dx]) => dx);
    if (y === 0) put(x, y, z, "polished_granite");                                  // granite base and ground slab
    else if (y === deck) put(x, y, z, ex.length ? "smooth_quartz" : "light_gray_concrete"); // cornice / roof deck
    else if (y === parapet) { if (ex.length) put(x, y, z, "calcite"); }             // parapet on the outer edge
    else if (y % 3 === 0) put(x, y, z, "smooth_quartz");                             // floor slab / storey line
    else if (ex.length) facade(x, y, z, zs, xs);                                     // window row
  }
}

// Roof equipment on the tower deck (one block high, inside the parapet): two plant boxes and a stone block.
for (const [x, z] of [[1, 4], [2, 4], [1, 5], [2, 5], [4, 15], [5, 15]]) put(x, 22, z, "gray_concrete");
put(5, 22, 16, "stone_bricks");

const { blocks, palette } = g.save(`${DIR}/NYC1035423.nbt`);
console.log(`NYC1035423.nbt: ${blocks} blocks, ${palette} palette entries`);
