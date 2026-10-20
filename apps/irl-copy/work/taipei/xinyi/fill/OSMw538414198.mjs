import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Untitled 2-storey mid-rise commercial block, late-20th-century Taipei:
// white-tile/concrete frame, glazed ground-floor shopfront, glazed upper storey
// with spandrels, flat roof with parapet and a small roof plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414198";
const W = 18, D = 14, H = 23;

const ROOF = 11;     // roof slab layer, ~11 blocks above lowest ground
const FLOOR = 5;     // storey line between ground and upper storey
const CORNICE = 10;  // top band under the roof

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => gmap.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const doorCols = new Set([8, 9]);
const southRow = D - 1;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr >= ROOF) continue;

  const perim = isPerim(x, z);

  if (!perim) {
    // Interior: floor slabs and roof only, air between (no interiors).
    if (gr <= FLOOR) put(x, FLOOR, z, "smooth_quartz");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Perimeter walls, gr .. ROOF-1.
  for (let y = gr; y < ROOF; y++) {
    let id;
    if (y === gr) id = "polished_andesite";            // base course / plinth
    else if (y === FLOOR || y === CORNICE) id = "smooth_quartz"; // storey lines
    else if (y < FLOOR) {                              // ground-floor shopfront
      id = (x + z) % 3 === 0 ? "white_concrete" : "glass";
    } else {                                           // upper storey
      if (y === 6 || y === 9) id = "white_concrete";   // spandrels
      else id = (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
    }
    put(x, y, z, id);
  }

  // Warm lights set into some windows.
  if (gr + 2 < FLOOR && (x + z) % 6 === 1 && (x + z) % 3 !== 0) {
    put(x, gr + 2, z, "shroomlight");
  }
  if (FLOOR + 3 < CORNICE && (x * 2 + z) % 7 === 0 && (x + z) % 3 !== 0) {
    put(x, 8, z, "shroomlight");
  }

  // Parapet on the roof edge.
  put(x, ROOF + 1, z, "white_concrete");
  // Roof slab.
  put(x, ROOF, z, "light_gray_concrete");
}

// Entrance on the south face: dark oak double-height door pair, outward facing.
for (const [x, z, gr] of cells) {
  if (z !== southRow || !doorCols.has(x) || !has(x, z)) continue;
  if (gr + 2 >= FLOOR) continue;
  put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant room, set back from the parapet, with a lightning rod.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 5 && x <= 8 && z >= 4 && z <= 7) {
    put(x, ROOF + 1, z, "smooth_stone");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}
put(6, ROOF + 3, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
console.log(`saved ${DIR}/${ID}.nbt (${cells.length} cells, roof at y=${ROOF})`);
