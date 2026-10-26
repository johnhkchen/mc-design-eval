// DC71692: Commercial-Office-Large, 1717 De Sales St NW (Dupont Circle). Read from the lidar as a 1970s blue-glass
// office on a stone plinth: a quartz storey grid, blue tinted glass, a stone cornice on every tier. The roof steps up
// from an 11-block front wing to a 13-block body, a 16-block middle band and a 22/24 tower core with a glazed crown.
// Storeys are 3 blocks (a quartz floor line, then two rows of glass). The shell is one block thick around an air
// interior with a floor slab per storey; glowstone and shroomlight sit a block behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 18, D = 13, H = 36;
const GLASS = "light_blue_stained_glass_pane";

const cells = JSON.parse(readFileSync(`${DIR}/DC71692.cells.json`, "utf8"));
const byXZ = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const cellAt = (x, z) => byXZ.get(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;

// Lidar roof -> clean tiers: the 3x3 median of the roof values (footprint cells only), snapped to a tier height.
// Tiers: 11 front wing, 13 body, 16 middle band, 22 setback, 24 tower crown.
const tierOf = (r) => (r <= 11 ? 11 : r <= 13 ? 13 : r <= 19 ? 16 : r <= 22 ? 22 : 24);
for (const c of byXZ.values()) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cellAt(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  c.T = tierOf(v[v.length >> 1]);
}

// Every footprint column is solid from y 0 up to its tier (the foundation is the same column, down to y 0).
const solid = (x, y, z) => { const c = cellAt(x, z); return !!c && y >= 0 && y < c.T; };
const openSides = (x, y, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const FLOOR = (y) => y === 0 || (y >= 4 && (y - 4) % 3 === 0);     // floor lines at 4, 7, 10, 13, 16, 19, 22

// The door: centre of the street (south, z 12) face.
const DOOR_X = 8, DOOR_Z = 12;
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// Role of one voxel: { b, s, ext, open } for a solid block, or null for air (an interior gap).
function role(x, y, z) {
  const c = cellAt(x, z); if (!c || y < 0 || y >= c.T) return null;
  const open = openSides(x, y, z);
  const ext = open.length > 0 || y === 0 || y === c.T - 1;
  if (y === c.T - 1) return { b: ext ? "stone_bricks" : "smooth_stone", ext };       // roof row: cornice on the edge, roof inside
  if (y === 0) return { b: ext ? "stone_bricks" : "smooth_stone", ext };            // plinth on the edge, slab inside
  if (open.length) {
    if (x === DOOR_X && z === DOOR_Z && (y === 1 || y === 2)) return { b: "dark_oak_door", s: doorState(y === 1 ? "lower" : "upper"), ext, open };
    if (FLOOR(y)) return { b: "smooth_quartz", ext, open };                          // storey line
    const xOpen = open.some(([dx]) => dx !== 0), zOpen = open.some(([, dz]) => dz !== 0);
    const pier = (xOpen && zOpen) || (zOpen ? x % 3 === 0 : z % 3 === 0);             // quoin at corners, mullion every 3rd
    if (pier) return { b: "smooth_quartz", ext, open };
    return { b: GLASS, ext, open };
  }
  return FLOOR(y) ? { b: "smooth_stone", ext: false } : null;                         // interior floor slab, else air gap
}

const R = new Map();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = cellAt(x, z); if (!c) continue;
  for (let y = 0; y < c.T; y++) { const r = role(x, y, z); if (r) R.set(key(x, y, z), r); }
}

// Support: an exterior voxel with air under it is carried down to the first solid (no wall hangs in the air).
for (const [k, r] of [...R]) {
  if (!r.ext) continue;
  const [x, y, z] = k.split(",").map(Number);
  for (let j = y - 1; j > 0 && !R.has(key(x, j, z)); j--) R.set(key(x, j, z), { b: "light_gray_concrete", ext: true });
}

// Warm light behind some panes: one block inside the glass, air between, standing on the floor slab below.
const DEPTH = 2;
for (const [k, r] of [...R]) {
  if (r.b !== GLASS || r.open.length !== 1) continue;
  const [x, y, z] = k.split(",").map(Number);
  const [dx, dz] = r.open[0];
  const bx = x - dx * DEPTH, bz = z - dz * DEPTH, kk = key(bx, y, bz);
  if (!cellAt(bx, bz) || R.has(kk) || !R.has(key(bx, y - 1, bz))) continue;
  if ((x * 3 + y * 5) % 11 === 0) R.set(kk, { b: "glowstone", ext: false });
  else if ((x + y * 2) % 13 === 0) R.set(kk, { b: "shroomlight", ext: false });
}
// The lantern inside the entrance, on the lobby slab.
if (!R.has(key(DOOR_X, 1, DOOR_Z - 1))) R.set(key(DOOR_X, 1, DOOR_Z - 1), { b: "lantern", s: { hanging: "false", waterlogged: "false" }, ext: false });

// Roof plant: iron boxes on the 13 body, and a glazed penthouse with a lantern on the 24 tower core.
for (const c of byXZ.values()) {
  const interior = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => cellAt(c.x + dx, c.z + dz)?.T === c.T);
  if (!interior) continue;
  if (c.T === 13 && c.x % 4 === 1 && c.z % 4 === 2) R.set(key(c.x, 13, c.z), { b: "iron_block", ext: true });
  if (c.T === 24 && (c.x === 13 || c.x === 14) && (c.z === 4 || c.z === 5)) {
    R.set(key(c.x, 24, c.z), { b: "light_gray_concrete", ext: true });
    R.set(key(c.x, 25, c.z), { b: "light_blue_stained_glass", ext: true });
  }
}
const crown = cellAt(13, 4);
if (crown?.T === 24) R.set(key(13, 26, 4), { b: "lantern", s: { hanging: "false", waterlogged: "false" }, ext: true });

// Panes join the neighbours they sit beside in their own wall (not the air gap behind them).
const NS = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
const g = new Voxels([W, H, D]);
for (const [k, r] of R) {
  const [x, y, z] = k.split(",").map(Number);
  let s = r.s;
  if (r.b === GLASS) {
    s = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };
    for (const [side, [dx, dz]] of Object.entries(NS)) if (R.has(key(x + dx, y, z + dz))) s[side] = "true";
  }
  g.set(x, y, z, r.b, s);
}
const info = g.save(`${DIR}/DC71692.nbt`);
console.log(`DC71692.nbt: ${info.blocks} blocks, ${info.palette} palette entries`);
for (let z = 0; z < D; z++) console.log(`z${String(z).padStart(2)} ` + Array.from({ length: W }, (_, x) => String(cellAt(x, z)?.T ?? ".").padStart(3)).join(""));
