// 1 Albert Street: a late-1980s office tower in glass and white precast on a shopfront base, about 21 storeys (the lidar
// roof is 80-91 blocks). Storeys are 4 blocks: a floor slab, then two rows of tinted glass between white mullions and a
// spandrel. The roof is the lidar's median, quantised to whole storeys, so the wings stand 20 storeys and the core 21; the
// core's outer two cells set back to 17 storeys, and the core carries a plant room (3 blocks) on alternating 4-block bays.
// Every storey stands on the one below, the foundation fills to each cell's ground, and interiors are air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24009995.cells.json", "utf8"));
const W = 53, D = 24, H = 104, FLOOR0 = 4, STOREY = 4, TOP = 21, SETBACK = 17;

// footprint, lidar ground and roof per cell
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const ground = grid(-1), roof = grid(-1);
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// smoothed roof: the median of the footprint cells within 3 of each cell, quantised to storeys
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const N = grid(0), top = grid(false);
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  N[x][z] = Math.min(TOP, Math.max(3, Math.floor((median(v) - FLOOR0) / STOREY)));
  top[x][z] = N[x][z] === TOP;
}

// distance in cells from the outline (0 = an edge cell), by a breadth-first walk in from the outside
const dist = grid(-1), q = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 0; q.push([x, z]); }
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  for (const [dx, dz] of DIRS) { const nx = x + dx, nz = z + dz; if (inside(nx, nz) && dist[nx][nz] < 0) { dist[nx][nz] = dist[x][z] + 1; q.push([nx, nz]); } }
}

// the core's outer two cells step back: the tower's top four storeys sit inside them
for (const [x, z] of cells) if (top[x][z] && dist[x][z] <= 2) N[x][z] = SETBACK;
let maxN = 0; for (const [x, z] of cells) maxN = Math.max(maxN, N[x][z]);

const topY = (x, z) => FLOOR0 + STOREY * N[x][z];                   // the roof slab row, which the storey below stands under
const outward = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] <= k);

const g = new Voxels([W, H, D]);
const GLASS = "cyan_stained_glass", FRAME = "white_concrete", SPAN = "light_gray_concrete", BASE = "polished_andesite";

// foundation to each cell's ground, then a granite plinth up to the ground floor's slab
for (const [x, z, gr] of cells) {
  for (let y = 0; y < FLOOR0; y++) g.set(x, y, z, y < gr ? "stone" : (y === FLOOR0 - 1 ? "smooth_stone" : "granite"));
}

// the entrance: on the south face (outward +z) of the ground storey, the cell nearest the middle of the width
const southFace = cells.filter(([x, z]) => outward(x, z, 0).some(([dx, dz]) => dx === 0 && dz === 1)).map(([x]) => x);
const doorX = southFace.reduce((best, x) => (Math.abs(x - W / 2) < Math.abs(best - W / 2) ? x : best), southFace[0]);
const entrance = { x: doorX, z: cells.filter(([x]) => x === doorX).reduce((m, [, z]) => Math.max(m, z), -1) };

// storeys: a floor slab per storey on every cell that reaches it, facade rings on the outward faces, air inside
for (let k = 0; k < maxN; k++) {
  for (const [x, z] of cells) {
    if (N[x][z] <= k) continue;
    const y0 = FLOOR0 + STOREY * k;
    g.set(x, y0, z, FRAME);                                     // floor slab / storey line across the whole cell
    const out = outward(x, z, k);
    if (out.length === 0) continue;                             // interior: air behind the glass
    if (out.length >= 2) {                                      // corner: a white pillar up the storey
      for (let y = y0 + 1; y <= y0 + 3; y++) g.set(x, y, z, FRAME);
      continue;
    }
    const [dx, dz] = out[0];
    const alongZ = dz !== 0;                                    // the wall runs along x
    const mullion = alongZ ? x % 4 === 0 : z % 4 === 0;
    if (k === 0 && entrance.x === x && entrance.z === z && dz === 1) {
      // the entrance: a double door under a stone lintel, with the glass band either side of it
      g.set(x, y0 + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 3, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (k === 0) {
      // the shopfront: glass between stone mullions, a polished lintel
      for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, mullion ? "stone_bricks" : GLASS);
      g.set(x, y0 + 3, z, BASE);
      continue;
    }
    // office storeys: two rows of glass between white mullions, and a spandrel
    for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, mullion ? FRAME : GLASS);
    g.set(x, y0 + 3, z, mullion ? FRAME : SPAN);
    // warm light: a glowstone just behind some panes, standing on the floor slab
    if (!mullion && (x * 7 + z * 13 + k * 5) % 9 === 0) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && N[ix][iz] > k && outward(ix, iz, k).length === 0) g.set(ix, y0 + 1, iz, "glowstone");
    }
  }
}

// roof: a cornice slab on every column, a parapet on the outline, and a plant room on alternating 4-block bays of the core
for (const [x, z] of cells) {
  const T = topY(x, z);
  g.set(x, T, z, SPAN);
  if (dist[x][z] === 0) g.set(x, T + 1, z, FRAME);
  else if (top[x][z] && dist[x][z] >= 3 && ((x >> 2) + (z >> 2)) % 2 === 0) {
    for (let y = T + 1; y <= T + 3; y++) g.set(x, y, z, y === T + 3 ? "stone_brick_slab" : BASE);
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24009995.nbt");
console.log(`way_24009995: ${maxN} storeys max, ${stats.blocks} blocks, ${stats.palette} palette`);
