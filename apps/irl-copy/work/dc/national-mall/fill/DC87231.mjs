import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87231.cells.json`, "utf8"));

const W = 8, H = 20, D = 4;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> { gr: ground, rf: roof top }
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { gr, rf });
const inside = (x, z) => map.has(`${x},${z}`);

// Exterior ring = any cell with a neighbour outside the footprint
const isRing = (x, z) =>
  !inside(x + 1, z) || !inside(x - 1, z) || !inside(x, z + 1) || !inside(x, z - 1);

// Window pattern: piers on the long faces at even x, windows at odd x;
// short faces get windows on the middle two cells; corners stay solid
function isWindowCell(x, z) {
  const cornerX = x === 0 || x === W - 1;
  const cornerZ = z === 0 || z === D - 1;
  if (cornerX && cornerZ) return false;
  if (cornerZ) return x > 0 && x < W - 1 && x % 2 === 1;
  if (cornerX) return z === 1 || z === 2;
  return false;
}

const isFrontDoor = (x, z) => z === 0 && (x === 3 || x === 4);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, gr, rf] of cells) {
  const top = Math.min(rf, H - 1);      // first empty level above the roof
  const ring = isRing(x, z);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground course: plinth on the ring, floor slab inside
  put(x, gr, z, ring ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y < top - 1; y++) {
    const rel = y - gr;

    if (ring) {
      if (rel % 3 === 0) {
        // Storey line / belt course
        put(x, y, z, "chiseled_stone_bricks");
      } else if (isFrontDoor(x, z) && rel <= 2) {
        // Double entrance on the front (z = 0) ground floor
        const half = rel === 1 ? "lower" : "upper";
        const hinge = x === 3 ? "left" : "right";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge, open: "false", powered: "false",
        });
      } else if (isWindowCell(x, z)) {
        // Window band: light glass panes set in the wall line
        put(x, y, z, "light_gray_stained_glass_pane");
      } else {
        put(x, y, z, "calcite");
      }
    } else {
      // Interior: floor slabs only, the rest is air (no interiors)
      if (rel % 3 === 0) put(x, y, z, "smooth_stone");
    }
  }

  // Roof cap: full blocks only (no walls, which render taller)
  put(x, top - 1, z, ring ? "stone_bricks" : "smooth_stone");
}

// Warm light behind glass: lanterns standing on the interior floor slabs
for (const [x, z] of [[3, 1], [4, 2]]) {
  if (!inside(x, z)) continue;
  const { gr, rf } = map.get(`${x},${z}`);
  for (const rel of [1, 4]) {
    const y = gr + rel;
    if (y < Math.min(rf, H - 1) - 1) {
      put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/DC87231.nbt`);
