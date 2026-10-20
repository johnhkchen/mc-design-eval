import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE102-0013 (2013): 14-storey glass-and-white-concrete commercial/office block.
// Granite base, white concrete piers and floor bands, light-blue glazing, a one-cell
// setback ring above storey 9, mechanical plant on the roof, sparse warm windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0013-14F";
const W = 31, H = 81, D = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inside = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey slab levels above each cell's own ground (14 storeys: 6, then 5/5/4 repeating).
const S = [6, 11, 16, 20, 25, 30, 34, 39, 44, 48, 53, 57, 62, 66];
const ROOF = 66;   // roof deck
const TOP = 68;    // top block of the 69-block building
const UPPER = 48;  // above this, the one-cell perimeter ring is set back

// Chebyshev distance to the nearest non-footprint cell.
const insetMap = new Map();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  let best = 10;
  outer: for (let d = 1; d <= 10; d++) {
    for (let dx = -d; dx <= d; dx++)
      for (let dz = -d; dz <= d; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== d) continue;
        if (!inside(x + dx, z + dz)) { best = d; break outer; }
      }
  }
  insetMap.set(key, best);
}
const insetOf = (x, z) => insetMap.get(`${x},${z}`);

// A cell exists at relative height dy if it is inside the footprint, and above the
// setback only if it is at least two cells in from the edge.
const present = (x, z, dy) =>
  inside(x, z) && (dy <= UPPER || insetOf(x, z) >= 2);

// Outward faces at height dy (neighbours not present at that height).
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const normals = (x, z, dy) => DIRS.filter(([dx, dz]) => !present(x + dx, z + dz, dy));

// Entrance: lower-tier edge cell facing north (z-1), nearest the footprint's mid x.
let sumX = 0, cnt = 0;
const northEdge = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (insetOf(x, z) === 1 && !inside(x, z - 1)) { northEdge.push(x); sumX += x; cnt++; }
}
let entranceX = null;
if (cnt > 0) {
  const cx = sumX / cnt;
  entranceX = northEdge.reduce((b, x) => (Math.abs(x - cx) < Math.abs(b - cx) ? x : b), northEdge[0]);
}
const isEntranceCell = (x, z) => entranceX !== null && x === entranceX && !inside(x, z - 1) && insetOf(x, z) === 1;

for (const [x, z, gr] of cells) {
  const ins = insetOf(x, z);

  // Foundation up to this cell's ground, then granite base course.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  set(x, gr, z, "polished_granite");

  // Floor slabs at storey lines (the ring has no slabs above the setback).
  for (const s of S) if (s <= UPPER || ins >= 2) set(x, gr + s, z, "white_concrete");

  // Rim on the setback terrace.
  if (ins === 1) set(x, gr + UPPER + 1, z, "smooth_quartz");

  // Roof parapet on the top tier, mechanical plant on the core.
  if (ins >= 2) {
    set(x, gr + ROOF + 1, z, "white_concrete");
    set(x, gr + TOP, z, "white_concrete");
  }
  if (ins >= 4) {
    set(x, gr + ROOF + 1, z, "light_gray_concrete");
    set(x, gr + TOP, z, (x + z) % 4 === 0 ? "iron_bars" : "gray_concrete");
  }

  // Facade rows between slabs.
  for (let dy = 1; dy < ROOF; dy++) {
    if (S.includes(dy)) continue;
    if (!present(x, z, dy)) continue;
    const nrm = normals(x, z, dy);
    if (nrm.length === 0) continue; // interior air behind the glass

    const corner = nrm.length !== 1;
    const north = nrm.some(([dx, dz]) => dz === -1);
    const along = (!corner && nrm[0][0] !== 0) ? z : x;
    const isPier = corner || along % 3 === 0;
    const y = gr + dy;

    if (dy === 5 && dy < UPPER) { set(x, y, z, "smooth_quartz"); continue; } // ground fascia

    if (dy < 6) {
      // Ground-storey shopfront
      if (isPier) set(x, y, z, "white_concrete");
      else if (dy === 4 && north && entranceX !== null && Math.abs(x - entranceX) <= 2)
        set(x, y, z, "smooth_quartz"); // entrance canopy band
      else if (dy === 2 && along % 9 === 4) set(x, y, z, "glowstone");
      else set(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Upper storeys
    let i = 0;
    while (!(S[i] < dy && dy < S[i + 1])) i++;
    if (isPier) set(x, y, z, "white_concrete");
    else if (dy === S[i] + 2 && i % 2 === 0 && (along + i * 3) % 9 === 0) set(x, y, z, "shroomlight");
    else set(x, y, z, "light_blue_stained_glass");
  }
}

// Entrance doors, last so they override the shopfront glass.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!isEntranceCell(x, z)) continue;
  const gr = ground.get(key);
  set(x, gr + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(x, gr + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  set(x, gr + 3, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
