import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~50 blocks above lowest ground.
// Read as a 1990s-2000s mid-rise office/commercial block: 10 storeys (5 blocks each),
// white-clad concrete frame, blue glass curtain-wall bays, granite podium with shopfronts,
// two setbacks, a parapet on each terrace and a rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169554";
const W = 34, D = 41, H = 62;

const FOUND    = "stone";
const SLAB     = "smooth_quartz";
const FACADE   = "white_concrete";
const MULLION  = "light_gray_concrete";
const GLASS    = "light_blue_stained_glass";
const BASE     = "polished_granite";
const DOOR     = "glass";
const LINTEL   = "smooth_quartz";
const LANTERN  = "sea_lantern";
const PARAPET  = "smooth_quartz";
const PLANT    = "gray_concrete";
const LIGHT    = "glowstone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(49, Math.round(gr))));
}
const inFp = (x, z) => ground.has(key(x, z));

// Edge distance: 1 on the footprint perimeter, growing inward (4-neighbour BFS).
const edge = new Map();
const queue = [];
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS4.some(([dx, dz]) => !inFp(x + dx, z + dz))) {
    edge.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const v = edge.get(key(x, z));
  for (const [dx, dz] of DIRS4) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && !edge.has(key(nx, nz))) {
      edge.set(key(nx, nz), v + 1);
      queue.push([nx, nz]);
    }
  }
}
const edgeOf = (x, z) => edge.get(key(x, z)) ?? 1;

// Tiers: podium 0-10, tower 10-30 (inset 3), tower 30-50 (inset 6), penthouse 50-55 (inset 9).
function tierD(y) {
  if (y < 0) return -1;
  if (y < 10) return 0;
  if (y < 30) return 3;
  if (y < 50) return 6;
  if (y < 55) return 9;
  return Infinity;
}

// Parapets on terrace edges and roof rims: y, ring distance, inset of the tier above.
const PARAPETS = [
  { y: 11, ring: 1,  upper: 3 },
  { y: 31, ring: 4,  upper: 6 },
  { y: 51, ring: 7,  upper: 9 },
  { y: 56, ring: 10, upper: Infinity },
];

const cx = Math.floor(W / 2);
const cz = Math.floor(D / 2);

const g = new Voxels([W, H, D]);

function facadeBlock(x, y, z, r, gr) {
  const isPodium = y < 10;
  const ed = edgeOf(x, z);
  // Main entrance on the south face, centred, with a lintel and a warm light.
  if (isPodium && z === D - 1 && ed === 1 && Math.abs(x - cx) <= 2) {
    if (y === gr + 3) return Math.abs(x - cx) === 0 ? LANTERN : LINTEL;
    if (y < gr + 3) {
      if (Math.abs(x - cx) === 2) return BASE;
      if (Math.abs(x - cx) <= 1) return DOOR;
    }
  }
  if (isPodium && y === gr) return BASE;           // base course
  if (r === 4) return FACADE;                      // spandrel band
  if ((x + z) % 3 === 0) return MULLION;           // frame / mullion
  return GLASS;                                    // glazing
}

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ed = edgeOf(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y <= 58; y++) {
    const d = tierD(y);
    const dp = tierD(y - 1);
    const r = y % 5;

    // Grade slab under the building.
    if (y === gr) {
      g.set(x, y, z, SLAB);
      continue;
    }

    // Storey floor slabs on floor lines, over every cell that is in this tier or the one below.
    if (r === 0 && y <= 55 && ed > Math.min(d, dp)) {
      g.set(x, y, z, SLAB);
      continue;
    }

    // Parapets on terrace rims and roof edges.
    const p = PARAPETS.find((q) => q.y === y && ed === q.ring && ed <= q.upper);
    if (p) {
      g.set(x, y, z, PARAPET);
      continue;
    }

    // Walls of the tier: facade on its outer ring, air behind it.
    const inTier = ed > d;
    if (inTier && y <= 55) {
      if (ed === d + 1) {
        const b = facadeBlock(x, y, z, r, gr);
        g.set(x, y, z, b);
      } else if (ed === d + 2 && r === 2 && ((x * 5 + z * 7 + y * 3) % 17 === 0)) {
        g.set(x, y, z, LIGHT);   // warm light behind the glass
      }
    }

    // Rooftop plant box on the penthouse roof.
    if (y >= 56 && y <= 58 && ed >= 11 && Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 4) {
      g.set(x, y, z, PLANT);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
