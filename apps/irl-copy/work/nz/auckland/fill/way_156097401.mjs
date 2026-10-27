// Auckland way 156097401: a 1930s Moderne brick-and-render commercial block, five storeys (lidar roof 20 above the lowest
// ground, 21 with the parapet) on a stone foundation that runs down to the ground under each cell. Storey lines sit on
// absolute 4-block levels, so the cream spandrels and the brick courses run level across the sloping site; the ground
// band is shopfronts (polished andesite piers, glass panes, a dark-oak door on the north face at the lowest street
// corner) under a cream fascia. Upper storeys: brick piers on a 3-block bay, glass panes between, cream spandrel band at
// each floor line, brick course under the sill. Roofs are the lidar height, median-smoothed and snapped to the storey
// grid; a cream coping runs round the edge and a plant room sits on the highest roof. Interiors are air with a floor slab
// per storey and glowstone behind a few panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_156097401.cells.json", "utf8"));
const W = 65, D = 72, TOP = 33;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), by BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
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

// median-smoothed roof, snapped to the 4-block storey grid, and at least one storey over the ground band
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const B0 = (x, z) => 4 * Math.floor(G[x][z] / 4) + 4;             // first storey line above the ground
const H = Array.from({ length: W }, () => Array(D).fill(0));       // roof level (top of the solid roof slab)
const levels = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  H[x][z] = Math.max(8, Math.round(median(x, z) / 4) * 4, B0(x, z) + 4);
  levels[H[x][z]] = (levels[H[x][z]] || 0) + 1;
}
const maxH = Math.max(...H.flat());

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const faces = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
const paneFor = (f) => (f === "N" || f === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// the entrance: on the north face, at the lowest street corner with a full ground band (door + fascia), near the middle
const northFace = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1)) northFace.push([x, z]);
const midX = [...northFace.map(([x]) => x)].sort((a, b) => a - b)[northFace.length >> 1];
const door = northFace.filter(([x, z]) => B0(x, z) - G[x][z] >= 4)
  .sort((a, b) => (G[a[0]][a[1]] - G[b[0]][b[1]]) || (Math.abs(a[0] - midX) - Math.abs(b[0] - midX)))[0] ?? null;
const flank = new Set();
if (door) for (const dx of [-1, 1]) if (inside(door[0] + dx, door[1]) && !inside(door[0] + dx, door[1] - 1)) flank.add(`${door[0] + dx},${door[1]}`);

const g = new Voxels([W, TOP, D]);
const glowCells = [];

// what a facade cell is at height y (the cell's ground band is y < B0; upper storeys follow the absolute 4-block grid)
function facadeBlock(x, z, y, f) {
  const gr = G[x][z], b0 = B0(x, z);
  if (y === gr) return ["polished_andesite"];                                        // base course
  const corner = f.length > 1;
  const u = f.includes("N") || f.includes("S") ? x : z;
  const pier = corner || u % 3 === 0 || flank.has(`${x},${z}`);
  if (y < b0) {                                                                       // ground band: shopfronts
    if (door && x === door[0] && z === door[1] && f.includes("N")) {
      if (y === gr + 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (y === b0 - 1) return ["smooth_quartz"];                                       // fascia
    if (pier) return ["polished_andesite"];
    return ["glass_pane", paneFor(f[0])];
  }
  const rel = (y - b0) % 4;
  if (rel === 0) return ["smooth_quartz"];                                            // spandrel at each floor line
  if (rel === 3) return ["bricks"];                                                   // brick course under the sill
  if (pier) return ["bricks"];
  return ["glass_pane", paneFor(f[0])];
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], b0 = B0(x, z), d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const f = faces(x, z, y);
    if (f.length === 0) {
      // interior: air, with a floor slab at the ground floor and at each storey line
      if (y === gr || (y >= b0 && (y - b0) % 4 === 0)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const [name, state] = facadeBlock(x, z, y, f);
    g.set(x, y, z, name, state);
    // warm light in some panes: a glowstone on the inside of a window (the air gap is in front of it)
    const glazed = name === "glass_pane" && (y === gr + 1 || (y - b0) % 4 === 1 || (y - b0) % 4 === 2);
    if (glazed && (x * 31 + z * 17 + y * 7) % 6 === 0) {
      const inward = f.length ? DIRS[f[0]] : [0, 0];
      const ix = x - inward[0], iz = z - inward[1];
      if (inside(ix, iz) && H[ix][iz] > y && faces(ix, iz, y).length === 0) glowCells.push([ix, y, iz]);
    }
  }

  // roof slab on the top of the cell; a cream coping on the outside ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "smooth_quartz");
}
for (const [x, y, z] of glowCells) g.set(x, y, z, "glowstone");

// plant room on the highest roof: a box of light-grey concrete, three storeys' height of wall, a flat cap; only where the
// roof is level under the whole box
const core = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === maxH && dist[x][z] >= 4) core.push([x, z]);
if (core.length) {
  const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length), cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
  const box = [];
  for (let x = cx - 4; x <= cx + 4; x++) for (let z = cz - 3; z <= cz + 3; z++) box.push([x, z]);
  if (box.every(([x, z]) => inside(x, z) && H[x][z] === maxH)) {
    for (const [x, z] of box) {
      const edge = x === cx - 4 || x === cx + 4 || z === cz - 3 || z === cz + 3;
      for (let y = maxH + 1; y <= maxH + 3; y++) if (edge) g.set(x, y, z, "light_gray_concrete");
      g.set(x, maxH + 4, z, "smooth_stone");
    }
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_156097401.nbt");
console.log(`way_156097401: ${info.blocks} blocks, ${info.palette} palette, roof levels ${JSON.stringify(levels)}, door ${door ? door.join(",") : "none"}`);
