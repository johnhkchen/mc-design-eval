import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw538037746.cells.json`, "utf8"));

const W = 29, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward directions: name, dx, dz
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const outsOf = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));

function put(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const lights = []; // [x, y, z, block]

// Door: double doors on the north (min z) face, centred on x 13..14
const DOOR_XS = [13, 14];
const CANOPY_XS = [12, 13, 14, 15];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  // Ground slab
  put(x, gr, z, "smooth_stone");

  const outs = outsOf(x, z);

  if (outs.length === 0) {
    // Interior: floor slabs and roof deck only, air between
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "light_gray_concrete");
    if (x >= 8 && x <= 20 && z >= 5 && z <= 12) {
      put(x, gr + 11, z, "gray_concrete");
      if ((x + z) % 3 === 0) put(x, gr + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter cell: walls, windows, storey lines, cornice, parapet
  const [face, fdx, fdz] = outs[0];
  const alongX = face === "north" || face === "south";
  const idx = alongX ? x : z;
  const L = alongX ? W : D;
  const pier = idx % 3 === 0 || idx === 0 || idx === L - 1;
  const isNorthEntrance = face === "north" && z === 0;
  const doorCol = isNorthEntrance && DOOR_XS.includes(x);

  for (let rel = 0; rel <= 11; rel++) {
    const y = gr + rel;
    let b = null;
    let p = null;

    if (rel === 0) b = "stone_bricks";
    else if (rel >= 1 && rel <= 3) {
      if (doorCol) {
        if (rel === 1) {
          b = "oak_door";
          p = { facing: "north", half: "lower", hinge: x === 13 ? "left" : "right", open: "false", powered: "false" };
        } else if (rel === 2) {
          b = "oak_door";
          p = { facing: "north", half: "upper", hinge: x === 13 ? "left" : "right", open: "false", powered: "false" };
        }
      } else {
        b = pier ? "white_concrete" : "light_blue_stained_glass";
      }
    } else if (rel === 4) {
      b = isNorthEntrance && CANOPY_XS.includes(x) ? "smooth_stone" : "white_concrete";
    } else if (rel === 5) b = "smooth_stone";
    else if (rel >= 6 && rel <= 8) b = pier ? "white_concrete" : "light_blue_stained_glass";
    else if (rel === 9) b = "white_concrete";
    else if (rel === 10) b = "smooth_stone";
    else if (rel === 11) b = "white_concrete";

    if (b) put(x, y, z, b, p);
  }

  // Lantern hanging under the entrance canopy, above the door
  if (doorCol && x === 13) {
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Canopy depth: one extra row inside the footprint behind the entrance
  if (isNorthEntrance && CANOPY_XS.includes(x)) {
    put(x, gr + 4, z + 1, "smooth_stone");
  }

  // Warm light markers: placed one cell inside behind selected windows
  const inX = x - fdx, inZ = z - fdz; // inward neighbour
  if (!pier && !doorCol) {
    if (idx % 6 === 2) lights.push([inX, gr + 7, inZ, "shroomlight"]);
    if (idx % 4 === 1) lights.push([inX, gr + 2, inZ, "glowstone"]);
  }
}

// Place interior lights only into interior air cells (not perimeter)
for (const [lx, ly, lz, lb] of lights) {
  if (!has(lx, lz)) continue;
  if (outsOf(lx, lz).length > 0) continue;
  put(lx, ly, lz, lb);
}

g.save(`${DIR}/OSMw538037746.nbt`);
