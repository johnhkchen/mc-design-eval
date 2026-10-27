// Q Central Apartments, Auckland (way 162814867): a concrete-frame apartment block of the 1990s-2000s on a basalt plinth.
// Read from the lidar: a band of roofs at 32 blocks (about eight storeys) with a nine-storey tower at the south-west end
// (roof 36, a 2-block parapet to the lidar's 38). Lidar roofs are median-smoothed and snapped to a 4-block storey grid;
// the tower's outer two rings step down to the body roof as a planked terrace. Every floor sits on one absolute 4-block
// grid, so each cell's ground storey runs from its ground to the next grid line (3-6 blocks) and the downhill end shows
// its extra storeys over the basalt foundation. Facade: smooth-quartz render with pier-and-pane bays of three (light-blue
// panes), a quartz spandrel at each floor line, basalt shopfront piers, a dark-oak entrance with a hanging lantern on the
// lowest street face, glowstone behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814867.cells.json", "utf8"));
const W = 127, D = 87, H = 51;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under the cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
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

// the roof on a 4-block storey grid: a 3x3 median of the lidar, snapped down so 31-32 reads 32 and 35-38 reads 36
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const snap = (r) => 4 * Math.floor((r + 1) / 4);
const up4 = (v) => 4 * Math.ceil(v / 4);

const T = Array.from({ length: W }, () => Array(D).fill(0));    // roof surface: the roof slab's y
const terrace = Array.from({ length: W }, () => Array(D).fill(false));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  T[x][z] = Math.max(snap(median(x, z)), up4(G[x][z] + 8));    // at least two storeys above its own ground
  // the tower's outer two rings step down to the body roof: a planked terrace
  if (T[x][z] >= 36 && dist[x][z] <= 2 && up4(G[x][z] + 8) <= 32) { T[x][z] = 32; terrace[x][z] = true; }
}

const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const outward = (x, z) => Object.keys(OUT).filter((k) => !inside(x + OUT[k][0], z + OUT[k][1]));
// the faces at height y with air beside them: off the footprint, or beside a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(OUT).filter((k) => {
  const nx = x + OUT[k][0], nz = z + OUT[k][1];
  return !inside(nx, nz) || T[nx][nz] < y;
});
const roofEdge = (x, z) => exposed(x, z, T[x][z]).length > 0;

// the entrance: the lowest street face (outward, 16+ blocks tall), the middle of the lowest-ground run
const street = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && outward(x, z).length && T[x][z] >= 16) street.push([x, z, outward(x, z)[0]]);
const lowG = Math.min(...street.map(([x, z]) => G[x][z]));
const low = street.filter(([x, z]) => G[x][z] === lowG).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const [ex, ez, eFace] = low[low.length >> 1];
const eAlong = eFace === "N" || eFace === "S" ? [1, 0] : [0, 1];
let lanternAt = null;
for (const s of [1, -1]) {
  const lx = ex + eAlong[0] * s, lz = ez + eAlong[1] * s;
  if (inside(lx, lz) && outward(lx, lz).includes(eFace)) { lanternAt = [lx, lz]; break; }
}

const GLASS = "light_blue_stained_glass_pane";
const g = new Voxels([W, H, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = T[x][z], L0 = up4(gr + 3);     // the ground storey's top: the first grid line 3+ blocks up
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");   // foundation: solid from y 0 up to the ground

  // roof: membrane (planked on the terrace), a parapet on any roof edge (two blocks on the tower), plant boxes inside
  g.set(x, top, z, terrace[x][z] ? "spruce_planks" : "smooth_stone");
  if (roofEdge(x, z)) for (let y = top + 1; y <= top + (top >= 36 ? 2 : 1); y++) g.set(x, y, z, "smooth_quartz");
  else if ((x * 5 + z * 3) % 17 === 0) { g.set(x, top + 1, z, "gray_concrete"); g.set(x, top + 2, z, "gray_concrete"); }

  for (let y = gr; y < top; y++) {
    const faces = exposed(x, z, y);
    if (y === gr) { g.set(x, y, z, faces.length ? "polished_basalt" : "smooth_stone"); continue; }   // plinth course
    if (y % 4 === 0) { g.set(x, y, z, faces.length ? "smooth_quartz" : "smooth_stone"); continue; }   // floor line
    if (!faces.length) continue;                                                                  // interior air

    if (x === ex && z === ez && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: FACING[eFace], half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (lanternAt && x === lanternAt[0] && z === lanternAt[1] && y === L0 - 1) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    const ground = y < L0;
    const ns = faces.some((k) => k === "N" || k === "S"), ew = faces.some((k) => k === "E" || k === "W");
    if (ns && ew) { g.set(x, y, z, ground ? "polished_basalt" : "smooth_quartz"); continue; }   // corner column
    const alongX = ns;                                                                              // the wall runs along x
    const pos = alongX ? x : z;
    if (pos % 3 === 0) { g.set(x, y, z, ground ? "polished_basalt" : "smooth_quartz"); continue; }  // pier between bays
    const st = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, GLASS, st);

    // warm light: a glowstone on the room's floor behind some panes (lower band of a storey, or the ground storey)
    const [dx, dz] = OUT[faces[0]];
    const ix = x - dx, iz = z - dz;
    if ((y === gr + 1 || y % 4 === 1) && (x * 7 + z * 11 + y * 3) % 9 === 0 && inside(ix, iz) &&
        y > G[ix][iz] && y < T[ix][iz] && exposed(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814867.nbt");

// check: a glass, pier, door or parapet block with air straight below it would hang in the air
const hanging = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 1; y < H; y++) {
  const v = g.val(x, y, z); if (!v || g.val(x, y - 1, z)) continue;
  const name = g.palette[v].block; hanging[name] = (hanging[name] || 0) + 1;
}
const top = Math.max(...T.flat());
console.log(JSON.stringify({ ...stats, roofMax: top, hangingAir: hanging }));
