// Biology Building: a 1970s university science block, brown brick piers and tinted glazing on a stone plinth, four storeys
// with a three-storey wing on the lower side. The roof comes from the lidar, smoothed by a 7x7 median and stepped into
// whole storeys (4 blocks each), so every storey stands on the one below. Interiors are air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23894030.cells.json", "utf8"));
const W = 59, D = 59, FLOOR0 = 4, STOREY = 4;

// footprint, lidar ground and roof per cell
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, gr, r] of cells) { ground[x][z] = gr; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;

// smoothed roof: median of the footprint cells within 3 of each cell, then whole storeys (rounded, so a 18 block roof is 4 storeys)
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const N = Array.from({ length: W }, () => Array(D).fill(0));
let maxN = 0;
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  const rs = median(v);
  N[x][z] = Math.min(5, Math.max(2, Math.round((rs - FLOOR0) / STOREY)));
  maxN = Math.max(maxN, N[x][z]);
}
const topY = (x, z) => FLOOR0 + STOREY * N[x][z];          // the roof slab row
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the facade directions of a cell at storey k: neighbours outside the footprint, or with no storey k
const outward = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] <= k);

const g = new Voxels([W, 34, D]);
// brick piers and tinted glazing, light concrete spandrels and storey lines: the 1970s block's palette
const GLASS = "gray_stained_glass", PIER = "bricks", LINE = "light_gray_concrete", SPAN = "stone_bricks", PLINTH = "smooth_stone";

// base: foundation down to each cell's ground, then a stone plinth up to the ground floor's slab
for (const [x, z, gr] of cells) {
  for (let y = 0; y < FLOOR0; y++) g.set(x, y, z, y < gr ? "stone" : (y === FLOOR0 - 1 ? PLINTH : "stone_bricks"));
}

// the entrance: on the south face (outward +z) of the ground storey, the cell nearest x = 29 (the middle of the footprint)
const southFace = cells.filter(([x, z]) => outward(x, z, 0).some(([dx, dz]) => dx === 0 && dz === 1)).map(([x]) => x);
const doorX = southFace.reduce((best, x) => (Math.abs(x - 29) < Math.abs(best - 29) ? x : best), southFace[0]);
const entrance = { x: doorX, z: cells.filter(([x]) => x === doorX).reduce((m, [, z]) => Math.max(m, z), -1) };

// storeys: solid floor slabs across each storey, facade rings, air inside
for (let k = 0; k < maxN; k++) {
  for (const [x, z] of cells) {
    if (N[x][z] <= k) continue;
    const y0 = FLOOR0 + STOREY * k;
    g.set(x, y0, z, LINE);                                      // the floor slab / storey line, across the whole cell
    const out = outward(x, z, k);
    if (out.length === 0) continue;                             // interior: air behind the glass
    // the footprint is a stepped band, so most edge cells are also corners: every facade cell takes the same bay grid
    const [dx, dz] = out[0];
    const pier = x % 4 === 0 || z % 4 === 0;                    // brick piers every 4 blocks each way, glazing between
    if (k === 0 && entrance.x === x && entrance.z === z && dz === 1) {
      // the door under the storey-2 slab, with a lantern hung from that slab over the step (the lantern is the canopy's light)
      g.set(x, y0 + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (k === 0) {
      // the ground floor: a glazed lab band between brick piers, with a stone lintel
      for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, pier ? PIER : GLASS);
      g.set(x, y0 + 3, z, pier ? PIER : SPAN);
      continue;
    }
    // upper storeys: two rows of glazing between brick piers, and a spandrel
    for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, pier ? PIER : GLASS);
    g.set(x, y0 + 3, z, pier ? PIER : SPAN);
    // warm light: a glowstone just behind some panes, standing on the floor slab
    if (!pier && (x * 7 + z * 13 + k * 5) % 9 === 0) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && N[ix][iz] > k && outward(ix, iz, k).length === 0) g.set(ix, y0 + 1, iz, "glowstone");
    }
  }
}

// roof: a slab on every column, a brick parapet on the roof's edge, and roof plant boxes on the core
for (const [x, z] of cells) {
  const T = topY(x, z);
  g.set(x, T, z, LINE);
  const edge = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] < N[x][z]);
  if (edge) g.set(x, T + 1, z, PIER);
  else if (N[x][z] === maxN && x % 9 === 4 && z % 9 === 4 && T + 2 < 34) {
    g.set(x, T + 1, z, "light_gray_concrete"); g.set(x, T + 2, z, "light_gray_concrete");
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23894030.nbt");
console.log(`way_23894030: ${maxN} storeys max, ${stats.blocks} blocks, ${stats.palette} palette`);
