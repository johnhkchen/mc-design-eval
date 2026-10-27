// NZ School of Tourism, Auckland (way 293020966): a 1980s institutional block on a dark basalt plinth, 39 x 43 blocks,
// about 62 blocks to its roof (lidar, median-smoothed and snapped to a 4-block storey grid). The lidar's core reads 44-47
// (about eleven storeys), the middle and east rise to 50-52, and a few single south-east cells reach 61 (spikes, smoothed
// out), so the massing is a broad slab with a stepped east block and a plant box on a lower roof. Storey lines sit on the global 4-block grid
// above each cell's own plinth top, so the slope steps the base and the upper storeys stay level. Facade: white precast
// piers every 4 blocks, light-grey spandrels, blue glass between, a smooth-quartz cornice and parapet. The ground storey
// is a glazed foyer on a basalt riser, with a dark-oak entrance door under a basalt canopy on the lowest-ground face.
// Interiors are a solid core behind a one-block air gap with a floor slab per storey; glowstone sits in the gap behind
// some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(`${HERE}way_293020966.cells.json`, "utf8"));
const W = 39, D = 43, HEIGHT = 74;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                 // ground (y 0 = lowest ground), lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const med3 = (A, x, z) => { const v = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(A[x + dx][z + dz]); return med(v); };
const cellsIn = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) cellsIn.push([x, z]);

// B: the first storey line above the plinth (solid basalt from y 0 up to it, so every cell stands on the ground);
// T: the tier's roof (multiple of 4), smoothed from the lidar so each tier is flat
const B = grid(0), T = grid(0), Q = grid(0);
for (const [x, z] of cellsIn) B[x][z] = 4 * Math.ceil(G[x][z] / 4);
for (const [x, z] of cellsIn) Q[x][z] = Math.max(B[x][z] + 4, 4 * Math.round(med3(R, x, z) / 4));
// the lidar's few 55-61 cells on the south-east are single-cell spikes, read as noise: they go, and the tier is the median
for (const [x, z] of cellsIn) T[x][z] = Math.max(B[x][z] + 4, 4 * Math.round(med3(Q, x, z) / 4));
const TMAX = Math.max(...cellsIn.map(([x, z]) => T[x][z]));

// the outward faces of (x, z) at height y: off the footprint, or beside a neighbour whose roof is already below y
const sides = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || T[nx][nz] <= y;
});
const along = (face, x, z) => (face === "N" || face === "S" ? x : z);

// the entrance: the face whose lowest-ground cells sit lowest, and the middle of those cells along it
const faceCells = { N: [], S: [], E: [], W: [] };
for (const [x, z] of cellsIn) for (const k of sides(x, z, 0)) faceCells[k].push([x, z]);
let entFace = "W", bestG = Infinity;
for (const k of ["W", "N", "S", "E"]) {
  const lo = Math.min(...faceCells[k].map(([x, z]) => G[x][z]));
  if (lo < bestG) { bestG = lo; entFace = k; }
}
const lowRun = faceCells[entFace].filter(([x, z]) => G[x][z] === bestG).map(([x, z]) => along(entFace, x, z)).sort((a, b) => a - b);
const zc = lowRun[lowRun.length >> 1];                           // along-face coordinate of the door
const inwardFacing = { N: "south", S: "north", E: "west", W: "east" }[entFace];   // a door faces the way it was placed: from outside

// the plant room: a 2 x 2 box of plant on the highest roof where four cells share one roof height (the lidar's tower
// lift is a few spikes, so the top may not fit one), with a rod on the tallest cell
let plant = null;
const byTop = [...cellsIn].sort((p, q) => T[q[0]][q[1]] - T[p[0]][p[1]]);
for (const [x, z] of byTop) {
  if (plant) break;
  const t = T[x][z], box = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (box.every(([bx, bz]) => inside(bx, bz) && T[bx][bz] === t) && t < TMAX) plant = [x, z];
}
const tallest = cellsIn.find(([x, z]) => T[x][z] === TMAX);

const g = new Voxels([W, HEIGHT, D]);

// the piers, spandrels, glass and the warm light: one storey is four blocks: spandrel at k 0, glass at k 1-3
const PIER = "white_concrete", SPAN = "light_gray_concrete", GLASS = "light_blue_stained_glass", CORNICE = "smooth_quartz";
const PLINTH = "polished_basalt", BASE = "basalt", ROOF = "gray_concrete", CORE = "stone", SLAB = "smooth_stone";
const DOOR = "dark_oak_door";

for (const [x, z] of cellsIn) {
  const Bc = B[x][z], Tc = T[x][z];

  // the solid plinth from y 0 up to the storey line: a basalt course on its top row where it shows
  for (let y = 0; y < Bc; y++) {
    const showing = sides(x, z, y).length > 0;
    g.set(x, y, z, showing && y === Bc - 1 ? BASE : PLINTH);
  }

  for (let y = Bc; y < Tc; y++) {
    const k = (y - Bc) % 4, storey = (y - Bc) >> 2;
    const ex = sides(x, z, y), ground = storey === 0;
    const top = y === Tc - 1;

    // the roof membrane on the top row; the cornice and parapet on the exposed edge
    if (top) {
      g.set(x, y, z, ex.length ? CORNICE : ROOF);
      // the parapet sits on the roof's outer edge only (off the footprint), not on a setback's shoulder
      if (Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz))) g.set(x, y + 1, z, CORNICE);
      continue;
    }

    if (ex.length) {
      const corner = ex.some((d) => d === "N" || d === "S") && ex.some((d) => d === "E" || d === "W");
      const face = ex[0];
      const a = along(face, x, z);
      const onEntrance = ground && face === entFace && Math.abs(a - zc) <= 1;
      if (k === 0) { g.set(x, y, z, ground ? PLINTH : SPAN); continue; }      // basalt riser or spandrel
      if (corner) { g.set(x, y, z, PIER); continue; }
      if (onEntrance) {
        if (a === zc && k <= 2) {                                             // the door, two blocks tall
          g.set(x, y, z, DOOR, { facing: inwardFacing, half: k === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        } else if (k === 3) g.set(x, y, z, BASE);                              // the basalt canopy over the door
        else g.set(x, y, z, GLASS);
        continue;
      }
      // piers on the global 4-block grid; the ground storey is a glazed foyer with piers only at the corners
      g.set(x, y, z, !ground && a % 4 === 0 ? PIER : GLASS);
      continue;
    }

    // inside the skin: a gap of air behind the glass (floored at each storey line), the core solid
    const gapFace = Object.keys(DIRS).find((d) => {
      const nx = x + DIRS[d][0], nz = z + DIRS[d][1];
      return inside(nx, nz) && sides(nx, nz, y).length > 0 && T[nx][nz] > y;
    });
    if (!gapFace) { g.set(x, y, z, CORE); continue; }
    if (k === 0) { g.set(x, y, z, SLAB); continue; }
    // the glass behind a share of the panes is lit (glowstone on the slab, under the glass)
    const nx = x + DIRS[gapFace][0], nz = z + DIRS[gapFace][1];
    const a = along(gapFace, x, z), bay = Math.floor(a / 4);
    if (k === 1 && a % 4 !== 0 && (bay + storey * 2) % 3 === 0 && !(ground && gapFace === entFace && Math.abs(a - zc) <= 1)) {
      g.set(x, y, z, "glowstone");
    } else g.set(x, y, z, "air");
  }
}

// the plant room: pale walls with a glass row and a roof at the top, standing on its tier's roof membrane; a lightning rod
// on the tallest tip
if (plant) {
  const [px, pz] = plant, Tp = T[px][pz];
  for (const dx of [0, 1]) for (const dz of [0, 1]) {
    const x = px + dx, z = pz + dz;
    g.set(x, Tp, z, SPAN); g.set(x, Tp + 1, z, GLASS); g.set(x, Tp + 2, z, SPAN); g.set(x, Tp + 3, z, ROOF);
  }
}
if (tallest) g.set(tallest[0], TMAX, tallest[1], "lightning_rod", { facing: "up", waterlogged: "false" });

const stats = g.save(`${HERE}way_293020966.nbt`);
console.log(JSON.stringify({ cells: cellsIn.length, TMAX, entFace, zc, plant, maxY: TMAX + 1, ...stats }));
