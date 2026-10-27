// Te Wharau o Horotiu / Bledisloe House (way 23906750): a mid-century office slab read from the lidar record. The roof
// steps from 40 blocks on the wings (about 33 m, nine storeys) to 44 over the main slab (eleven storeys of 4 blocks),
// with a 52 and 56 block core rising in the middle (the mast on top). A pale quartz pier-and-spandrel grid, the piers
// reading as the structure, white spandrel bands at each floor line, blue glass set one block back from the face so an
// air gap sits behind it, a stone-clad plinth with shopfronts and two iron-door entrances under small canopies, a
// cornice on the parapet and a grey roof. Every column is solid from y 0 up to its own tier, so nothing floats; the
// storey lines sit on absolute y multiples of 4 so every band runs level across the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const X = 52, Z = 111, Y = 69;
const cells = JSON.parse(readFileSync(`${DIR}/way_23906750.cells.json`, "utf8"));

// the footprint as grids: inF[x][z], ground G, lidar roof R
const grid = (v) => Array.from({ length: X }, () => new Array(Z).fill(v));
const inF = grid(false), G = grid(0), R = grid(0);
for (const [x, z, g, r] of cells) { inF[x][z] = true; G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && inF[x][z];
// outward normals, with the facing name a door or window takes
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// tiers: the lidar roof medianed over a 5x5 window, quantised to 4-block storeys, at least one storey above the ground
const T = grid(0);
for (const [x, z, g] of cells) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) vals.push(R[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  T[x][z] = Math.max(4 * Math.ceil((g + 4) / 4), 4 * Math.round(vals[vals.length >> 1] / 4));
}

// exposed faces of each footprint cell, and the runs of exposed faces along each wall line (u = the cell's position
// along the wall; a run is contiguous cells sharing an outward normal), so bays count from a run's own end
const faces = grid(null);
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const f = DIRS.map(([dx, dz], d) => (inside(x + dx, z + dz) ? null : d)).filter((d) => d !== null);
  faces[x][z] = f;
}
const runOf = new Map();   // "x,z,d" -> { start, end }
const lines = new Map();   // "d,line" -> [u...]
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) for (const d of faces[x][z] ?? []) {
  const [dx] = DIRS[d]; const key = dx !== 0 ? `${d},${x}` : `${d},${z}`; const u = dx !== 0 ? z : x;
  if (!lines.has(key)) lines.set(key, []); lines.get(key).push(u);
}
for (const [key, us] of lines) {
  us.sort((a, b) => a - b);
  const d = Number(key.split(",")[0]), line = Number(key.split(",")[1]), alongZ = DIRS[d][0] !== 0;
  let s = 0;
  for (let i = 0; i <= us.length; i++) {
    if (i === us.length || (i > 0 && us[i] !== us[i - 1] + 1)) {
      for (let j = s; j < i; j++) {
        const u = us[j], x = alongZ ? line : u, z = alongZ ? u : line;
        runOf.set(`${x},${z},${d}`, { start: us[s], end: us[i - 1], u });
      }
      s = i;
    }
  }
}

// the block at each cell, [name, state] or null; air is left out of the file
const B = new Array(X * Y * Z).fill(null);
const at = (x, y, z) => (z * Y + y) * X + x;
const put = (x, y, z, name, state) => { if (y >= 0 && y < Y) B[at(x, y, z)] = [name, state]; };
const carve = (x, y, z) => { if (y >= 0 && y < Y) B[at(x, y, z)] = "air"; };

// the four facade materials: quartz piers, white spandrels, blue glass and stone plinth
const PIER = "quartz_pillar", SPANDREL = "white_concrete", GLASS = "light_blue_stained_glass", PLINTH = "stone_bricks";
const windows = [];      // [x, y, z, d] for glass set one block back
const doors = [];        // [x, z, d] for the entrances
const doorCell = new Set();

// the entrances: the middle of the longer wall runs at street level, where the ground is low enough for a door
// the footprint's walls are short stair-steps, so a door is any plain (single-face) wall cell on low ground in a run of
// at least three, spaced at least 14 cells apart, taken in order along the street side
const cand = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const fs = faces[x][z] ?? [];
  if (fs.length !== 1 || G[x][z] > 1) continue;
  const run = runOf.get(`${x},${z},${fs[0]}`);
  if (run && run.end - run.start >= 2) cand.push([x, z, fs[0]]);
}
for (const [x, z, d] of cand) {
  if (doors.length >= 6) break;
  if (doors.some(([dx, dz]) => Math.abs(dx - x) + Math.abs(dz - z) < 14)) continue;
  doors.push([x, z, d]); doorCell.add(`${x},${z},${d}`);
}

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF[x][z]) continue;
  const t = T[x][z], g = G[x][z], fs = faces[x][z] ?? [], ex = fs.length > 0, corner = fs.length > 1;
  for (let y = 0; y < t; y++) {
    const s = y >> 2, r = y & 3;
    if (!ex) { put(x, y, z, y === t - 1 ? "gray_concrete" : SPANDREL); continue; }   // interior fill, grey roof on top
    if (y === t - 1) { put(x, y, z, "smooth_quartz"); continue; }                   // parapet course
    // the facade: from the first exposed face (a corner takes the pier everywhere but the plinth and the bands)
    const d = fs[0], run = runOf.get(`${x},${z},${d}`) ?? { start: 0, end: 0, u: 0 };
    const pier = corner || run.u === run.start || run.u === run.end || (run.u - run.start) % 3 === 0;
    if (s === 0 && (r === 0 || r === 3)) { put(x, y, z, PLINTH); continue; }
    if (s > 0 && (r === 0 || r === 3)) { put(x, y, z, SPANDREL); continue; }
    if (!pier && y >= g) {
      // blue glass one block back from the face, with a warm lamp behind some panes
      windows.push([x, y, z, d]);
      put(x, y, z, GLASS);
      continue;
    }
    put(x, y, z, s === 0 ? PLINTH : PIER, PIER === "quartz_pillar" && s > 0 ? { axis: "y" } : undefined);
  }
  if (ex) {
    // a cornice course on the exterior ring, and the rest of the roof grey
    put(x, t, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// glass goes one block back: the air gap behind each pane, and a lamp in the gap in some of them
for (const [x, y, z, d] of windows) {
  const [dx, dz] = DIRS[d]; const qx = x - dx, qz = z - dz;
  if (!inF[qx]?.[qz]) continue;
  carve(qx, y, qz);
  if (((x * 7 + y * 5 + z * 3) % 13 === 0) && y >= 4 && (y & 3) === 1) B[at(qx, y, qz)] = ["glowstone"];
}

// entrances: an iron door in the recess at street level, its air gap, and a canopy over it on the wall
for (const [x, z, d] of doors) {
  const [dx, dz, facing] = DIRS[d]; const qx = x - dx, qz = z - dz;
  const st = (half) => ({ facing: DIRS[d][2], half, hinge: "left", open: "false", powered: "false" });
  if (inF[qx]?.[qz]) { carve(qx, 1, qz); carve(qx, 2, qz); }
  put(x, 1, z, "iron_door", st("lower")); put(x, 2, z, "iron_door", st("upper"));
  // canopy: slabs on the outside of the wall above the door, five cells wide, attached to the wall face
  const alongZ = dx !== 0;
  for (let k = -2; k <= 2; k++) {
    const cx = alongZ ? x + dx : x + k, cz = alongZ ? z + k : z + dz;
    if (!inside(cx, cz) && cx >= 0 && cz >= 0 && cx < X && cz < Z) put(cx, 3, cz, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// roof: a lightning mast on the top of the tallest tier, and two plant boxes on the 52 block core
const top = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inF[x][z] && T[x][z] === 56 && !(faces[x][z] ?? []).length) top.push([x, z]);
if (top.length) {
  const cx = top.reduce((a, c) => a + c[0], 0) / top.length, cz = top.reduce((a, c) => a + c[1], 0) / top.length;
  const [mx, mz] = top.reduce((best, c) => ((c[0] - cx) ** 2 + (c[1] - cz) ** 2 < (best[0] - cx) ** 2 + (best[1] - cz) ** 2 ? c : best));
  for (let y = 56; y < 61; y++) put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false" });
}
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF[x][z] || T[x][z] < 52 || (faces[x][z] ?? []).length) continue;
  if (x % 9 === 4 && z % 9 === 4 && T[x][z] === 52) { put(x, 52, z, "light_gray_concrete"); put(x, 53, z, "iron_bars"); }
}

// write the blocks: a vanilla structure file, the palette made by the Voxels class
// anything still null inside a column up to its tier is the interior fill; "air" is the carved gap and is left out
const vox = new Voxels([X, Y, Z]);
for (const [x, z] of cells.map((c) => [c[0], c[1]])) for (let y = 0; y < T[x][z]; y++) if (!B[at(x, y, z)]) B[at(x, y, z)] = ["white_concrete"];
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const b = B[at(x, y, z)];
  if (!b || b === "air") continue;
  vox.set(x, y, z, b[0], b[1]);
}
const out = vox.save(`${DIR}/way_23906750.nbt`);
console.log(JSON.stringify({ footprint: cells.length, windows: windows.length, doors: doors.length, ...out }));
