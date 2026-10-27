// One Enfield, Mt Eden: a 1970s concrete-framed office block on the slope below Maungawhau. Its ground is 0 to 8 blocks
// across the footprint (the west end is the uphill side), and the lidar roof is about 30 blocks above y 0 on most cells,
// with lower wings toward the west. Storeys are 4 blocks: a white concrete floor line, then two rows of tinted glazing and
// a grey spandrel, between light concrete piers. The floor plate is at y 8 for every cell; the downhill side (east and
// north) shows two basement storeys of windows on a stone podium. Each cell's roof is the lidar's height smoothed by a 7x7
// median and stepped to whole storeys, so every storey stands on the one below. Interiors are air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_903669974.cells.json", "utf8"));
const W = 40, D = 24, FLOOR = 8, STOREY = 4, PARAPET_TOP = 30;

// footprint, lidar ground and roof per cell
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;

// storeys per cell: the roof median-smoothed over 3 cells, then whole storeys under a 2-block parapet (roof slab at FLOOR + 4n)
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const N = Array.from({ length: W }, () => Array(D).fill(0));
let maxN = 0;
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  N[x][z] = Math.max(3, Math.floor((median(v) - FLOOR - 2) / STOREY));
  maxN = Math.max(maxN, N[x][z]);
}
const roofSlab = (x, z) => FLOOR + STOREY * N[x][z];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] <= k);

const CONC = "white_concrete", FRAME = "light_gray_concrete", GLASS = "light_blue_stained_glass", SPAN = "gray_concrete";
const g = new Voxels([W, 36, D]);

// podium: solid from y 0 up to the floor plate. Where the ground is 4 or lower, two basement storeys show on the downhill
// side: a stone base at 0-3, a floor slab at 4, windows at 5-6 on the outside faces, and a stone band at 7 under the
// ground floor. Elsewhere the podium is solid stone, which is the foundation under the ground the cell stands on.
const basement = (x, z) => ground[x][z] <= 4;
for (const [x, z] of cells) {
  const out = outward(x, z, -1);                                   // footprint edges only
  for (let y = 0; y < FLOOR; y++) {
    if (!basement(x, z)) { g.set(x, y, z, y < 4 ? "stone" : "stone_bricks"); continue; }
    if (y < 4) g.set(x, y, z, "stone");
    else if (y === 4) g.set(x, y, z, CONC);                        // basement floor slab
    else if (y === 7) g.set(x, y, z, "stone_bricks");              // base course under the ground floor
    else if (out.length) {                                         // basement windows on the outside
      const [dx, dz] = out[0], pier = dz !== 0 ? x % 4 === 0 : z % 4 === 0;
      if (out.length === 1) g.set(x, y, z, pier ? FRAME : GLASS);
      else g.set(x, y, z, FRAME);
    }
  }
  g.set(x, FLOOR, z, CONC);                                        // ground floor slab (the floor plate)
}

// entrance: the south-facing ground cell with the highest ground (nearest the street level), on the ground storey
const southCells = cells.filter(([x, z]) => outward(x, z, 0).some(([dx, dz]) => dx === 0 && dz === 1));
const door = southCells.reduce((best, c) => (c[2] > best[2] || (c[2] === best[2] && Math.abs(c[0] - 20) < Math.abs(best[0] - 20)) ? c : best), southCells[0]);
const [doorX, doorZ] = door;

// storeys: floor slab per cell, a facade ring on the outside, air inside
for (let k = 0; k < maxN; k++) {
  for (const [x, z] of cells) {
    if (N[x][z] <= k) continue;
    const y0 = FLOOR + STOREY * k;
    g.set(x, y0, z, CONC);
    const out = outward(x, z, k);
    if (out.length === 0) continue;                                 // interior: air behind the glass
    if (out.length >= 2) {                                          // corner: a concrete pier
      for (let y = y0 + 1; y <= y0 + 3; y++) g.set(x, y, z, FRAME);
      continue;
    }
    const [dx, dz] = out[0];
    const alongZ = dz !== 0;                                        // the wall runs along x
    const pier = alongZ ? x % 4 === 0 : z % 4 === 0;
    if (k === 0 && x === doorX && z === doorZ && dz === 1) {
      // the entrance: a door under a stone lintel, set in the ground storey's glazing
      g.set(x, y0 + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (k === 0) {
      // the ground storey: a shopfront band of glass between frames, with a stone lintel
      for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, pier ? FRAME : GLASS);
      g.set(x, y0 + 3, z, "smooth_stone");
      continue;
    }
    // upper storeys: two rows of tinted glazing between piers, and a spandrel under the next floor
    for (let y = y0 + 1; y <= y0 + 2; y++) g.set(x, y, z, pier ? FRAME : GLASS);
    g.set(x, y0 + 3, z, pier ? FRAME : SPAN);
    // warm light: a glowstone just inside some panes (a lit office), on the floor slab
    if (!pier && (x * 7 + z * 13 + k * 5) % 9 === 0) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && N[ix][iz] > k && outward(ix, iz, k).length === 0) g.set(ix, y0 + 1, iz, "glowstone");
    }
  }
}

// roof: a slab on every cell, a parapet on the roof edge with a stone cap, and plant boxes on a grid over the roof
for (const [x, z] of cells) {
  const T = roofSlab(x, z);
  g.set(x, T, z, "light_gray_concrete");
  const edge = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] < N[x][z]);
  if (edge) {
    g.set(x, T + 1, z, FRAME);
    if (T + 2 <= PARAPET_TOP) g.set(x, T + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else if (x % 8 === 4 && z % 8 === 4 && T + 2 <= PARAPET_TOP) {
    g.set(x, T + 1, z, "light_gray_concrete");                     // plant boxes
    g.set(x, T + 2, z, "smooth_stone");
  } else if (x % 8 === 0 && z % 8 === 0 && T + 1 <= PARAPET_TOP) {
    g.set(x, T + 1, z, "lantern", { hanging: "false", waterlogged: "false" }); // roof lights
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_903669974.nbt");
console.log(`way_903669974: ${maxN} storeys max, ${stats.blocks} blocks, ${stats.palette} palette`);
