// Way 1382247136: a 1980s-90s Auckland CBD office tower, 14 storeys to a 56-block roof on a 47 x 42 footprint.
// Era and materials: a dark stone base and lobby, a light precast frame (light gray piers and mullions, cream
// spandrels), blue-tinted glass in mullioned bays, plant boxes on the top set. The lidar roof (5x5 median, then
// rounded to 4-block storeys) gives the massing: the 52-55 core rises to 56, the 44-48 wings step down, and the
// 12-36 setbacks read as terraces. Each column is solid from y 0 to its roof, so every storey and setback
// stands on the one below. The skin is the cells with a side open to the air at that height; one cell in behind
// is an air gap (a floor slab per storey), and the rest is solid core. Some windows have a glowstone in the gap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_1382247136.cells.json", "utf8"));

const W = 47, D = 42, H = 68, N = W * D;
const MAX_ROOF = 56;
const idx = (x, z) => z * W + x;
const inGrid = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// a deterministic hash for the scattered details (which windows are lit, which lanterns hang)
const hh = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

const inF = new Uint8Array(N), R = new Int32Array(N);
for (const [x, z, , r] of cells) { inF[idx(x, z)] = 1; R[idx(x, z)] = r; }

// 1. Smooth the lidar roof: a 5x5 median over footprint cells, so single noisy cells do not make spikes.
const Rm = new Int32Array(N);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, nz = z + dz; if (inGrid(nx, nz) && inF[idx(nx, nz)]) v.push(R[idx(nx, nz)]);
  }
  v.sort((a, b) => a - b); Rm[i] = v[v.length >> 1];
}

// 2. Tiers: the roof rounded to whole 4-block storeys, so each column tops out flat at 4n.
const T = new Int32Array(N);
for (let i = 0; i < N; i++) if (inF[i]) T[i] = clamp(4 * Math.round(Rm[i] / 4), 4, MAX_ROOF);
const maxT = Math.max(...T);

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const SKIN = 2, GAP = 3, CORE = 1;

// A cell is a member at height y if it is in the footprint and its column reaches y.
const mem = (x, z, y) => inGrid(x, z) && inF[idx(x, z)] === 1 && y < T[idx(x, z)];

// 3. Per height: skin = members with a side open to the air (the grid edge, a cell outside the footprint, or a
// neighbouring column that has ended below y). Gap = members behind the skin. The rest is core.
const kinds = [];
for (let y = 0; y < H; y++) {
  const k = new Uint8Array(N);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (mem(x, z, y)) k[idx(x, z)] = CORE;
  const skin = new Uint8Array(N);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = idx(x, z); if (k[i] !== CORE) continue;
    if (DIRS.some(([dx, dz]) => !mem(x + dx, z + dz, y))) skin[i] = 1;
  }
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = idx(x, z); if (k[i] !== CORE || skin[i]) continue;
    if (DIRS.some(([dx, dz]) => inGrid(x + dx, z + dz) && skin[idx(x + dx, z + dz)])) k[i] = GAP;
  }
  for (let i = 0; i < N; i++) if (skin[i]) k[i] = SKIN;
  kinds.push(k);
}
const kindAt = (x, y, z) => (inGrid(x, z) && y >= 0 && y < H ? kinds[y][idx(x, z)] : 0);

// The outward directions of a skin cell at height y, and whether it is a corner (open on two axes).
const normalsAt = (x, y, z) => DIRS.filter(([dx, dz]) => !mem(x + dx, z + dz, y));
const isCorner = (ds) => ds.some(([dx]) => dx) && ds.some(([, dz]) => dz);

// 4. The entrance: a plain skin cell on the north face (the lowest z), nearest the face's middle.
const north = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (kinds[1][idx(x, z)] !== SKIN) continue;
  const ds = normalsAt(x, 1, z);
  if (ds.length === 1 && ds[0][2] === "north") north.push({ x, z });
}
let entrance = null;
if (north.length) {
  const xs = north.map((c) => c.x).sort((a, b) => a - b), mid = xs[xs.length >> 1];
  entrance = north.reduce((best, c) => (Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best));
}

// 5. Lit windows: a pane with a gap behind it gets a glowstone there, about one in seven.
const lit = new Set();
for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (kindAt(x, y, z) !== SKIN || (y & 3) === 0 || (y & 3) === 3 || y < 4) continue;
  if (hh(x, y, z) % 7 !== 0) continue;
  const g = DIRS.find(([dx, dz]) => kindAt(x + dx, y, z + dz) === GAP);
  if (g) lit.add(`${x + g[0]},${y},${z + g[1]}`);
}

// 6. Write the volume.
const v = new Voxels([W, H, D]);
const BASE = "stone_bricks", BODY = "light_gray_concrete", BAND = "smooth_quartz", ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";

for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || y >= T[i]) continue;
  const k = kinds[y][i], f = y >> 2, r = y & 3, top = y === T[i] - 1;
  if (k === CORE) {
    v.set(x, y, z, top ? ROOF : BODY);
  } else if (k === GAP) {
    if (top) v.set(x, y, z, ROOF);
    else if (r === 0) v.set(x, y, z, BODY);                     // the floor slab
    else if (lit.has(`${x},${y},${z}`)) v.set(x, y, z, "glowstone");
    else if (f === 0 && r === 3 && y + 1 < T[i] && hh(x, y, z, 5) % 5 === 0) v.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    const ds = normalsAt(x, y, z);
    const corner = isCorner(ds);
    const onEntrance = entrance && x === entrance.x && z === entrance.z;
    const facing = ds.length ? ds[0][2] : "north";
    if (y === 0) v.set(x, y, z, BASE);                           // the plinth, on the ground
    else if (onEntrance && (y === 1 || y === 2)) {
      // the door: lower and upper halves, hung on the wall running across its facing
      v.set(x, y, z, "iron_door", { facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    }
    else if (onEntrance && y === 3) v.set(x, y, z, BASE);       // the lintel over the door
    else if (f === 0 && r === 3) v.set(x, y, z, BASE);          // the ground storey's head: a stone band
    else if (corner) v.set(x, y, z, BODY);                      // a corner pier, all the way up
    else if (r === 0 || r === 3) v.set(x, y, z, BAND);          // cream spandrel and head bands per storey
    else {
      const alongX = ds.some(([, dz]) => dz);                   // a z-facing wall runs along x
      const mullion = alongX ? x % 3 === 0 : z % 3 === 0;
      if (mullion) v.set(x, y, z, BODY);
      else {
        // a pane connects to whatever stands beside it in the wall's plane, so the glass reads as a run of bays
        const conn = (dx, dz) => (mem(x + dx, z + dz, y) ? "true" : "false");
        const state = alongX
          ? { north: "false", south: "false", east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" }
          : { north: conn(0, -1), south: conn(0, 1), east: "false", west: "false", waterlogged: "false" };
        v.set(x, y, z, GLASS, state);
      }
    }
  }
}

// 7. Roof: a cornice slab on each skin cell whose top is open (it stands on the parapet course below). Only where
// the parapet runs on at the same height along the wall: a lone stair-step cell gets none, or it reads as a dash.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || T[i] >= H) continue;
  if (kindAt(x, T[i] - 1, z) !== SKIN) continue;
  const run = DIRS.some(([dx, dz]) => inGrid(x + dx, z + dz) && inF[idx(x + dx, z + dz)] && T[idx(x + dx, z + dz)] === T[i] && kindAt(x + dx, T[i] - 1, z + dz) === SKIN);
  if (run) v.set(x, T[i], z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
// Plant boxes on the top set: iron units on the 56-block core, standing on its roof membrane.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || T[i] !== maxT) continue;
  if (kindAt(x, T[i] - 1, z) === CORE && x % 6 === 2 && z % 6 === 3) v.set(x, T[i], z, "iron_block");
}

const out = DIR + "way_1382247136.nbt";
const stats = v.save(out);
console.log(JSON.stringify({ cells: cells.length, maxRoof: maxT, entrance, litWindows: lit.size, ...stats }));
