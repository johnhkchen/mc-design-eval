import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 17 x 17 footprint, roof about 4 blocks above the lowest ground.
// Read as a one-storey, late-20th/early-21st-century Taipei retail or service pavilion:
// white-tiled concrete walls, a granite plinth, a light-glass shopfront band,
// a quartz cornice, a parapet and a small roof plant box.
const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075572.cells.json", "utf8")
);

const W = 17, H = 16, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  fp.set(key(x, z), gr);
  if (gr > maxG) maxG = gr;
}
const has = (x, z) => fp.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Roof slab level: about 4 above the lowest ground (y0), raised only if the slope demands it.
const R = Math.max(4, maxG + 4);

// Ground-floor glass and warm lights (shroomlight) are placed on the edge walls.
for (const [x, z, gc] of cells) {
  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: ground floor slab, air above (no interiors modelled).
    g.set(x, gc, z, "smooth_quartz");
    g.set(x, R, z, "light_gray_concrete"); // roof slab over the storey
    continue;
  }

  // Edge cell: plinth, glazed shopfront band, storey lintel, cornice, parapet.
  g.set(x, gc, z, "polished_granite");

  // Which way this wall faces decides the mullion rhythm.
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  const idx = alongX ? x : z;
  const mullion = idx % 3 === 0 || idx === 0 || idx === W - 1 || idx === D - 1;

  // Entrance on the south face (z = 16), centre three cells.
  const southEntrance = z === D - 1 && x >= 7 && x <= 9;

  for (let y = gc + 1; y <= R - 1; y++) {
    if (y === R - 1) {
      // Storey lintel / upper wall band.
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (southEntrance) {
      if (y <= gc + 2) {
        g.set(x, y, z, "air"); // doorway opening
      } else {
        g.set(x, y, z, "smooth_quartz"); // entrance lintel
      }
      continue;
    }
    if (mullion) {
      g.set(x, y, z, "white_concrete");
    } else if (y === gc + 1 && idx % 6 === 4) {
      g.set(x, y, z, "shroomlight"); // warm light in a window
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Cornice on the roof line, then parapet above it.
  g.set(x, R, z, "smooth_quartz");
  g.set(x, R + 1, z, "white_concrete");
}

// Roof plant: small box near the centre, standing on the roof slab.
for (let x = 5; x <= 11; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!has(x, z)) continue;
    if (x >= 6 && x <= 10 && z >= 7 && z <= 9) {
      g.set(x, R + 1, z, "smooth_stone");
      if (x >= 7 && x <= 9 && z === 8) g.set(x, R + 2, z, "smooth_stone");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075572.nbt");
