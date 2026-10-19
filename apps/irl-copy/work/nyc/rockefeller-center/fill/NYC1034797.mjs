// 9 West 54th Street, 1898: a Commercial & Office building of about eight storeys (the lidar roof is 24 blocks, 3 to a
// storey), built as a loft-office in brick on a granite base, with calcite belt courses at every storey line, a calcite
// cornice and a brick parapet, and a recessed-free granite entrance on the 54th Street front (the south, 13-wide face).
// The rear north wing is one storey lower (roof 21). Ground storey shopfronts with granite piers, sash windows as glass
// panes between brick piers, glowstone behind some windows. Solid base, floor slabs and roof at every storey line, and
// the interior is air behind the walls.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034797.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 13, Y = 30, Z = 22;
const MAIN = 24, LOW = 21;                // roof tops above y 0: the cornice is at top - 2, the parapet at top - 1
const BELTS = [4, 7, 10, 13, 16, 19];     // storey lines: a belt course, then two rows of window above it
const STREET_Z = 21, DOOR_X = 6;          // 54th Street front, and the entrance on it

// Tiers from the lidar roof: 23 and up is the main block, 15 to 22 the lower wing; no return (under 15) takes the
// majority of its neighbours. One majority pass after that gives clean flat tiers with no single-cell notches.
const key = (x, z) => `${x},${z}`;
const H = new Map();
for (const [x, z, , r] of cells) H.set(key(x, z), r >= 23 ? MAIN : r >= 15 ? LOW : null);
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const majority = (x, z, self, values) => {
  const n = new Map();
  for (const v of values) if (v != null) n.set(v, (n.get(v) ?? 0) + 1);
  let best = self, most = 0;
  for (const [v, c] of n) if (c > most) { best = v; most = c; }
  return best;
};
for (const [k, v] of H) if (v == null) {
  const [x, z] = k.split(",").map(Number);
  H.set(k, majority(x, z, null, NB8.map(([dx, dz]) => H.get(key(x + dx, z + dz)))) ?? LOW);
}
const smoothed = new Map();
for (const [k, v] of H) {
  const [x, z] = k.split(",").map(Number);
  smoothed.set(k, majority(x, z, v, [v, ...NB8.map(([dx, dz]) => H.get(key(x + dx, z + dz)))]));
}
const top = (x, z) => smoothed.get(key(x, z));
const inF = (x, z) => smoothed.has(key(x, z));

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const outside = (x, y, z, d) => {        // off the footprint, or above the neighbour's tier: the air this face looks onto
  const [dx, dz] = DIRS[d];
  return !inF(x + dx, z + dz) || y >= top(x + dx, z + dz);
};
const exposures = (x, y, z) => Object.keys(DIRS).filter((d) => outside(x, y, z, d));
const isZFace = (d) => d === "n" || d === "s";
const glassFor = (d) => ({ block: "glass_pane", state: isZFace(d)
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" } });
const doorHalf = (half) => ({ block: "dark_oak_door", state: { facing: "south", half, hinge: "left", open: "false", powered: "false" } });

const g = new Voxels([X, Y, Z]);
const lights = [];

const blockFor = (x, y, z, t) => {
  if (y === 0) return { block: "stone_bricks" };                          // foundation under every footprint cell
  const ex = exposures(x, y, z);
  const roof = y === t - 2, parapet = y === t - 1;
  const belt = BELTS.includes(y) && y < t - 2;
  if (!ex.length) return y === 1 || roof || belt ? { block: "smooth_stone" } : null;   // floor slabs and roof; interior air
  if (y === 1) return { block: "polished_granite" };                       // granite base course
  if (roof || belt) return { block: "calcite" };                          // cornice and storey belt courses
  if (parapet) return { block: "bricks" };
  const d = ex[0], zFace = isZFace(d);
  const u = zFace ? x : z;
  const corner = ex.some((e) => isZFace(e) !== zFace);
  const along = zFace ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  const end = along.some(([dx, dz]) => !(inF(x + dx, z + dz) && y < top(x + dx, z + dz) && exposures(x + dx, y, z + dz).includes(d)));
  if (y < 4 && d === "s" && z === STREET_Z) {                             // ground-floor shopfront on 54th Street
    if (x === DOOR_X) return doorHalf(y === 2 ? "lower" : "upper");
    if (x === DOOR_X - 1 || x === DOOR_X + 1 || u % 3 === 0) return { block: "polished_granite" };
    return glassFor(d);
  }
  if (corner || end) return { block: "calcite" };                         // quoins at the corners and returns
  if (u % 3 === 0) return { block: "bricks" };                            // brick piers between the window bays
  if ((u + Math.floor(y / 3)) % 9 === 0 && y % 3 === 2) lights.push([x, y, z, d]);   // a few lit windows, not a grid of them
  return glassFor(d);
};

for (const k of smoothed.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const b = blockFor(x, y, z, t);
    if (b) g.set(x, y, z, b.block, b.state);
  }
}

// Warm light: glowstone on the inside of some windows, and two lamps in the shop.
for (const [x, y, z, d] of lights) {
  const [dx, dz] = DIRS[d];
  g.set(x - dx, y, z - dz, "glowstone");
}
g.set(2, 2, 20, "glowstone");
g.set(10, 2, 20, "glowstone");

// Roof equipment: a three-by-three stair bulkhead on the main roof, with its door on the south face.
for (let x = 8; x <= 10; x++) for (let z = 16; z <= 18; z++) {
  if (x === 9 && z === 17) continue;
  for (let y = 23; y <= 25; y++) {
    if (x === 9 && z === 18 && y <= 24) { const d = doorHalf(y === 23 ? "lower" : "upper"); g.set(x, y, z, d.block, d.state); }
    else g.set(x, y, z, "bricks");
  }
  g.set(x, 26, z, "calcite");
}

const { blocks, palette } = g.save(`${DIR}/NYC1034797.nbt`);
console.log(`NYC1034797.nbt: ${blocks} blocks, palette ${palette}`);
