import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 第一社會福利基金會 (2005), 36 x 30 footprint, roof ~35 blocks above lowest ground.
// Read as a 7-storey (5 blocks per storey) mid-rise institutional office: white-concrete
// grid with glass window bands, dark spandrels, granite base, pier columns, a framed
// entrance on the street face, and a mechanical penthouse with a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0437-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 36, H = 47, D = 30;
const TOP = 35;       // roof slab row (about 35 blocks above lowest ground)
const PARAPET = 36;   // parapet course on the perimeter
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => G.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = (minX + maxX) / 2;
const midZ = (minZ + maxZ) / 2;

// Main entrance sits centred on the street-facing (minimum z) face.
const isEntrance = (x, z) => isEdge(x, z) && z === minZ && Math.abs(x - midX) <= 2.5;
// Mechanical penthouse in the middle of the roof.
const isPenthouse = (x, z) => !isEdge(x, z) && Math.abs(x - midX) <= 5 && Math.abs(z - midZ) <= 4;
// Vertical pier columns every 6 cells along the facade, including corners.
const isPier = (x, z) => (x - minX) % 6 === 0 || (z - minZ) % 6 === 0 || x === maxX || z === maxZ;

// Returns the block for a footprint cell at height y (y >= ground), or null for air.
function blockAt(x, z, y, gr, edge) {
  if (y === TOP) return "smooth_stone";                           // roof slab, every cell
  if (!edge) return y % 5 === 0 ? "light_gray_concrete" : null;   // interior floor slabs; air otherwise
  if (y === gr) return "polished_granite";                        // base course

  if (isEntrance(x, z)) {
    if (y <= gr + 2) {
      const d = Math.abs(x - midX);
      return d < 2.5 ? "glass" : "white_concrete";                // glazed opening, flanking piers
    }
    if (y === gr + 3) return "stone_bricks";                      // entrance lintel
    if (y === gr + 4) return "smooth_stone";                      // entrance head band
  }

  const r = y % 5;
  if (r === 0) return "white_concrete";                           // storey line / slab edge
  if (r === 4) return "gray_concrete";                            // dark spandrel for reveal contrast

  // window band rows 1..3
  if (isPier(x, z)) return "light_gray_concrete";                 // solid piers between bays
  return (x + z) % 2 === 0 ? "white_concrete" : "glass";          // glass with mullions
}

// Pass 1: foundation, walls, floors, roof, parapet, penthouse.
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Walls, floor slabs and roof from ground up to the roof slab.
  for (let y = gr; y <= TOP; y++) {
    const b = blockAt(x, z, y, gr, edge);
    if (b) g.set(x, y, z, b);
  }

  // Parapet on the perimeter, standing on the roof slab.
  if (edge) g.set(x, PARAPET, z, "white_concrete");

  // Mechanical penthouse with a cap, and a mast on the central cell.
  if (isPenthouse(x, z)) {
    for (let y = PARAPET; y <= 38; y++) g.set(x, y, z, "white_concrete");
    g.set(x, 39, z, "smooth_stone");
    if (x === Math.floor(midX) && z === Math.floor(midZ)) {
      for (let y = 40; y <= 43; y++) g.set(x, y, z, "iron_bars");
    }
  }
}

// Pass 2: warm shroomlights in the air cell behind some glass panes.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  if ((x + z) % 4 !== 1) continue;                  // only behind glass cells
  if (isPier(x, z)) continue;
  const nb = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
    .find(([a, b]) => has(a, b) && !isEdge(a, b));
  if (!nb) continue;
  const [nx, nz] = nb;
  const ngr = G.get(key(nx, nz));
  for (let s = 0; s <= 6; s++) {
    const y = 5 * s + 2;
    if (y > 33 || y < gr + 1 || y < ngr) continue;
    g.set(nx, y, nz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
