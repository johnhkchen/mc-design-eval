// 1529 16th St NW (Special Purpose-Misc): a four-storey brick-and-limestone block of the 1910s-20s, Beaux-Arts in its
// bones: a stone plinth, a cream limestone string course on each floor line, red brick walls with glass panes between
// brick piers, a limestone cornice. The lidar roof is smoothed into two clean tiers (a 6-high front and side range, an
// 8-high core round a court open to the south) plus the low one-storey annex at the east end.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58583.cells.json`, "utf8"));
const [W, H, D] = [23, 20, 13];

// ---- massing: lidar roof per cell, median-smoothed into clean tiers ------------------------------------------------
const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(`${x},${z}`, { g, r });
const roof = new Map();
for (const [k, { r }] of raw) {
  if (r < 4) { roof.set(k, r); continue; }                  // the low annex keeps its own height
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(`${x + dx},${z + dz}`); if (n && n.r >= 4) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  roof.set(k, vals[Math.floor(vals.length / 2)] >= 7 ? 8 : 6);   // 7 reads as 8; 6 and 8 are the two tiers
}
const foot = (x, z) => roof.has(`${x},${z}`);
const R = (x, z) => roof.get(`${x},${z}`) ?? 0;
// the cell's outward faces at height y: a neighbour that is off the footprint or air at that height
const faces = (x, z, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !foot(x + dx, z + dz) || R(x + dx, z + dz) <= y);

// ---- storey lines (absolute, shared by every cell): plinth y0, windows y1, string y2, windows y3-4, string y5, ---------
// windows y6 (core), cap at each cell's own top ----------------------------------------------------------------------
const FLOORS = new Set([2, 5]);       // interior floor slabs, same lines as the string courses
const WINDOW_ROWS = new Set([1, 3, 4, 6]);
const STRING_ROWS = new Set([2, 5]);
const ENTRANCE_X = [9, 10, 11];       // the street front (z = 0) entrance bay

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// the wall at (x, y, z) on an exterior face: piers every third bay, glass between, string courses and cap
const wallAt = (x, z, y, face) => {
  const t = face[0] ? z : x;          // along-face coordinate
  if (STRING_ROWS.has(y)) return ["smooth_quartz"];
  if (WINDOW_ROWS.has(y) && t % 3 !== 0) return ["glass"];
  return ["bricks"];
};

const lights = [];
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number);
  const r = R(x, z);
  for (let y = 0; y < r; y++) {
    const outs = faces(x, z, y);
    const exposed = outs.length > 0;
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                   // plinth, every cell
    if (!exposed) {
      if (y === r - 1 || FLOORS.has(y)) put(x, y, z, "smooth_stone");        // roof deck and floor slabs
      continue;                                                              // air between floors
    }
    if (y === r - 1) { put(x, y, z, "smooth_quartz"); continue; }             // cornice / parapet cap
    // exterior: the front (z = 0) entrance bay
    if (z === 0 && ENTRANCE_X.includes(x)) {
      if (y === 1 && x === 10) { put(x, y, z, "dark_oak_door", doorState("lower")); continue; }
      if (y === 2 && x === 10) { put(x, y, z, "dark_oak_door", doorState("upper")); continue; }
      if (y <= 3) { put(x, y, z, "smooth_quartz"); continue; }                // pilasters and lintel
    }
    const face = outs[0];
    const [blk, st] = wallAt(x, z, y, face);
    put(x, y, z, blk, st);
    if (blk === "glass" && ((x * 7 + z * 3 + y) % 5 === 0)) lights.push({ x, y, z, face });   // some lit windows
  }
}

// warm light behind a share of the glass: in the air gap just inside the window, where the room would be
const LIGHTS = ["glowstone", "shroomlight"];
lights.forEach((w, i) => {
  const [dx, dz] = w.face;
  const ix = w.x - dx, iz = w.z - dz;
  if (!foot(ix, iz) || faces(ix, iz, w.y).length) return;   // only where the inside is open air
  put(ix, w.y, iz, LIGHTS[i % 2]);
});

// rooftop boxes on the 6-high range (roof equipment; a little above the lidar roof, as plant does)
for (const [x, z] of [[2, 2], [2, 9], [18, 2]]) {
  if (R(x, z) === 6 && !faces(x, z, 5).length) put(x, 6, z, "bricks");
}

const out = `${DIR}/DC58583.nbt`;
const res = g.save(out);
console.log(`wrote ${out}: ${res.blocks} blocks, palette ${res.palette}`);
