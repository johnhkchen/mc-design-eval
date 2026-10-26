// DC70437: 1999 I St NW, Residential-Apartment-Elevator. A mid-century brick apartment block with limestone bands,
// eight storeys of two blocks each (about 1.3 m-scale storeys read as a 2-block rhythm: window row over a stone band),
// stepped down to a 4-block lobby wing on the east and a 13/15/16 block core. Downhill to the south: the foundation shows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70437.cells.json`, "utf8"));
const W = 20, D = 41, H = 28;

const grid = (v) => Array.from({ length: D }, () => Array(W).fill(v));
const G = grid(0), RAW = grid(0);
for (const [x, z, g, r] of cells) { G[z][x] = g; RAW[z][x] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && RAW[z][x] > 0;

// lidar noise into flat tiers: 3x3 median over the footprint, then the low wings (2-5 blocks) snap to one 4-block tier
const T = grid(0);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) vals.push(RAW[z + dz][x + dx]);
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  T[z][x] = m <= 5 ? 4 : m;
}

const top = (x, z) => (inF(x, z) ? T[z][x] : 0);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the faces of a cell at height y that look out: a neighbour outside the footprint, or one whose roof is below y
const exposed = (x, z, y) => NB.filter(([dx, dz]) => top(x + dx, z + dz) <= y);
const shellAt = (x, z, y) => exposed(x, z, y).length > 0;

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const g = G[z][x], t = T[z][x];
  for (let y = 0; y < t; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                  // foundation: solid from y 0 up to the ground
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                // plinth course
    const shell = shellAt(x, z, y);
    if (y === t - 1) { put(x, y, z, "smooth_stone"); continue; }             // roof slab
    if (y === t - 2) { put(x, y, z, shell ? "calcite" : "smooth_stone"); continue; } // cornice / interior slab
    if (y % 2 === 0) { put(x, y, z, shell ? "calcite" : "smooth_stone"); continue; } // string course / storey slab
    if (!shell) continue;                                                   // air behind the glass (lamps placed below)
    // window row: piers of brick every third bay, glass panes between, running along the face the cell looks out of
    const zFace = exposed(x, z, y).some(([, dz]) => dz !== 0);
    const xFace = exposed(x, z, y).some(([dx]) => dx !== 0);
    if (zFace === xFace) { put(x, y, z, "bricks"); continue; }              // corners stay brick
    const idx = zFace ? x : z;
    if (idx % 3 === 0) { put(x, y, z, "bricks"); continue; }
    const state = zFace
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "gray_stained_glass_pane", state);
  }
}

// lamps behind some glass: the inward neighbour of a pane, standing on the storey slab below it
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const t = T[z][x];
  for (let y = 1; y <= t - 3; y += 2) {
    if (!shellAt(x, z, y) || v.get(x, y, z)?.block !== "minecraft:gray_stained_glass_pane") continue;
    const [dx, dz] = exposed(x, z, y)[0];
    const ix = x - dx, iz = z - dz;
    if (!inF(ix, iz) || shellAt(ix, iz, y)) continue;
    const h = (x * 31 + z * 17 + y * 7) % 10;
    if (h === 0) put(ix, y, iz, "lantern", { hanging: "false" });
    else if (h === 4) put(ix, y, iz, "glowstone");
  }
}

// parapets on the outer edge of each tier
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  if (NB.some(([dx, dz]) => !inF(x + dx, z + dz))) put(x, T[z][x], z, "stone_bricks");
}

// roof plant on the 13-block tier: a few units on the interior roof
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z) || T[z][x] !== 13) continue;
  if (NB.some(([dx, dz]) => !inF(x + dx, z + dz))) continue;
  if ((x * 3 + z) % 13 === 0) put(x, 13, z, "light_gray_concrete");
}

// entrance: a double door in the lobby on the north (street) face, with a stone lintel above
for (const x of [10, 11]) {
  const hinge = x === 10 ? "left" : "right";
  put(x, 0, 0, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 1, 0, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  put(x, 2, 0, "calcite");
}

const out = `${DIR}/DC70437.nbt`;
const res = v.save(out);
console.log(JSON.stringify({ out, ...res }));
