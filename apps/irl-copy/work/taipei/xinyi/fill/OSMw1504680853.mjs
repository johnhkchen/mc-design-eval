import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1504680853.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1504680853.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 16, H = 16, D = 29;
const g = new Voxels([W, H, D]);

// Single-storey commercial block: roof slab at y=ROOF, parapet at ROOF+1.
const ROOF = 4;
const PAR = ROOF + 1;

const inside = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inside.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Entrance: street-side edge cell (lowest z), median x among those.
const northEdge = cells
  .filter(([x, z]) => NB.some(([dx, dz]) => !has(x + dx, z + dz)))
  .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
const minZ = northEdge.length ? northEdge[0][1] : 0;
const atMinZ = northEdge.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const entX = atMinZ.length ? atMinZ[Math.floor(atMinZ.length / 2)] : -1;
const entZ = minZ;

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, ROOF - 2));
  const edge = NB.some(([dx, dz]) => !has(x + dx, z + dz));

  // Foundation up to ground, then a floor slab at the ground surface.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  // Roof slab over every footprint cell.
  g.set(x, ROOF, z, "light_gray_concrete");

  // Roof equipment: small plant boxes on some interior roof cells.
  if (!edge && (x * 3 + z) % 7 === 0) {
    g.set(x, PAR, z, "smooth_stone");
  }

  if (edge) {
    // Walls from above the floor slab to the underside of the roof.
    for (let y = gr + 1; y <= ROOF - 1; y++) {
      const k = y - gr;
      const isEntrance = x === entX && z === entZ && k <= 2;
      let id;
      if (isEntrance) {
        if (k === 1) id = "air";
        else id = "lantern";
      } else if (k === 1) {
        // Shopfront: stone mullions every third cell, glass otherwise.
        id = (x + z) % 3 === 0 ? "stone_bricks" : "glass";
      } else if (y === ROOF - 1) {
        // Cornice band under the roof.
        id = "smooth_stone";
      } else {
        // Upper window band: concrete mullions, glass, and warm glowstone panes.
        if ((x + z) % 3 === 0) id = "white_concrete";
        else if ((x + z) % 6 === 1) id = "glowstone";
        else id = "glass";
      }
      g.set(x, y, z, id);
    }
    // Parapet on the perimeter.
    g.set(x, PAR, z, "white_concrete");
  } else {
    // Interior: air gap between floor slab and roof slab (no interiors).
  }
}

g.save(OUT);
