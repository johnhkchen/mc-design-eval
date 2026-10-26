// 1330 Connecticut Ave NW: a 1960s-70s precast-and-glass office block, 7 storeys over a shopfront ground floor,
// set back in three tiers (tower core 19, wings 16 / 13 / 11, a one-storey annex 5). Floor slabs and an air gap behind
// every window; the lidar roof is median-smoothed and quantised into those tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78545.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [25, 30, 37];

// the footprint, and each cell's roof tier (3x3 median of the lidar roof, then quantised)
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const tierOf = (s) => (s >= 17.5 ? 19 : s >= 15.5 ? 16 : s >= 12.5 ? 13 : s >= 7.5 ? 11 : 5);
let TOP = new Map();
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp.get(`${x + dx},${z + dz}`); if (n) near.push(n.roof); }
  TOP.set(key, tierOf(median(near)));
}
// a majority pass over the tiers twice: a one-cell fringe of the next tier along a ragged edge reads as a stair, not a setback
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [key, t] of TOP) {
    const [x, z] = key.split(",").map(Number);
    const count = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = TOP.get(`${x + dx},${z + dz}`); if (v !== undefined) count.set(v, (count.get(v) || 0) + 1); }
    let best = t;
    for (const [v, n] of count) if (n > (count.get(best) || 0)) best = v;
    next.set(key, best);
  }
  TOP = next;
}
const top = (x, z) => TOP.get(`${x},${z}`);

// faces: E = +x, W = -x, S = +z, N = -z
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const ORDER = ["E", "W", "S", "N"];
// a face is open at height y when it looks out of the footprint, or onto a lower roof that y is above
const faceOpen = (x, z, d, y) => {
  const [dx, dz] = DIRS[d];
  return !inFp(x + dx, z + dz) || top(x + dx, z + dz) <= y;
};
const extDirs = (x, z, y) => ORDER.filter((d) => faceOpen(x, z, d, y));
// envelope cell: on the outside of the footprint, or stepped down from a taller neighbour
const isEnv = (x, z) => ORDER.some((d) => { const [dx, dz] = DIRS[d]; return !inFp(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z); });

const DOOR = { x: 21, z: 13, face: "E" };          // main entrance on the east face, Connecticut Avenue side
const GLASS = "light_blue_stained_glass_pane";
const FRAME = "light_gray_concrete";
const SPANDREL = "smooth_quartz";
const STONE = "smooth_stone";

// what each block is, before it is written: { b, state, kind }   kind: pane | solid | door | light
const kinds = new Map();
const put = (x, y, z, k) => kinds.set(`${x},${y},${z}`, k);
const kindAt = (x, y, z) => kinds.get(`${x},${y},${z}`);

function classify(x, z, y) {
  const T = top(x, z);
  if (y >= T) return null;
  if (y === 0) return { b: "stone_bricks", kind: "solid" };             // foundation on every cell, even the ground=0 tip
  const ext = extDirs(x, z, y);
  if (!ext.length) {                                                      // interior: a floor slab per storey, air otherwise
    if (y === T - 1) return { b: "gray_concrete", kind: "solid" };       // roof deck
    if (y >= 5 && y % 2 === 1) return { b: "stone", kind: "solid" };     // floor slab
    return null;
  }
  const primary = ext[0];
  const pos = DIRS[primary][0] !== 0 ? z : x;                            // along the face
  const mullion = pos % 3 === 0;
  if (y === T - 1) return { b: SPANDREL, kind: "solid" };                 // cornice / parapet
  if (y === 1) return { b: STONE, kind: "solid" };                        // base course
  if (x === DOOR.x && z === DOOR.z && primary === DOOR.face && (y === 2 || y === 3)) {
    return { b: "dark_oak_door", state: { facing: "east", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }, kind: "door" };
  }
  if (y === 4 && x === DOOR.x && primary === DOOR.face && Math.abs(z - DOOR.z) <= 1) return { b: SPANDREL, kind: "solid" };   // canopy band over the door
  if (y === 2) return { b: FRAME, kind: "solid" };                        // shopfront kick
  if (y === 3 || y === 4) return mullion ? { b: FRAME, kind: "solid" } : { b: GLASS, kind: "pane", axis: primary };
  if (y % 2 === 1) return { b: SPANDREL, kind: "solid" };                 // storey line
  return mullion ? { b: FRAME, kind: "solid" } : { b: GLASS, kind: "pane", axis: primary };   // upper window
}

for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < top(x, z); y++) {
    const k = classify(x, z, y);
    if (k) put(x, y, z, k);
  }
}

// a penthouse on the tower core: 5 x 5 on the roof deck, walls to 21, a cap at 22
const PH = { x0: 10, x1: 14, z0: 8, z1: 12 };
let penthouse = 0;
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  if (!inFp(x, z) || top(x, z) !== 19 || isEnv(x, z)) continue;
  penthouse++;
  const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  for (let y = 19; y <= 21; y++) {
    if (!ring) continue;
    put(x, y, z, y === 20 ? { b: SPANDREL, kind: "solid" } : { b: FRAME, kind: "solid" });
  }
  put(x, 22, z, { b: SPANDREL, kind: "solid" });
}

// warm light in some windows: a glowstone or a lantern in the air gap behind a glass pane
for (const [key, k] of [...kinds]) {
  if (k.kind !== "pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const [dx, dz] = DIRS[k.axis];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || isEnv(ix, iz) || kindAt(ix, y, iz)) continue;
  const h = (x * 73 + z * 151 + y * 31) % 11;
  if (h === 0) put(ix, y, iz, { b: "glowstone", kind: "light" });
  else if (h === 5) put(ix, y, iz, { b: "lantern", state: { hanging: "false", waterlogged: "false" }, kind: "light" });
}

// pane connections: a glass pane joins the panes and frames beside it along its wall
const solidAt = (x, y, z) => { const k = kindAt(x, y, z); return !!k && (k.kind === "pane" || k.kind === "solid"); };
const paneState = (x, y, z, face) => {
  const [ax, az] = DIRS[face][0] !== 0 ? [0, 1] : [1, 0];   // a plate in the wall's plane
  const c = (dx, dz) => (solidAt(x + dx, y, z + dz) ? "true" : "false");
  const s = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (az) { s.north = c(0, -1); s.south = c(0, 1); }
  if (ax) { s.west = c(-1, 0); s.east = c(1, 0); }
  return s;
};

const g = new Voxels(SIZE);
const counts = {};
for (const [key, k] of kinds) {
  const [x, y, z] = key.split(",").map(Number);
  let state = k.state;
  if (k.kind === "pane") state = paneState(x, y, z, k.axis);
  g.set(x, y, z, k.b, state);
  counts[k.kind] = (counts[k.kind] || 0) + 1;
}
const out = g.save(`${DIR}/DC78545.nbt`);
console.log("cells", cells.length, "penthouse cells", penthouse, "kinds", counts, "saved", out);
