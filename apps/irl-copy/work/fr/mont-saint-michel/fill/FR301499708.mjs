import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499708";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Commercial 2-storey stone block, flat parapet roof, shopfront on the north (z=0) street face.
const W = 7, H = 26, D = 10;
const g = new Voxels([W, H, D]);

const has = (x, z) => cells.some(c => c[0] === x && c[1] === z);
const median = arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

// One common storey datum and one roof level for the whole block: removes lidar stepping.
const G = median(cells.map(c => c[2]));
const T = Math.max(G + 11, Math.round(median(cells.map(c => c[3]))));

const WALL = "stone_bricks";
const BASE = "polished_andesite";
const LINE = "chiseled_stone_bricks";
const FRAME = "dark_oak_planks";
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";

for (const [x, z, ground] of cells) {
  const gy = ground;
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const northFace = !has(x, z - 1);
  const southFace = !has(x, z + 1);
  const u = (northFace || southFace) ? x : z;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, WALL);

  if (perim) {
    for (let y = gy; y < T; y++) {
      const rel = y - G;
      let id = WALL;
      if (y === gy) id = BASE;                       // base course at cell ground
      else if (rel === 5 || rel === 10) id = LINE;   // storey line / cornice
      else if (rel >= 11) id = WALL;                 // parapet
      else if (rel >= 1 && rel <= 4) {               // ground storey (shopfront on north)
        if (northFace) {
          if (rel === 4) id = FRAME;                 // fascia
          else if (u % 2 === 0) id = FRAME;          // piers
          else if (u === 3 && rel <= 2) id = "dark_oak_door";
          else id = GLASS;
        } else {
          id = (u % 2 === 1) ? GLASS : WALL;
        }
      } else if (rel >= 6 && rel <= 8) {             // upper storey windows
        id = (u % 2 === 1) ? GLASS : WALL;
      }

      if (id === "dark_oak_door") {
        const half = rel === 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, id);
      }
    }
    g.set(x, T - 1, z, LINE);                        // roof coping
  } else {
    // Interior: air with floor slabs per storey and a roof deck; no hanging pieces
    g.set(x, gy, z, FLOOR);
    for (const f of [G + 5, G + 10]) if (f >= gy) g.set(x, f, z, FLOOR);
    g.set(x, T - 1, z, FLOOR);
    if (z === 1 && x % 2 === 1) g.set(x, G + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
    if (z === 1 && (x === 1 || x === 5)) g.set(x, G + 7, z, "glowstone");
  }
}

// Single chimney at the common roof level on an interior cell
if (has(3, 5) && !(!has(2, 5) || !has(4, 5) || !has(3, 4) || !has(3, 6))) {
  g.set(3, T, 5, "bricks");
  g.set(3, T + 1, 5, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
