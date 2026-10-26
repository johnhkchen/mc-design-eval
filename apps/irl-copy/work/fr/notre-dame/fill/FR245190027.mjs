// FR245190027: a residential block of 1870 on the lidar footprint (17 x 28), seven storeys of Haussmann-era limestone
// (calcite walls, smooth-stone string courses, calcite piers) under a slate mansard. Storey lines sit on absolute levels
// (every 5 blocks: the ground at 0, floors at 5..25, the mansard's floor at 30), so each band lands on a lintel below it.
// The roof snaps to two tiers from the lidar (about 30 and 35 blocks), and the mansard steps in twice as it rises:
// the outer ring stops at 32, the next ring at 33, the core at 34. Interiors are air behind one-block facades, with a
// floor slab per storey; a few windows hold glowstone. Entrance on the longest outer run, under a calcite surround.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245190027.cells.json`, "utf8"));

const W = 17, H = 51, D = 28;
const ATTIC = 30;                                          // the mansard's floor: storeys 1..6 below, slate above
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const key = (x, z) => `${x},${z}`;

// 1. The footprint, and each cell's roof: the 3x3 median of the lidar roofs, snapped to the two tiers.
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { x, z, g, r });
const at = (x, z) => fp.get(key(x, z));
const roofMedian = (c) => {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  return vals[vals.length >> 1];
};
for (const c of fp.values()) {
  const R = roofMedian(c);
  c.T = R >= 33 ? 35 : R >= 27 ? 30 : 20;
}

// 2. Setback distance from the outer edge (a missing neighbour), in four-neighbour steps.
const queue = [...fp.values()].filter((c) => Object.values(DIRS).some(([dx, dz]) => !at(c.x + dx, c.z + dz)));
for (const c of queue) c.dist = 0;
const seen = new Set(queue.map((c) => key(c.x, c.z)));
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || seen.has(key(n.x, n.z))) continue;
    seen.add(key(n.x, n.z)); n.dist = c.dist + 1; queue.push(n);
  }
}

// 3. Exposure: the faces with no footprint neighbour (outer walls), and whether a neighbour stands lower (a step).
for (const c of fp.values()) {
  c.exp = Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return !at(c.x + dx, c.z + dz); });
  c.step = Object.values(DIRS).some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.T < c.T; });
  c.facade = c.exp.length > 0 || c.step;
  // the last solid layer: the mansard's outer ring stops at 32, the next ring at 33, the core at 34; the lower tier at 29
  c.L = c.T === 35 ? 34 - Math.min(2, c.dist) : c.T - 1;
}

// 4. The entrance: the middle window bay of the longest single-face outer run (a run of 8+ cells).
const runs = new Map();
for (const c of fp.values()) {
  if (c.exp.length !== 1 || c.T !== 35) continue;
  const f = c.exp[0];
  const line = f === "north" || f === "south" ? `${f}:${c.z}` : `${f}:${c.x}`;
  if (!runs.has(line)) runs.set(line, []);
  runs.get(line).push(c);
}
let door = null;
for (const [line, list] of runs) {
  const f = line.split(":")[0];
  const along = (c) => (f === "north" || f === "south" ? c.x : c.z);
  list.sort((a, b) => along(a) - along(b));
  if (list.length < 8) continue;
  const bays = list.filter((c) => along(c) % 3 === 1);
  const pick = bays[Math.floor(bays.length / 2)];
  if (pick && (!door || list.length > door.len)) door = { c: pick, f, len: list.length };
}
const doorKey = door ? key(door.c.x, door.c.z) : null;

// Windows sit in the middle of each three-cell bay on the outer walls (piers either side); corners are plain piers.
const windowCol = (c, f) => (f === "north" || f === "south" ? c.x : c.z) % 3 === 1;
const hash = (x, y, z) => (x * 7919 + y * 104729 + z * 1299709) % 1009;

const g = new Voxels([W, H, D]);
for (const c of fp.values()) {
  const { x, z, L } = c;
  const exposed = c.exp.length === 1 ? c.exp[0] : null;
  for (let y = 0; y <= L; y++) {
    if (!c.facade) {                                       // interior: floor slabs per storey, a roof cap, the attic solid
      if (y === L) g.set(x, y, z, "deepslate_tiles");
      else if (c.T === 35 && c.dist >= 1 && y >= ATTIC) g.set(x, y, z, "deepslate_tiles");
      else if (y === 0) g.set(x, y, z, "stone_bricks");
      else if (y % 5 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === L) { g.set(x, y, z, "smooth_stone"); continue; }                // cornice or parapet
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }               // plinth
    if (y % 5 === 0) { g.set(x, y, z, "smooth_stone"); continue; }           // string course at each floor line
    if (y % 5 === 4) { g.set(x, y, z, "calcite"); continue; }                // lintel course
    if (y >= ATTIC) {                                      // the mansard: slate, with dormer windows in the bays
      if (exposed && windowCol(c, exposed)) g.set(x, y, z, "glass_pane");
      else g.set(x, y, z, "deepslate_tiles");
      continue;
    }
    if (exposed && windowCol(c, exposed)) g.set(x, y, z, "glass_pane");
    else g.set(x, y, z, "calcite");                        // piers, corners and step walls
  }
  // The entrance: a lower and an upper door block on the ground floor, facing out
  if (key(x, z) === doorKey) {
    g.set(x, 1, z, "dark_oak_door", { facing: door.f, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: door.f, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm light: glowstone in the air behind some ground and upper windows, one block in from the wall.
for (const c of fp.values()) {
  if (!c.facade || c.exp.length !== 1) continue;
  const f = c.exp[0];
  if (key(c.x, c.z) === doorKey || !windowCol(c, f)) continue;
  const [dx, dz] = DIRS[OPP[f]];
  const n = at(c.x + dx, c.z + dz);
  if (!n || n.facade) continue;
  for (const y of [2, 7, 12, 17, 22]) {
    if (y > n.L - 1 || hash(c.x, y, c.z) % 5 !== 0) continue;
    g.set(n.x, y, n.z, "glowstone");
  }
}

// Roof plant: brick chimneys on the mansard core, set well in from the eaves.
for (const c of fp.values()) {
  if (c.T !== 35 || c.dist < 3 || c.x % 5 !== 2 || c.z % 6 !== 3) continue;
  for (let y = c.L + 1; y <= c.L + 3; y++) g.set(c.x, y, c.z, "bricks");
}

// Connections: each glass pane joins whatever stands beside it in the wall plane (and nothing in the air behind it).
const CONN = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
let panes = 0;
for (const c of fp.values()) {
  if (!c.facade) continue;
  for (let y = 0; y <= c.L; y++) {
    const cur = g.get(c.x, y, c.z);
    if (!cur || cur.block !== "minecraft:glass_pane") continue;
    const state = {};
    for (const [d, [dx, dz]] of Object.entries(CONN)) state[d] = g.get(c.x + dx, y, c.z + dz) ? "true" : "false";
    g.set(c.x, y, c.z, "glass_pane", state);
    panes++;
  }
}

const stats = g.save(`${DIR}/FR245190027.nbt`);
console.log(JSON.stringify({ cells: cells.length, ...stats, panes, door: door ? { x: door.c.x, z: door.c.z, face: door.f, run: door.len } : null }));
