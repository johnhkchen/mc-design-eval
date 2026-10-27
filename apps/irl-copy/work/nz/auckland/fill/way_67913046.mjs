// Edenz College, Auckland (OSM way 67913046): a 1980s-style concrete-and-glass college block, nine storeys
// (lidar roof about 34 above the lowest ground, parapet to 36). Three tiers: a full podium to y 12, a ring
// setback to y 24 (3 blocks in from the edge), and a core tower to y 34 (7 in). Each tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_67913046.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_67913046.nbt";
const g = new Voxels([42, 48, 44]);

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const K = (x, z) => x * 1000 + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(K(x, z), gr);
const inF = (x, z) => ground.has(K(x, z));
const gOf = (x, z) => ground.get(K(x, z));

// distance in from the footprint edge (1 = edge cell)
const dist = new Map(), q = [];
for (const [x, z] of cells) if (NB.some(([dx, dz]) => !inF(x + dx, z + dz))) { dist.set(K(x, z), 1); q.push([x, z]); }
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i], d = dist.get(K(x, z));
  for (const [dx, dz] of NB) { const a = x + dx, b = z + dz; if (inF(a, b) && !dist.has(K(a, b))) { dist.set(K(a, b), d + 1); q.push([a, b]); } }
}
const D = (x, z) => dist.get(K(x, z));
const topOf = (x, z) => { const d = D(x, z); return d >= 7 ? 34 : d >= 3 ? 24 : 12; };
const groundTop = (gr) => 4 * Math.floor(gr / 4) + 4;   // the ground storey ends on the next storey line

// outward faces at height y: the neighbour has no wall there (off the footprint, or its top is below y)
const exposed = (x, z, y) => NB.filter(([dx, dz]) => {
  const a = x + dx, b = z + dz;
  return !inF(a, b) || (y >= gOf(a, b) && topOf(a, b) <= y);
});
const CORE = 9;   // cells this deep in hold structural columns (a 6-block grid), so the floor slabs have something under them
const column = (x, z) => D(x, z) >= CORE && x % 6 === 0 && z % 6 === 0;

// 1. the envelope, cell by cell, bottom to top
for (const [x, z] of cells) {
  const gr = gOf(x, z), t = topOf(x, z), gt = groundTop(gr), d = D(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");                       // foundation
  for (let y = gr; y < t; y++) {
    if (y === t - 1) { g.set(x, y, z, t === 34 ? "gray_concrete" : "smooth_stone"); continue; }   // roof surface
    const faces = exposed(x, z, y);
    if (faces.length === 0) {
      if (column(x, z)) g.set(x, y, z, "light_gray_concrete");
      else if (y % 4 === 0 || y === gr) g.set(x, y, z, "smooth_stone");                          // floor slabs
      continue;
    }
    if (faces.length >= 2) { g.set(x, y, z, "white_concrete"); continue; }                     // corner column
    const [dx, dz] = faces[0];
    const along = dx !== 0 ? z : x;
    const pier = along % 3 === 0;
    const pane = () => g.set(x, y, z, "light_blue_stained_glass_pane",
      dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
               : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    if (y === gr) g.set(x, y, z, "polished_andesite");                                         // base course
    else if (y < gt) {
      if (y === gt - 1) g.set(x, y, z, "light_gray_concrete");                                 // shopfront head
      else if (pier) g.set(x, y, z, "white_concrete"); else pane();
    } else {
      const ly = y % 4;
      if (ly === 0 || ly === 3) g.set(x, y, z, "light_gray_concrete");                         // storey line, spandrel
      else if (pier) g.set(x, y, z, "white_concrete"); else pane();
    }
  }
}

// 2. parapets: the top tier's edge to y 36, a low kerb on the first setback's edge
for (const [x, z] of cells) {
  const t = topOf(x, z), d = D(x, z);
  const edge = NB.some(([dx, dz]) => !inF(x + dx, z + dz) || topOf(x + dx, z + dz) < t);
  if (t === 34 && edge) { g.set(x, 34, z, "white_concrete"); g.set(x, 35, z, "light_gray_concrete"); }
  if (t === 24 && d === 3 && edge) g.set(x, 24, z, "white_concrete");
}

// 3. the entrance: the street face with the most ground-level exposure, a bay off-centre, dark oak doors, a lamp inside
const gl = cells.filter(([x, z, gr]) => gr <= 1 && exposed(x, z, gr + 1).length === 1);
const byDir = new Map();
for (const [x, z, gr] of gl) { const [dx, dz] = exposed(x, z, gr + 1)[0]; const k = `${dx},${dz}`; byDir.set(k, [...(byDir.get(k) || []), [x, z, gr, dx, dz]]); }
const [, faceCells] = [...byDir.entries()].sort((a, b) => b[1].length - a[1].length)[0];
const alongs = faceCells.map(([x, z, , dx]) => (dx !== 0 ? z : x)).sort((a, b) => a - b);
const mid = alongs[Math.floor(alongs.length / 2)];
const [ex, ez, egr, edx, edz] = faceCells
  .filter(([x, z, , dx]) => ((dx !== 0 ? z : x) % 3) === 1)
  .sort((a, b) => Math.abs((a[3] !== 0 ? a[1] : a[0]) - mid) - Math.abs((b[3] !== 0 ? b[1] : b[0]) - mid))[0];
const facing = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" }[`${edx},${edz}`];
const door = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
g.set(ex, egr + 1, ez, "dark_oak_door", door("lower"));
g.set(ex, egr + 2, ez, "dark_oak_door", door("upper"));
g.set(ex - edx, egr + 1, ez - edz, "glowstone");   // lamp in the lobby behind the door, on the ground slab

// 4. warm lights behind some windows: a glowstone on the air gap's floor, one cell in from the glass
for (const [x, z] of cells) {
  const t = topOf(x, z), gr = gOf(x, z);
  for (let y = gr + 1; y < t - 1; y++) {
    if (y % 4 !== 1 || exposed(x, z, y).length !== 1) continue;
    if ((x * 31 + z * 17 + y * 7) % 9 !== 0) continue;
    const [dx, dz] = exposed(x, z, y)[0];
    const ix = x - dx, iz = z - dz;
    if (!inF(ix, iz) || y < gOf(ix, iz) || topOf(ix, iz) - 1 <= y || column(ix, iz)) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 5. roof plant on the tower's roof: two iron units, the only things above the parapet line
for (const [x0, x1, z0, z1] of [[16, 19, 17, 19], [16, 19, 22, 24]]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inF(x, z) || topOf(x, z) !== 34 || D(x, z) < CORE) continue;
    g.set(x, 34, z, "iron_block"); g.set(x, 35, z, "iron_block");
  }
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, palette ${res.palette}`);
