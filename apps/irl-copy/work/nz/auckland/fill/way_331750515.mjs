// Crowne Plaza Auckland (way 331750515): a late-20th-century concrete-frame hotel slab with tinted curtain glass, on a
// stone-clad podium. The lidar roof is median-smoothed and snapped to the 4-block storey grid, so the tower is a flat
// crown (96 to 108, mostly 100 and 104) with three-storey wings on the thin west strip and the north-east corner. Floor
// lines are global (y = 4k) and each column is solid from y 0 up to the first floor line above its ground, so nothing
// floats on the slope. The facade is 3-block bays: white spandrels, glass panes with light-grey piers, a stone podium under
// y 16 with glass shopfronts, a dark-oak door on the lowest street face, glowstone behind some panes. Interiors are air
// behind a one-block shell, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_331750515.cells.json", "utf8"));
const W = 42, D = 65, H = 144, PODIUM = 16;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = outside the footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// the lidar roof, median of the 3x3 footprint around each cell, then snapped down to the storey grid (floor((r+1)/4) storeys);
// a column is at least one storey above its own floor line, so a roof the lidar reads below the ground still stands
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const base = (x, z) => 4 * Math.ceil(G[x][z] / 4);                 // the first floor line at or above the ground
const T = Array.from({ length: W }, () => Array(D).fill(0));       // top of each column (multiple of 4)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z))
  T[x][z] = Math.max(4 * Math.floor((median(x, z) + 1) / 4), base(x, z) + 4);

const solid = (x, z, y) => inside(x, z) && y < T[x][z];
const DIRS = [["north", 0, -1], ["east", 1, 0], ["south", 0, 1], ["west", -1, 0]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !solid(x + dx, z + dz, y));

// the entrance: a ground-level face (the lowest ground, base 0) on the south or west side, the middle of that run
const door = (() => {
  const c = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && base(x, z) === 0) {
    const ex = exposed(x, z, 0).find(([n]) => n === "south" || n === "west");
    if (ex) c.push({ x, z, face: ex });
  }
  return c.length ? c[c.length >> 1] : null;
})();

// the crown plant room: a 4 x 4 box on the flattest, deepest roof run (three blocks in from every edge)
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}
let plant = null;
for (let x = 0; x + 3 < W; x++) for (let z = 0; z + 3 < D; z++) {
  let ok = true, minD = 99, top = T[x][z];
  for (let i = 0; i < 4 && ok; i++) for (let j = 0; j < 4 && ok; j++) {
    const cx = x + i, cz = z + j;
    if (!inside(cx, cz) || T[cx][cz] !== top || top < 96) ok = false; else minD = Math.min(minD, dist[cx][cz]);
  }
  if (ok && minD >= 3 && (!plant || minD > plant.minD)) plant = { x, z, top, minD };
}

const g = new Voxels([W, H, D]);
const glowAt = [];      // windows that get a warm light just inside the glass: [x, y, z, dx, dz]

const facade = (x, y, z, ex) => {
  const t = T[x][z];
  if (door && x === door.x && z === door.z && y < 2) {          // the door: lower and upper half
    const facing = door.face[0];
    const half = y === 0 ? "lower" : "upper";
    return g.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
  }
  const [name, dx, dz] = ex[0], u = dx === 0 ? x : z, rr = y % 4, podium = y < PODIUM;
  if (y === t - 1) return g.set(x, y, z, "stone_bricks");        // the cornice on the roof edge
  if (podium) {
    if (rr === 0) return g.set(x, y, z, "smooth_stone");         // string course
    if (rr === 3 && y >= 4) return g.set(x, y, z, "stone_bricks");
    return u % 3 === 0 ? g.set(x, y, z, "stone_bricks") : g.set(x, y, z, "cyan_stained_glass");   // shopfront or window
  }
  if (rr === 0 || rr === 3) return g.set(x, y, z, "white_concrete");   // spandrels
  if (u % 3 === 0) return g.set(x, y, z, "light_gray_concrete");         // piers
  g.set(x, y, z, "light_blue_stained_glass");
  if ((u + 2 * y) % 23 === 0) glowAt.push([x, y, z, dx, dz]);
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const b = base(x, z), t = T[x][z];
  for (let y = 0; y < t; y++) {
    if (y < b) { g.set(x, y, z, "stone_bricks"); continue; }     // foundation up to the floor line
    const ex = exposed(x, z, y);
    if (ex.length) { facade(x, y, z, ex); continue; }
    if (y === t - 1) g.set(x, y, z, "smooth_stone");              // roof over the interior
    else if (y % 4 === 0) g.set(x, y, z, "smooth_stone");         // floor slab per storey
  }
}

// the warm lights go just inside a window's glass; only into air, so a light never replaces a wall or a slab
for (const [x, y, z, dx, dz] of glowAt) {
  const ix = x - dx, iz = z - dz;
  if (inside(ix, iz) && y >= base(ix, iz) && y < T[ix][iz] && !g.val(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// roof plant: a 4 x 4 box, two storeys of plant room on the roof
if (plant) {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const x = plant.x + i, z = plant.z + j;
    g.set(x, plant.top, z, "light_gray_concrete");
    g.set(x, plant.top + 1, z, "light_gray_concrete");
    g.set(x, plant.top + 2, z, "stone_bricks");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_331750515.nbt";
const r = g.save(out);
console.log(`way_331750515: ${r.blocks} blocks, ${r.palette} palette entries, top ${Math.max(...T.flat())}, plant ${plant ? `at ${plant.x},${plant.z}` : "none"}, door ${door ? `${door.x},${door.z} facing ${door.face[0]}` : "none"}`);
