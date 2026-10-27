// Aura Apartments, Auckland (way 260053881): a 1990s-2000s mid-rise apartment tower, fourteen storeys (57 blocks to the
// lidar roof, 4 blocks a storey) on a 50 x 44 footprint. The NW core rises to 56, the SE block steps down to 48-52, and
// the outer ring of the tower is set back one tier below the core. The facade is a white-concrete frame (slab line at
// every storey, piers every third block) with light-blue glass panes and grey spandrels, a stone-brick plinth, and a
// shopfront storey at the street with a dark-stone entrance on the north face. Some panes have a glowstone behind them.
// The roof is a flat smooth-stone deck with a parapet and a solid plant room on the core. Interiors are air with a floor
// slab per storey; every column runs from the foundation to its roof, so no tier stands on air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260053881.cells.json", "utf8"));
const W = 50, D = 44, TOP = 69;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
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

// median-smoothed lidar roof, snapped to the 4-block storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // roof height of each cell (the top of its column)
let maxT = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  let t = 4 * Math.round(median(x, z) / 4);
  t = Math.max(t, 4, 4 * Math.ceil((G[x][z] + 1) / 4));          // at least one storey above its own ground
  if (dist[x][z] === 1 && t >= 56) t = 52;                         // the tower's outer ring steps back one tier
  H[x][z] = t; maxT = Math.max(maxT, t);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the entrance: the middle of the north run at street level (lowest ground on the north edge)
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && H[x][z] >= 8) northEdge.push([x, z]);
const door = northEdge.length ? northEdge[northEdge.length >> 1] : null;

const g = new Voxels([W, TOP, D]);
// a pane runs along the face it sits in: east-west on a north/south face, north-south on an east/west face
const PANE = (face) => (face === "N" || face === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  const shopTop = 4 * Math.ceil((gr + 1) / 4);                    // the shopfront storey runs from the street to the first slab line
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey and at the street
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const face = ex[0];
    const along = face === "N" || face === "S" ? x : z;
    const pier = along % 3 === 0;                               // every third block along a face is a pier (a step on the diagonal keeps its glass)
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }  // base course on the street
    if (y < shopTop) {
      // shopfront: a lintel over the glass, piers in stone, the entrance door on the north face
      if (y === shopTop - 1) g.set(x, y, z, "polished_andesite");
      else if (door && face === "N" && x === door[0] && z === door[1] && y <= gr + 2) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (pier || (door && face === "N" && Math.abs(x - door[0]) <= 1 && z === door[1])) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, GLASS, PANE(face));
      continue;
    }
    // upper storeys: white slab line at each floor, glass in two of the four rows, a grey spandrel below each pane row
    const row = y % 4;
    if (row === 0) g.set(x, y, z, "white_concrete");
    else if (pier) g.set(x, y, z, "white_concrete");
    else if (row === 3) g.set(x, y, z, "gray_concrete");
    else {
      g.set(x, y, z, GLASS, PANE(face));
      // glowstone a block inside some panes, where the air behind the glass is interior
      const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
      if (((x * 7 + z * 13 + y * 5) % 23 === 0) && inside(ix, iz) && exposed(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
    }
  }

  // roof: a flat smooth-stone deck, a white parapet on the outside ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "white_concrete");
}

// plant room on the core: a solid two-storey box with a stone cap, on the tallest roof
const core = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === maxT && dist[x][z] >= 6) core.push([x, z]);
if (core.length) {
  const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length), cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
  const rect = [];
  for (let x = cx - 3; x < cx + 3; x++) for (let z = cz - 2; z < cz + 2; z++) rect.push([x, z]);
  if (rect.every(([x, z]) => inside(x, z) && H[x][z] === maxT)) {
    for (const [x, z] of rect) {
      const rim = x === cx - 3 || x === cx + 2 || z === cz - 2 || z === cz + 1;
      g.set(x, maxT + 1, z, rim ? "light_gray_concrete" : "white_concrete");
      g.set(x, maxT + 2, z, rim ? "light_gray_concrete" : "white_concrete");
      g.set(x, maxT + 3, z, "smooth_stone");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260053881.nbt");
