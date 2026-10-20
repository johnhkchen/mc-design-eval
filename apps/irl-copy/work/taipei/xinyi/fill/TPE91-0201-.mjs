import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0201-";
const W = 18, H = 23, D = 66;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Two storeys of cream tile over a shopfront base, with a projecting cap at +11.
// Ground storey: stone plinth (+0), glass shopfront with terracotta piers (+1..+3),
//   fascia (+4).
// Upper storey: storey line (+5), spandrel (+6), glazing with dark mullions (+7..+8),
//   head (+9), parapet coping (+10), projecting cap slab (+11).
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");

  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const longFace = !has(x - 1, z) || !has(x + 1, z);
  const along = longFace ? z : x;
  const pier = along % 3 === 0;

  if (edge) {
    // Plinth
    put(x, gr, z, "stone_bricks");

    // Ground storey shopfront
    for (let k = 1; k <= 3; k++) {
      put(x, gr + k, z, pier ? "white_terracotta" : "glass_pane");
    }
    // Fascia
    put(x, gr + 4, z, "smooth_quartz");

    // Storey line and upper storey
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 6, z, "white_terracotta");
    put(x, gr + 7, z, pier ? "light_gray_concrete" : "glass_pane");
    put(x, gr + 8, z, pier ? "light_gray_concrete" : "glass_pane");
    put(x, gr + 9, z, "white_terracotta");
    put(x, gr + 10, z, "smooth_quartz");
    // Projecting cap slab over the parapet
    put(x, gr + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

    // Entrance on the z = 0 short end: stone jambs, double iron doors, red awning
    if (z === 0 && x >= 6 && x <= 11) {
      put(x, gr + 4, z, "red_concrete");
      if (x === 7 || x === 10) {
        put(x, gr + 1, z, "stone_bricks");
        put(x, gr + 2, z, "stone_bricks");
      }
      if (x === 8 || x === 9) {
        const hinge = x === 8 ? "left" : "right";
        for (const [yy, half] of [[gr + 1, "lower"], [gr + 2, "upper"]]) {
          put(x, yy, z, "iron_door", {
            facing: "north", half, hinge, open: "false", powered: "false",
          });
        }
      }
    }

    // Warm light behind glass on the long facades
    if (longFace && !pier) {
      const inX = x === 0 ? 1 : x === W - 1 ? W - 2 : null;
      if (inX !== null && has(inX, z)) {
        if (along % 6 === 1) put(inX, gr + 7, z, "glowstone");
        if (along % 6 === 4) put(inX, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  } else {
    // Interior: floor slab at the storey line and roof deck at the top
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "gray_concrete");

    // Low roof plant: flat 2x2 units, one layer, sitting on the deck
    if (x % 8 === 3 || x % 8 === 4) {
      if (z % 20 === 8 || z % 20 === 9) {
        put(x, gr + 11, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
