import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw549464119.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw549464119.nbt";

const W = 14, H = 33, D = 22;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inSet = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !inSet(x + 1, z) || !inSet(x - 1, z) || !inSet(x, z + 1) || !inSet(x, z - 1);
const interior = (x, z) => inSet(x, z) && !perim(x, z);

// Street frontage = south face (z+1 side). Door on the middle front cell.
let maxZ = -Infinity;
for (const [, z] of cells) if (z > maxZ) maxZ = z;
const frontXs = cells.filter(([x, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const isFront = (x, z) => !inSet(x, z + 1) && z >= maxZ - 0;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Find an interior neighbour (a cell whose four neighbours are all footprint cells) for a wall cell
function inwardCell(x, z) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (interior(nx, nz)) return [nx, nz];
  }
  return null;
}

for (const [x, z, gr] of cells) {
  const per = perim(x, z);
  const base = gr;

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground deck / base course
  put(x, base, z, per ? "stone_bricks" : "smooth_stone");

  for (let o = 1; o <= 20; o++) {
    const y = base + o;

    if (o === 20) {
      // cornice band on walls, roof membrane inside
      put(x, y, z, per ? "white_concrete" : "gray_concrete");
      continue;
    }

    if (o % 5 === 0) {
      // storey lines / floor slabs
      put(x, y, z, per ? "white_concrete" : "smooth_stone");
      continue;
    }

    if (!per) continue; // interior air, no interiors

    const s = Math.floor((o - 1) / 5); // storey index 0..3
    const r = (o - 1) % 5;             // 0 sill, 1-2 glass, 3 lintel
    const pier = (x + z) % 3 === 0;
    const front = isFront(x, z) && s === 0;

    if (front) {
      if (x === doorX && o <= 2) {
        // entrance door
        const half = o === 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (o === 1) { put(x, y, z, "stone_bricks"); continue; }      // shopfront plinth
      if (o === 4) { put(x, y, z, "red_concrete"); continue; }      // fascia / awning band
      if (o === 2 || o === 3) {
        if (pier) { put(x, y, z, "white_concrete"); continue; }
        put(x, y, z, "light_blue_stained_glass");
        continue;
      }
    }

    if (r === 0 || r === 3) {
      put(x, y, z, "smooth_quartz"); // spandrel and lintel
      continue;
    }

    // r = 1..2 : window band
    if (pier) {
      put(x, y, z, "white_concrete");
      continue;
    }
    put(x, y, z, "light_blue_stained_glass");

    // warm light behind some windows (inside the storey)
    if (r === 1 && (x * 5 + z * 3 + s * 7) % 4 === 0) {
      const inward = inwardCell(x, z);
      if (inward) put(inward[0], y, inward[1], "glowstone");
    }
  }

  // Parapet coping on the perimeter
  if (per) put(x, base + 21, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // Roof equipment: AC plant boxes on some interior roof cells
  if (!per && x % 4 === 1 && z % 4 === 1) {
    put(x, base + 21, z, "light_gray_concrete");
    put(x, base + 22, z, "light_gray_concrete");
    put(x, base + 23, z, "iron_bars");
  }
}

// Stair/lift penthouse, only if all its cells are interior footprint
{
  const px = [4, 5, 6], pz = [6, 7, 8];
  let ok = true;
  let baseP = 0;
  for (const x of px) for (const z of pz) {
    if (!interior(x, z)) ok = false;
    else baseP = Math.max(baseP, ground.get(`${x},${z}`));
  }
  if (ok) {
    for (const x of px) for (const z of pz) {
      const gr = ground.get(`${x},${z}`);
      for (let o = 21; o <= 23; o++) put(x, gr + o, z, "smooth_quartz");
      put(x, gr + 24, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
    // small warm window on the penthouse south face
    for (const x of px) {
      const gr = ground.get(`${x},${pz[pz.length - 1]}`);
      put(x, gr + 22, pz[pz.length - 1], "light_blue_stained_glass");
    }
  }
}

g.save(OUT);
