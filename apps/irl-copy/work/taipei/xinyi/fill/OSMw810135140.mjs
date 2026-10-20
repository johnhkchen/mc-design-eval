import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw810135140";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 19, D = 9;
const ROOF = 7;                       // lidar roof height above lowest ground
const g = new Voxels([W, H, D]);

const has = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const topOf = new Map();

const WALL = "white_concrete";
const BASE = "polished_andesite";
const CORNER = "smooth_stone";
const FLOOR = "smooth_stone";
const DECK = "light_gray_concrete";
const GLASS = "glass_pane";
const CAP = "stone_brick_slab";
const FOUND = "stone";

for (const [x, z, gr] of cells) {
  // Shallow single-storey pavilion: at least 4 blocks of wall-and-band above the floor.
  const top = Math.max(gr + 4, ROOF - 1);
  topOf.set(`${x},${z}`, top);

  // Foundation under each cell, then the floor slab on top of it.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  g.set(x, gr, z, FLOOR);

  const edgeX = x === 0 || x === 8;
  const edgeZ = z === 0 || z === 8;
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;
  const front = z === 8;
  const back = z === 0;
  const pos = (front || back) ? x : z;  // position along the face

  // Interior cells stay open air between floor and roof.
  if (perim) {
    for (let y = gr + 1; y < top; y++) {
      if (corner) {
        g.set(x, y, z, CORNER);
        continue;
      }

      // Front (street) face: shopfront with central door.
      if (front && pos >= 2 && pos <= 6) {
        if (y === gr + 1 || y === gr + 2) {
          if (pos === 4 && y === gr + 1) {
            g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (pos === 4 && y === gr + 2) {
            g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            g.set(x, y, z, GLASS);
          }
          continue;
        }
        if (y === gr + 3) {
          // Canopy/lintel over the shopfront.
          g.set(x, y, z, CAP, { type: "bottom", waterlogged: "false" });
          continue;
        }
      }

      // Base course.
      if (y === gr + 1) {
        g.set(x, y, z, BASE);
        continue;
      }

      // Cornice band just under the parapet.
      if (y === top - 1) {
        g.set(x, y, z, WALL);
        continue;
      }

      // Window grid: glass on odd bays, concrete piers on even bays.
      if (y >= gr + 2 && y <= top - 2) {
        if (pos % 2 === 1) g.set(x, y, z, GLASS);
        else g.set(x, y, z, WALL);
        continue;
      }

      g.set(x, y, z, WALL);
    }
  }

  // Roof deck over every footprint cell.
  g.set(x, top, z, DECK);

  // Parapet cap on the perimeter.
  if (perim) {
    g.set(x, top + 1, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}

// Warm light behind some back-wall windows (interior row z=1).
for (const x of [3, 5]) {
  const gr = has.get(`${x},1`);
  if (gr !== undefined) g.set(x, gr + 2, 1, "glowstone");
}

// Rooftop condenser block on the interior roof.
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3]]) {
  const top = topOf.get(`${x},${z}`);
  if (top !== undefined && top + 1 < H) g.set(x, top + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
