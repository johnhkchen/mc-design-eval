// Lim Chhour Supermarket, Mt Eden / Eden Terrace, Auckland: a 1980s-style concrete mixed-use block. A supermarket on
// the ground floor (glazed shopfronts under a red awning band, two entrances with doors) and offices or flats above.
// The lidar roof sets three masses: a 4-storey north block (roof 19), a 5-storey core set in from its edges (roof 23),
// and a 3-storey south wing (roof 15) with a 4-storey east spine beside it (roof 19). Every storey is 4 blocks, counted
// from one floor datum at y 3, so each floor stands on the one below. Facade glazing sits in front of a one-block air
// gap; a few gaps hold a glowstone behind the glass. The body is solid concrete, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091728.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091728.nbt";

const X = 35, Z = 37, H = 28, FLOOR = 3, STOREY = 4;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const idx = (x, z) => z * X + x;
const ground = new Int16Array(X * Z).fill(-1);       // -1 = outside the footprint
const lidar = new Int16Array(X * Z);
for (const [x, z, g, r] of cells) { ground[idx(x, z)] = g; lidar[idx(x, z)] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && ground[idx(x, z)] >= 0;

// The four sides: E = +x, S = +z. `facing` is the word a door's state takes.
const SIDES = [
  { dx: 1, dz: 0, name: "E", facing: "east" },
  { dx: -1, dz: 0, name: "W", facing: "west" },
  { dx: 0, dz: 1, name: "S", facing: "south" },
  { dx: 0, dz: -1, name: "N", facing: "north" },
];

// 1. Massing: flat tiers read from the lidar roof (the record's ~23 at the core, 19 on the north block, 15 on the wing).
const CORE = (x, z) => x >= 9 && x <= 27 && z >= 2 && z <= 10;
const EAST_SPINE = (x, z) => x >= 21 && z >= 13 && z <= 20;
const roofTier = (x, z) => (CORE(x, z) ? 23 : z <= 12 || EAST_SPINE(x, z) ? 19 : 15);
const top = new Int16Array(X * Z);                    // absolute y of the roof: blocks fill y < top
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (inside(x, z)) top[idx(x, z)] = roofTier(x, z);

// 2. Exposure: a side is open at height y if the cell beside it is outside the footprint, or has no block at y.
const exposure = (x, y, z) => SIDES.filter((s) => {
  const nx = x + s.dx, nz = z + s.dz;
  return !inside(nx, nz) || y >= top[idx(nx, nz)];
});

// 3. Entrances: on the two faces with the most outward ground-floor cells, the one nearest the face's middle on the
//    lowest ground (the street side). Door cells are facade cells on the ground floor, with one open side.
const doors = new Map();                              // cell index -> facing word
const outward = {};
const faceCells = {};
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  const ex = exposure(x, FLOOR, z);
  if (ex.length !== 1 || !ex[0] || !ex.some((s) => !inside(x + s.dx, z + s.dz))) continue;
  const name = ex[0].name;
  (faceCells[name] = faceCells[name] || []).push(idx(x, z));
  outward[name] = (outward[name] || 0) + 1;
}
for (const name of Object.entries(outward).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n)) {
  const side = SIDES.find((s) => s.name === name);
  const along = (c) => (side.dx !== 0 ? Math.floor(c / X) : c % X);
  const cand = faceCells[name];
  const mid = cand.reduce((a, c) => a + along(c), 0) / cand.length;
  cand.sort((a, b) => ground[a] - ground[b] || Math.abs(along(a) - mid) - Math.abs(along(b) - mid));
  doors.set(cand[0], side.facing);
}

// 4. Air gaps: the block behind each window (one cell in, on the same row) is air, so the glass is not backed by a wall.
const gap = new Set();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  for (let y = ground[idx(x, z)]; y < top[idx(x, z)]; y++) {
    const rr = (y - FLOOR) & 3;
    if (y < FLOOR || (rr !== 1 && rr !== 2)) continue;
    const ex = exposure(x, y, z);
    if (ex.length !== 1) continue;
    const s = ex[0], gx = x - s.dx, gz = z - s.dz;
    if (inside(gx, gz) && exposure(gx, y, gz).length === 0 && y < top[idx(gx, gz)]) gap.add(`${gx},${y},${gz}`);
  }
}

// 5. Build the massing, cell by cell, from y 0.
const g = new Voxels([X, H, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glowAt = (x, z, k) => (x * 7 + z * 13 + k * 5) % 4 === 0;
const mullionAt = (side, x, z) => (side.dx !== 0 ? z % 3 === 0 : x % 3 === 0);

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  const c = idx(x, z), gr = ground[c], R = top[c];
  const doorFacing = doors.get(c);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                 // foundation up to the cell's ground
  for (let y = gr; y < Math.min(FLOOR, R); y++) put(x, y, z, "polished_andesite");   // base course to the floor datum

  for (let y = Math.max(gr, FLOOR); y < R; y++) {
    const rel = y - FLOOR, k = rel >> 2, rr = rel & 3, topRow = y === R - 1;
    const ex = exposure(x, y, z);

    if (ex.length >= 2) { put(x, y, z, "light_gray_concrete"); continue; }        // corner pillar

    if (ex.length === 1) {
      const face = ex[0];
      if (doorFacing && k === 0) {                                                 // the entrance bay
        if (rr === 0) put(x, y, z, "iron_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (rr === 1) put(x, y, z, "iron_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (rr === 2) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "red_terracotta");                                       // the awning band
        continue;
      }
      if (rr === 0) put(x, y, z, "light_gray_concrete");                          // floor line / string course
      else if (rr === 3) put(x, y, z, topRow ? "light_gray_concrete" : k === 0 ? "red_terracotta" : "white_concrete");
      else if (mullionAt(face, x, z)) put(x, y, z, "light_gray_concrete");        // glazing bars
      else put(x, y, z, k === 0 ? "light_blue_stained_glass" : "gray_stained_glass");   // shopfront, then tinted glass
      continue;
    }

    if (gap.has(`${x},${y},${z}`)) {                                             // the air gap behind the glass
      if (rr === 1 && glowAt(x, z, k)) put(x, y, z, "glowstone");                // a warm light behind some panes
      continue;
    }
    put(x, y, z, topRow ? "smooth_stone" : "white_concrete");                    // body; light roof membrane on top
  }

  // Parapet: a coping course on any cell open to the sky at its top row, with a half slab cap.
  if (exposure(x, R - 1, z).length >= 1) {
    put(x, R, z, "light_gray_concrete");
    put(x, R + 1, z, "stone_brick_slab", { type: "bottom" });
  }
}

// Roof plant: 2x2 boxes, 2 high, on roof areas at least one cell in from every edge.
const roofBlock = (x, z) => inside(x, z) && exposure(x, top[idx(x, z)] - 1, z).length === 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (x % 8 !== 3 || z % 6 !== 2) continue;
  const R = top[idx(x, z)];
  const pad = [[0, 0], [1, 0], [0, 1], [1, 1]];
  if (!pad.every(([dx, dz]) => roofBlock(x + dx, z + dz) && top[idx(x + dx, z + dz)] === R)) continue;
  for (const [dx, dz] of pad) {
    put(x + dx, R, z + dz, "light_gray_concrete");
    put(x + dx, R + 1, z + dz, "white_concrete");
  }
}

// 6. Verify: nothing floats. Every block must connect to the ground through face-adjacent blocks. A window head over
//    the air gap is held up by the wall beside it, so a block-below test would flag every window; connection does not.
const seen = new Uint8Array(X * H * Z), at3 = (x, y, z) => (z * H + y) * X + x;
const queue = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (g.val(x, 0, z)) { seen[at3(x, 0, z)] = 1; queue.push([x, 0, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, y, z] = queue[i];
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= H || nz >= Z) continue;
    if (seen[at3(nx, ny, nz)] || !g.val(nx, ny, nz)) continue;
    seen[at3(nx, ny, nz)] = 1; queue.push([nx, ny, nz]);
  }
}
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < H; y++) for (let x = 0; x < X; x++) if (g.val(x, y, z) && !seen[at3(x, y, z)]) floating++;

// Massing check: how far the flat tiers sit from the lidar roof, cell by cell.
let cellsN = 0, maxDiff = 0, sumDiff = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (inside(x, z)) {
  const d = Math.abs(top[idx(x, z)] - lidar[idx(x, z)]);
  cellsN++; sumDiff += d; maxDiff = Math.max(maxDiff, d);
}

const stats = g.save(OUT);
console.log(`way_162091728: ${stats.blocks} blocks, ${stats.palette} palette entries; tiers 15/19/23; doors ${[...doors.values()].join(",")}; unsupported ${floating}; roof vs lidar mean ${(sumDiff / cellsN).toFixed(1)} max ${maxDiff}`);
