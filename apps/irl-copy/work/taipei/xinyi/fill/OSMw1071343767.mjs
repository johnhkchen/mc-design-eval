import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw1071343767: 31 x 16 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, early-1990s Xinyi commercial block: white concrete
// frame, glazed bays, a polished-andesite shopfront plinth, a quartz storey
// band, a stone roof slab and a white parapet. Entrance is centred on the
// south face. Warm light is set behind some glass for dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343767";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const missN = (x, z) => !has(x, z - 1);
const missS = (x, z) => !has(x, z + 1);
const missW = (x, z) => !has(x - 1, z);
const missE = (x, z) => !has(x + 1, z);
const isPerim = (x, z) => missN(x, z) || missS(x, z) || missW(x, z) || missE(x, z);

// Bounds-checked setter. Props are optional.
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Inward neighbour for a perimeter cell (first exterior face wins).
function inward(x, z) {
  if (missN(x, z)) return [x, z + 1];
  if (missS(x, z)) return [x, z - 1];
  if (missW(x, z)) return [x + 1, z];
  if (missE(x, z)) return [x - 1, z];
  return null;
}

for (const [x, z, gr] of cells) {
  const perim = isPerim(x, z);

  // Foundation: solid stone from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at ground level.
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  if (!perim) {
    // Interior: floor slabs and roof slab only, air between.
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    // Roof plant: a low central block of equipment.
    if (x >= 11 && x <= 19 && z >= 5 && z <= 10) {
      put(x, gr + 11, z, "light_gray_concrete");
    }
    continue;
  }

  const alongX = missN(x, z) || missS(x, z);   // wall runs east-west
  const alongZ = !alongX && (missW(x, z) || missE(x, z));
  const corner = alongX && (missW(x, z) || missE(x, z));
  const mull = corner || (alongX ? x % 4 === 0 : z % 4 === 0);
  const doorCell = missS(x, z) && (x === 14 || x === 15);

  const paneProps = alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Plinth course above the floor.
  put(x, gr + 1, z, "polished_andesite");

  // Ground-floor glazing (gr+2..gr+4), with entrance door on south face.
  if (doorCell) {
    const hinge = x === 14 ? "left" : "right";
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    put(x, gr + 4, z, "black_concrete"); // transom over the doors, also supports the lantern
  } else {
    for (const dy of [2, 3, 4]) {
      if (mull) put(x, gr + dy, z, "white_concrete");
      else put(x, gr + dy, z, "glass_pane", paneProps);
    }
  }

  // Storey band between floors.
  put(x, gr + 5, z, "quartz_block");

  // Upper-floor glazing (gr+6..gr+8) with spandrel at gr+9.
  for (const dy of [6, 7, 8]) {
    if (mull) put(x, gr + dy, z, "white_concrete");
    else put(x, gr + dy, z, "glass_pane", paneProps);
  }
  put(x, gr + 9, z, "white_concrete");

  // Roof edge and parapet.
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");

  // Warm light behind some glazed bays, on both floors.
  if (!mull && !doorCell) {
    const inn = inward(x, z);
    if (inn && has(inn[0], inn[1]) && !isPerim(inn[0], inn[1])) {
      if (((x * 3 + z * 5) % 4) === 0) put(inn[0], gr + 7, inn[1], "shroomlight");
      else if (((x + z) % 5) === 0) put(inn[0], gr + 3, inn[1], "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
