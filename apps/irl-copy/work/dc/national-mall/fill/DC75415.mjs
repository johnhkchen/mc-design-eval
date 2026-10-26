import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1901 L St NW: a 1920s Classical office block in limestone (calcite) on a granite base, six storeys of two blocks
// (ground storey three), a central seven-storey tower stepping back from a one-cell terrace ring, low one-storey lobbies
// on the west and north. Storey lines are absolute, so every tier lines up across the lidar's ground steps.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75415.cells.json`, "utf8"));

const W = 20, H = 27, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(key(x, z), { ground, roof });
const has = (x, z) => raw.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---- massing: a top height per cell (blocks above y 0) ----
// lidar roof >= 15 is the tower zone; its perimeter cells are the terrace ring (12); other cells 12..14 are the wing at 12;
// lidar 0..2 (no return, the lobbies) is a one-storey lobby of 3, and the north corner's 4 stays 4.
const zone = (x, z) => has(x, z) && raw.get(key(x, z)).roof >= 15;
const ring = (x, z) => zone(x, z) && DIRS.some(([dx, dz]) => !zone(x + dx, z + dz));
const topOf = (x, z) => {
  if (ring(x, z)) return 12;
  if (zone(x, z)) return 15;
  const r = raw.get(key(x, z)).roof;
  if (r >= 12) return 12;
  return Math.max(3, r);
};
const T = new Map();
for (const [k] of raw) { const [x, z] = k.split(",").map(Number); T.set(k, topOf(x, z)); }
const top = (x, z) => T.get(key(x, z));

// ---- materials ----
const LIMESTONE = "calcite";
const BAND = "smooth_stone";
const CAP = "stone_bricks";
const BASE = "polished_granite";
const FOUNDATION = "stone_bricks";
const ROOF = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";
const CONCRETE = "light_gray_concrete";

const blk = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blk.set(`${x},${y},${z}`, { block, state });
const panes = [];        // { x, y, z, axis } for connection state after the pass

// exposure toward a side: outside the footprint, or a neighbour that is not tall enough at this height
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || top(x + dx, z + dz) <= y);

// Storefront and window rows: y 1 on the ground storey, then the even storeys above it; bands on the odd lines.
const isWindowRow = (y) => y === 1 || (y >= 4 && y % 2 === 0);
const isFloorLine = (y) => y >= 3 && y % 2 === 1;

// The main entrance: the south face (z = D - 1), a pair of dark oak doors at x 8..9 under a granite canopy.
const ENTRY_Z = D - 1;
const isDoor = (x, y, z) => z === ENTRY_Z && (x === 8 || x === 9) && (y === 0 || y === 1);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!has(x, z)) continue;
  const t = top(x, z), gr = raw.get(key(x, z)).ground;

  // foundation: solid from y 0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) put(x, y, z, FOUNDATION);

  for (let y = gr; y < t; y++) {
    const E = exposedDirs(x, z, y);

    if (z === ENTRY_Z && isDoor(x, y, z)) {
      const hinge = x === 8 ? "left" : "right";
      put(x, y, z, "dark_oak_door", { facing: "south", half: y === 0 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      continue;
    }
    if (z === ENTRY_Z && x >= 7 && x <= 10 && y === 3) { put(x, y, z, BASE); continue; }       // canopy over the entrance
    if (z === ENTRY_Z && (x === 7 || x === 10) && (y === 1 || y === 2)) { put(x, y, z, BASE); continue; }   // pilasters

    if (E.length === 0) {
      // interior: a floor slab at each storey line and the roof; the rest is air
      if (y === gr || isFloorLine(y) || y === t - 1) put(x, y, z, ROOF);
      continue;
    }

    if (y === t - 1) { put(x, y, z, CAP); continue; }             // the parapet / cornice course
    if (y === gr) { put(x, y, z, BASE); continue; }                // granite base course
    if (y === 2) { put(x, y, z, LIMESTONE); continue; }            // lintel over the ground storey
    if (isFloorLine(y)) { put(x, y, z, BAND); continue; }          // storey band
    if (isWindowRow(y)) {
      const corner = E.length >= 2;
      // bays: along the face, two windows then a pier; corners are always piers
      const [dx, dz] = E[0];
      const u = dz !== 0 ? x : z;
      if (corner || u % 3 === 0) { put(x, y, z, LIMESTONE); continue; }
      put(x, y, z, GLASS);
      panes.push({ x, y, z, axis: dz !== 0 ? "ew" : "ns", out: [dx, dz] });
      continue;
    }
    put(x, y, z, LIMESTONE);
  }
}

// ---- warm light behind some windows: a lantern standing on the floor slab, one cell inside the glass ----
for (const p of panes) {
  const [dx, dz] = p.out;
  const ix = p.x - dx, iz = p.z - dz;
  if (!has(ix, iz) || exposedDirs(ix, iz, p.y).length) continue;
  const floorBelow = p.y - 1 === 0 || isFloorLine(p.y - 1);
  if (!floorBelow || (p.x * 7 + p.y * 13 + p.z * 5) % 5 !== 0) continue;
  put(ix, p.y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- roof equipment: two air-handling units on the wing roof, a plant box on the tower's core ----
const wingRoof = (x, z) => has(x, z) && top(x, z) === 12 && !ring(x, z) && DIRS.every(([dx, dz]) => has(x + dx, z + dz) && top(x + dx, z + dz) >= 12);
for (const [ax, az] of [[17, 2], [17, 9]]) {
  if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([i, j]) => wingRoof(ax + i, az + j))) continue;
  for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let y = 12; y <= 13; y++) put(ax + i, y, az + j, CONCRETE);
}
for (let x = 8; x <= 11; x++) for (let z = 7; z <= 9; z++) for (let y = 15; y <= 16; y++) put(x, y, z, CONCRETE);

// ---- panes connect to their neighbours in the wall plane, as a placed pane would ----
const solidish = (b) => b && b.block !== "lantern" && !b.block.endsWith("_door");
for (const p of panes) {
  const [a, b] = p.axis === "ew" ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  const conn = (dx, dz) => { const n = blk.get(`${p.x + dx},${p.y},${p.z + dz}`); return solidish(n) ? "true" : "false"; };
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (p.axis === "ew") { state.north = conn(...a); state.south = conn(...b); }
  else { state.east = conn(...a); state.west = conn(...b); }
  put(p.x, p.y, p.z, GLASS, state);
}

// ---- write the volume ----
for (const [k, v] of blk) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = `${DIR}/DC75415.nbt`;
const res = g.save(out);
console.log(JSON.stringify({ file: out, ...res }));
