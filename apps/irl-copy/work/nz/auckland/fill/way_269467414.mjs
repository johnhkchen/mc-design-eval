// Way 269467414, Mt Eden / Eden Terrace: a single-storey brick shop block on a falling site, a basement showing under it on the downhill side.
// The lidar roof reads 6 or 7 blocks over y 0 (noise); it is smoothed to one flat tier at 7, with a parapet to 8 (about 8 over the lowest ground).
// Ground falls from 4 (north-west) to 0 (south-east): cobblestone fills to each cell's ground, the bluestone-style base course sits on it.
// Outer ring = facade (base course, brick piers, quoins at corners, glazed bays, stone frieze, parapet, coping). Behind each window the next cell
// in is an air gap (glowstone behind some upper windows). The core is solid, with a floor slab at y 3 and the roof deck at y 7.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467414.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467414.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..36, z 0..16
const g = new Voxels([37, 20, 17]);

const ROOF = 7;      // the flat roof deck (lidar 6-7, smoothed)
const FLOOR = 3;     // the shop floor line: string course on the facade, floor slab inside
const SHOP = [4, 5]; // glazed rows of the shopfront storey (frieze at 6)
const FRIEZE = 6;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const k = (x, z) => `${x},${z}`;

const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(k(x, z), { x, z, g: ground, roof });
const inside = (x, z) => at.has(k(x, z));

// Depth: 0 on the outer ring (a footprint cell with an outside neighbour), one more per step inward.
const depth = new Map();
const queue = [];
for (const c of at.values()) {
  c.out = DIRS.filter(([dx, dz]) => !inside(c.x + dx, c.z + dz));
  if (c.out.length) { depth.set(k(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(k(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const n = at.get(k(c.x + dx, c.z + dz));
    if (n && !depth.has(k(n.x, n.z))) { depth.set(k(n.x, n.z), d + 1); queue.push(n); }
  }
}
const depthOf = (c) => depth.get(k(c.x, c.z));

// A window on a single-face ring cell at row y: the face's bays run in threes (every third cell is a brick pier),
// and the cell inward must be inside the building, one cell deeper, and standing at that row (not foundation).
const inwardOf = (c, [dx, dz]) => at.get(k(c.x - dx, c.z - dz));
function windowFace(c, y) {
  if (c.out.length !== 1) return null;
  const dir = c.out[0];
  const u = dir[0] !== 0 ? c.z : c.x;
  if (u % 3 === 0) return null;                       // pier
  const n = inwardOf(c, dir);
  if (!n || n.g > y || y <= c.g) return null;         // a thin end wall takes flush glazing (no gap behind it)
  return dir;
}
// Window rows of a ring cell: the basement row under the floor line (only where the ground is low), and the shop rows.
function windowRows(c) {
  const rows = [];
  if (c.g + 1 < FLOOR) rows.push(c.g + 1);
  for (const y of SHOP) if (y > c.g) rows.push(y);
  return rows;
}

// The entrance: the middle window bay of the face with the most window bays on the shop rows.
const faceCount = new Map();
for (const c of at.values()) {
  if (depthOf(c) !== 0 || c.out.length !== 1) continue;
  if (!windowFace(c, SHOP[0])) continue;
  const key = NAME[c.out[0].join(",")];
  faceCount.set(key, (faceCount.get(key) || 0) + 1);
}
const doorFace = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
const doorDir = Object.entries(NAME).find(([, n]) => n === doorFace)[0].split(",").map(Number);
const doorCands = [...at.values()].filter((c) => depthOf(c) === 0 && c.out.length === 1 &&
  c.out[0][0] === doorDir[0] && c.out[0][1] === doorDir[1] && windowFace(c, SHOP[0]));
const uOf = (c) => (doorDir[0] !== 0 ? c.z : c.x);
const uMid = doorCands.reduce((s, c) => s + uOf(c), 0) / doorCands.length;
const door = doorCands.sort((a, b) => Math.abs(uOf(a) - uMid) - Math.abs(uOf(b) - uMid))[0];
const doorKey = k(door.x, door.z);

// Warm light behind some upper windows (glowstone in the air gap).
const lit = (c) => (c.x + 2 * c.z) % 5 === 0;

// Pass 1: solid volume and facade.
const gaps = [];      // [x, y, z, light] cells to open (air) or light behind a window
const panes = [];     // [x, y, z, dir] glass panes on the facade
for (const c of at.values()) {
  const d = depthOf(c);
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "cobblestone");       // foundation fills to the ground
  if (d >= 1) {                                                          // interior: floor slab, walls, roof deck
    for (let y = c.g; y < ROOF; y++) g.set(c.x, y, c.z, y === FLOOR ? "smooth_stone" : d === 1 ? "bricks" : "stone");
    g.set(c.x, ROOF, c.z, "deepslate_tiles");
    continue;
  }
  const corner = c.out.length >= 2;
  const rows = windowRows(c);
  for (let y = c.g; y <= ROOF + 1; y++) {
    if (y === ROOF + 1) { g.set(c.x, y, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }   // coping
    if (y === ROOF) { g.set(c.x, y, c.z, corner ? "stone_bricks" : "bricks"); continue; }                                  // parapet
    if (corner) { g.set(c.x, y, c.z, "stone_bricks"); continue; }                                                       // quoins
    if (y === c.g || y === FLOOR || y === FRIEZE) { g.set(c.x, y, c.z, "stone_bricks"); continue; }                      // base, string course, frieze
    const dir = rows.includes(y) ? windowFace(c, y) : null;
    if (dir) {
      const n = inwardOf(c, dir);
      const isDoor = k(c.x, c.z) === doorKey && SHOP.includes(y);
      if (isDoor) { g.set(c.x, y, c.z, "air"); }
      else { panes.push([c.x, y, c.z, dir]); }
      if (depthOf(n) >= 1) gaps.push([n.x, y, n.z, !isDoor && SHOP.includes(y) && lit(c)]);
      continue;
    }
    g.set(c.x, y, c.z, "bricks");                                                                                    // pier
  }
}

// Pass 2: the glazing, then the air gaps (or the glowstone) behind it.
for (const [x, y, z, [dx, dz]] of panes) {
  const ew = dz !== 0;
  g.set(x, y, z, "glass_pane", { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" });
}
for (const [x, y, z, warm] of gaps) g.set(x, y, z, warm ? "glowstone" : "air");

// The entrance door on the chosen face: two halves on the shop rows, facing into the building.
const doorState = (half) => ({ facing: NAME[door.out[0].map((v) => -v).join(",")], half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, SHOP[0], door.z, "dark_oak_door", doorState("lower"));
g.set(door.x, SHOP[1], door.z, "dark_oak_door", doorState("upper"));

// Roof plant on the roof deck near the middle of the block (sits on the deck at 7).
const mid = { x: 18, z: 7 };
for (const c of at.values()) {
  if (depthOf(c) < 1) continue;
  if (Math.abs(c.x - mid.x) <= 2 && Math.abs(c.z - mid.z) <= 1) {
    g.set(c.x, ROOF + 1, c.z, "stone_bricks");
    g.set(c.x, ROOF + 2, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

const stats = g.save(OUT);
console.log(`way_269467414: ${cells.length} cells, door on the ${doorFace} face, ${panes.length} panes, ${gaps.length} gaps, ${stats.blocks} blocks, ${stats.palette} palette`);
