import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Footprint 11 x 14, roof ~11 blocks above lowest ground (lidar).
// Read as a two-storey (about 5 blocks per storey) low commercial block of the
// 1990s Xinyi frontage: stone-bricks plinth, white concrete spandrels, glass-pane
// shopfront below and an upper office storey with a grid of panes, a smooth stone
// storey line, a cornice and a parapet, with rooftop plant on the deck.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020189";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

let y0 = Infinity, maxG = -Infinity;
for (const [, , gr] of cells) {
  if (gr < y0) y0 = gr;
  if (gr > maxG) maxG = gr;
}

// Absolute storey levels: ground floor slab at y0+5, roof deck at y0+11 (flat roof).
const Y1 = y0 + 5;
const roofTop = Math.min(20, Math.max(y0 + 11, maxG + 4));

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  if (!perimeter) {
    // Interior: air behind glass, floor slab per storey, roof deck, a few lamps.
    if (Y1 >= gr && Y1 < roofTop - 1) g.set(x, Y1, z, "smooth_stone");
    if (roofTop - 1 >= gr) g.set(x, roofTop - 1, z, "light_gray_concrete");
    // Warm lamps on the upper floor slab, near the windowed walls.
    if ((x === 1 || x === W - 2) && z % 3 === 2 && Y1 + 1 < roofTop - 1 && Y1 >= gr) {
      g.set(x, Y1 + 1, z, "glowstone");
    }
    continue;
  }

  // Perimeter wall column.
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const onZFace = z === 0 || z === D - 1;
  const along = onZFace ? x : z;
  const mullion = corner || along % 3 === 0;
  const pane = onZFace ? PANE_EW : PANE_NS;
  const isDoor = z === 0 && x === 5;

  for (let y = gr; y < roofTop - 1; y++) {
    if (y === gr) {
      g.set(x, y, z, "stone_bricks"); // base course
    } else if (y === Y1 && Y1 > gr) {
      g.set(x, y, z, "smooth_stone"); // storey line
    } else if (y === Y1 + 1 && Y1 + 1 > gr) {
      g.set(x, y, z, "white_concrete"); // upper spandrel / sill
    } else if (y === roofTop - 2 && roofTop - 2 > gr) {
      g.set(x, y, z, "white_concrete"); // head band under cornice
    } else if (y < Y1) {
      // Ground-floor shopfront
      if (isDoor && y <= gr + 2 && gr + 2 < Y1) {
        if (y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        }
      } else if (isDoor && y === gr + 3 && gr + 3 < Y1) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // canopy lintel
      } else if (mullion) {
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "glass_pane", pane);
      }
    } else {
      // Upper office storey window grid
      if (mullion) {
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "glass_pane", pane);
      }
    }
  }

  // Cornice and parapet on the perimeter.
  if (roofTop - 1 >= gr) g.set(x, roofTop - 1, z, "smooth_stone");
  g.set(x, roofTop, z, "stone_bricks");
}

// Rooftop plant boxes on the deck, inside the parapet.
const plant = [[3, 5], [4, 5], [3, 6], [4, 6], [7, 8], [7, 9]];
for (const [x, z] of plant) {
  if (groundAt(x, z) === undefined) continue;
  g.set(x, roofTop, z, "light_gray_concrete");
}
if (groundAt(3, 5) !== undefined) g.set(3, roofTop + 1, 5, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
