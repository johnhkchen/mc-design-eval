import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei commercial block: two storeys, cream quartz facade,
// dark-glass shopfront with a dark oak canopy, grey flat roof behind a quartz parapet.
const W = 9, H = 23, D = 11;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542020151.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const m = Math.min(...cells.map(c => c[2])); // lowest ground under footprint
const T = m + 10;                           // top solid course of the parapet

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inFp = (x, z) => ground.has(key(x, z));

// Distance from the outer edge of the footprint (0 = perimeter wall, 1 = air gap, 2+ = core).
const dist = new Map();
const queue = [];
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const edge = NB.some(([dx, dz]) => !inFp(x + dx, z + dz));
  if (edge) { dist.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz, k = key(nx, nz);
    if (inFp(nx, nz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([nx, nz]); }
  }
}

const maxZ = Math.max(...cells.map(c => c[1]));
const cx = 4;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const d = dist.get(key(x, z)) ?? 0;

  if (d === 0) {
    // Perimeter facade.
    for (let y = gr; y <= T; y++) {
      const isDoorCell = z === maxZ && x === cx;
      if (y === T) { put(x, y, z, "smooth_quartz"); continue; }                 // parapet cap
      if (y === T - 1) { put(x, y, z, "smooth_quartz"); continue; }             // cornice
      if (y === gr) { put(x, y, z, "polished_granite"); continue; }             // base course
      if (y === m + 5) { put(x, y, z, "smooth_quartz"); continue; }             // storey line
      if (y < m + 5) {
        // Ground floor shopfront.
        if (isDoorCell && (y === gr || y === gr + 1)) {
          const half = y === gr ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (z === maxZ && x >= 2 && x <= 6 && y === gr + 3) {
          put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); // canopy
          continue;
        }
        if ((x + z) % 2 === 0) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "glass_pane");
        continue;
      }
      // Second floor window grid.
      if ((x + z) % 2 === 0) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass_pane");
    }
    // Warm light behind some second-floor windows, in the air gap just inside.
    if (m + 7 > gr && ((x * 3 + z) % 4 === 1)) {
      for (const [dx, dz] of NB) {
        const ix = x + dx, iz = z + dz;
        if (inFp(ix, iz) && dist.get(key(ix, iz)) === 1 && (x + z) % 2 === 1) {
          put(ix, m + 7, iz, "glowstone");
          break;
        }
      }
    }
  } else if (d === 1) {
    // Air gap behind the facade: floor slabs only, roof deck on top.
    put(x, gr, z, "smooth_stone");
    if (m + 5 > gr) put(x, m + 5, z, "smooth_stone");
    if (T > gr) put(x, T, z, "gray_concrete");
  } else {
    // Core: solid, with a grey roof deck and occasional roof units.
    for (let y = gr; y <= T; y++) put(x, y, z, "stone");
    put(x, T, z, "gray_concrete");
    if ((x + z) % 4 === 0) put(x, T + 1, z, "light_gray_concrete");
  }
}

// Lantern hanging under the entrance canopy.
if (ground.has(key(cx, maxZ))) {
  const gr = ground.get(key(cx, maxZ));
  put(cx, gr + 2, maxZ, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542020151.nbt");
