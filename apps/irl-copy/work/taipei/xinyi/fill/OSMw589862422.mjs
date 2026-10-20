import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw589862422";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 31 x 18 footprint, roof about 22 blocks above lowest ground.
// Read as a four-storey, 5-block-per-storey Xinyi-era commercial/office block:
// white tiled piers and light-blue glass curtain-wall bays, light grey spandrels,
// polished granite base, a shopfront ground storey, a stone parapet cap, and
// roof plant on the centre of the roof.
const W = 31, H = 34, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) {
  groundOf.set(key(x, z), Math.max(0, Math.min(gr, 19)));
}
const has = (x, z) => groundOf.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// Front (minimum z) entrance: centred door cell on the front row.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const doorX = Math.round((Math.min(...frontXs) + Math.max(...frontXs)) / 2);
const doorKey = key(doorX, minZ);

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

for (const [x, z] of cells) {
  const gr = groundOf.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const cornerX = !has(x - 1, z) || !has(x + 1, z);
    const cornerZ = !has(x, z - 1) || !has(x, z + 1);
    const isCorner = cornerX && cornerZ;
    const isPier = isCorner || (x + z) % 3 === 0;

    for (let y = gr; y <= 19; y++) {
      if (y === gr) {
        g.set(x, y, z, "polished_granite");                      // base course
      } else if (y % 5 === 0) {
        g.set(x, y, z, "light_gray_concrete");                   // storey spandrel / floor line
      } else if (isPier) {
        g.set(x, y, z, "white_concrete");                        // tiled pier / mullion
      } else if (y < 5) {
        g.set(x, y, z, "light_blue_stained_glass");              // shopfront glazing
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane");         // curtain-wall glazing
      }
    }
    // Parapet and cap.
    if (gr <= 20) g.set(x, 20, z, "light_gray_concrete");
    g.set(x, 21, z, "smooth_stone_slab", SLAB_BOTTOM);

    // Entrance on the front row: door, lintel canopy, glazed sides.
    if (key(x, z) === doorKey) {
      if (gr + 1 <= 19) {
        g.set(x, gr + 1, z, "dark_oak_door", DOOR_LOWER);
        g.set(x, gr + 2, z, "dark_oak_door", DOOR_UPPER);
      }
      if (gr + 3 <= 19) g.set(x, gr + 3, z, "dark_oak_slab", SLAB_BOTTOM); // canopy
    }
  } else {
    // Interior: floor slab per storey and the roof membrane; air elsewhere.
    for (const fy of [5, 10, 15]) {
      if (fy > gr) g.set(x, fy, z, "smooth_stone");
    }
    if (20 > gr) g.set(x, 20, z, "gray_concrete");
    // Roof plant on the central block of the roof.
    if (x >= 9 && x <= 14 && z >= 6 && z <= 11) {
      g.set(x, 21, z, "light_gray_concrete");
      g.set(x, 22, z, "light_gray_concrete");
    }
  }
}

// Warm light behind some glazed bays: glowstone in the air gap just inside the glass.
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const gr = groundOf.get(key(x, z));
  for (let y = gr + 1; y <= 19; y++) {
    if (y % 5 === 0) continue;
    if ((x + z) % 3 === 0) continue; // pier, not glass
    const inward = DIRS
      .map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => has(nx, nz) && !isEdge(nx, nz));
    if (!inward) continue;
    if ((x * 5 + z * 3 + y) % 11 === 0) {
      g.set(inward[0], y, inward[1], "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
