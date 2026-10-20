import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1335587032";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, D = 12, H = 19;
const g = new Voxels([W, H, D]);

// Plan: one shophouse storey (red fascia, glazed shopfront, tiled base) with a flat
// parapet roof. Roof level is shared across the footprint: lowest ground + 7, lifted
// only if the highest cell needs room for its storey.
const gmin = Math.min(...cells.map(c => c[2]));
const gmax = Math.max(...cells.map(c => c[2]));
const R = Math.min(H, Math.max(gmin + 7, gmax + 6)); // roof deck at R-2, parapet at R-1

const P = new Map();           // placed block ids, for pane connections
const glassList = [];          // glass panes resolved after all placement
const key = (x, y, z) => `${x},${y},${z}`;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
  P.set(key(x, y, z), id);
}
function glass(x, y, z) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  glassList.push([x, y, z]);
  P.set(key(x, y, z), "glass_pane");
}

const SOLID = new Set(["white_concrete", "light_gray_concrete", "red_concrete",
  "stone_bricks", "smooth_stone", "iron_block", "glass_pane"]);
function conn(x, y, z) {
  const id = P.get(key(x, y, z));
  return id && SOLID.has(id) ? "true" : "false";
}

for (const [x, z, gr] of cells) {
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0, back = z === D - 1;
  const side = (x === 0 || x === W - 1) && !front && !back;

  // Foundation under the cell, up to its own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab: base course on the perimeter, light floor inside.
  put(x, gr, z, perim ? "stone_bricks" : "light_gray_concrete");

  // Ground storey walls and openings (gr+1 .. gr+3).
  if (perim) {
    for (let k = 1; k <= 3; k++) {
      const y = gr + k;
      if (front) {
        if (x === 0 || x === W - 1) {
          put(x, y, z, "white_concrete");                 // piers
        } else if (x === 2 && k <= 2) {
          // Shop entrance door, lower and upper halves.
          put(x, y, z, "oak_door", { facing: "north", half: k === 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false" });
        } else {
          glass(x, y, z);                                  // shopfront glazing
        }
      } else if (back) {
        if (k === 2 && x >= 1 && x <= W - 2) glass(x, y, z);
        else put(x, y, z, "white_concrete");
      } else if (side) {
        if (k === 2 && (z - 1) % 3 !== 2) glass(x, y, z);
        else put(x, y, z, "white_concrete");
      }
    }
    // Interior warm light behind a few shop and side windows (sits on the floor slab).
    // Placed only when the cell is the interior of the footprint.
  } else {
    // Interior cells: air gap until the ceiling slab.
  }

  // Interior lights on the floor, behind selected windows.
  if (!perim) {
    if ((x === 1 && z === 5) || (x === 4 && z === 6) || (x === 2 && z === 1)) {
      put(x, gr + 1, z, "glowstone");
    }
  }

  // Ceiling slab over the storey. Red fascia band on the front face.
  if (perim && front) {
    put(x, gr + 4, z, "red_concrete");
  } else {
    put(x, gr + 4, z, "light_gray_concrete");
  }

  // Solid core between the ceiling and the roof deck.
  for (let y = gr + 5; y <= R - 3; y++) put(x, y, z, "white_concrete");

  // Roof deck (cornice ring on the perimeter), then parapet ring.
  if (R - 2 > gr + 4) put(x, R - 2, z, perim ? "smooth_stone" : "light_gray_concrete");
  else if (perim) put(x, R - 2, z, "smooth_stone");
  if (perim) put(x, R - 1, z, "white_concrete");   // parapet
}

// Roof equipment: two condenser units on the deck, at the back.
put(2, R - 1, 8, "iron_block");
put(3, R - 1, 8, "iron_block");

// Resolve glass pane connections now that all neighbours are known.
for (const [x, y, z] of glassList) {
  g.set(x, y, z, "glass_pane", {
    north: conn(x, y, z - 1),
    south: conn(x, y, z + 1),
    east: conn(x + 1, y, z),
    west: conn(x - 1, y, z),
    waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
