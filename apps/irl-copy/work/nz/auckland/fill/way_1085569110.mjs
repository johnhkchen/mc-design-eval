// Way 1085569110: a two-storey Stripped Classical commercial block (c.1925) of rendered masonry on a volcanic-stone
// plinth, shopfronts on the ground floor, a stepped massing: the central 10-block tower-like core over lower wings.
// Footprint cells only; each cell fills from y 0 to its ground (foundation), then walls up to its smoothed roof tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1085569110.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1085569110.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map(), raw = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); raw.set(key(x, z), r); }
const inF = (x, z) => ground.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const edge = (x, z) => exposed(x, z).length > 0;

// the lidar roof, smoothed over the 5x5 footprint neighbourhood and rounded: stepped flat tiers (7 wings, 8-9 ring, 10 core)
const roof = new Map();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const q = key(x + dx, z + dz); if (raw.has(q)) { s += raw.get(q); n++; }
  }
  roof.set(k, Math.round(s / n));
}
const T = (x, z) => roof.get(key(x, z));
const G = (x, z) => ground.get(key(x, z));
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));

const g = new Voxels([14, 22, 15]);
const glass = new Set();
const at = (x, y, z) => `${x},${y},${z}`;

// 1. foundation (stone to each cell's ground), core (solid mass, so nothing floats), roof surface and cornice
for (const [x, z] of cellList) {
  const gr = G(x, z), t = T(x, z), e = edge(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < t - 1; y++) g.set(x, y, z, "smooth_quartz");
  if (e) g.set(x, t - 1, z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, t - 1, z, "smooth_stone");
}

// 2. facade: plinth and storey courses, window bays with a pier every third cell, quoins at the corners,
//    glass in the outer skin with an air gap (or a warm glowstone/shroomlight) behind it, lintels over the bays
const DOOR = [10, 14];                          // the lowest-ground cell on the south face: the street entrance
let pocketN = 0;
for (const [x, z] of cellList) {
  if (!edge(x, z)) continue;
  const gr = G(x, z), t = T(x, z), ex = exposed(x, z), corner = ex.length > 1;
  if (corner) {
    for (let y = gr; y < t - 1; y++) g.set(x, y, z, "polished_andesite");   // quoins: full-height stone at the corners
    continue;
  }
  const face = ex[0], [dx, dz] = DIRS[face];
  const idx = face === "N" || face === "S" ? x : z;
  const pier = idx % 3 === 0;
  for (let F = gr; F < t - 1; F += 4) {
    g.set(x, F, z, "polished_andesite");                                   // plinth (F=gr) and storey string courses
    const windowRows = [F + 1, F + 2].filter((y) => y < t - 1);
    if (!pier) {
      for (const y of windowRows) {
        if (F === gr && x === DOOR[0] && z === DOOR[1]) continue;
        g.set(x, y, z, "glass_pane"); glass.add(at(x, y, z));
        // air gap behind the glass in the core; one in five with a warm light
        const ix = x - dx, iz = z - dz;
        if (inF(ix, iz) && !edge(ix, iz)) {
          if ((pocketN++ % 5) === 0) g.set(ix, y, iz, "glowstone");
          else g.set(ix, y, iz, "air");
        }
      }
      if (F + 3 < t - 1) g.set(x, F + 3, z, "dark_oak_planks");              // lintel over the bay
    }
  }
}

// 3. the street door: a dark oak door on the south face, a lintel above, a plinth step at its foot
{
  const [x, z] = DOOR, gr = G(x, z);
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  glass.delete(at(x, gr + 1, z)); glass.delete(at(x, gr + 2, z));
  g.set(x, gr + 3, z, "dark_oak_planks");
}

// 4. roof plant: iron-clad units on the flat top of the core, and a shroomlight over the entrance
{
  const tMax = Math.max(...cellList.map(([x, z]) => T(x, z)));
  const core = cellList.filter(([x, z]) => !edge(x, z) && T(x, z) === tMax && x % 3 === 1);
  for (const [x, z] of core.slice(0, 3)) g.set(x, tMax, z, "iron_block");
}

// 5. glass panes connect to every neighbour that is not air (as vanilla does)
for (const k of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const nb = (dx, dz) => g.val(x + dx, y, z + dz) !== 0;
  g.set(x, y, z, "glass_pane", { north: String(nb(0, -1)), south: String(nb(0, 1)), east: String(nb(1, 0)), west: String(nb(-1, 0)), waterlogged: "false" });
}

// sanity: every solid block must connect, through solids, to the ground layer (nothing floats)
{
  const [X, Y, Z] = g.size, seen = new Set(), q = [];
  for (const [x, z] of cellList) if (g.val(x, 0, z)) { seen.add(at(x, 0, z)); q.push([x, 0, z]); }
  while (q.length) {
    const [x, y, z] = q.pop();
    for (const [a, b, c] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
      const [nx, ny, nz] = [x + a, y + b, z + c], id = at(nx, ny, nz);
      if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z || seen.has(id) || !g.val(nx, ny, nz)) continue;
      seen.add(id); q.push([nx, ny, nz]);
    }
  }
  let floating = 0; g.forEachCell((i) => { const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y)); if (!seen.has(at(x, y, z))) floating++; });
  console.log(`floating blocks: ${floating}`);
}

const s = g.save(OUT);
console.log(`saved ${OUT}: ${s.blocks} blocks, palette ${s.palette}`);
