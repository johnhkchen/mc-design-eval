// Social Sciences 201E: a 1970s-80s university block, concrete frame and tinted ribbon glazing, on a stone plinth.
// Storeys are 4 blocks: a white concrete floor line, then three rows of facade (two of glass, one spandrel). The roof
// comes from the lidar, smoothed by a 7x7 median and stepped into three tiers (about 9, 10 and 11 storeys); the
// setbacks are whole columns, so every storey stands on the one below. Interiors are air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893806.cells.json", "utf8"));
const W = 81, D = 80, FLOOR0 = 4, STOREY = 4;

// footprint, lidar ground and roof per cell
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;

// smoothed roof: median of the footprint cells within 3 of each cell, then storeys (the parapet must stay under the lidar)
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const N = Array.from({ length: W }, () => Array(D).fill(0));
let maxN = 0;
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  const rs = median(v);
  N[x][z] = Math.max(3, Math.floor((rs - 5) / STOREY));
  maxN = Math.max(maxN, N[x][z]);
}
const topY = (x, z) => FLOOR0 + STOREY * N[x][z];          // the roof slab row
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the facade directions of a cell at storey k: neighbours outside the footprint, or with no storey k
const outward = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] <= k);

const g = new Voxels([W, 62, D]);
// full glass blocks read blue from the street; thin panes on a grey face read as wall. Spandrels are darker than the frames.
const GLASS = "light_blue_stained_glass", CONC = "white_concrete", SPAN = "gray_concrete";

// base: foundation down to each cell's ground, then a stone plinth up to the ground floor's slab
for (const [x, z, gr] of cells) {
  for (let y = 0; y < FLOOR0; y++) g.set(x, y, z, y < gr ? "stone" : (y === FLOOR0 - 1 ? "smooth_stone" : "stone_bricks"));
}

// the entrance: on the south face (outward +z) of the ground storey, the cell nearest x = 40
const southFace = cells.filter(([x, z]) => outward(x, z, 0).some(([dx, dz]) => dx === 0 && dz === 1)).map(([x, z]) => x);
const doorX = southFace.reduce((best, x) => (Math.abs(x - 40) < Math.abs(best - 40) ? x : best), southFace[0]);
const entrance = { x: doorX, z: cells.filter(([x]) => x === doorX).reduce((m, [, z]) => Math.max(m, z), -1) };

// storeys: columns of solid floor slabs, facade rings, air inside
for (let k = 0; k < maxN; k++) {
  for (const [x, z] of cells) {
    if (N[x][z] <= k) continue;
    const y0 = FLOOR0 + STOREY * k;
    g.set(x, y0, z, CONC);                                      // the floor slab / storey line, across the whole cell
    const out = outward(x, z, k);
    if (out.length === 0) continue;                             // interior: air behind the glass
    if (out.length >= 2) {                                      // corner: a concrete pillar
      for (let y = y0 + 1; y <= y0 + 3; y++) g.set(x, y, z, CONC);
      continue;
    }
    const [dx, dz] = out[0];
    const alongZ = dz !== 0;                                    // the wall runs along x
    const mullion = alongZ ? x % 4 === 0 : z % 4 === 0;
    if (k === 0 && entrance.x === x && entrance.z === z && dz === 1) {
      // the door and its flanking glass, under a flat canopy (no overhang: the footprint is the limit)
      g.set(x, y0 + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 3, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (k === 0) {
      // the ground floor: a tall shopfront-style glazed band with a stone lintel
      for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, mullion ? "stone_bricks" : GLASS);
      g.set(x, y0 + 3, z, "smooth_stone");
      continue;
    }
    // upper storeys: two rows of glazing between frames, and a spandrel
    for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, mullion ? CONC : GLASS);
    g.set(x, y0 + 3, z, mullion ? CONC : SPAN);
    // warm light: a glowstone just behind some panes, standing on the floor slab
    if (!mullion && (x * 7 + z * 13 + k * 5) % 9 === 0) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && N[ix][iz] > k && outward(ix, iz, k).length === 0) g.set(ix, y0 + 1, iz, "glowstone");
    }
  }
}

// roof: a slab on every column, a parapet on the roof's edge, and roof plant on the core
for (const [x, z] of cells) {
  const T = topY(x, z);
  g.set(x, T, z, SPAN);
  const edge = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] < N[x][z]);
  if (edge) g.set(x, T + 1, z, CONC);
  else if (x % 8 === 4 && z % 8 === 4 && T + 1 <= 49) g.set(x, T + 1, z, "gray_concrete");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893806.nbt");
console.log(`way_23893806: ${maxN} storeys max, ${stats.blocks} blocks, ${stats.palette} palette`);
