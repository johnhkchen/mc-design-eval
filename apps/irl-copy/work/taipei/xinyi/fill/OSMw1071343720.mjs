import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343720";

// Footprint: 25 x 16 blocks, roof at absolute y 11 (about 11 blocks above lowest ground).
// Reads as a two-storey, late-20th-century commercial block: white concrete piers,
// tinted glass bays, a quartz cornice band and parapet, and a shopfront with entrance.
const W = 25, H = 23, D = 16;
const ROOF_Y = 11;      // parapet top
const CORNICE_Y = 10;   // roof deck / cornice band
const FLOOR_Y = 5;      // storey line between the two floors
const SLAB_Y = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const exterior = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

const SLAB = { type: "top", waterlogged: "false" };

for (const [key, gr0] of ground) {
  const [x, z] = key.split(",").map(Number);
  const gr = Math.max(0, Math.min(H - 1, gr0));
  const ext = exterior(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Above 10 there is no room for the building; leave only the foundation.
  if (gr > CORNICE_Y) continue;

  // Base course on the exterior, floor on the inside.
  g.set(x, gr, z, ext ? "polished_andesite" : "smooth_stone");

  const pier = x % 4 === 0 || x === W - 1;

  for (let y = gr + 1; y <= ROOF_Y; y++) {
    if (y === FLOOR_Y) {
      g.set(x, y, z, ext ? "smooth_quartz" : "light_gray_concrete");
    } else if (y === CORNICE_Y) {
      g.set(x, y, z, ext ? "smooth_quartz" : "light_gray_concrete");
    } else if (y === SLAB_Y) {
      if (ext) g.set(x, y, z, "smooth_quartz_slab", SLAB);
    } else if (y < FLOOR_Y) {
      // Ground storey: shopfront with piers, glass bays and a central entrance.
      if (!ext) continue;
      if (pier) {
        g.set(x, y, z, "white_concrete");
      } else if (z === 0 && (x === 12 || x === 13) && y <= gr + 2) {
        // entrance opening (air)
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else {
      // Upper storey: framed windows with quartz sill and head.
      if (!ext) continue;
      if (pier) {
        g.set(x, y, z, "white_concrete");
      } else if (y === 6 || y === 9) {
        g.set(x, y, z, "smooth_quartz");
      } else if (y === 7 && x % 8 === 2) {
        g.set(x, y, z, "glowstone");   // warm light in some windows
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Roof plant: a small enclosed mechanical box on the deck, centre of the roof.
  const inBox = x >= 10 && x <= 14 && z >= 5 && z <= 10;
  if (!ext && inBox && gr <= CORNICE_Y) {
    g.set(x, SLAB_Y, z, "light_gray_concrete");
    g.set(x, SLAB_Y + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
