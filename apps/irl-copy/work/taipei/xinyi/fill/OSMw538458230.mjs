import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538458230.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538458230.nbt";

// Record: lidar roof ~11 blocks above lowest ground, footprint 17 x 21.
// Read as a two-storey, flat-roofed reinforced-concrete shophouse with a
// shopfront ground floor, Taipei 1960s-80s commercial type: light concrete
// walls, pier-and-window bays, a stone base, and a parapet with a rooftop tank.
// Storey lines sit at y=5 and y=10, roof slab at y=11, parapet at y=12.

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

// Entrance: centre of the north (z-min) street face.
const northCells = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x);
const doorX = northCells.length
  ? Math.floor((Math.min(...northCells) + Math.max(...northCells)) / 2)
  : null;
const doorZ = minZ;

const isDoor = (x, z) => doorX !== null && x === doorX && z === doorZ && !has(x, z - 1);

const isPier = (x, z, ex) => {
  if (ex.n || ex.s) return x % 3 === 0 || x === minX || x === maxX;
  return z % 3 === 0 || z === minZ || z === maxZ;
};

// Facade rows for a perimeter cell, relative to its own ground gr.
function facadeMat(x, z, y, gr, ex) {
  const pier = isPier(x, z, ex);
  if (y <= gr + 3) return pier ? "smooth_quartz" : "glass";   // shopfront
  if (y === gr + 4) return "stone_bricks";                    // shopfront lintel
  if (y === 5 || y === 9 || y === 10) return "smooth_quartz"; // storey lines, sill, cornice band
  if (y >= 6 && y <= 8) return pier ? "smooth_quartz" : "glass";
  return "smooth_quartz";
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const perimeter = ex.n || ex.s || ex.w || ex.e;

  if (!perimeter) {
    // Interior: air behind glass, floor slabs per storey.
    for (const fy of [5, 10]) {
      if (fy > gr) g.set(x, fy, z, "smooth_quartz");
    }
    // Warm light on the upper floor slab, nearer the facades.
    const nearFacade = has(x, z - 1) === false || has(x, z + 1) === false ||
                       has(x - 1, z) === false || has(x + 1, z) === false;
    if (6 > gr && 5 > gr && (x + z) % 4 === 0 && !nearFacade) {
      g.set(x, 6, z, "shroomlight");
    }
    if (11 > gr) g.set(x, 11, z, "gray_concrete"); // roof slab over interior
    continue;
  }

  // Perimeter wall column.
  for (let y = gr + 1; y <= 10; y++) {
    if (isDoor(x, z)) {
      if (y === gr + 1) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 2) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 3) { g.set(x, y, z, "glass"); continue; } // transom
    }
    g.set(x, y, z, facadeMat(x, z, y, gr, ex));
  }

  // Roof slab and parapet on the perimeter.
  if (11 > gr) g.set(x, 11, z, "gray_concrete");
  if (12 > gr) g.set(x, 12, z, "white_concrete");
}

// Rooftop water tank: 2x2 copper block on the roof, interior cells only.
const roofCandidates = cells.filter(([x, z, gr]) => {
  const ex = exposed(x, z);
  return !(ex.n || ex.s || ex.w || ex.e) &&
    has(x + 1, z) && has(x, z + 1) && has(x + 1, z + 1) &&
    [[x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => {
      const e2 = exposed(a, b);
      return !(e2.n || e2.s || e2.w || e2.e);
    });
});
if (roofCandidates.length) {
  const cx = Math.floor((minX + maxX) / 2);
  const cz = Math.floor((minZ + maxZ) / 2);
  const pick = roofCandidates.reduce((best, c) =>
    Math.abs(c[0] - cx) + Math.abs(c[1] - cz) < Math.abs(best[0] - cx) + Math.abs(best[1] - cz) ? c : best
  );
  const [tx, tz, tg] = pick;
  for (const [a, b] of [[tx, tz], [tx + 1, tz], [tx, tz + 1], [tx + 1, tz + 1]]) {
    if (12 > gnd(a, b)) {
      g.set(a, 12, b, "copper_block");
      g.set(a, 13, b, "copper_block");
      g.set(a, 14, b, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
  }
}

g.save(OUT);
