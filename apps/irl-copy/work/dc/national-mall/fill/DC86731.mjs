// 1499 Massachusetts Ave NW: a Residential-Apartment-Elevator block of the 1910s-20s, the Beaux-Arts / Renaissance-Revival
// brick apartment house that lines the avenue round Dupont Circle. Red brick walls, pale limestone belt courses, cornice
// and window surrounds, a rusticated stone base, six 3-block storeys at the core with the outer ring stepped down one storey
// to a terrace coping, and an elevator headhouse on the tower roof. Storeys: a floor row, then two window rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86731.cells.json`, "utf8"));

const W = 19, D = 26, STOREY = 3;
const NB = [[0, -1], [0, 1], [1, 0], [-1, 0]];        // north, south, east, west
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, r });
const at = (x, z) => cell.get(key(x, z));

// Massing: the lidar roof, median-smoothed over 3x3 (the noisy single cells and notch edges), becomes whole storeys
// plus a 2-block parapet; the street ring is one storey lower than the core (the setback).
for (const c of cell.values()) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  c.boundary = NB.some(([dx, dz]) => !at(c.x + dx, c.z + dz));
  const n0 = Math.min(6, Math.max(4, Math.round((v[v.length >> 1] - c.g - 2) / STOREY)));
  c.setback = c.boundary && n0 === 6;
  c.storeys = c.setback ? 5 : n0;
  c.T = c.g + STOREY * c.storeys;                      // roof slab level (the top of the last storey)
}

// Elevator headhouse: a 3 x 3 core on the tower roof, away from the street edge.
const headCells = [];
for (const x of [4, 5, 6]) for (const z of [10, 11, 12]) { const c = at(x, z); if (c && !c.boundary && c.storeys === 6) headCells.push(c); }
if (headCells.length === 9) for (const c of headCells) c.head = true;
else headCells.length = 0;

// A body column is solid from the ground up to its roof, and so is its neighbour's foundation below it.
const solidBody = (x, z, y) => { const n = at(x, z); return !!n && y <= n.T; };
const headAt = (x, z) => !!at(x, z)?.head;

const out = new Voxels([W, 32, D]);
const windows = [];
const paneState = (dx, dz) => (dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const c of cell.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) out.set(x, y, z, "stone_bricks");              // plinth under the lower cells
  for (let y = g; y < T; y++) {
    const row = (y - g) % STOREY;                                              // 0 = floor/belt row, 1-2 = windows
    const outs = NB.filter(([dx, dz]) => !solidBody(x + dx, z + dz, y));
    if (!outs.length) { if (row === 0) out.set(x, y, z, "smooth_stone"); continue; }   // interior: floor slabs only, air between
    if (y === g) { out.set(x, y, z, "stone_bricks"); continue; }                // base course
    if (row === 0) { out.set(x, y, z, "calcite"); continue; }                  // limestone belt course
    if (outs.length > 1) { out.set(x, y, z, "bricks"); continue; }              // corner pier
    const [dx, dz] = outs[0];
    const along = dz !== 0 ? x : z;
    const storey0 = y - g < STOREY;
    if (z === 0 && dz === -1 && x === 9 && storey0) {                          // the entrance: a dark wood door
      out.set(x, y, z, "dark_oak_door", { facing: "north", half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (z === 0 && dz === -1 && (x === 8 || x === 10) && storey0) { out.set(x, y, z, "stone_bricks"); continue; }   // door surround
    if (along % 3 !== 0) {                                                       // two windows, one brick pier
      out.set(x, y, z, "glass_pane", paneState(dx, dz));
      windows.push({ x, y, z, dx, dz, row });
    } else out.set(x, y, z, "bricks");
  }
  out.set(x, T, z, "smooth_stone");                                             // roof
  if (c.boundary) {
    out.set(x, T + 1, z, "calcite");                                           // cornice, or the terrace coping
    if (!c.setback) out.set(x, T + 2, z, "bricks");                            // parapet
  }
}

// Warm light behind some glass: a lamp in the room just inside a window's lower row, standing on the floor slab.
const LAMPS = ["glowstone", "lantern", "shroomlight"];
let k = 0;
for (const w of windows) {
  if (w.row !== 1 || (w.x * 5 + w.z * 3 + w.y) % 9 !== 0) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz, ic = at(ix, iz);
  if (!ic || w.y < ic.g || w.y >= ic.T || out.get(ix, w.y, iz)) continue;
  const lamp = LAMPS[k++ % LAMPS.length];
  out.set(ix, w.y, iz, lamp, lamp === "lantern" ? { hanging: "false", waterlogged: "false" } : undefined);
}
const lobby = at(9, 1);                                                        // a lamp in the entrance hall
if (lobby && !out.get(9, lobby.g + 1, 1)) out.set(9, lobby.g + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// The elevator headhouse: glass at its lower row on the faces, brick above, a limestone cap.
for (const c of headCells) {
  for (const y of [c.T + 1, c.T + 2]) {
    const outs = NB.filter(([dx, dz]) => !headAt(c.x + dx, c.z + dz));
    if (!outs.length) continue;                                                // the room inside
    if (y === c.T + 1 && outs.length === 1) {
      const [dx, dz] = outs[0];
      out.set(c.x, y, c.z, "glass_pane", paneState(dx, dz));
    } else out.set(c.x, y, c.z, "bricks");
  }
  out.set(c.x, c.T + 3, c.z, "calcite");
}

const info = out.save(`${DIR}/DC86731.nbt`);
const tops = [...cell.values()].map((c) => c.T + (c.boundary ? 2 : 0));
console.log(`storeys: ${[...new Set([...cell.values()].map((c) => c.storeys))].sort().join(",")}, tallest y ${Math.max(...tops)}, windows ${windows.length}, lamps ${k}, headhouse ${headCells.length ? "yes" : "no"}`);
console.log(`blocks ${info.blocks}, palette ${info.palette}`);
