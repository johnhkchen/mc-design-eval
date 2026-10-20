import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE91-0297-17F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE91-0297-17F.nbt";

const W = 66, H = 95, D = 57;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// 2002 office tower: blue-green tinted curtain wall, white concrete piers,
// light grey spandrels, polished granite base and foundation, grey parapets.
const FOUND = "polished_granite";
const BASE = "polished_granite";
const SLAB = "light_gray_concrete";
const PIER = "white_concrete";
const MULL = "light_gray_concrete";
const SPAN = "gray_concrete";
const GLASS = "light_blue_stained_glass";
const LIT = "glowstone";
const ROOF = "smooth_stone";
const PARA = "light_gray_concrete";
const LINTEL = "white_concrete";
const CANOPY = "smooth_stone";

// Tiers: inset from footprint bounding box, slab = absolute y of the tier's top slab.
const TIERS = [
  { inset: 0,  slab: 15 }, // podium, 3 storeys
  { inset: 5,  slab: 55 }, // midrise
  { inset: 12, slab: 83 }, // upper tower (roof ~83)
  { inset: 18, slab: 88 }, // mechanical penthouse
  { inset: 22, slab: 93 }, // slender crown
];

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
const footprint = [];
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const c of cells) {
  const [x, z] = c;
  const gr = Math.max(0, Math.min(90, Math.round(Number(c[2]) || 0)));
  groundOf.set(key(x, z), gr);
  footprint.push([x, z]);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.round((minX + maxX) / 2);
const midZ = Math.round((minZ + maxZ) / 2);

// Zone sets per tier: footprint cells inside the inset bounding box.
const tierSets = TIERS.map(({ inset }) => {
  const s = new Set();
  for (const [x, z] of footprint) {
    if (x >= minX + inset && x <= maxX - inset && z >= minZ + inset && z <= maxZ - inset) {
      s.add(key(x, z));
    }
  }
  return s;
});

const tierStart = (t) => (t === 0 ? 0 : TIERS[t - 1].slab + 1);
const neighbours = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];

// Entrance: centred on the street-facing (minZ) edge of the podium.
const isEntranceCell = (x, z) => z === minZ && Math.abs(x - midX) <= 3;

for (const [x, z] of footprint) {
  const k = key(x, z);
  const gr = groundOf.get(k);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let t = 0; t < TIERS.length; t++) {
    if (!tierSets[t].has(k)) continue;
    const slab = TIERS[t].slab;
    const start = tierStart(t);
    const edge = neighbours(x, z).some(([nx, nz]) => !tierSets[t].has(key(nx, nz)));
    const entrance = t === 0 && isEntranceCell(x, z);
    // Vertical piers every 6 cells along the facade break the flat grid.
    const pier = (x + z) % 6 === 0;

    for (let y = Math.max(start, gr); y <= slab; y++) {
      // Floor slabs at every 5th level and at the tier top.
      if (y === slab || y % 5 === 0) {
        g.set(x, y, z, SLAB);
        continue;
      }
      if (!edge) continue; // interior: air gap, no interiors

      if (entrance) {
        if (y === gr || y === gr + 1) continue;          // open doorway
        if (y === gr + 2) { g.set(x, y, z, LINTEL); continue; }
        if (y === gr + 3) { g.set(x, y, z, CANOPY); continue; } // canopy
      }

      // Granite base course on the podium.
      if (t === 0 && y < gr + 2) {
        g.set(x, y, z, BASE);
        continue;
      }

      const r = y % 5;
      if (r === 4) {
        g.set(x, y, z, SPAN);
        continue;
      }
      if (pier) {
        g.set(x, y, z, PIER);
        continue;
      }
      // Glass rows 1..3 with thin aluminium mullions.
      if ((x + z) % 3 === 0) {
        g.set(x, y, z, MULL);
      } else if ((x * 7 + z * 5 + y * 3) % 97 === 0) {
        g.set(x, y, z, LIT);
      } else {
        g.set(x, y, z, GLASS);
      }
    }

    // Parapet on the outer ring of the topmost exposed level of this tier.
    const nextHas = t + 1 < TIERS.length && tierSets[t + 1].has(k);
    if (!nextHas && edge && slab + 1 < H) {
      g.set(x, slab + 1, z, PARA);
    }
    // Roof surface on exposed tops (non-edge), so no gaps show through.
    if (!nextHas && !edge && slab >= gr) {
      g.set(x, slab, z, ROOF);
    }
  }
}

// Lightning rod on the crown, standing on the top slab of the crown tier.
const crownSlab = TIERS[TIERS.length - 1].slab;
if (tierSets[TIERS.length - 1].has(key(midX, midZ)) && crownSlab + 1 < H) {
  g.set(midX, crownSlab + 1, midZ, "lightning_rod");
}

g.save(OUT);
