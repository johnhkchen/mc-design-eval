import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326010";
const W = 10, H = 21, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const has = (x, z) => cells.some(c => c[0] === x && c[1] === z);

// One flat parapet line for the whole walk-up, from the median lidar roof
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const flatTop = Math.min(H - 5, Math.round(medRoof) - 1);

const chimneyCell = cells.find(c => c[0] === 2);

const exN = (x, z) => !has(x, z - 1);
const exS = (x, z) => !has(x, z + 1);
const exW = (x, z) => !has(x - 1, z);
const exE = (x, z) => !has(x + 1, z);

// Trim: light sandstone reads as brownstone/limestone from the air at dusk
const TRIM = "smooth_sandstone";
const BASE = "stone_bricks";
const WALL = "bricks";

for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const topC = Math.max(flatTop, ground + 5);
  const n = exN(x, z), s = exS(x, z), w = exW(x, z), e = exE(x, z);
  const zFace = n || s;
  const wall = n || s || w || e;

  // Foundation to lowest-ground-relative footing
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);

  const topRow = topC - ground;
  for (let y = ground; y <= topC; y++) {
    const k = y - ground;
    if (k === 0) {
      g.set(x, y, z, BASE); // plinth course
    } else if (k === topRow) {
      g.set(x, y, z, TRIM); // cornice
    } else if (k % 2 === 0) {
      // storey line: stone band on the walls, brick floor slab inside
      g.set(x, y, z, wall ? TRIM : WALL);
    } else {
      // window row
      if (!wall) continue; // interior air behind the glass
      if (zFace && x % 2 === 1 && x <= 7) {
        // one or two warm windows per facade, the rest plain glass
        const lit = (x === 3 && k === 3) || (x === 7 && k === 5);
        if (lit) {
          g.set(x, y, z, "glowstone");
        } else {
          g.set(x, y, z, "glass_pane", {
            north: "false", south: "false", east: "true", west: "true", waterlogged: "false"
          });
        }
      } else {
        g.set(x, y, z, WALL);
      }
    }
  }

  // Parapet cap
  g.set(x, topC + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Chimney stack on the x=2 column
  if (chimneyCell && x === chimneyCell[0] && z === chimneyCell[1]) {
    g.set(x, topC + 2, z, WALL);
    g.set(x, topC + 3, z, WALL);
    g.set(x, topC + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance centred on the street face (low z if exposed, else high z)
let doorDone = false;
for (const [x, z, gr] of cells) {
  if (doorDone || x !== 4) continue;
  const ground = Math.max(0, Math.round(gr));
  const facing = exN(x, z) ? "north" : exS(x, z) ? "south" : null;
  if (!facing) continue;
  // stone surround above the door, then the door itself
  g.set(x, ground + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, ground + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  doorDone = true;
}

g.save(`${DIR}/${ID}.nbt`);
