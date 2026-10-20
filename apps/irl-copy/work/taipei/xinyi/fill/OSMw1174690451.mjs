import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1990s-era low-rise commercial block, two storeys, white tiled concrete
// with a stone plinth, blue glass curtain bands, quartz cornice and a
// parapet, and a shopfront with a south entrance. Roof about 11 blocks above
// the lowest ground, so the storeys are about 5 blocks each.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690451";
const W = 18, H = 23, D = 18;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));

// Footprint cells -> ground level relative to the lowest ground (clamped).
const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.min(20, Math.max(0, Math.round(gr - minG))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const maxZ = Math.max(...[...ground.keys()].map((k) => Number(k.split(",")[1])));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// The interior neighbour of an edge cell, used to place lamps behind glass.
function inward(x, z) {
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) return [nx, nz];
  }
  return null;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false", hinge_side: "left" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const roofY = Math.max(10, gr);           // roof slab (interior) / cornice (edge)
  const isDoor = edge && z === maxZ && (x === 8 || x === 9) && gr + 2 <= 4;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: ground-floor ceiling / upper floor slab, and the roof slab.
    if (gr < 5) put(x, 5, z, "light_gray_concrete");
    put(x, roofY, z, "light_gray_concrete");
    continue;
  }

  // Edge (facade) cells, from ground level up to the parapet.
  for (let y = gr; y <= roofY + 1; y++) {
    if (y === roofY + 1) {
      put(x, y, z, "white_concrete");                       // parapet
    } else if (y === roofY) {
      put(x, y, z, "smooth_quartz");                        // cornice
    } else if (y === gr) {
      put(x, y, z, "stone_bricks");                         // plinth course
    } else if (y < 4) {
      // Ground-floor shopfront.
      if (isDoor && y === gr + 1) put(x, y, z, "oak_door", DOOR_LOWER);
      else if (isDoor && y === gr + 2) put(x, y, z, "oak_door", DOOR_UPPER);
      else if ((x + z) % 3 === 0) put(x, y, z, "white_concrete");   // pilaster
      else put(x, y, z, "glass");
    } else if (y === 4) {
      put(x, y, z, "smooth_quartz");                        // ground-floor lintel
    } else if (y === 5) {
      put(x, y, z, "smooth_quartz");                        // storey line
    } else if (y <= 8) {
      // Upper-floor window grid: two glass bays, one mullion per module.
      const idx = (x + z) % 3;
      if (idx === 2) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
        // Warm light behind some windows: shroomlight on the interior floor.
        const inn = inward(x, z);
        if (y === 6 && idx === 0 && (x * 3 + z * 5) % 4 === 0 && inn) {
          const [ix, iz] = inn;
          const igr = ground.get(`${ix},${iz}`);
          if (igr < 5) put(ix, 6, iz, "shroomlight");
        }
      }
    } else {
      // y === 9: spandrel below the cornice.
      put(x, y, z, "light_gray_concrete");
    }
  }
}

// Roof plant: a small mechanical enclosure on the roof, standing on the roof slab.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x >= 5 && x <= 8 && z >= 5 && z <= 8) {
    const roofY = Math.max(10, gr);
    put(x, roofY + 1, z, "light_gray_concrete");
    if ((x + z) % 2 === 0) put(x, roofY + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
