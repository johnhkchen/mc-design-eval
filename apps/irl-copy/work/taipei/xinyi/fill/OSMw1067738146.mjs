import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738146";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 30, H = 23, D = 38;
const TOP = 11;        // parapet course (roof line about 11 blocks above lowest ground)
const DECK = 10;       // roof deck / cornice course
const FLOOR2 = 5;      // second-storey floor and fascia line
const SHOP_TOP = 4;    // canopy / transom over shopfronts
const SLAB = { type: "bottom", waterlogged: "false" };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

// Facade rule for an exterior wall column. u = position along the face,
// y = height, gcc = the cell's ground (base course), entr = entrance bay.
function facade(y, u, gcc, entr) {
  if (y === gcc) return ["polished_andesite"];
  if (y < SHOP_TOP) {
    if (entr) return ["glass"];
    return u % 5 === 0 ? ["smooth_quartz"] : ["glass"];
  }
  if (y === SHOP_TOP) {
    return entr ? ["mud_brick_slab", SLAB] : ["smooth_quartz"];
  }
  if (y === FLOOR2) return ["smooth_quartz"];
  if (y <= 9) {
    if (u % 3 === 0) return ["white_concrete"];          // piers between window bays
    if (y === 6) return ["smooth_quartz_slab", SLAB];     // sill
    const bay = Math.floor(u / 3);
    if (y === 7 && u % 3 === 1 && bay % 2 === 1) return ["glowstone"]; // warm lit bay
    if (y === 9) return ["smooth_quartz"];                // head
    return ["light_blue_stained_glass"];
  }
  if (y === DECK) return ["stone_brick_slab", SLAB];      // cornice
  return ["stone_brick_wall"];                            // parapet
}

for (const [x, z, gr] of cells) {
  const gcc = Math.max(0, Math.min(H - 1, gr));

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gcc; y++) put(x, y, z, "stone_bricks");

  // Find the exterior face this cell sits on (first missing neighbour).
  let face = null;
  if (!inside(x, z - 1)) face = { name: "N", u: x, c: 15 };
  else if (!inside(x, z + 1)) face = { name: "S", u: x, c: 15 };
  else if (!inside(x - 1, z)) face = { name: "W", u: z, c: 19 };
  else if (!inside(x + 1, z)) face = { name: "E", u: z, c: 19 };

  if (face) {
    const entr = Math.abs(face.u - face.c) <= 1;
    for (let y = gcc; y <= TOP; y++) {
      const blk = facade(y, face.u, gcc, entr);
      put(x, y, z, blk[0], blk[1]);
    }
  } else {
    // Interior: ground floor slab, second-floor slab, roof deck. Air behind glass.
    put(x, gcc, z, "smooth_stone");
    if (FLOOR2 > gcc) put(x, FLOOR2, z, "smooth_stone");
    put(x, DECK, z, "smooth_stone");

    // Roof equipment: AC plant and a water tank on a few cells.
    if (x % 8 === 4 && z % 9 === 4) put(x, DECK + 1, z, "light_gray_concrete");
    else if (x % 11 === 6 && z % 13 === 7) put(x, DECK + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
