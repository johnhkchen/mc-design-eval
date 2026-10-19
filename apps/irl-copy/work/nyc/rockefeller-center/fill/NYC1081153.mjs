// 3 East 54 Street (1955, commercial & office): a mid-century office block on 54th Street. A granite base and shopfront
// with a recessed entrance on the north (street) face, then a white spandrel and blue glass curtain wall with grey
// mullions. The lidar roof is snapped to whole storey lines (1 + 3n) and mode-filtered into flat tiers: a 7-storey body
// (22), a 10-storey tower on the north-east (31, stepped down at its edges), a penthouse (25) and a 5-storey south wing
// (16); the west edge is a brick party wall to 34. Every cell stands on the cell below (y 0 is a stone foundation, each
// storey a slab line), and the interior is solid except a one-cell air gap behind the glass, with glowstone lights in
// some bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081153.cells.json`, "utf8"));
const W = 17, D = 21, H = 46;

const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const SIDES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };      // N is low z (uptown), i.e. 54th Street's north face
const DEPTH = { N: [0, 2], S: [0, -2], W: [2, 0], E: [-2, 0] };      // two cells inward from a face

// Lidar roof -> nearest storey line (tops are 1 + 3n, so every tier stands on whole storeys).
const raw = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, , r] of cells) raw[x][z] = 1 + 3 * Math.round((r - 1) / 3);

// Majority of the 3x3 neighbourhood (cells inside the footprint); ties keep the cell's own tier.
const T = raw.map((col, x) => col.map((v, z) => {
  if (!v) return 0;
  const n = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const a = x + dx, b = z + dz;
    if (inside(a, b) && raw[a][b]) n.set(raw[a][b], (n.get(raw[a][b]) || 0) + 1);
  }
  let best = v, count = n.get(v) || 0;
  for (const [t, c] of n) if (c > count) { best = t; count = c; }
  return best;
}));
// Tower crown: its outer ring (west edge, east edge, south edge) steps down one storey-pair from the core.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (T[x][z] === 31 && (x === 7 || x === 16 || z === 6)) T[x][z] = 28;
}

const top = (x, z) => (inside(x, z) ? T[x][z] : 0);
// Sides of (x, z) facing air at height y: outside the footprint, or a neighbour whose top is at or below y.
const exposed = (x, z, y) => Object.keys(SIDES).filter((s) => { const [dx, dz] = SIDES[s]; return top(x + dx, z + dz) <= y; });
// The shell is the street-facing skin; the party wall at x = 0 is solid brick and has no glass.
const shell = (x, z, y) => x > 0 && exposed(x, z, y).length > 0;
const airBehind = (x, z, y) => Object.values(SIDES).some(([dx, dz]) => shell(x + dx, z + dz, y));

// Warm lights: a few glass bays get a glowstone two cells back, behind the air gap, inside the solid core.
const glow = new Set();
for (let x = 1; x < W; x++) for (let z = 0; z < D; z++) for (let y = 2; y < top(x, z); y += 3) {
  if (y === top(x, z) - 1 || !shell(x, z, y) || (x * 5 + z * 11 + y) % 13 !== 0) continue;
  const side = exposed(x, z, y)[0];
  const [dx, dz] = DEPTH[side], tx = x + dx, tz = z + dz;
  if (inside(tx, tz) && top(tx, tz) > y + 1 && !shell(tx, tz, y)) glow.add(`${tx},${tz},${y}`);
}

const DOOR = { facing: "north", open: "false", powered: "false" };
// y 0: foundation. Storey k spans y 1 + 3k .. 3 + 3k: r 0 is the slab/spandrel line, r 1 and 2 the glass rows.
function kindAt(x, y, z) {
  const t = top(x, z);
  if (!inside(x, z) || y < 0 || y >= t) return null;
  if (y === 0) return { b: "stone_bricks" };
  if (x === 0) return { b: (y === t - 1 || (y - 1) % 3 === 0 || z % 4 === 0) ? "stone_bricks" : "bricks" };   // pilasters break the blank party wall

  const k = Math.floor((y - 1) / 3), r = (y - 1) % 3;
  const sides = exposed(x, z, y), skin = sides.length > 0;
  if (y === t - 1) return { b: skin ? "smooth_stone" : "gray_concrete" };         // cornice on the skin, roof deck inside

  if (k === 0 && z === 0 && skin && (x === 3 || x === 4)) {                       // recessed entrance, two leaves
    const hinge = x === 3 ? "left" : "right";
    if (r === 0) return { b: "dark_oak_door", s: { ...DOOR, half: "lower", hinge } };
    if (r === 1) return { b: "dark_oak_door", s: { ...DOOR, half: "upper", hinge } };
    if (r === 2) return { b: "polished_granite" };
  }
  if (r === 0) {
    if (!skin) return { b: "light_gray_concrete" };                              // floor slab
    return { b: k === 0 ? "polished_granite" : "white_concrete" };             // base course / spandrel
  }
  if (skin) {
    const pier = sides.some((s) => (s === "N" || s === "S" ? x % 2 === 0 : z % 2 === 0));
    if (pier) return { b: k === 0 ? "polished_granite" : "gray_concrete" };    // mullions and shopfront piers
    return { b: (x * 7 + z * 3 + k) % 9 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass" };
  }
  if (glow.has(`${x},${z},${y}`)) return { b: "glowstone" };
  if (airBehind(x, z, y)) return null;                                             // air gap behind the glass
  return { b: "stone" };                                                           // solid core
}

const g = new Voxels([W, H, D]);
let placed = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < T[x][z]; y++) {
  const kd = kindAt(x, y, z);
  if (kd) { g.set(x, y, z, kd.b, kd.s); placed++; }
}

// Roof plant: a mechanical bulkhead on the body, a box on the penthouse, an elevator house on the tower.
const plant = [
  [2, 11, 22, 2, 2, "light_gray_concrete"], [5, 14, 22, 1, 2, "light_gray_concrete"],
  [8, 13, 25, 1, 2, "iron_block"], [11, 2, 31, 2, 2, "bricks"],
];
for (const [x0, z0, y0, dx, dz, b] of plant) for (let x = x0; x < x0 + dx; x++) for (let z = z0; z < z0 + dz; z++) {
  for (let y = y0; y < y0 + 2; y++) g.set(x, y, z, b);
}

const info = g.save(`${DIR}/NYC1081153.nbt`);
console.log(`NYC1081153: ${placed} cells placed, ${info.blocks} blocks, ${info.palette} palette entries`);
