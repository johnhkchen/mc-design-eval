import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334813695";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 64, H = 19, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => groundOf.has(key(x, z));

// Height check: roof top block sits at ground + 7 for every cell.
for (const [, , gr] of cells) {
  if (gr + 7 > H - 1) throw new Error(`ground ${gr} puts roof above grid height ${H}`);
}

const DOOR_X = [10, 50];

for (const [x, z, G] of cells) {
  // Foundation below the floor slab, then the floor slab itself.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, G, z, "smooth_stone");

  const north = !has(x, z - 1); // street face (z = 0)
  const south = !has(x, z + 1); // back face (z = 5)
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const perimeter = north || south || west || east;

  if (!perimeter) {
    // Interior: air, with a ceiling/roof slab at ground + 7.
    g.set(x, G + 7, z, "smooth_stone");
    // Warm shroomlight just behind the street-face glass.
    if (z === 1 && x % 8 === 3) g.set(x, G + 3, z, "shroomlight");
    continue;
  }

  // Cornice band (ground + 5) and parapet (ground + 6, cap at ground + 7).
  g.set(x, G + 5, z, "smooth_stone");
  g.set(x, G + 6, z, "white_concrete");
  g.set(x, G + 7, z, "smooth_stone");

  if (north) {
    // Street face: plinth, pillars every 4 blocks, glass shopfront, two entrances.
    g.set(x, G + 1, z, "polished_andesite");
    for (let y = G + 2; y <= G + 4; y++) {
      g.set(x, y, z, x % 4 === 0 ? "white_concrete" : "glass");
    }
    if (DOOR_X.includes(x)) {
      g.set(x, G + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, G + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, G + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else if (south) {
    // Back face: solid with a regular glazing rhythm.
    g.set(x, G + 1, z, "light_gray_concrete");
    for (let y = G + 2; y <= G + 4; y++) {
      g.set(x, y, z, x % 4 === 0 ? "white_concrete" : (x % 4 === 1 || x % 4 === 2 || x % 4 === 3) ? "glass" : "white_concrete");
    }
  } else {
    // End walls.
    for (let y = G + 1; y <= G + 4; y++) g.set(x, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
