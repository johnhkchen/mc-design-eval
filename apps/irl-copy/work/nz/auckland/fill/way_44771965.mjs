// Atrium on Takutai: a glass-and-concrete commercial tower of the 1990s-2010s, on a stone plinth. The ground storey is a
// double-height glazed shopfront and lobby (the atrium); above it, storeys of 4 blocks with two rows of glazing and a
// spandrel, and a white concrete frame on 3-block bays. The lidar roof (median-smoothed, quantised to storeys) gives the
// podium-and-tower massing: each cell is its own column from the plinth up, so every storey stands on the one below.
// Interiors are air behind the glass; a slab per storey; a parapet on the roof's edge; plant and planters on the roof.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_44771965.cells.json", "utf8"));
const W = 113, D = 86, STOREY = 4, FLOOR0 = 2, UP0 = 7;     // ground slab y 2; upper storey k slab at UP0 + 4k

// footprint, lidar ground and roof per cell
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, gr, r] of cells) { ground[x][z] = gr; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;

// smoothed roof: median of the footprint cells within 3 of each cell, then upper storeys under it (the parapet may sit a little over)
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const N = Array.from({ length: W }, () => Array(D).fill(0));
let maxN = 0;
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  N[x][z] = Math.max(2, Math.floor((median(v) - UP0) / STOREY));
  maxN = Math.max(maxN, N[x][z]);
}
const topY = (x, z) => UP0 + STOREY * N[x][z];              // the roof deck row
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the facade directions of a cell at storey k (k = -1: the ground storey, open only to the outside): neighbours outside the footprint, or with no storey k
const outward = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || (k >= 0 && N[x + dx][z + dz] <= k));

const g = new Voxels([W, 84, D]);
// full glass blocks read blue from the street; spandrels are darker than the frames
const GLASS = "light_blue_stained_glass", CONC = "white_concrete", SPAN = "gray_concrete", BASE = "stone_bricks";

// plinth: solid from y 0 up to the cell's ground (foundation), then stone to the ground floor slab
for (const [x, z, gr] of cells) for (let y = 0; y < FLOOR0; y++) g.set(x, y, z, y <= gr ? "stone" : "smooth_stone");
for (const [x, z] of cells) g.set(x, FLOOR0, z, CONC);      // the ground floor slab across the whole cell

// the entrance: on the south face (outward +z) of the ground storey, the cell nearest the footprint's middle
const meanX = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const southFace = cells.filter(([x, z]) => outward(x, z, -1).some(([dx, dz]) => dx === 0 && dz === 1)).map(([x, z]) => [x, z]);
const entrance = southFace.reduce((best, c) => (Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best), southFace[0]);

// ground storey: a double-height glazed atrium front on a stone base course, a lintel, and a ceiling slab at UP0
for (const [x, z] of cells) {
  const out = outward(x, z, -1);
  if (out.length === 0) continue;                           // interior: air behind the glass
  if (out.length >= 2 && x % 3 === 0 && z % 3 === 0) { for (let y = 3; y <= 6; y++) g.set(x, y, z, CONC); continue; }
  const [dx, dz] = out[0];
  const mullion = dz !== 0 ? x % 3 === 0 : z % 3 === 0;     // bays of 3 along each face
  if (entrance[0] === x && entrance[1] === z && dz === 1) {
    // the lobby door under a stone lintel
    g.set(x, 3, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 4, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 5, z, "smooth_stone"); g.set(x, 6, z, "smooth_stone");
    continue;
  }
  g.set(x, 3, z, BASE);
  for (let y = 4; y <= 5; y++) g.set(x, y, z, mullion ? CONC : GLASS);
  g.set(x, 6, z, "smooth_stone");
}
// the atrium's warm light: glowstone behind some panes of the ground storey
for (const [x, z] of cells) {
  const out = outward(x, z, -1);
  if (out.length !== 1 || (x * 5 + z * 11) % 7 !== 0) continue;
  const [dx, dz] = out[0];
  const ix = x - dx, iz = z - dz;
  if (dz !== 0 ? x % 3 === 0 : z % 3 === 0) continue;
  if (inside(ix, iz) && outward(ix, iz, -1).length === 0) g.set(ix, 4, iz, "glowstone");
}

// upper storeys: a slab across each cell, two rows of glazing between frames, and a spandrel; air inside
for (let k = 0; k < maxN; k++) {
  const y0 = UP0 + STOREY * k;
  for (const [x, z] of cells) {
    if (N[x][z] <= k) continue;
    g.set(x, y0, z, CONC);                                  // the floor slab / storey line
    const out = outward(x, z, k);
    if (out.length === 0) continue;
    // a stepped (diagonal) edge makes many cells two-sided: only the mullion grid's nodes are solid there, else the glass runs on
    if (out.length >= 2 && x % 3 === 0 && z % 3 === 0) { for (let y = y0 + 1; y <= y0 + 3; y++) g.set(x, y, z, CONC); continue; }
    const [dx, dz] = out[0];
    const mullion = dz !== 0 ? x % 3 === 0 : z % 3 === 0;
    for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, mullion ? CONC : GLASS);
    g.set(x, y0 + 3, z, mullion ? CONC : SPAN);
    // warm light: a glowstone just behind some panes, standing on the floor slab
    if (!mullion && (x * 7 + z * 13 + k * 5) % 9 === 0) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && N[ix][iz] > k && outward(ix, iz, k).length === 0) g.set(ix, y0 + 1, iz, "glowstone");
    }
  }
}

// roof: a deck on every column, a parapet on the roof's edge and on each step down, and plant and planters on the roof
for (const [x, z] of cells) {
  const T = topY(x, z);
  g.set(x, T, z, SPAN);
  const edge = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] < N[x][z]);
  if (edge) { g.set(x, T + 1, z, CONC); continue; }
  if (x % 8 === 4 && z % 8 === 4 && T + 2 <= 72) { g.set(x, T + 1, z, "light_gray_concrete"); g.set(x, T + 2, z, "light_gray_concrete"); }
  else if (N[x][z] <= 5 && x % 6 === 1 && z % 6 === 1) g.set(x, T + 1, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_44771965.nbt");
console.log(`way_44771965: ${maxN} upper storeys max, roof to y ${Math.max(...cells.map(([x, z]) => topY(x, z)))}, ${stats.blocks} blocks, ${stats.palette} palette`);
