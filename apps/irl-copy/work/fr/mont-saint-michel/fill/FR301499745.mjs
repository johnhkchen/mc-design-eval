import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499745.cells.json", "utf8"));

const W = 15, H = 18, D = 7;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(x + "," + z, [gr, rf]);
const has = (x, z) => map.has(x + "," + z);

// One clean flat roof for the whole building (lidar noise smoothed away)
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
const R = Math.min(H - 2, Math.max(6, Math.round(roofMed)));

const NONE = {};
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const WALL = "calcite";

for (const [x, z, gr] of cells) {
  const G = Math.max(0, Math.min(R - 5, Math.round(gr)));

  // foundation and ground floor slab
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks", NONE);
  g.set(x, G, z, "stone_bricks", NONE);

  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const front = z === 0;
  const back = z === D - 1;
  const left = x === 0;
  const right = x === W - 1;

  if (perim) {
    for (let y = G + 1; y <= R - 2; y++) {
      let id = WALL, props = NONE;

      if (front) {
        if (y <= G + 2) {
          // shopfront: stone piers, glass bays, centred door in a stone surround
          if (left || right || x === 4 || x === 6 || x === 8 || x === 10) {
            id = "stone_bricks";
          } else if (x === 7) {
            id = "oak_door";
            props = {
              facing: "north",
              half: y === G + 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
              powered: "false"
            };
          } else {
            id = "glass";
          }
        } else if (y === G + 3) {
          // striped awning band
          if (left || right) id = "stone_bricks";
          else id = x % 2 === 0 ? "red_terracotta" : "white_terracotta";
        } else if (y >= G + 4 && y <= R - 3) {
          if (left || right) id = "stone_bricks";
          else if (x % 2 === 1) { id = "glass_pane"; props = PANE_EW; }
          else id = WALL;
        }
      } else if (back) {
        if (y === G + 1) id = "stone_bricks";
        else if (y >= G + 3 && y <= R - 3 && x % 2 === 1 && !left && !right) {
          id = "glass_pane"; props = PANE_EW;
        }
      } else {
        // side faces
        if (y === G + 1) id = "stone_bricks";
        else if (y >= G + 3 && y <= R - 3 && (z === 2 || z === 4)) {
          id = "glass_pane"; props = PANE_NS;
        }
      }

      if ((left || right) && (front || back)) id = "stone_bricks";

      g.set(x, y, z, id, props);
    }

    // cornice course
    g.set(x, R - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // interior air, ceiling slab at the top of the storey
    g.set(x, R - 1, z, "smooth_stone", NONE);
  }

  // flat slate roof over the whole footprint
  g.set(x, R, z, "deepslate_tiles", NONE);
}

// entrance canopy: a short slab hood over the door, supported by the piers
for (let x = 6; x <= 8; x++) {
  if (has(x, 0)) {
    const G = Math.max(0, Math.min(R - 5, Math.round(map.get(x + ",0")[0])));
    g.set(x, G + 3, 0, "red_terracotta", NONE);
  }
}

// warm lights behind the shop glass, inside the room
for (const x of [5, 9]) {
  if (has(x, 1)) {
    const G = Math.max(0, Math.min(R - 5, Math.round(map.get(x + ",1")[0])));
    g.set(x, G + 2, 1, "glowstone", NONE);
  }
}

// small brick chimney on the roof at the back-right
if (has(12, 5)) {
  for (let y = R + 1; y <= Math.min(H - 1, R + 2); y++) {
    g.set(12, y, 5, "bricks", NONE);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499745.nbt");
