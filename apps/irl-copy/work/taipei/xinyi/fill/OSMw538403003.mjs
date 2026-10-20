import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403003";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 23, D = 6;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const key = (x, z) => `${x},${z}`;
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(key(x, z), gr);
const has = (x, z) => gm.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DOOR_X = 13;

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Edge tests: a side is exposed where no footprint neighbour exists
  const wallN = !has(x, z - 1); // back (z = 0 side)
  const wallS = !has(x, z + 1); // street front (z = 5 side)
  const wallW = !has(x - 1, z);
  const wallE = !has(x + 1, z);
  const edge = wallN || wallS || wallW || wallE;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, second floor, roof deck
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 10, z, "gray_concrete");

  if (!edge) {
    // Roof plant on the deck, a few units
    if (x % 8 === 3 && z === 2) put(x, gr + 11, z, "iron_block");
    continue;
  }

  // Perimeter walls, storey 1 (offsets 1..4) and storey 2 (6..9)
  for (let o of [1, 2, 3, 4, 6, 7, 8, 9]) {
    put(x, gr + o, z, "white_concrete");
  }

  // Cornice and parapet
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "white_concrete");

  if (wallS) {
    // Street front: shopfront on the ground floor
    const pier = x % 6 === 0;
    for (let o of [1, 2, 3]) {
      if (pier) {
        put(x, gr + o, z, "smooth_stone");
      } else if (x === DOOR_X && o === 1) {
        put(x, gr + o, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (x === DOOR_X && o === 2) {
        put(x, gr + o, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, gr + o, z, "glass");
      }
    }
    // Fascia / canopy band above shopfront
    put(x, gr + 4, z, "smooth_stone");

    // Upper storey window grid: sill band, glass bays with mullions, head band
    const mullion = x % 3 === 0;
    for (let o of [6, 7, 8]) {
      if (mullion) {
        put(x, gr + o, z, "white_concrete");
      } else {
        put(x, gr + o, z, "glass_pane");
      }
    }
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 9, z, "smooth_quartz");

    // Warm lights behind a few upper windows (air gap at z = 4)
    if (!mullion && x % 9 === 4) {
      put(x, gr + 6, 4, "shroomlight");
    }
  } else if (wallN) {
    // Back wall: plain with a window grid on the upper storey
    const mullion = x % 3 === 0;
    for (let o of [6, 7, 8]) {
      if (!mullion) put(x, gr + o, z, "glass_pane");
      else put(x, gr + o, z, "white_concrete");
    }
  }
  // End walls (wallE / wallW) stay solid white concrete from the loop above.
}

g.save(`${DIR}/${ID}.nbt`);
