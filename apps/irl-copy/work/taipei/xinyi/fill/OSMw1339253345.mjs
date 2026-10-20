import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253345";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([8, 19, 5]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));
const isExt = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Lowest ground sets the common datum; roof sits 7 blocks above it.
const L = Math.min(...cells.map((c) => c[2]));
const TOP = L + 7;
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation and plinth: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  g.set(x, gr, z, "stone_bricks");

  const ext = isExt(x, z);
  const front = !has(x, z - 1); // street face on the north side (z = 0)
  const corner = isCorner(x, z);

  for (let y = gr + 1; y <= TOP; y++) {
    // Roof: parapet ring on the outside, roof terrace inside.
    if (y === TOP) {
      g.set(x, y, z, ext ? "smooth_stone" : "gray_concrete");
      continue;
    }
    // Storey line / floor slab at the second-storey level.
    if (y === L + 3) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    // Interior: air gap behind the glass.
    if (!ext) continue;

    // Exterior corner pilasters run full height.
    if (corner) {
      g.set(x, y, z, "quartz_block");
      continue;
    }

    if (y <= L + 2) {
      // Ground storey: shopfront on the street face, plain white wall elsewhere.
      if (front) {
        if (x === 3 && y === gr + 1) {
          g.set(x, y, z, "oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (x === 3 && y === gr + 2) {
          g.set(x, y, z, "oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, "glass");
        }
      } else {
        g.set(x, y, z, "white_concrete");
      }
    } else if (y === L + 6) {
      // Upper-storey lintel band.
      g.set(x, y, z, "white_concrete");
    } else {
      // Upper storey windows (rows L+4 and L+5).
      g.set(x, y, z, "light_blue_stained_glass_pane", PANE);
      // Warm light behind some street-facing windows.
      if (front && (x === 2 || x === 5) && y === L + 4 && has(x, z + 1) && !isExt(x, z + 1)) {
        g.set(x, y, z + 1, "glowstone");
      }
    }
  }
}

// Rooftop air-conditioning units sitting on the interior roof terrace.
if (TOP + 1 <= 18) {
  for (const [x, z] of cells) {
    if (!isExt(x, z) && (x + z) % 3 === 0) {
      g.set(x, TOP + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
