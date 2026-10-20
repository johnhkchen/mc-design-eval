import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339263101";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 271 x 68 footprint, roof ~12 blocks above lowest ground.
// Read as a 2-storey (plus parapet) commercial podium-style block:
// granite plinth, shopfront ground floor, white-tiled concrete upper floors
// with blue-glass window bands, quartz storey lines, parapet and rooftop plant.
const W = 271, H = 24, D = 68;
const ROOF = 12;            // absolute roof level (lowest ground = y 0)
const STOREY = 5;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id) => {
  if (y >= 0 && y < H && x >= 0 && x < W && z >= 0 && z < D) g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const isPerimeter = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !ground.has(key(x + dx, z + dz)));

for (const [x, z, gr] of cells) {
  const perim = isPerimeter(x, z);
  // Deck sits at the roof level, or on the ground if the ground is already higher.
  const deck = Math.max(gr, ROOF - 2);
  const parapet = deck + 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof deck (white on the perimeter edge, light grey inside).
  put(x, deck, z, perim ? "white_concrete" : "light_gray_concrete");

  // Floor slabs / storey lines above the ground floor.
  for (let L = gr + STOREY; L < deck; L += STOREY) put(x, L, z, "smooth_quartz");

  if (perim) {
    // Plinth course at ground level.
    put(x, gr, z, "polished_granite");

    // Walls, shopfront and window grid up to the parapet.
    for (let y = gr + 1; y < deck; y++) {
      const rel = y - gr;
      if ((rel % STOREY) === 0) continue; // storey line already placed

      const f = Math.floor(rel / STOREY);  // storey index, 0 = ground floor
      const lit = ((x * 3 + z * 5 + y * 7) % 31) === 0;

      if (f === 0) {
        // Shopfront: granite mullions every 8 blocks, glass between.
        if (((x + z) % 8) === 0) put(x, y, z, "polished_granite");
        else put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
      } else {
        // Upper storeys: window grid with white frames every 4 blocks.
        if (((x + z) % 4) === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
      }
    }

    // Entrances: an opening in the shopfront on the long faces with a frame.
    if ((x % 60) === 30 && (z <= 1 || z >= D - 2)) {
      put(x, gr + 1, z, "air");
      put(x, gr + 2, z, "air");
      put(x, gr + 3, z, "smooth_quartz");
    }

    // Parapet and cornice cap.
    put(x, parapet, z, "white_concrete");
    if (parapet + 1 < H) put(x, parapet + 1, z, "smooth_stone");
  } else {
    // Rooftop plant boxes scattered across the deck.
    if (((x * 7 + z * 11) % 97) === 0) {
      put(x, parapet, z, "light_gray_concrete");
      put(x, parapet + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
