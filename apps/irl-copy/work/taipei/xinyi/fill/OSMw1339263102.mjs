import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339263102";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 30 x 3 footprint, two storeys of ~5 blocks, parapet to ~12 blocks.
// Reads as a 1980s cream-tiled concrete mid-rise: rhythm of piers and
// ribbon windows, a red shopfront lintel on the street face, a light
// cornice band between storeys, and a lit shop and lit upper bays.
const W = 30, H = 24, D = 3;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const end = x === 0 || x === W - 1;
  const front = z === 0;
  const back = z === 2;
  const middle = z === 1;
  const bay = x % 5;

  for (let rel = 0; rel <= 12; rel++) {
    const y = gr + rel;

    // Base course.
    if (rel === 0) { put(x, y, z, "polished_andesite"); continue; }

    // Storey slabs (floor lines / cornice bands), full depth.
    if (rel === 5 || rel === 10) { put(x, y, z, "light_gray_concrete"); continue; }

    // Parapet and cap; middle row stays open for roof plant.
    if (rel === 11) {
      if (!middle || end) put(x, y, z, "white_concrete");
      else if (bay === 1 || bay === 2) put(x, y, z, "light_gray_concrete"); // roof plant
      continue;
    }
    if (rel === 12) {
      if (!middle || end) put(x, y, z, "light_gray_concrete");
      else if (bay === 1 || bay === 2) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Wall storeys: ground rel 1..4, upper rel 6..9.
    const ground = rel <= 4;
    const winRow = ground ? rel >= 1 && rel <= 3 : rel >= 7 && rel <= 8;

    if (end) { put(x, y, z, "white_concrete"); continue; }

    if (middle) {
      // Core wall, with an air gap behind window openings and warm lights.
      if (winRow && bay >= 1 && bay <= 3) {
        if (!ground && rel === 7 && bay === 2 && Math.floor(x / 5) % 2 === 0) {
          put(x, y, z, "lantern", LANTERN);
        } else if (ground && rel === 2 && bay === 2) {
          put(x, y, z, "shroomlight");
        }
        // otherwise leave air
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    // Street (z=0) and back (z=2) facades.
    if (bay === 0) { put(x, y, z, "white_concrete"); continue; } // piers

    if (ground && rel === 4) {
      put(x, y, z, front ? "red_concrete" : "light_gray_concrete"); // shopfront lintel
      continue;
    }
    if (!ground && (rel === 6 || rel === 9)) {
      put(x, y, z, "light_gray_concrete"); // sill and head
      continue;
    }

    if (front && bay === 2 && (rel === 1 || rel === 2)) {
      put(x, y, z, "dark_oak_door", rel === 1 ? DOOR_LOWER : DOOR_UPPER); // entrance
      continue;
    }

    if (winRow) {
      put(x, y, z, "glass_pane", GLASS);
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
