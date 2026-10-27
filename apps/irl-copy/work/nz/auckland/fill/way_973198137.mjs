// way 973198137: a 1980s concrete-frame office block on the Eden Terrace side of the CBD ridge. Precast concrete
// spandrels and mullions, tinted glazing, a granite base and a dark shopfront at street level, a flat roof with a
// parapet and one plant box. Lidar roofs are smoothed (3x3 mean over footprint cells) and quantized to 4-block storeys
// above each cell's own ground, so every storey, setback and roof sits on the storey below. No interiors: a slab per
// storey, a structural grid, and an air gap behind the glass. Some windows get glowstone behind them for dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 70, D = 52, H = 76;
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_973198137.cells.json`, "utf8"));   // [x, z, ground, roof]
const STOREY = 4;

// Materials
const FOUND = "stone_bricks", BASE = "polished_granite", SLAB = "light_gray_concrete", FRAME = "white_concrete";
const WIN = "light_blue_stained_glass", SHOP = "glass", ROOF = "gray_concrete", CAP = "black_concrete";

const grid = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, ground, roof] of cells) grid[z][x] = { ground, roof };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && grid[z][x] !== null;
const faces = (x, z) => ({ n: !inside(x, z - 1), s: !inside(x, z + 1), w: !inside(x - 1, z), e: !inside(x + 1, z) });
const perim = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => inside(x, z) && (() => { const f = faces(x, z); return f.n || f.s || f.w || f.e; })()));

// Massing: the lidar roof, 3x3 mean over footprint cells, then whole storeys above the cell's own ground (at least one).
const top = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) { sum += grid[z + dz][x + dx].roof; n++; }
  const gr = grid[z][x].ground, s = sum / n;
  top[z][x] = Math.max(gr + STOREY, gr + STOREY * Math.round((s - gr) / STOREY));
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const column = (x, z) => x % 6 === 3 && z % 6 === 3;   // structural grid, interior only
const DIRS = { n: "north", s: "south", w: "west", e: "east" };

// Entrance: the ground-floor perimeter cell on the south face nearest the footprint's centre (north if none faces south).
let xc = 0, nc = 0; for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) { xc += x; nc++; }
xc /= nc;
let door = null;
for (const face of ["s", "n"]) {
  let best = Infinity;
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!perim[z][x] || !faces(x, z)[face]) continue;
    const d = Math.abs(x - xc); if (d < best) { best = d; door = { x, z, face }; }
  }
  if (door) break;
}

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const gr = grid[z][x].ground, T = top[z][x], f = faces(x, z), per = perim[z][x];
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);                                    // foundation to the cell's ground
  const n = (T - gr) / STOREY;
  for (let k = 0; k < n; k++) {
    const b = gr + STOREY * k, ground = k === 0, topS = k === n - 1;
    put(x, b, z, per && ground ? BASE : SLAB);                                          // slab / base course
    if (per) {
      const corner = (f.n || f.s) && (f.w || f.e);
      const bay = f.n || f.s ? x : z;
      const mull = corner || bay % 3 === 0;
      const lit = !ground && !mull && (x * 5 + z * 3 + k * 7) % 7 === 0;
      for (const dy of [1, 2]) put(x, b + dy, z, mull ? (ground ? BASE : FRAME) : (ground ? SHOP : WIN));
      put(x, b + 3, z, FRAME);                                                          // precast spandrel line
      if (lit) {
        const nb = [[x, z + 1], [x, z - 1], [x + 1, z], [x - 1, z]].find(([a, c]) => inside(a, c) && !perim[c][a] && grid[c][a].ground <= b + 1 && top[c][a] > b + 2 && !column(a, c));
        if (nb) put(nb[0], b + 1, nb[1], "glowstone");
      }
    } else {
      if (topS) put(x, T - 1, z, ROOF);
    }
  }
  if (per) put(x, T, z, SLAB);                                                          // parapet on every top edge
  if (!per && column(x, z)) for (let y = gr; y < T - 1; y++) put(x, y, z, FRAME);      // columns carry the slabs
}

// Entrance: a dark-oak door in the perimeter bay, a black lintel over it, and glazed flanks.
if (door) {
  const b = grid[door.z][door.x].ground, { x, z } = door;
  const fs = DIRS[door.face];
  put(x, b + 1, z, "dark_oak_door", { facing: fs, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, b + 2, z, "dark_oak_door", { facing: fs, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    const a = x + (door.face === "s" || door.face === "n" ? dx : 0), c = z + (door.face === "s" || door.face === "n" ? 0 : dx);
    if (inside(a, c) && perim[c][a] && grid[c][a].ground <= b + 3 && top[c][a] > b + 3) put(a, b + 3, c, CAP);
    if (dx !== 0 && inside(a, c) && perim[c][a] && grid[c][a].ground <= b + 1 && top[c][a] > b + 2) { put(a, b + 1, c, SHOP); put(a, b + 2, c, SHOP); }
  }
}

// Roof plant: a 6x6 box on the highest flat interior patch, its walls on the roof deck, a cap and a lightning rod.
let best = null, cx0 = 0, cz0 = 0, cn = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) { cx0 += x; cz0 += z; cn++; }
cx0 /= cn; cz0 /= cn;
for (let z = 2; z < D - 3; z++) for (let x = 2; x < W - 3; x++) {
  const T = top[z][x]; let ok = true;
  for (let dz = -2; dz <= 3 && ok; dz++) for (let dx = -2; dx <= 3 && ok; dx++) {
    if (!inside(x + dx, z + dz) || perim[z + dz][x + dx] || top[z + dz][x + dx] !== T) ok = false;
  }
  if (!ok) continue;
  const score = T * 1000 - Math.hypot(x - cx0, z - cz0);
  if (!best || score > best.score) best = { x, z, T, score };
}
if (best) {
  const { x: bx, z: bz, T } = best;
  for (let dz = -2; dz <= 3; dz++) for (let dx = -2; dx <= 3; dx++) {
    const x = bx + dx, z = bz + dz, edge = dx === -2 || dx === 3 || dz === -2 || dz === 3;
    for (let y = T; y < T + 4; y++) if (edge) put(x, y, z, SLAB);
    put(x, T + 4, z, ROOF);
  }
  put(bx, T + 5, bz, "lightning_rod");
}

const { blocks, palette } = g.save(`${DIR}/way_973198137.nbt`);
console.log(`way_973198137: ${blocks} blocks, palette ${palette}, storeys ${Math.min(...cells.map(([x, z, gr]) => (top[z][x] - gr) / STOREY))}-${Math.max(...cells.map(([x, z, gr]) => (top[z][x] - gr) / STOREY))}, roof ${Math.max(...cells.map(([x, z]) => top[z][x]))}, door ${door ? `${door.face} ${door.x},${door.z}` : "none"}, plant ${best ? "yes" : "no"}`);
