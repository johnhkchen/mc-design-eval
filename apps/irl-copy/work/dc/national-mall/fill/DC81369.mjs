// DC81369: 949 1st St SE, Residential-Multifamily (Misc), Capitol Hill, Washington DC.
// A 45 x 30 block footprint: a one-to-three-storey perimeter ring round an open courtyard, with a taller stepped tower
// on the north-centre and a second tower on the south-west. Brick walls with white-concrete piers, stone base course and
// cornice, a shopfront row on the ground floor, a door on the south face, glass panes with an air gap behind them and a
// floor slab per storey, and warm light behind some windows.
//
// Storeys: each storey is two blocks (a window row over a spandrel/floor row), because a one-block storey cannot hold
// a window, an air gap behind it and a floor slab. The lidar heights are followed as given (smoothed), so the tallest
// tier is the record's 6 blocks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const X = 45, Z = 30, H = 18;
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

const cells = JSON.parse(readFileSync(`${HERE}/DC81369.cells.json`, "utf8"));
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[z][x] !== undefined;
const G = Array.from({ length: Z }, () => Array(X).fill(undefined));   // ground per cell
const R0 = Array.from({ length: Z }, () => Array(X).fill(undefined));  // raw lidar roof per cell
for (const [x, z, g, r] of cells) { G[z][x] = g; R0[z][x] = r; }

// Lidar noise: a lower-median over the 3x3 footprint neighbourhood flattens single-cell dips and spikes into clean tiers.
const T = Array.from({ length: Z }, () => Array(X).fill(0));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (inFp(x + dx, z + dz)) vals.push(R0[z + dz][x + dx]);
  }
  vals.sort((a, b) => a - b);
  let t = vals[Math.floor((vals.length - 1) / 2)];
  // the building stands at least one storey above its ground, where it has any roof at all
  if (t > 0) t = Math.max(t, G[z][x] + 1);
  T[z][x] = t;
}
// Majority passes: a cell with at least five built cells of its 3x3 (itself included) becomes built, at the lower median of
// their heights; a cell with fewer than five goes bare. Speckled lidar becomes continuous tiers; the courtyard stays open.
for (let pass = 0; pass < 2; pass++) {
  const next = T.map((row) => row.slice());
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (!inFp(x, z)) continue;
    const nb = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (inFp(x + dx, z + dz) && T[z + dz][x + dx] > 0) nb.push(T[z + dz][x + dx]);
    }
    if (nb.length >= 5) {
      nb.sort((a, b) => a - b);
      next[z][x] = Math.max(nb[Math.floor((nb.length - 1) / 2)], G[z][x] + 1);
    } else next[z][x] = 0;
  }
  for (let z = 0; z < Z; z++) T[z] = next[z];
}
// Stray specks: a built patch of fewer than six cells is lidar noise, not a building, so it goes bare.
{
  const seen = Array.from({ length: Z }, () => Array(X).fill(false));
  for (let z0 = 0; z0 < Z; z0++) for (let x0 = 0; x0 < X; x0++) {
    if (seen[z0][x0] || !(T[z0][x0] > 0)) continue;
    const patch = [[x0, z0]]; seen[z0][x0] = true;
    for (let i = 0; i < patch.length; i++) {
      const [x, z] = patch[i];
      for (const [dx, dz] of DIRS) {
        const nx = x + dx, nz = z + dz;
        if (inFp(nx, nz) && !seen[nz][nx] && T[nz][nx] > 0) { seen[nz][nx] = true; patch.push([nx, nz]); }
      }
    }
    if (patch.length < 6) for (const [x, z] of patch) T[z][x] = 0;
  }
}

// A face is exposed at height y where the neighbour is outside the footprint, or its roof is lower than y.
const exposed = (x, z, y) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz) || T[z + dz][x + dx] <= y);

// Deterministic per-cell hash for the lit windows.
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const blocks = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

// Hero features decided up front: the entrance on the south face, nearest the middle of the front.
let door = null;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z) || T[z][x] < 4 || G[z][x] !== 0) continue;
  if (inFp(x, z + 1)) continue;                       // south edge only
  const score = Math.abs(x - 22) + (Z - 1 - z) * 4;
  if (!door || score < door.score) door = { x, z, score };
}

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  const t = T[z][x], g = G[z][x];
  for (let y = 0; y < t; y++) {
    const ext = exposed(x, z, y);
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }          // foundation
    if (y === t - 1) {                                              // cornice / roof slab
      put(x, y, z, ext ? "stone_bricks" : "smooth_stone");
      continue;
    }
    const k = y - g;
    if (k % 2 === 0) {                                              // spandrel: brick band, or the floor slab inside
      put(x, y, z, ext ? (k === 0 ? "stone_bricks" : "bricks") : "smooth_stone");
      continue;
    }
    // window row: piers on the 3-block grid, glass in the bays, an air gap behind inside
    if (!ext) continue;
    const pier = x % 3 === 0 || z % 3 === 0;
    if (pier) put(x, y, z, "white_concrete");
    else if (k === 1) put(x, y, z, "glass");                        // shopfront glazing on the ground floor
    else put(x, y, z, "glass_pane");
  }
}

// The door: a lower and upper half in the ground-floor row, with a stone head above (the spandrel course).
if (door) {
  const { x, z } = door, g = G[z][x];
  put(x, g, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, g + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    if (inFp(x + dx, z) && at(x + dx, g + 1, z)) put(x + dx, g + 1, z, "lantern", { hanging: "true" });
  }
  put(x, g + 2, z, "stone_bricks");
}

// Window panes connect to their neighbours in the same row.
const panes = [...blocks].filter(([, b]) => b.block === "glass_pane");
for (const [key, b] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const state = {};
  for (const [dx, dz, name] of DIRS) {
    const n = at(x + dx, y, z + dz);
    state[name] = n ? "true" : "false";
  }
  b.state = state;
}
// Behind a lit pane sits a light in the air gap: an empty interior neighbour at the same row.
for (const [key] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const h = hash(x, y, z);
  const behind = DIRS.map(([dx, dz]) => [x + dx, z + dz]).filter(([nx, nz]) => inFp(nx, nz) && !at(nx, y, nz));
  if (behind.length && h % 4 === 0) {
    const [bx, bz] = behind[h % behind.length];
    put(bx, y, bz, h % 16 === 0 ? "shroomlight" : "glowstone");
  }
}

// Roof plant on the flat tops of the towers: small concrete boxes on the courtyard-side roofs, out of the parapet.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z) || T[z][x] < 4) continue;
  if (exposed(x, z, T[z][x] - 1)) continue;
  if ((x * 5 + z * 3) % 13 === 0) put(x, T[z][x], z, "light_gray_concrete");
}

const g = new Voxels([X, H, Z]);
for (const [key, b] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const out = g.save(`${HERE}/DC81369.nbt`);
console.log(`DC81369.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
