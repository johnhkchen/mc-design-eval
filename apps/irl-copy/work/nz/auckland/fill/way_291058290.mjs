// Harbour Green, Auckland (way 291058290): a 1980s concrete-frame office block, eleven storeys (about 44 blocks) on a
// basalt-faced plinth with a low podium at its foot. Lidar roof heights are snapped to two tiers: a 43 crown over most
// of the footprint, a 39 setback on its lower edges, and 2-block ground cells read as a paved podium. Each storey is a
// 4-block module: a light-grey spandrel line at every floor (y = 4k), three rows of tinted glass between white concrete
// piers every third bay, and a white cornice and parapet on the outer ring. Corners are piers. The ground floor is a
// shopfront with a glass door on the lower face, and a few panes have glowstone in the air gap behind them. Interiors
// are air with a floor slab per storey; the roof carries a louvred plant box.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058290.cells.json", "utf8"));
const W = 33, D = 38, H = 56;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const T = Array.from({ length: W }, () => Array(D).fill(-1));   // top of the cell, snapped from the lidar roof
for (const [x, z, g, r] of cells) {
  G[x][z] = g;
  // lidar noise snapped to tiers: a podium stays at its own height, the crown at 43, the setback edges at 39
  T[x][z] = r <= 3 ? r : r >= 41 ? 43 : 39;
}
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const topOf = (x, z) => (inside(x, z) ? T[x][z] : -1);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };

// the faces of a cell exposed at height y: outside the footprint, or beside a neighbour with nothing standing at y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k];
  return topOf(x + dx, z + dz) < y;
});

const g = new Voxels([W, H, D]);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = T[x][z];

  // foundation: solid from y 0 up to the ground under the cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // the podium: a solid 2-block ground cell with a paved top
  if (top <= 3) {
    for (let y = gr; y < top; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, top, z, "smooth_stone");
    continue;
  }

  for (let y = gr; y <= top; y++) {
    const ex = exposed(x, z, y);
    const shell = ex.length > 0;

    if (y === top) {                                    // roof: cornice on the shell, roof membrane inside
      g.set(x, y, z, shell ? "white_concrete" : "smooth_stone");
      if (shell && ex.some(k => !inside(x + DIRS[k][0], z + DIRS[k][1]))) g.set(x, y + 1, z, "white_concrete");   // parapet
      continue;
    }
    if (y === gr) { g.set(x, y, z, shell ? "polished_andesite" : "smooth_stone"); continue; }   // base course, ground slab
    if (y % 4 === 0) { g.set(x, y, z, shell ? "light_gray_concrete" : "smooth_stone"); continue; }  // spandrel / floor slab
    if (!shell) continue;                               // interior air behind the glass

    // facade: piers on the corners and every third bay, tinted glass between
    const ns = ex.some(k => k === "N" || k === "S"), ew = ex.some(k => k === "E" || k === "W");
    const along = ns ? x : z;
    const pier = (ns && ew) || along % 3 === 0;
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    const pane = { north: String(ew), south: String(ew), east: String(ns), west: String(ns), waterlogged: "false" };
    g.set(x, y, z, "cyan_stained_glass_pane", pane);

    // warm light in the air gap behind some panes
    const k = ex[0], [dx, dz] = DIRS[k], bx = x - dx, bz = z - dz;
    if (inside(bx, bz) && exposed(bx, bz, y).length === 0 && (x * 5 + z * 3 + y * 7) % 11 === 0) g.set(bx, y, bz, "glowstone");
  }
}

// the entrance: a glass door in the ground-floor shopfront on the south face (north if none), near the middle of its run
const entranceRun = (face) => {
  const [dx, dz] = DIRS[face];
  const run = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (inside(x, z) && !inside(x + dx, z + dz) && G[x][z] <= 1 && T[x][z] >= 39) run.push([x, z]);
  }
  return run;
};
const face = entranceRun("S").length ? "S" : "N";
const run = entranceRun(face);
if (run.length) {
  const mid = run.map(([x]) => x).sort((a, b) => a - b)[run.length >> 1];
  const [ex, ez] = run.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
  const gr = G[ex][ez];
  const door = { facing: FACING[face], hinge: "left", open: "false", powered: "false" };
  g.set(ex, gr + 1, ez, "iron_door", { ...door, half: "lower" });
  g.set(ex, gr + 2, ez, "iron_door", { ...door, half: "upper" });
  g.set(ex, gr + 3, ez, "white_concrete");              // lintel over the door
}

// roof plant: a louvred box on the crown, well in from the edges
const PX = [10, 16], PZ = [13, 17];
let plantOk = true;
for (let x = PX[0]; x <= PX[1]; x++) for (let z = PZ[0]; z <= PZ[1]; z++) {
  if (!inside(x, z) || T[x][z] !== 43 || exposed(x, z, 43).length) plantOk = false;
}
if (plantOk) {
  for (let x = PX[0]; x <= PX[1]; x++) for (let z = PZ[0]; z <= PZ[1]; z++) {
    const edge = x === PX[0] || x === PX[1] || z === PZ[0] || z === PZ[1];
    for (let y = 44; y <= 46; y++) {
      if (y === 46) g.set(x, y, z, "gray_concrete");       // cap
      else if (!edge) continue;
      else if (y === 45 && (x + z) % 2 === 0) g.set(x, y, z, "iron_bars");   // louvres
      else g.set(x, y, z, "light_gray_concrete");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058290.nbt");
