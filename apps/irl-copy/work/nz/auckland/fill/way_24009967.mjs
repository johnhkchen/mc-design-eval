// Dilworth Building: a stripped-classical commercial block, 1920s, reinforced concrete frame under a cream render, on a
// stone base course with shopfronts on the ground storey. The lidar roof (median-smoothed over 5x5, quantised to 4-block
// storeys) gives a tall core of about 10 storeys over a few lower wings. Every column is solid from the plinth up through
// each storey's floor slab, so every tier stands on what is below it. Facades are pier-and-pane grids on the exposed faces
// (a face is exposed when the neighbour outside the footprint, or has fewer storeys); interiors are air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24009967.cells.json", "utf8"));
const W = 54, D = 42, STOREY = 4, PLINTH = 4;

const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, g0, r] of cells) { ground[x][z] = g0; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;

// storeys above the plinth: the 7x7 median of the lidar roof, quantised to 4-block storeys (the parapet sits above it),
// then two majority passes over the 3x3 so the setbacks run as clean tiers, not a sawtooth of lidar noise
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const N = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  N[x][z] = Math.min(10, Math.max(1, Math.round((median(v) - PLINTH) / STOREY)));
}
const majority = () => {
  const next = N.map((col) => col.slice());
  for (const [x, z] of cells) {
    const count = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) count.set(N[x + dx][z + dz], (count.get(N[x + dx][z + dz]) || 0) + 1);
    let best = N[x][z], bestN = -1;
    for (const [v, c] of count) if (c > bestN || (c === bestN && v > best)) { best = v; bestN = c; }
    next[x][z] = best;
  }
  for (const [x, z] of cells) N[x][z] = next[x][z];
};
majority(); majority();
const nAt = (x, z) => (inside(x, z) ? N[x][z] : 0);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the faces of a cell at storey k that show: outside the footprint, or next to a cell with no storey k
const exposed = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || nAt(x + dx, z + dz) <= k);
const slab = (k) => PLINTH + STOREY * k;                    // the floor slab (or roof) under storey k

const WALL = "white_concrete", PIER = "smooth_quartz", BASE = "stone_bricks", FILL = "stone";
const PANE = "light_blue_stained_glass_pane", SHOP = "light_blue_stained_glass", TRIM = "polished_andesite";
const ROOF = "smooth_stone", LIGHT = "glowstone", PLANT = "stone_bricks";

const g = new Voxels([W, 58, D]);

// base course: a stone plinth under the whole footprint, the outer ring dressed as the base
for (const [x, z] of cells) {
  const edge = exposed(x, z, -1).length > 0;
  for (let y = 0; y < PLINTH; y++) g.set(x, y, z, edge ? BASE : FILL);
}

// floor slabs: one per storey under every cell, the top one is the roof; a column is solid from the plinth to its roof
for (const [x, z] of cells) {
  const n = N[x][z];
  for (let k = 0; k <= n; k++) g.set(x, slab(k), z, k === n ? ROOF : WALL);
}

// the entrance: on the north (low z) face of the ground storey, the middle of that run
const northRun = cells.filter(([x, z]) => N[x][z] >= 1 && exposed(x, z, 0).some(([dx, dz]) => dx === 0 && dz === -1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = northRun[northRun.length >> 1];
const doorZ = cells.filter(([x]) => x === doorX).reduce((m, [, z]) => Math.min(m, z), Infinity);

// facades: pillars at corners, pier-and-pane grids on a single exposed face, shopfront glass on the ground storey
for (const [x, z] of cells) {
  for (let k = 0; k < N[x][z]; k++) {
    const faces = exposed(x, z, k), y0 = slab(k);
    if (faces.length === 0) continue;
    if (faces.length >= 2) { for (let y = y0 + 1; y <= y0 + 3; y++) g.set(x, y, z, PIER); continue; }
    const [dx, dz] = faces[0];
    const u = dz !== 0 ? x : z;                               // position along the face
    const pier = u % 3 === 0;
    const isDoor = k === 0 && x === doorX && z === doorZ;
    for (let y = y0 + 1; y <= y0 + 3; y++) {
      if (pier) g.set(x, y, z, PIER);
      else if (y === y0 + 3) g.set(x, y, z, WALL);            // spandrel above each window band
      else g.set(x, y, z, k === 0 ? SHOP : PANE);
    }
    if (isDoor) {
      g.set(x, y0 + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, y0 + 3, z, TRIM);                              // lintel over the door
      for (const ox of [-1, 1]) if (inside(x + ox, z) && N[x + ox][z] >= 1) g.set(x + ox, y0 + 3, z, TRIM);
    } else if (!pier && k > 0 && (x * 5 + z * 3 + k) % 9 === 0) {
      // a warm light behind one window: glowstone in the air gap, standing on the floor slab
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && N[ix][iz] > k) g.set(ix, y0 + 1, iz, LIGHT);
    }
  }
}

// parapet: a two-block trim on the outer edge of the roof, where the roof meets the outside or a lower tier
for (const [x, z] of cells) {
  const n = N[x][z];
  if (exposed(x, z, n - 1).length === 0) continue;
  for (let y = slab(n) + 1; y <= slab(n) + 2; y++) g.set(x, y, z, TRIM);
}

// roof plant: 2x2 boxes on the core's roof, clear of the parapet
for (const [x, z] of cells) {
  const n = N[x][z];
  if (n < 8 || x % 8 !== 3 || z % 6 !== 2) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => [x + a, z + b]);
  if (!block.every(([a, b]) => inside(a, b) && N[a][b] === n && exposed(a, b, n - 1).length === 0)) continue;
  for (const [a, b] of block) for (let y = slab(n) + 1; y <= slab(n) + 2; y++) g.set(a, y, b, PLANT);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24009967.nbt");
