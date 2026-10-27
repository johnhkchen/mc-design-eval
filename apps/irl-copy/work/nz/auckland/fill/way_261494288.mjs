// Mt Eden / Newton, Auckland: a 1960s-70s reinforced-concrete commercial block, flat roofed, 3 storeys at its high
// (north-east) end and 2 on the wings, with a dark volcanic-basalt base course (polished andesite, the local stone),
// painted off-white concrete bays, tinted glazing on concrete mullions, a shopfront band on the ground floor and two
// entrances with canopy bands. Each storey is 4 blocks, counted from its own ground. Its tiers come from the lidar roof
// (5x5 median, quantised to whole storeys); a 3-storey tier that is not 2 cells in from the lower ground keeps
// only 2, so the top steps in at the edges. The glazing sits in front of a one-block air gap; the body behind is solid,
// so every floor and tier stands on what is below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494288.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494288.nbt";

const W = 122, D = 62, H = 24, STOREY = 4, MAX_STOREYS = 3;
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

// 1. Smooth the lidar roof (median over 5x5 footprint cells) and quantise it to whole storeys above each cell's ground.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const storeys = new Int8Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) vals.push(roof[idx(x + dx, z + dz)]);
  const smooth = median(vals);
  const n = Math.round((smooth - ground[idx(x, z)]) / STOREY);
  storeys[idx(x, z)] = Math.min(MAX_STOREYS, Math.max(1, n));
}

// 2. Setbacks: a 3-storey column keeps its top storey only if every cell within 1 is also 3 storeys; otherwise it
//    drops to 2, so the top steps in at the edges and the storey below becomes a terrace.
const tiers = new Int8Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const n = storeys[idx(x, z)];
  let plateau = true;
  if (n >= 3) for (let dz = -1; dz <= 1 && plateau; dz++) for (let dx = -1; dx <= 1 && plateau; dx++) {
    const xx = x + dx, zz = z + dz;
    if (!inside(xx, zz) || storeys[idx(xx, zz)] < n) plateau = false;
  }
  tiers[idx(x, z)] = n >= 3 && !plateau ? n - 1 : n;
}
const top = new Int16Array(W * D);                    // absolute y of the roof surface (the first air block)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) top[idx(x, z)] = ground[idx(x, z)] + STOREY * tiers[idx(x, z)];

// 3. Facade cells: a footprint cell on the outside edge, or beside a column at least one storey lower, faces that way.
//    Two faces make a corner (a solid pier). Behind a single-face cell, one cell in, is the air gap.
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
  const along = face && face.dx !== 0 ? z : x;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                 // foundation up to the cell's ground

  for (let y = gr; y < R; y++) {
    const rel = y - gr, k = rel >> 2, rr = rel & 3, topRow = y === R - 1;
    if (door && k === 0) {                                                    // entrance: door, transom, canopy band
      if (rr === 0) put(x, y, z, "oak_door", { facing: door, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (rr === 1) put(x, y, z, "oak_door", { facing: door, half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (rr === 2) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "dark_oak_slab", { type: "bottom" });
      continue;
    }
    if (corner) { put(x, y, z, rr === 0 && k === 0 ? "polished_andesite" : "white_concrete"); continue; }   // corner piers
    if (face) {
      if (rr === 0) put(x, y, z, k === 0 ? "polished_andesite" : "light_gray_concrete");   // basalt base course; floor string courses
      else if (rr === 3) put(x, y, z, "light_gray_concrete");                              // spandrel, cornice on the top storey
      else if (along % 12 === 0) put(x, y, z, "white_concrete");                          // full-height piers: the bay rhythm
      else if (along % 3 === 0) put(x, y, z, "light_gray_concrete");                      // mullions
      else put(x, y, z, k === 0 ? "light_blue_stained_glass" : "gray_stained_glass");   // shopfront glass; upper glazing
      continue;
    }
    if (gap[c] && (rr === 1 || rr === 2)) {
      if (rr === 1 && glowAt(x, z, k)) put(x, y, z, "glowstone");              // a warm light behind the glass
      continue;                                                                 // the air gap
    }
    put(x, y, z, topRow ? "smooth_stone" : "white_concrete");                  // body; the top row is the roof membrane
  }

  // Parapet with a coping on every roof edge (outside, or a step up from a lower tier).
  if (dirs.length) {
    put(x, R, z, "white_concrete");
    put(x, R + 1, z, "stone_brick_slab", { type: "bottom" });
  }
}

// Roof plant: 2x2 boxes, 2 high, on roof areas at least 2 cells in from any edge, on a 10-cell grid.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (x % 10 !== 5 || z % 10 !== 5) continue;
  const c = idx(x, z);
  if (!inside(x, z) || faceDirs.has(c)) continue;
  const R = top[c];
  const pad = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inside(x + dx, z + dz) && !faceDirs.has(idx(x + dx, z + dz)) && top[idx(x + dx, z + dz)] === R);
  if (!pad) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(x + dx, R, z + dz, "light_gray_concrete");
    put(x + dx, R + 1, z + dz, dx === 0 && dz === 0 ? "iron_bars" : "stone_brick_slab", dx === 0 && dz === 0 ? undefined : { type: "bottom" });
  }
}

const stats = g.save(OUT);
console.log(`way_261494288: ${stats.blocks} blocks, palette ${stats.palette}, storeys 1-${MAX_STOREYS}, top ${Math.max(...top.filter((_, i) => ground[i] >= 0))}`);
