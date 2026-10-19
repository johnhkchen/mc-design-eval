// 126 West 46 Street, 1912 commercial and office building: a 20-storey red-brick loft tower in the Renaissance Revival
// manner, with a three-storey granite-faced banking-hall podium, limestone storey bands and cornice, a 60-block tower
// over the south-centre of the lot, a 66-block penthouse crown on it, and lower shoulders (56, 51, 50, 45, 42) stepping
// down to the north-east and the rear. Footprint 22 x 28 (x across the front, low z = north = the 46th Street frontage).
// Ground floor glazed shopfronts with a recessed entrance (dark oak door, lantern) on the north face; every window is a
// glass pane one block back from the face with air behind it, a floor slab at each storey line (no interiors), and a
// sparse warm glowstone behind some panes. Lidar roof is read as clean flat tiers (median-smoothed), not cell by cell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022645.cells.json`, "utf8"));
const X = 22, Y = 73, Z = 28;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Roof tiers (block heights above y 0), flattened from the lidar: a 45 north strip, a 46-50 west shoulder, a 42 north-east
// block (lidar 42-44), a 51 band across the middle, a 56 wing on the south-east and a 60 tower in the south-centre
// (lidar 55-61), a 66 penthouse crown on the tower, and a 42 rear wing (lidar 42-44, the 1s are lidar holes).
const tierAt = (x, z) => {
  if (x >= 5 && x <= 9 && z >= 14 && z <= 18) return 66;
  if (z <= 1) return 45;
  if (z <= 10) return x >= 15 ? 42 : x <= 2 ? 46 : 50;
  if (z <= 12) return 51;
  if (z <= 22) return z >= 14 && z <= 19 && x >= 3 && x <= 12 ? 60 : 56;
  return 42;
};
const roofAt = (x, z) => (inFoot(x, z) ? tierAt(x, z) : 0);

// Lidar check (not used for the massing): how far the tiers sit from the measured roof, on the cells that have one.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 1) { dev += Math.abs(roofAt(x, z) - roof); n++; }

// Outward faces: N = low z (the street), S = rear, W/E = the side walls. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const PODIUM = 9;                                              // the banking-hall podium: three storeys of granite

// A cell is open at height y when it is outside the footprint or its roof is at or below y.
const open = (x, y, z) => !inFoot(x, z) || roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
// An edge: a neighbour whose roof is lower than this cell's top, or none at all (the cornice and parapet line).
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !inFoot(x + dx, z + dz) || roofAt(x + dx, z + dz) < top);

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 1. Solid mass from y 0 to each tier: the granite podium, brick above, a foundation under every cell's ground.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), top = roofAt(x, z);
  for (let y = 0; y < top; y++) g.set(x, y, z, y < PODIUM ? "polished_granite" : "bricks");
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Faces, one storey at a time: a stone base course at y 0, limestone storey bands on every third row, brick or granite
// piers every third column, and a glass pane in each remaining bay (two rows per storey). Each pane is set one block back
// with air behind it (or a glowstone for the lit ones), so the wall reads as a recessed grid, not a painted one.
const recesses = [];
const entrance = (x, y, z) => z === 0 && x === 10 && (y === 1 || y === 2);
for (const [x, z] of cols) {
  const top = roofAt(x, z), { ground } = cell.get(`${x},${z}`);
  for (let y = 0; y < top - 1; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // one block in, behind the face
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }          // buried by the slope: foundation
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }             // base course
    if (entrance(x, y, z)) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                // storey band (the lintel over the door too)
    if (u % 3 === 0) { g.set(x, y, z, y < PODIUM ? "polished_granite" : "bricks"); continue; }   // pier
    g.set(x, y, z, "glass_pane", dx === 0 ? NS : EW);                         // the bay: glass
    const deep = inFoot(ix, iz) && roofAt(ix, iz) > y && !faceOf(ix, y, iz);
    if (!deep) continue;
    recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : 3)]);
  }
}
// The recesses behind the panes: air (no interiors), a glowstone where the window is lit, and the entrance hall lantern.
for (const [x, y, z, on] of recesses) g.set(x, y, z, on ? "glowstone" : "air");
g.set(10, 1, 1, "air");
g.set(10, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 3. Roof: a cornice of limestone on every edge with a parapet course above it, a gray roof membrane inside, and two
// brick plant stacks on the 56 wing and one on the 42 north-east block.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (edgeAt(x, z, top)) { g.set(x, top - 1, z, "calcite"); g.set(x, top, z, "calcite"); }
  else g.set(x, top - 1, z, "smooth_stone");
}
const stacks = [[18, 16, 56], [19, 16, 56], [18, 17, 56], [19, 17, 56], [16, 4, 42], [17, 4, 42], [16, 5, 42], [17, 5, 42]];
for (const [x, z, base] of stacks) for (let y = base; y < base + 3; y++) g.set(x, y, z, y === base + 2 ? "calcite" : "bricks");

const saved = g.save(`${DIR}/NYC1022645.nbt`);
console.log(`built NYC1022645: ${saved.blocks} blocks, ${saved.palette} palette entries; tiers vs lidar mean |dev| ${(dev / n).toFixed(1)} blocks over ${n} cells`);
