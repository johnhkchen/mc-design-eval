// Life Central, Auckland: a 1980s-style concrete commercial block. A white-painted concrete frame with light-grey
// string courses and mullions, tinted-glass window bands, a polished base course, shopfronts and two entrances on the
// ground floor, a 4-storey east wing setting back to 3 on its inner ring, and a 2-storey west wing. Each storey is 4
// blocks (about 3.3 m), counted from its own ground. The facade glazing sits in front of a one-block air gap; the body
// behind it is solid, so every floor and tier stands on what is below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494323.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494323.nbt";

const W = 158, D = 113, H = 29, STOREY = 4, MAX_STOREYS = 4;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const idx = (x, z) => z * W + x;
const ground = new Int16Array(W * D).fill(-1);       // -1 = outside the footprint
const roof = new Int16Array(W * D);
for (const [x, z, g, r] of cells) { ground[idx(x, z)] = g; roof[idx(x, z)] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[idx(x, z)] >= 0;

// The four sides: E = +x, S = +z. The facing word is what a door's `facing` state takes.
const SIDES = [
  { dx: 1, dz: 0, name: "E", facing: "east" },
  { dx: -1, dz: 0, name: "W", facing: "west" },
  { dx: 0, dz: 1, name: "S", facing: "south" },
  { dx: 0, dz: -1, name: "N", facing: "north" },
];

// 1. Smooth the lidar roof: the median over a 5x5 neighbourhood of footprint cells (noise to flat tiers).
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const roofSmooth = new Float32Array(W * D);
const storeys = new Int8Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) vals.push(roof[idx(x + dx, z + dz)]);
  roofSmooth[idx(x, z)] = median(vals);
  const n = Math.round((roofSmooth[idx(x, z)] - ground[idx(x, z)]) / STOREY);
  storeys[idx(x, z)] = Math.min(MAX_STOREYS, Math.max(1, n));
}

// 2. Setbacks: a column of 3+ storeys keeps its top storey only if it is at least 2 cells in from any outside cell or
//    any lower column. Where it is not, the storey below becomes a terrace.
const tiers = new Int8Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const n = storeys[idx(x, z)];
  let plateau = true;
  if (n >= 3) for (let dz = -2; dz <= 2 && plateau; dz++) for (let dx = -2; dx <= 2 && plateau; dx++) {
    const xx = x + dx, zz = z + dz;
    if (!inside(xx, zz) || storeys[idx(xx, zz)] < n) plateau = false;
  }
  tiers[idx(x, z)] = n >= 3 && !plateau ? n - 1 : n;
}
const top = new Int16Array(W * D);                    // absolute y of the roof surface (the first air block)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) top[idx(x, z)] = ground[idx(x, z)] + STOREY * tiers[idx(x, z)];

// 3. Facade cells: a footprint cell on the outside edge, or beside a column at least one storey lower, faces that way.
//    Two faces make a corner (a concrete pillar). Behind a single-face cell, one cell in, is the air gap.
const faceDirs = new Map();                            // cell index -> [{ side, outside }]
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const c = idx(x, z), dirs = [];
  for (const s of SIDES) {
    const nx = x + s.dx, nz = z + s.dz;
    if (!inside(nx, nz)) dirs.push({ ...s, outside: true });
    else if (top[idx(nx, nz)] <= top[c] - STOREY) dirs.push({ ...s, outside: false });
  }
  if (dirs.length) faceDirs.set(c, dirs);
}
const gap = new Uint8Array(W * D);
for (const [c, dirs] of faceDirs) {
  if (dirs.length !== 1) continue;
  const x = c % W, z = Math.floor(c / W), s = dirs[0];
  const gx = x - s.dx, gz = z - s.dz;
  if (inside(gx, gz) && !faceDirs.has(idx(gx, gz))) gap[idx(gx, gz)] = 1;
}

// 4. Entrances: on the two faces with the most outside-facing cells, the cell nearest the face's middle on the lowest
//    ground (the street side).
const faceCount = {};
for (const [, dirs] of faceDirs) if (dirs.length === 1 && dirs[0].outside) faceCount[dirs[0].name] = (faceCount[dirs[0].name] || 0) + 1;
const doors = new Map();                               // cell index -> facing word
for (const name of Object.entries(faceCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n)) {
  const cand = [];
  for (const [c, dirs] of faceDirs) if (dirs.length === 1 && dirs[0].outside && dirs[0].name === name) cand.push(c);
  const side = SIDES.find((s) => s.name === name);
  const along = (c) => (side.dx !== 0 ? Math.floor(c / W) : c % W);
  const mid = cand.reduce((a, c) => a + along(c), 0) / cand.length;
  cand.sort((a, b) => ground[a] - ground[b] || Math.abs(along(a) - mid) - Math.abs(along(b) - mid));
  doors.set(cand[0], side.facing);
}

// 5. Build the massing, column by column, from y 0.
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glowAt = (x, z, k) => (x * 7 + z * 13 + k * 5) % 4 === 0;

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const c = idx(x, z), gr = ground[c], R = top[c];
  const dirs = faceDirs.get(c) || [];
  const face = dirs.length === 1 ? dirs[0] : null;
  const corner = dirs.length >= 2;
  const door = doors.get(c);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                 // foundation up to the cell's ground

  for (let y = gr; y < R; y++) {
    const rel = y - gr, k = rel >> 2, rr = rel & 3, topRow = y === R - 1;
    if (door) {
      if (rr === 0) put(x, y, z, "oak_door", { facing: door, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (rr === 1) put(x, y, z, "oak_door", { facing: door, half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (rr === 2) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "dark_oak_slab", { type: "bottom" });                   // the entrance canopy band
      continue;
    }
    if (corner) { put(x, y, z, "light_gray_concrete"); continue; }
    if (face) {
      if (rr === 0) put(x, y, z, k === 0 ? "polished_andesite" : "light_gray_concrete");   // base course, string courses
      else if (rr === 3) put(x, y, z, topRow ? "light_gray_concrete" : "white_concrete");   // spandrel, cornice
      else {
        const mullion = face.dx !== 0 ? z % 3 === 0 : x % 3 === 0;
        put(x, y, z, mullion ? "light_gray_concrete" : k === 0 ? "light_blue_stained_glass" : "gray_stained_glass");
      }
      continue;
    }
    if (gap[c] && (rr === 1 || rr === 2)) {
      if (rr === 1 && glowAt(x, z, k)) put(x, y, z, "glowstone");              // a warm light behind the glass
      continue;                                                                   // the air gap
    }
    put(x, y, z, topRow ? "smooth_stone" : "white_concrete");                  // body; the top row is the roof membrane (light, so the roofs read from the air)
  }

  // Roof: a parapet with a coping on the outside edge, and plant boxes on the roof.
  if (dirs.some((d) => d.outside)) {
    put(x, R, z, "white_concrete");
    put(x, R + 1, z, "stone_brick_slab", { type: "bottom" });
  }
}

// Plant boxes: 2x2 blocks, 2 high, on roof areas that are at least 3 cells in from the edge.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  const c = idx(x, z);
  if (!inside(x, z) || faceDirs.has(c)) continue;
  const R = top[c];
  const pad = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inside(x + dx, z + dz) && !faceDirs.has(idx(x + dx, z + dz)) && top[idx(x + dx, z + dz)] === R);
  if (!pad) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(x + dx, R, z + dz, "light_gray_concrete");
    put(x + dx, R + 1, z + dz, "light_gray_concrete");
  }
}

// 6. Verify: nothing floats. Every block must connect to the ground through face-adjacent blocks. A window head over
//    the air gap is held up by the wall beside it, so a block-below test would flag every window; connection does not.
const seen = new Uint8Array(W * H * D), at3 = (x, y, z) => (z * H + y) * W + x;
const queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (g.val(x, 0, z)) { seen[at3(x, 0, z)] = 1; queue.push([x, 0, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, y, z] = queue[i];
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= H || nz >= D) continue;
    if (seen[at3(nx, ny, nz)] || !g.val(nx, ny, nz)) continue;
    seen[at3(nx, ny, nz)] = 1; queue.push([nx, ny, nz]);
  }
}
let floating = 0;
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.val(x, y, z) && !seen[at3(x, y, z)]) floating++;
const counts = {};
for (const s of [1, 2, 3, 4]) counts[s] = 0;
for (let c = 0; c < W * D; c++) if (ground[c] >= 0) counts[tiers[c]]++;

const stats = g.save(OUT);
console.log(`way_261494323: ${stats.blocks} blocks, ${stats.palette} palette entries; storeys ${JSON.stringify(counts)}; doors ${[...doors.values()].join(",")}; unsupported ${floating}`);
