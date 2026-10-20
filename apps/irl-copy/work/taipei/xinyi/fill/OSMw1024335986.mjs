import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1024335986";
const W = 15, H = 23, D = 7;

// Roof geometry from lidar: roof about 11 blocks above lowest ground.
const ROOF = 11;   // parapet cap
const DECK = 10;   // cornice line and roof deck
const SLAB = 5;    // second-floor slab line

// Palette: 1980s Taipei commercial block, pale tiled facade, dark glass bands.
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const FRAME = "smooth_quartz";
const FLOOR = "smooth_stone";
const EQUIP = "gray_concrete";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const exterior = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  if (!exterior(x, z)) {
    // Interior cell: floor slabs and roof deck only, no interior fit-out.
    put(x, gr, z, FLOOR);
    if (SLAB > gr) put(x, SLAB, z, FLOOR);
    put(x, DECK, z, FLOOR);
    continue;
  }

  const front = z === D - 1;
  const back = z === 0;
  const side = !front && !back;

  for (let y = gr; y <= ROOF; y++) {
    let id = null;
    let props = null;

    if (y === gr) {
      id = BASE; // base course
    } else if (y === ROOF) {
      id = "smooth_quartz_slab";
      props = { type: "top", waterlogged: "false" }; // parapet cap
    } else if (y === DECK) {
      id = BAND; // cornice
    } else if (y === 4 || y === SLAB || y === 9) {
      id = BAND; // storey lines and window heads
    } else if (y < 4) {
      // Ground floor: commercial shopfront.
      if (front) {
        if (x === 7) {
          if (y === gr + 1) {
            put(x, y, z, "oak_door", {
              facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
            });
            continue;
          } else if (y === gr + 2) {
            put(x, y, z, "oak_door", {
              facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
            });
            continue;
          } else {
            id = GLASS; // transom
          }
        } else {
          id = x % 3 === 0 ? FRAME : GLASS;
        }
        if (x === 0 || x === 14) id = WALL;
      } else if (side && z % 3 === 1) {
        id = GLASS;
      } else {
        id = WALL;
      }
    } else {
      // Upper floor: office windows.
      if (front) {
        id = x % 3 === 0 ? FRAME : GLASS;
        if (x === 0 || x === 14) id = WALL;
      } else if (back) {
        id = x % 3 === 1 ? GLASS : WALL;
      } else {
        id = z % 3 === 1 ? GLASS : WALL;
      }
    }

    put(x, y, z, id ?? WALL, props);
  }
}

// Warm light behind glass on the street frontage (interior cells at z = 5).
for (let x = 1; x <= 13; x++) {
  if (!has(x, D - 1) || !has(x, D - 2)) continue;
  if (exterior(x, D - 2)) continue;
  const gz = gAt(x, D - 2);
  if (x % 3 === 0) continue;
  if (gz <= 2) put(x, 2, D - 2, "glowstone");   // shopfront glow
  if (gz <= 7) put(x, 7, D - 2, "glowstone");   // office glow
}

// Roof plant on an interior roof cell: a condenser block and a short mast.
if (has(3, 2) && !exterior(3, 2)) {
  put(3, ROOF, 2, EQUIP);
  put(3, ROOF + 1, 2, EQUIP);
}
if (has(11, 4) && !exterior(11, 4)) {
  put(11, ROOF, 4, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
