// Scene One, Auckland (way 355401751): a 1980s concrete-frame office block on a basalt base. The lidar roof is
// median-smoothed and snapped to a 4-block storey grid: a 15-storey tower core, stepped down to 8 and 12 storeys on its
// outer rings (a ziggurat), 4 and 5 storey wings and 1 to 3 storey podium edges. Each cell stands on its own ground
// (foundation solid up to it), with a floor and a ceiling slab per storey, so nothing hangs in the air. The facade is a
// 4-block storey rhythm: white floor ledge, glass panes between white piers, grey spandrel. Commercial ground floor:
// dark-oak shopfronts on a blackstone base course, a dark-oak door on the north face under a slab hood. Glowstone sits
// inside some windows; plant boxes stand on the tower roof. Interiors are air between the slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_355401751.cells.json", "utf8"));
const W = 114, D = 66, TOP = 73;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1);                                              // ground under each cell, -1 = not footprint
const R = grid(0);                                               // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), breadth-first through the footprint
const dist = grid(0);
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median of the 3x3 roof, snapped to storeys above the cell's ground; the tower's outer rings step down
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const N = grid(0), T = grid(0);                                  // storeys, and roof level (y of the roof cap)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z];
  let n = Math.max(1, Math.round((4 * Math.round(median(x, z) / 4) - g) / 4));
  if (n >= 14) n = dist[x][z] <= 2 ? 8 : dist[x][z] <= 4 ? 12 : n;
  N[x][z] = n; T[x][z] = g + 4 * n;
}
const maxT = Math.max(...cells.map(([x, z]) => T[x][z]));

const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
// the faces of cell x, z that are open to the air at height y: off the footprint, or beside a neighbour that stops below y
const openAt = (x, z, y) => DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || T[nx][nz] <= y; });
// the roof's edge: a face off the footprint or beside a lower roof
const roofEdge = (x, z) => DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || T[nx][nz] < T[x][z]; });

// the north entrance: the north-edge cell nearest the middle of the run, with a shopfront storey
const northRun = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && N[x][z] >= 2) northRun.push([x, z]);
const midX = northRun.map(([x]) => x).sort((a, b) => a - b)[northRun.length >> 1];
const door = northRun.reduce((best, c) => (!best || Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best), null);

const g3 = new Voxels([W, TOP, D]);
const glowAt = [];                                               // interior cells to light, after the walls

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z], t = T[x][z];
  for (let y = 0; y < g; y++) g3.set(x, y, z, "blackstone");     // foundation up to the ground
  for (let y = g; y < t; y++) {
    const rel = (y - g) % 4, s = Math.floor((y - g) / 4), open = openAt(x, z, y), edge = open.length > 0;
    if (rel === 0) {                                             // floor line: ledge on the facade, slab inside
      g3.set(x, y, z, edge ? (s === 0 ? "polished_blackstone_bricks" : "white_concrete") : "light_gray_concrete");
    } else if (rel === 3) {                                      // ceiling line: fascia or spandrel on the facade
      g3.set(x, y, z, edge && s === 0 ? "dark_oak_planks" : "light_gray_concrete");
    } else if (edge) {                                           // glazing between piers
      const corner = open.length > 1 && open.some(([, , d]) => d === "N" || d === "S") && open.some(([, , d]) => d === "E" || d === "W");
      const ns = open.some(([, , d]) => d === "N" || d === "S");
      const idx = ns ? x : z;
      const pier = corner || idx % 3 === 0;
      const pierBlock = s === 0 ? "dark_oak_planks" : "white_concrete";
      if (pier) {
        g3.set(x, y, z, pierBlock);
        // a mullion two blocks deep: the glazing sits back between piers, so the facade has relief, not a flat sheet
        if (!corner) {
          const [dx, dz] = open[0], ix = x - dx, iz = z - dz;
          if (inside(ix, iz) && G[ix][iz] <= y && y < T[ix][iz] && openAt(ix, iz, y).length === 0) g3.set(ix, y, iz, pierBlock);
        }
      } else {
        const side = ns ? { east: "true", west: "true", north: "false", south: "false" }
                        : { north: "true", south: "true", east: "false", west: "false" };
        g3.set(x, y, z, "light_blue_stained_glass_pane", { ...side, waterlogged: "false" });
        if ((x * 31 + z * 17 + s * 7) % 11 === 0) {
          const [dx, dz] = open[0]; glowAt.push([x - dx, y, z - dz]);
        }
      }
    }
    // interior air between the slabs
  }
  // roof: the cap, a cornice on the open edge, a parapet one block up
  const re = roofEdge(x, z).length > 0;
  g3.set(x, t, z, re ? "white_concrete" : "light_gray_concrete");
  if (re) g3.set(x, t + 1, z, "light_gray_concrete");
}

// the glowing cells: only interior air (no open face at that height), so they stay behind the glass
for (const [x, y, z] of glowAt) if (inside(x, z) && y >= G[x][z] && y < T[x][z] && openAt(x, z, y).length === 0 && (y - G[x][z]) % 4 === 1) g3.set(x, y, z, "glowstone");

// the north entrance: a dark-oak door (two blocks) under a slab hood across the shopfront
if (door) {
  const [ex, ez] = door, g = G[ex][ez];
  g3.set(ex, g, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g3.set(ex, g + 1, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) if (inside(ex + dx, ez)) g3.set(ex + dx, g + 2, ez, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// plant boxes on the tower roof, two rectangles around its middle
const core = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && T[x][z] === maxT) core.push([x, z]);
const cx = Math.round(core.reduce((a, [x]) => a + x, 0) / core.length), cz = Math.round(core.reduce((a, [, z]) => a + z, 0) / core.length);
for (const [x0, x1, z0, z1] of [[cx - 14, cx - 6, cz - 5, cz - 1], [cx + 3, cx + 11, cz + 1, cz + 5]]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (inside(x, z) && T[x][z] === maxT)
    for (let y = maxT + 1; y <= maxT + 3; y++) g3.set(x, y, z, "gray_concrete");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_355401751.nbt";
const info = g3.save(out);
const storeys = {};
for (const [x, z] of cells) storeys[N[x][z]] = (storeys[N[x][z]] || 0) + 1;
console.log(JSON.stringify({ blocks: info.blocks, palette: info.palette, maxRoof: maxT, storeys, door, glow: glowAt.length }));
