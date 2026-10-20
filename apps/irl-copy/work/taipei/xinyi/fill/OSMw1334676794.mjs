import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Bigtom American Ice Cream Cafe, Xinyi district.
// Low-rise 1990s commercial block: one shopfront storey on a stone plinth,
// cream concrete piers, glass bays, a Bigtom-red fascia band, cornice and
// parapet, with a flat roof carrying AC plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334676794";
const W = 23, H = 19, D = 25;
const ROOF = 7;   // lidar: roof about 7 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const grd = new Map();
for (const [x, z, gr] of cells) grd.set(key(x, z), gr);
const has = (x, z) => grd.has(key(x, z));
const isBoundary = (x, z) =>
  !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (inBounds(x, y, z)) g.set(x, y, z, id, props);
};

// Street-facing side is the +z edge. Door sits centred on that edge.
let zMax = -Infinity;
for (const [, z] of cells) zMax = Math.max(zMax, z);
const frontXs = cells.filter(([, z]) => z === zMax).map(([x]) => x).sort((a, b) => a - b);
const doorCenter = frontXs.length ? Math.floor((frontXs[0] + frontXs[frontXs.length - 1]) / 2) : -999;
const doorXs = new Set([doorCenter, doorCenter + 1]);

const pillar = (x, z) => (x + z) % 3 === 0;
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const [x, z, gr] of cells) {
  const top = Math.max(ROOF, gr + 5);
  const bnd = isBoundary(x, z);
  const isFrontDoorCell = bnd && z === zMax && doorXs.has(x);

  // Foundation and ground floor slab, so nothing floats on the slope.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  // Walls: storey pattern repeats every 5 rows (base, glass, glass, fascia, cornice).
  if (bnd) {
    for (let y = gr + 1; y <= top - 2; y++) {
      const rel = y - gr;
      const m = (rel - 1) % 5;

      if (isFrontDoorCell && rel <= 2) {
        const half = rel === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (m === 0) { put(x, y, z, "polished_andesite"); continue; }
      if (m === 3) { put(x, y, z, "red_concrete"); continue; }
      if (m === 4) { put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }

      // m = 1 or 2: glazed bays between cream concrete piers.
      if (pillar(x, z)) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane");
        // Warm light behind some panes, in the interior air cell next to them.
        if (m === 1 && (x * 5 + z * 3 + rel) % 9 === 0) {
          for (const [dx, dz] of dirs) {
            if (has(x + dx, z + dz) && !isBoundary(x + dx, z + dz)) {
              put(x + dx, y, z + dz, "glowstone");
              break;
            }
          }
        }
      }
    }
    // Transom over the door.
    if (doorXs.has(x) && z === zMax) put(x, gr + 3, z, "glass_pane");
    // Parapet cap.
    put(x, top - 1, z, "white_concrete");
  } else {
    // Interior cells: air gap, then the roof deck.
    put(x, top - 1, z, "light_gray_concrete");
    // Roof plant: a few AC units on the flat roof.
    if (x % 7 === 3 && z % 7 === 3) put(x, top, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
