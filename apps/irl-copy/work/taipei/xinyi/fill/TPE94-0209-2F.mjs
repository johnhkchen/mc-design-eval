import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0209-2F";
const W = 23, D = 7, H = 24;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .map(([x, z, gr]) => [x | 0, z | 0, Math.round(gr)]);

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const GROUND = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => GROUND.has(key(x, z));
const isExterior = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// One common datum for the whole mall so the roof reads level (lidar: roof ~12 above lowest ground).
const minG = Math.min(...cells.map(c => c[2]));
const S1 = minG + 5;   // storey line / level-2 floor
const S2 = minG + 10;  // roof slab / cornice
const P = minG + 11;   // parapet top (roof ~12 blocks)

// Street-side entrance: middle of the front (smallest z) exterior run, 3 cells wide.
const minZ = Math.min(...cells.map(([, z]) => z));
const frontCells = cells
  .filter(([x, z]) => z === minZ && isExterior(x, z))
  .sort((a, b) => a[0] - b[0]);
const doorX = frontCells[Math.floor(frontCells.length / 2)][0];
const isDoor = (x, z) => z === minZ && Math.abs(x - doorX) <= 1 && isExterior(x, z);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isExterior(x, z)) {
    // Base course at ground.
    put(x, gr, z, "polished_granite");

    for (let y = gr + 1; y <= P; y++) {
      // Parapet and cornice on the common datum.
      if (y === P) { put(x, y, z, "white_concrete"); continue; }
      if (y === S2) { put(x, y, z, "light_gray_concrete"); continue; }
      if (y === S1) { put(x, y, z, "light_gray_concrete"); continue; }

      if (y < S1) {
        // Ground storey: shopfront with pillars, glass bays, kickplate and fascia.
        if (isDoor(x, z)) {
          if (y === S1 - 1) {
            put(x, y, z, x === doorX ? "gold_block" : "black_concrete");
          }
          // door opening is air below the fascia
          continue;
        }
        if (y === S1 - 1) { put(x, y, z, "black_concrete"); continue; }   // fascia
        if (y === gr + 1) { put(x, y, z, "polished_andesite"); continue; } // kickplate
        if (x % 4 === 0) { put(x, y, z, "white_concrete"); continue; }     // pillar
        put(x, y, z, "light_blue_stained_glass");                          // shop glass
        continue;
      }

      // Upper storey: curtain wall with mullions, sill and head spandrels.
      if (y === S1 + 1 || y === S2 - 1) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, x % 2 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
    }
  } else {
    // Interior: floor slabs at each storey line above this cell's ground, air gap behind glass.
    if (gr < S1) put(x, S1, z, "smooth_stone");
    if (gr < S2) put(x, S2, z, "smooth_stone");
    if (gr < P) put(x, gr, z, "smooth_stone");

    // Warm lanterns hanging from the slabs, set back from the glass.
    const behindFront = z === minZ + 1;
    if (behindFront && gr < S1 - 1 && x % 4 === 2) {
      put(x, S1 - 1, z, "lantern", { hanging: "true" });
    }
    if (behindFront && gr < S2 - 1 && x % 4 === 0) {
      put(x, S2 - 1, z, "lantern", { hanging: "true" });
    }

    // Roof plant on the roof slab.
    if (x % 7 === 3 && z === 3) {
      put(x, P, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
