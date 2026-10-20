import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE103-6699-3F";
const W = 67, H = 28, D = 48;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;
}
const midX = Math.round((minX + maxX) / 2);

const has = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const northFace = (x, z) => !has(x, z - 1);
const corner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const nearPerim = (x, z) =>
  (has(x - 1, z) && perim(x - 1, z)) || (has(x + 1, z) && perim(x + 1, z)) ||
  (has(x, z - 1) && perim(x, z - 1)) || (has(x, z + 1) && perim(x, z + 1));

// along-face coordinate for the pilaster grid
const along = (x, z) => (!has(x, z - 1) || !has(x, z + 1)) ? x : z;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BASE = "stone_bricks";
const FOUND = "stone";
const CANOPY = "gray_concrete";

for (const [x, z, gr] of cells) {
  const p = perim(x, z);
  const cor = p && corner(x, z);
  const ent = p && northFace(x, z) && Math.abs(x - midX) <= 3; // entrance zone
  const doorCell = p && northFace(x, z) && x === midX;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, FOUND);

  // three storeys of 5 blocks: slab, window band, spandrel
  for (let k = 0; k < 3; k++) {
    const b = gr + 1 + 5 * k;

    // floor slab across every footprint cell
    put(x, b, z, SPANDREL);

    if (p) {
      // pilaster grid: full-height frame every 6 cells along each face, and at corners
      const pilaster = cor || (along(x, z) - minX) % 6 === 0 || (along(x, z) - minZ) % 6 === 0;

      if (k === 0) {
        if (ent) {
          if (doorCell) {
            put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
            put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, b + 1, z, BASE);
            put(x, b + 2, z, pilaster && !doorCell ? FRAME : GLASS);
          }
          put(x, b + 3, z, pilaster ? FRAME : GLASS);
          // canopy lintel over the entrance
          put(x, b + 4, z, CANOPY);
        } else {
          put(x, b + 1, z, BASE);
          put(x, b + 2, z, pilaster ? FRAME : GLASS);
          put(x, b + 3, z, pilaster ? FRAME : GLASS);
          put(x, b + 4, z, FRAME);
        }
      } else {
        const col = pilaster ? FRAME : GLASS;
        put(x, b + 1, z, col);
        put(x, b + 2, z, col);
        put(x, b + 3, z, col);
        put(x, b + 4, z, cor ? FRAME : SPANDREL);
      }
    } else {
      // interior: air gap behind glass; warm light in some rooms next to the facade
      if (k === 0 && nearPerim(x, z) && Math.abs(x - midX) <= 4 && northFace(x, z + 1) !== true && has(x, z - 1) && perim(x, z - 1) && Math.abs(x - midX) <= 3) {
        put(x, b + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
      } else if (nearPerim(x, z) && (x * 7 + z * 3 + k) % 11 === 0) {
        put(x, b + 2, z, "shroomlight");
      }
      if (k === 2) put(x, b + 4, z, SPANDREL); // roof slab under parapet level
    }
  }

  // parapet / cornice on the perimeter
  if (p) put(x, gr + 16, z, FRAME);
  else {
    put(x, gr + 15, z, SPANDREL);
    // roof plant: a few larger units and small green patches
    if ((x * 5 + z * 3) % 31 === 0) {
      put(x, gr + 16, z, SPANDREL);
      put(x, gr + 17, z, "iron_block");
    } else if (((x % 9) >= 3 && (x % 9) <= 5) && ((z % 9) >= 3 && (z % 9) <= 5)) {
      put(x, gr + 16, z, "moss_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
