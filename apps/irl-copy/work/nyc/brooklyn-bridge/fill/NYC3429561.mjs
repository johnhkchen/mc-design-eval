import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3429561.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3429561.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 20, H = 18, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => has.has(key(x, z));

for (const [x, z, gr, ro] of cells) {
  const ground = Math.max(0, Math.min(H - 5, Math.round(gr)));
  // Quantise the lidar roof to whole two-block storeys so tiers stand cleanly.
  let top = ground + 2 * Math.max(1, Math.round((Math.round(ro) - ground) / 2));
  top = Math.max(ground + 3, Math.min(H - 1, top)); // top <= 17 keeps the parapet in range

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const xFace = !inFp(x - 1, z) || !inFp(x + 1, z);
  const zFace = !inFp(x, z - 1) || !inFp(x, z + 1);
  const edge = xFace || zFace;
  const mullion = (xFace && zFace) || (xFace && z % 3 === 0) || (zFace && x % 3 === 0);
  // Main entrance on the low-z (street) face, centred on the frontage.
  const entranceFace = !inFp(x, z - 1) && x >= 6 && x <= 13;

  for (let y = ground; y < top; y++) {
    const dy = y - ground;

    if (edge) {
      if (dy === 0) {
        g.set(x, y, z, "smooth_stone");                       // base course
      } else if (y === top - 1) {
        g.set(x, y, z, "smooth_stone");                       // cornice band
      } else if (entranceFace && dy === 3) {
        g.set(x, y, z, "smooth_stone");                       // entrance canopy
      } else if (entranceFace && (dy === 1 || dy === 2)) {
        g.set(x, y, z, "glass");                              // entrance glazing
      } else if (dy % 2 === 0) {
        g.set(x, y, z, "white_concrete");                     // floor spandrel
      } else if (mullion) {
        g.set(x, y, z, "smooth_quartz");                      // frame / mullion
      } else if ((x * 3 + z * 5 + dy) % 11 === 0) {
        g.set(x, y, z, "glowstone");                          // warm lit window
      } else {
        g.set(x, y, z, "light_blue_stained_glass");           // glazing
      }
    } else {
      if (y === top - 1) {
        g.set(x, y, z, "moss_block");                         // green roof deck
      } else if (dy % 2 === 0 || y === top - 2) {
        g.set(x, y, z, "light_gray_concrete");                // floor slab
      }
      // otherwise air: no interiors
    }
  }

  // Parapet on the roof edge, standing on the cornice.
  if (edge && top <= H - 1) {
    g.set(x, top, z, "stone_brick_wall");
  }

  // Sparse rooftop planting on interior roof cells (no leaf columns).
  if (!edge && top <= H - 1 && (x * 2 + z) % 5 === 0) {
    g.set(x, top, z, "flowering_azalea");
  }
}

g.save(OUT);
