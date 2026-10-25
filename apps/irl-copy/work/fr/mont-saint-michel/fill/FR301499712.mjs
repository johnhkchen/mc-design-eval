import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499712";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, D = 10, HMAX = 20;
const g = new Voxels([W, HMAX, D]);

// Normalise: grounds per cell, one flat roof tier for the whole building.
const grounds = cells.map(c => Math.round(c[2]));
const minG = Math.min(...grounds);
const maxG = Math.max(...grounds);
// One-storey commercial block: roof about 8 blocks above the lowest ground.
const roofTop = Math.min(HMAX - 3, Math.max(minG + 8, maxG + 5));

const WALL = "smooth_sandstone";
const BASE = "stone_bricks";
const CORNICE = "stone_bricks";
const COPING = "stone_brick_slab";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const AWNING = "red_terracotta";

function paneEW(x, y, z) {
  g.set(x, y, z, "glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
}
function paneNS(x, y, z) {
  g.set(x, y, z, "glass_pane", { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
}

for (const c of cells) {
  const x = c[0], z = c[1];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.round(c[2]));
  const roof = roofTop;

  // Foundation fill up to this cell's ground, so nothing floats on the slope.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;

  if (perimeter) {
    // Solid wall from ground to the parapet, every cell.
    for (let y = gr; y <= roof - 2; y++) g.set(x, y, z, WALL);
    g.set(x, gr, z, BASE);
    g.set(x, gr + 4, z, CORNICE);
    g.set(x, roof - 2, z, CORNICE);
    g.set(x, roof - 1, z, COPING, { type: "top", waterlogged: "false" });

    if (front && x >= 1 && x <= W - 2) {
      // Shopfront: bulkhead, glazing, awning band.
      g.set(x, gr, z, "polished_andesite");
      g.set(x, gr + 3, z, AWNING);
      if (x === 2) {
        g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        paneEW(x, gr + 1, z);
        paneEW(x, gr + 2, z);
      }
    } else if (front) {
      g.set(x, gr + 3, z, AWNING);
    }

    if (!front && z === D - 1 && (x === 1 || x === 4)) {
      paneEW(x, gr + 1, z);
      paneEW(x, gr + 2, z);
    }
    if ((x === 0 || x === W - 1) && !front && (z === 3 || z === 6)) {
      paneNS(x, gr + 1, z);
      paneNS(x, gr + 2, z);
    }
  } else {
    // Interior: floor slab, air gap behind the glass, ceiling, roof deck.
    g.set(x, gr, z, FLOOR);
    for (let y = gr + 1; y <= roof - 3; y++) g.set(x, y, z, "air");
    g.set(x, roof - 2, z, FLOOR);
    g.set(x, roof - 1, z, FLOOR);
  }
}

// Warm lights behind the shopfront glass.
{
  const c = cells.find(cc => cc[0] === 1 && cc[1] === 1);
  const gr = c ? Math.round(c[2]) : minG;
  g.set(1, gr + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
  g.set(4, gr + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Small rooftop chimney, set inside the footprint on the roof deck.
if (roofTop + 2 < HMAX) {
  g.set(2, roofTop, 5, "stone_brick_wall");
  g.set(2, roofTop + 1, 5, "stone_brick_wall");
}

g.save(`${DIR}/${ID}.nbt`);
