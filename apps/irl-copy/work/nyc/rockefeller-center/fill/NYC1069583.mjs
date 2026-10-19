// 114 West 46th Street, NYC individual landmark (Public Facilities & Institutions, 1894).
// Read as a late-19th-century Renaissance Revival civic building: red brick walls on a grey stone base,
// cream sandstone stringcourses, quoins, a cornice and parapet, and tall glazed bays. The massing follows
// the lidar roof, smoothed into 3-block storeys so every tier stands on the storey below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1069583.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 43, H = 38, D = 33;
const B = {
  base: "polished_andesite", wall: "bricks", stone: "smooth_sandstone", floor: "smooth_stone",
  parapet: "stone_brick_wall", glass: "glass_pane", door: "dark_oak_door", glow: "glowstone",
};
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north (low z, uptown), south, west, east
const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const P = (block, state, inward) => ({ block, state, inward });

// Footprint cells and their storey-quantised tops. Each top is the 3x3 median of the lidar roof, rounded to whole storeys.
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(k2(x, z), { ground, roof });
const has = (x, z) => fp.has(k2(x, z));
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const top = new Map();
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp.get(k2(x + dx, z + dz)); if (n) near.push(n.roof); }
  top.set(k, 3 * Math.min(9, Math.max(1, Math.round(median(near) / 3))));
}
const topAt = (x, z) => top.get(k2(x, z)) ?? -1;

// A cell is a shell cell (wall) when a side is open: off the footprint, or beside a lower tier. Everything else is interior.
const faces = (x, z) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) < topAt(x, z));

// Is the air behind a window open? Interior air is open between floor plates; the outside is open.
const open = (x, y, z) => {
  if (!has(x, z)) return true;
  if (y > topAt(x, z)) return true;
  if (faces(x, z).length) return false;
  return y % 3 !== 0;
};

// The entrance: the two middle cells of the north (z = 0) frontage.
const northX = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === 0).map(([x]) => x).sort((a, b) => a - b);
const mid = northX[Math.floor(northX.length / 2)];
const doorCells = new Set([k2(mid, 0), k2(mid + 1, 0)]);

// What stands at (x, y, z). Rows: 0 base or floor; 3k a floor plate or stringcourse; 3k+1 and 3k+2 the storey's air or windows.
function cellBlock(x, y, z) {
  if (!has(x, z)) return null;
  const T = topAt(x, z);
  if (y > T + 1) return null;
  const fs = faces(x, z);
  if (!fs.length) {                                     // interior: a floor plate per storey, air between
    if (y === T || y % 3 === 0) return P(B.floor);
    return null;
  }
  if (y === T + 1) return P(B.parapet);
  if (y === T || y % 3 === 0) return P(y === 0 ? B.base : B.stone);
  if (y <= 2 && z === 0 && doorCells.has(k2(x, z))) {  // doors, lower and upper
    return P(B.door, { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  }
  const pier = y < 3 ? B.base : B.wall;
  if (fs.length >= 2) return P(B.stone);               // quoins at the corners
  const [dx, dz] = fs[0];
  const i = dx !== 0 ? z : x;                          // index along the face
  if (i % 4 === 0) return P(pier);                     // piers between window bays
  const ix = x - dx, iz = z - dz;
  if (open(ix, y, iz)) return P(B.glass, null, [ix, iz]);
  return P(pier);
}

// Build the placed map first, so light and pane states can see their neighbours.
const placed = new Map();
const glass = [];
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= topAt(x, z) + 1; y++) {
    const b = cellBlock(x, y, z);
    if (!b) continue;
    placed.set(k3(x, y, z), b);
    if (b.block === B.glass) glass.push([x, y, z, b.inward]);
  }
}

// Warm light behind some windows, in the interior air just inside the glass.
for (const [x, y, z, [ix, iz]] of glass) {
  if (((x * 5 + y * 3 + z * 11) % 25) !== 0) continue;
  if (!has(ix, iz) || faces(ix, iz).length || y >= topAt(ix, iz) || y % 3 === 0) continue;
  const key = k3(ix, y, iz);
  if (!placed.has(key)) placed.set(key, P(B.glow));
}

// Pane and wall arms: each side connects to a neighbouring block, so the glazing meets its frame.
const armed = (x, y, z, dx, dz) => (placed.has(k3(x + dx, y, z + dz)) ? "true" : "false");
const lowArm = (x, y, z, dx, dz) => (placed.get(k3(x + dx, y, z + dz))?.block === B.parapet ? "low" : "none");

const g = new Voxels([W, H, D]);
for (const [key, b] of placed) {
  const [x, y, z] = key.split(",").map(Number);
  if (b.block === B.glass) {
    g.set(x, y, z, B.glass, { north: armed(x, y, z, 0, -1), south: armed(x, y, z, 0, 1), west: armed(x, y, z, -1, 0), east: armed(x, y, z, 1, 0) });
  } else if (b.block === B.parapet) {
    g.set(x, y, z, B.parapet, { north: lowArm(x, y, z, 0, -1), south: lowArm(x, y, z, 0, 1), west: lowArm(x, y, z, -1, 0), east: lowArm(x, y, z, 1, 0), up: "true", waterlogged: "false" });
  } else {
    g.set(x, y, z, b.block, b.state);
  }
}

const stats = g.save(`${DIR}/NYC1069583.nbt`);
console.log(`NYC1069583: ${stats.blocks} blocks, palette ${stats.palette}, top ${Math.max(...top.values())}, glass ${glass.length}`);
