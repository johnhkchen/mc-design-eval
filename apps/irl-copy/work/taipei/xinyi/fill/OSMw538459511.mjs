import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

// Footprint 17 x 9. Lidar roof ~11 blocks above the lowest ground.
// Read as a 1990s-2000s Xinyi mid-rise: two 5-block storeys, white tiled
// walls, a stone base, a glazed shopfront at street level, light-grey
// mullions and cornice, and rooftop plant.
const W = 17, H = 23, D = 9;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459511.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const isEdge = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));
const missingCount = (x, z) => [has(x + 1, z), has(x - 1, z), has(x, z + 1), has(x, z - 1)].filter(v => !v).length;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const minG = Math.min(...cells.map(c => c[2]));
const R = minG + 11;               // roof surface height (absolute)
const maxZ = Math.max(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === maxZ).map(c => c[0]).sort((a, b) => a - b);
const midX = frontXs[Math.floor(frontXs.length / 2)];
const doorX = frontXs.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), midX);

// Per-cell storey layout
function layout(gr) {
  const top = Math.min(Math.max(R - 1, gr + 1), H - 1); // top solid course (roof slab / cornice)
  const floors = [gr];
  if (gr + 5 < top) floors.push(gr + 5);
  return { top, floors };
}

// Pass 1: foundations, floors, walls, windows, cornice
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const { top, floors } = layout(gr);
  const edge = isEdge(x, z);
  const corner = missingCount(x, z) >= 2;

  if (!edge) {
    // interior: floor slabs per storey and roof surface, air elsewhere
    for (let y = gr; y <= top; y++) {
      if (floors.includes(y) || y === top) put(x, y, z, "smooth_stone");
    }
  } else {
    for (let y = gr; y <= top; y++) {
      if (y === top) { put(x, y, z, "light_gray_concrete"); continue; }        // cornice
      if (floors.includes(y)) {
        put(x, y, z, y === gr ? "stone_bricks" : "light_gray_concrete");        // base course / floor line
        continue;
      }
      const f = Math.max(...floors.filter(fl => fl <= y));
      const rel = y - f;
      if (rel >= 1 && rel <= 3) {
        // window band
        const mullion = corner || ((x + z) % 3 === 0);
        if (mullion) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "glass");
      } else {
        put(x, y, z, "white_concrete");                                          // spandrel
      }
    }
  }
}

// Pass 2: warm lights behind some windows (inward interior cells)
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const { top, floors } = layout(gr);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const inward = dirs.find(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return has(nx, nz) && !isEdge(nx, nz);
  });
  if (!inward) continue;
  const [dx, dz] = inward;
  const nx = x + dx, nz = z + dz;
  const ng = G.get(key(nx, nz));
  const nl = layout(ng);
  for (let y = gr + 1; y < top; y++) {
    const f = Math.max(...floors.filter(fl => fl <= y));
    const rel = y - f;
    if (rel < 1 || rel > 3) continue;
    if (corner(x, z)) continue;
    if ((x * 3 + z + y) % 7 !== 0) continue;
    if (y < ng || y >= nl.top) continue;
    if (nl.floors.includes(y)) continue;
    put(nx, y, nz, "shroomlight");
  }
}

function corner(x, z) { return missingCount(x, z) >= 2; }

// Pass 3: rooftop plant on interior roof cells (sitting on the roof surface)
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  const { top } = layout(gr);
  if ((x * 2 + z * 5) % 9 === 0 && top + 1 < H) put(x, top + 1, z, "iron_block");
}

// Pass 4: entrance on the street (+z) face, centred
for (const [x, z, gr] of cells) {
  if (z !== maxZ || x !== doorX) continue;
  const { top } = layout(gr);
  // canopy lintel above the door opening
  put(x, gr + 4, z, "light_gray_concrete");
  if (gr + 2 < top) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459511.nbt");
