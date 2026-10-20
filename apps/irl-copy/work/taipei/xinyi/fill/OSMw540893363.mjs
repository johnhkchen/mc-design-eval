import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893363";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 21, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Two storeys of 5 blocks on a level roof at y=10, parapet to y=11.
const ROOF = 10;
const TOP = 11;
const STOREY_LINE = 5;
const MAXZ = Math.max(...cells.map((c) => c[1]));

// Entrance: edge cell on the max-z frontage nearest the middle.
let ENT = null;
for (const [x, z] of cells) {
  if (z === MAXZ && (ENT === null || Math.abs(x - 10) < Math.abs(ENT - 10))) ENT = x;
}

const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };

for (const [x, z] of cells) {
  const G = ground.get(key(x, z));
  const edge = isEdge(x, z);
  const corner = edge && (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const pier = corner || (x + z) % 3 === 0;
  const nb = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
  const depth1 = !edge && nb.some(([a, b]) => has(a, b) && isEdge(a, b));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone");

  if (G >= TOP) continue;

  if (edge) {
    // Base course at street level.
    g.set(x, G, z, "stone_bricks");

    for (let y = G + 1; y <= 9; y++) {
      const isEntrance = x === ENT && z === MAXZ && y >= G + 1 && y <= G + 2;
      if (isEntrance) continue; // open doorway, air gap
      if (x === ENT && z === MAXZ && y === G + 3) {
        g.set(x, y, z, "white_concrete"); // lintel over entrance
        continue;
      }
      if (y === STOREY_LINE) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (y === 9) {
        g.set(x, y, z, "smooth_quartz"); // upper spandrel
      } else if (y < STOREY_LINE && y <= G + 3) {
        // Shopfront glazing with mullions.
        g.set(x, y, z, pier ? "polished_andesite" : "gray_stained_glass");
      } else if (y >= 6 && y <= 8) {
        // Upper storey window grid.
        g.set(x, y, z, pier ? "polished_andesite" : "light_blue_stained_glass");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }

    // Hanging lantern over the entrance.
    if (x === ENT && z === MAXZ && G + 2 < STOREY_LINE) {
      g.set(x, G + 2, z, "lantern", LANTERN);
    }

    // Cornice band and parapet.
    g.set(x, ROOF, z, "light_gray_concrete");
    g.set(x, TOP, z, "smooth_stone_slab", SLAB_BOTTOM);
  } else {
    // Interior: base slab, storey floor, roof slab; air gaps between.
    g.set(x, G, z, "light_gray_concrete");
    if (G < STOREY_LINE) g.set(x, STOREY_LINE, z, "light_gray_concrete");
    g.set(x, ROOF, z, "light_gray_concrete");
  }

  // Warm lights behind the glass, sitting on floor slabs.
  if (depth1 && G + 1 < STOREY_LINE && (x * 3 + z * 5) % 11 === 0) {
    g.set(x, G + 1, z, "glowstone");
  }
  if (depth1 && G < STOREY_LINE && (x + 2 * z) % 7 === 0) {
    g.set(x, 6, z, "shroomlight");
  }

  // Roof plant boxes.
  if (!edge && ((x >= 6 && x <= 7 && z >= 4 && z <= 5) || (x >= 13 && x <= 14 && z >= 6 && z <= 7))) {
    g.set(x, TOP, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
