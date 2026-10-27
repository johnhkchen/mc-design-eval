// Kennards Self Storage, Auckland (way 291058280): a 1990s-2000s purpose-built self-storage box, five storeys over a
// basalt-grey plinth, the roof stepping between tiers as the lidar does. Concrete tilt-panel walls in light grey, white
// bands at each storey line, glass-pane windows on a 3-block pier grid, roller-door bays (red) on the ground floor, a
// glazed entrance with a red canopy on the north face, a red sign band on the top storey, a lift overrun and AC plant
// on the roof. Floors sit on absolute 4-block lines, so every tier, storey and setback stands on the solid below it.
// Interiors are air with a slab per storey; glowstone behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058280.cells.json", "utf8"));
const W = 61, D = 75, TOP = 39;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// foundation top F0: the first storey line above the ground (multiples of 4), so every floor lines up across the footprint
const F0 = Array.from({ length: W }, (_, x) => Array.from({ length: D }, (_, z) => (inside(x, z) ? 4 * Math.ceil((G[x][z] + 1) / 4) : 0)));
// roof T: the lidar roof, median of a 5x5 window inside the footprint, snapped to the storey grid, at least one storey above F0
const median = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = Math.max(4 * Math.round(median(x, z) / 4), F0[x][z] + 4);

const solidAt = (x, z, y) => {                                     // the footprint cell's block at y is solid (plinth, slab, roof)
  if (!inside(x, z)) return false;
  const f = F0[x][z], t = T[x][z];
  return y <= f || y >= t || (y - f) % 4 === 0;
};
const isAir = (x, z, y) => inside(x, z) && y > F0[x][z] && y < T[x][z] && (y - F0[x][z]) % 4 !== 0;

const g = new Voxels([W, TOP, D]);
const put = (x, y, z, block, state) => { if (x >= 0 && y >= 0 && z >= 0 && x < W && y < TOP && z < D) g.set(x, y, z, block, state); };
const SLAB = { type: "bottom", waterlogged: "false" };

// the entrance: the five-cell run of north-face cells with the lowest ground, centred on x0 (pad, glazed door, canopy)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the entrance: five outer cells in a straight run on one face (same line, same foundation), lowest ground
const alongX = (d) => d === "N" || d === "S";
let entrance = null;
for (const face of Object.keys(DIRS)) {
  const [dx, dz] = DIRS[face];
  const outer = new Map();
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x + dx, z + dz)) outer.set(`${alongX(face) ? z : x}:${alongX(face) ? x : z}`, [x, z]);
  for (const [key, [x, z]] of outer) {
    const line = alongX(face) ? z : x, t0 = alongX(face) ? x : z;
    const run = [-1, 0, 1].map((d) => outer.get(`${line}:${t0 + d}`));
    if (run.some((c) => !c) || new Set(run.map(([a, b]) => F0[a][b])).size !== 1) continue;
    const s = run.reduce((a, [u, v]) => a + G[u][v], 0);
    if (!entrance || s < entrance.s) entrance = { face, dx, dz, cells: run, t: t0, line, s };
  }
}
const tanOf = (face, x, z) => (alongX(face) ? x : z);
const lineOf = (face, x, z) => (alongX(face) ? z : x);
// 0 none, 1 glazed door (middle three), 2 pier beside the door (outer two)
const entranceAt = (face, x, z) => {
  if (!entrance || face !== entrance.face || lineOf(face, x, z) !== entrance.line) return 0;
  const d = Math.abs(tanOf(face, x, z) - entrance.t);
  return d === 0 ? 1 : d === 1 ? 2 : 0;
};
const xc = entrance ? tanOf(entrance.face, ...entrance.cells[1]) : W / 2;
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // a pane along an E-W wall
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // a pane along an N-S wall

// the facade block for one exposed air cell, by face (N, S, W or E), storey k, row r (1 sill, 2 glass, 3 head) and tangential index t
function facade(face, k, r, t, top, corner, entr) {
  if (corner) return { block: "white_concrete" };
  if (k === 0) {
    if (entr === 1) return { block: "glass" };
    if (entr === 2) return { block: "white_concrete" };
    if ((t % 8) >= 2 && (t % 8) <= 4) return { block: "red_concrete" };     // roller-door bay, three wide
    if (r === 1) return { block: "smooth_stone" };
    return { block: "light_gray_concrete" };
  }
  if (r === 1) return { block: "white_concrete" };
  if (r === 3) {
    if (top && entrance && face === entrance.face && Math.abs(t - xc) <= 14) return { block: "red_concrete" };   // the sign band
    return { block: "white_concrete" };
  }
  if (t % 3 === 0) return { block: "white_concrete" };                    // a pier of the window grid
  return { block: "light_blue_stained_glass_pane", state: face === "N" || face === "S" ? PANE_NS : PANE_EW };
}

let counts = { walls: 0, floors: 0, roofs: 0 };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const f = F0[x][z], t = T[x][z], n = (t - f) / 4;
  // foundation, plinth and the ground-floor line
  for (let y = 0; y < f; y++) put(x, y, z, "stone_bricks");
  put(x, f, z, "smooth_stone");
  // floor slabs at each storey line above the ground floor, and the roof
  for (let k = 1; k < n; k++) { put(x, f + 4 * k, z, "gray_concrete"); counts.floors++; }
  const outside = Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz));
  const lowerNeighbour = Object.values(DIRS).some(([dx, dz]) => inside(x + dx, z + dz) && T[x + dx][z + dz] < t);
  put(x, t, z, outside || lowerNeighbour ? "white_concrete" : "gray_concrete"); counts.roofs++;
  if (outside) {                                                             // a parapet with a cap on the outer edge
    put(x, t + 1, z, "light_gray_concrete");
    put(x, t + 2, z, "smooth_stone_slab", SLAB);
  }
  // exposed air cells: the envelope, with the facade by face
  for (let y = f + 1; y < t; y++) {
    if (!isAir(x, z, y)) continue;
    const faces = Object.keys(DIRS).filter((d) => {
      const [dx, dz] = DIRS[d];
      return !inside(x + dx, z + dz) || solidAt(x + dx, z + dz, y);
    });
    if (!faces.length) continue;
    const corner = faces.length >= 2 && faces.some((a) => "NS".includes(a)) && faces.some((a) => "WE".includes(a));
    const face = faces[0], k = Math.floor((y - f) / 4), r = (y - f) % 4;
    const top = k === n - 1;
    const tan = face === "N" || face === "S" ? x : z;
    const fc = facade(face, k, r, tan, top, corner, entranceAt(face, x, z));
    put(x, y, z, fc.block, fc.state);
    counts.walls++;
    // a warm light in some windows: glowstone in the air behind the pane
    if (fc.block.endsWith("stained_glass_pane") && (tan + 2 * k + (face === "N" || face === "W" ? 0 : 3)) % 6 === 0) {
      const [dx, dz] = DIRS[face];
      if (isAir(x - dx, z - dz, y)) put(x - dx, y, z - dz, "glowstone");
    }
  }
}

// the entrance: a stoop padded out from the north face, a glazed door, and a red canopy on two posts
if (entrance) {
  const { dx, dz, cells } = entrance, f = F0[cells[0][0]][cells[0][1]];
  // the stoop: two cells out from the run, on the ground, then the canopy at the storey line over the door
  for (const [x, z] of cells) for (const j of [1, 2]) {
    const px = x + dx * j, pz = z + dz * j;
    for (let y = G[x][z]; y < f; y++) put(px, y, pz, "stone_bricks");
    put(px, f, pz, "smooth_stone");
    put(px, f + 4, pz, "red_concrete");
  }
  for (const i of [0, 2]) {
    const [x, z] = cells[i];
    for (let y = f + 1; y <= f + 3; y++) put(x + dx * 2, y, z + dz * 2, "white_concrete");
  }
  const [x, z] = cells[1];
  put(x + dx * 2, f + 3, z + dz * 2, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant: a lift overrun (4x4, three high) on a flat interior tier at the highest roof, and AC units on a grid
const Tmax = Math.max(...T.flat());
let overrun = null;
for (let x = 2; x < W - 6 && !overrun; x++) for (let z = 2; z < D - 6 && !overrun; z++) {
  let ok = true;
  for (let dx = 0; dx < 4 && ok; dx++) for (let dz = 0; dz < 4 && ok; dz++) if (!inside(x + dx, z + dz) || T[x + dx][z + dz] !== Tmax) ok = false;
  if (ok) overrun = { x, z };
}
if (overrun) {
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) {
    for (let y = Tmax + 1; y <= Tmax + 2; y++) put(overrun.x + dx, y, overrun.z + dz, "light_gray_concrete");
    put(overrun.x + dx, Tmax + 3, overrun.z + dz, "smooth_stone");
  }
}
for (let x = 3; x < W - 3; x += 9) for (let z = 3; z < D - 3; z += 9) {
  if (!inside(x, z) || T[x][z] < Tmax - 4 || solidAt(x, z, T[x][z] + 1)) continue;
  if (overrun && x >= overrun.x - 1 && x <= overrun.x + 4 && z >= overrun.z - 1 && z <= overrun.z + 4) continue;
  put(x, T[x][z] + 1, z, "iron_block");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058280.nbt");
const tierHist = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) tierHist[T[x][z]] = (tierHist[T[x][z]] || 0) + 1;
console.log(JSON.stringify({ blocks: g.count(), palette: g.palette.length, entrance: entrance && { face: entrance.face, t: entrance.t, s: entrance.s }, overrun, Tmax, tiers: tierHist, counts }));
